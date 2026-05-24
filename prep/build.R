#!/usr/bin/env Rscript
# build.R — orchestrator для ESS .sav → JSON pipeline
#
# Запуск з кореня репо:  Rscript prep/build.R
#
# Вхід:  data/raw/ESS11_UA.sav  (або інший пріоритет — див. detect_sav_file)
# Вихід: public/data/respondents.json
#        public/data/methodology.json  (поля з ESS оновлюються автоматично)
#
# Залежності: haven, survey, dplyr, jsonlite

suppressPackageStartupMessages({
  library(haven)
  library(dplyr)
  library(jsonlite)
  library(survey)
})

# ---- Налаштування шляхів ---------------------------------------------------

# Скрипт може бути запущений з кореня репо або з prep/. Резолвимо обидва.
script_dir <- tryCatch(
  dirname(normalizePath(sys.frame(1)$ofile, mustWork = FALSE)),
  error = function(e) getwd()
)
if (basename(getwd()) == "prep") {
  repo_root <- dirname(getwd())
} else {
  repo_root <- getwd()
}

source(file.path(repo_root, "prep", "lib", "recode.R"))
source(file.path(repo_root, "prep", "lib", "weights.R"))
source(file.path(repo_root, "prep", "lib", "bootstrap.R"))
source(file.path(repo_root, "prep", "lib", "export.R"))

raw_dir <- file.path(repo_root, "data", "raw")
out_dir <- file.path(repo_root, "public", "data")
dir.create(out_dir, showWarnings = FALSE, recursive = TRUE)

# ---- 1. Знайти і прочитати .sav --------------------------------------------

# Пріоритет: повний R11 → R11 country-specific → R10.
# Користувач може покласти будь-який — підбираємо найкращий доступний.
detect_sav_file <- function(dir) {
  priorities <- c(
    "ESS11_UA.sav", "ESS11UA.sav", "ESS11ce01_UA.sav",
    "ESS11csUAe01.sav", "ESS11cs_UA.sav",
    "ESS10UAe4.sav", "ESS10_UA.sav"
  )
  for (name in priorities) {
    path <- file.path(dir, name)
    if (file.exists(path)) return(path)
  }
  # Fallback: будь-який .sav у папці
  candidates <- list.files(dir, pattern = "\\.sav$", full.names = TRUE)
  if (length(candidates) > 0) return(candidates[1])
  stop("Не знайдено жодного .sav файлу в ", dir,
       ". Завантаж ESS з europeansocialsurvey.org → Ukraine, поклади у data/raw/.")
}

sav_path <- detect_sav_file(raw_dir)
cat("📂 Читаю:", basename(sav_path), "\n")

raw <- read_sav(sav_path)
cat("   n_rows =", nrow(raw), ", n_cols =", ncol(raw), "\n")

# Визначаємо хвилю за назвою файла (для metadata)
wave <- if (grepl("11", basename(sav_path))) "ESS11" else
        if (grepl("10", basename(sav_path))) "ESS10" else "unknown"
cat("   wave =", wave, "\n")

# ---- 2. Валідація змінних --------------------------------------------------

required_vars <- c(
  "gndr", "agea", "eisced", "hinctnta",
  "marsts", "chldhm", "cgtsmke", "alcfreq",
  "pspwght"
)
optional_vars <- c("anweight", "rlgdgr", "lrscale", "dosprt", "lnghom1")

present <- intersect(c(required_vars, optional_vars), names(raw))
missing_required <- setdiff(required_vars, names(raw))
missing_optional <- setdiff(optional_vars, names(raw))

if (length(missing_required) > 0) {
  warning("❗ Відсутні обов'язкові ESS-змінні: ",
          paste(missing_required, collapse = ", "),
          "\nЦе означає, що відповідні контроли в UI треба прибрати, ",
          "або переключитись на іншу хвилю. Не вигадуй fallback.")
}

cat("✓ Присутні змінні (",length(present),"):", paste(present, collapse=", "), "\n")
if (length(missing_required) > 0) {
  cat("✗ Відсутні обов'язкові:", paste(missing_required, collapse=", "), "\n")
}

# ---- 3. Перекодування ------------------------------------------------------

# Усі recode_* функції — у lib/recode.R. Кожна повертає вектор чистих кодів
# або NA для невалідних/відмов. Зберігаємо ESS-семантику кодів де можливо.
respondents <- raw %>%
  filter(if ("cntry" %in% names(raw)) cntry == "UA" else TRUE) %>%
  transmute(
    id        = row_number(),
    gndr      = recode_gndr(gndr),
    agea      = recode_agea(agea),
    eisced    = recode_eisced(eisced),
    hinctnta  = recode_hinctnta(hinctnta),
    marsts    = recode_marsts(marsts),
    chldhm    = recode_chldhm(chldhm),
    smokes    = if ("cgtsmke" %in% names(raw)) recode_smoking(cgtsmke) else NA,
    alc       = if ("alcfreq" %in% names(raw)) recode_alcohol(alcfreq) else NA,
    rlgdgr    = if ("rlgdgr"  %in% names(raw)) recode_rlgdgr(rlgdgr)   else NA_real_,
    lrscale   = if ("lrscale" %in% names(raw)) recode_lrscale(lrscale) else NA_real_,
    dosprt    = if ("dosprt"  %in% names(raw)) recode_dosprt(dosprt)   else NA_real_,
    lnghom1   = if ("lnghom1" %in% names(raw)) recode_lnghom1(lnghom1) else NA_character_,
    pspwght   = pspwght,
    anweight  = if ("anweight" %in% names(raw)) anweight else NA_real_
  ) %>%
  filter(!is.na(gndr), !is.na(agea), !is.na(pspwght)) %>%
  # ESS вибірка для жителів 15+; фронтенд цікавлять дорослі (18+)
  filter(agea >= 18, agea <= 100)

cat("✓ Після перекодування і фільтра 18+: n =", nrow(respondents), "\n")

# ---- 4. Design-aware SE для базової joint-частки ---------------------------

# TODO: коли матимемо реальні дані — додати домашні господарства (psu),
#       якщо ESS UA SDDF підтримує (треба перевірити R11).
# Поки що — заміна psu по id (ind. respondents, no clustering).
des <- svydesign(ids = ~1, weights = ~pspwght, data = respondents)

# Precomputed SE для типових (стать × вікова група) комбінацій.
# Фронтенд може використовувати замість in-browser bootstrap.
age_groups <- list(
  c(18, 24), c(25, 34), c(35, 44),
  c(45, 54), c(55, 64), c(65, 100)
)
precomputed_se <- compute_se_grid(des, age_groups)
cat("✓ Precomputed SE для", length(precomputed_se), "груп\n")

# ---- 5. Експорт respondents.json -------------------------------------------

export_respondents(
  respondents,
  precomputed_se = precomputed_se,
  wave           = wave,
  source_file    = basename(sav_path),
  out_path       = file.path(out_dir, "respondents.json")
)
cat("✓ Записано respondents.json (", nrow(respondents), "рядків)\n")

# ---- 6. Оновлення methodology.json -----------------------------------------

update_methodology(
  out_path           = file.path(out_dir, "methodology.json"),
  wave               = wave,
  n_respondents      = nrow(respondents),
  source_file        = basename(sav_path),
  variables_present  = present,
  variables_missing  = missing_required,
  weight_var         = if ("anweight" %in% names(raw)) "anweight" else "pspwght",
  fieldwork_year     = NA  # TODO: дістати з ESS metadata якщо доступно
)
cat("✓ Оновлено methodology.json\n")

# ---- 7. Перевірка external.json --------------------------------------------

ext_path <- file.path(out_dir, "external.json")
if (!file.exists(ext_path)) {
  warning("⚠ public/data/external.json не існує. Створи вручну з даними з ",
          "NCD-RisC / demography.org.ua / ukrstat.gov.ua. Шаблон — у моку.")
} else {
  ext <- fromJSON(ext_path)
  if (isTRUE(ext$mock)) {
    warning("⚠ external.json все ще mock:true. Заміни TODO реальними числами ",
            "перед продакшн-збіркою.")
  }
}

cat("\n🎉 Готово. Перевір public/data/ і запусти `cd web && npm run dev`.\n")
