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

# Пріоритет: повний substantive R11 → R10.
# ESS contact study (cs у назві) — це non-response дані, не респонденти. НЕ використовуємо.
detect_sav_file <- function(dir) {
  priorities <- c(
    # R11 substantive (повний набір)
    "ESS11_UA.sav", "ESS11UA.sav",
    "ESS11e04_1-subset.sav", "ESS11e04_UA.sav",
    "ESS11e03_UA.sav", "ESS11e02_UA.sav", "ESS11e01_UA.sav",
    # R10 substantive
    "ESS10UAe4.sav", "ESS10_UA.sav", "ESS10e3.0_UA.sav"
  )
  for (name in priorities) {
    path <- file.path(dir, name)
    if (file.exists(path)) return(path)
  }
  # Fallback: будь-який .sav без "cs" / "contact" у назві
  candidates <- list.files(dir, pattern = "\\.sav$", full.names = TRUE)
  candidates <- candidates[!grepl("cs|contact", basename(candidates), ignore.case = TRUE)]
  if (length(candidates) > 0) return(candidates[1])
  stop("Не знайдено substantive .sav файлу в ", dir,
       ". ESS contact study (cs) не містить респондентських відповідей. ",
       "Завантаж основний ESS-файл з europeansocialsurvey.org → Ukraine.")
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
  "pspwght"
)
# Змінні з аліасами — перевіряються через pick_first() нижче.
# Тут лише ті, що не мають альтернативних імен між хвилями.
optional_vars <- c("anweight", "rlgdgr", "lrscale", "dosprt", "lnghom1",
                   "marsts", "rshpsts", "chldhm", "chldhhe",
                   "cgtsmke", "cgtsmok", "alcfreq")

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
#
# Деякі змінні мають альтернативні імена між хвилями (chldhm у старих, chldhhe у R10).
# pick_first() повертає першу доступну зі списку, або NA-вектор.
pick_first <- function(raw, candidates, recode_fn = identity) {
  for (nm in candidates) {
    if (nm %in% names(raw)) return(list(values = recode_fn(raw[[nm]]), source = nm))
  }
  list(values = rep(NA, nrow(raw)), source = NA_character_)
}

# Логуємо який alias підхопився — стане у methodology.json.
var_sources <- list()
log_var <- function(canonical, picked) {
  var_sources[[canonical]] <<- picked$source
  picked$values
}

respondents <- raw %>%
  filter(if ("cntry" %in% names(raw)) cntry == "UA" else TRUE) %>%
  transmute(
    id        = row_number(),
    gndr      = recode_gndr(gndr),
    agea      = recode_agea(agea),
    eisced    = recode_eisced(eisced),
    hinctnta  = recode_hinctnta(hinctnta),
    marsts    = recode_partnered(
                  if ("marsts"  %in% names(raw)) marsts  else NA,
                  if ("rshpsts" %in% names(raw)) rshpsts else NULL
                ),
    chldhm    = log_var("chldhm",  pick_first(raw, c("chldhm","chldhhe"), recode_chldhm)),
    smokes    = log_var("smokes",  pick_first(raw, c("cgtsmke","cgtsmok"), recode_smoking)),
    alc       = log_var("alc",     pick_first(raw, c("alcfreq"), recode_alcohol)),
    rlgdgr    = log_var("rlgdgr",  pick_first(raw, c("rlgdgr"),  recode_rlgdgr)),
    lrscale   = log_var("lrscale", pick_first(raw, c("lrscale"), recode_lrscale)),
    dosprt    = log_var("dosprt",  pick_first(raw, c("dosprt"),  recode_dosprt)),
    lnghom1   = log_var("lnghom1", pick_first(raw, c("lnghom1"), recode_lnghom1)),
    pspwght   = pspwght,
    anweight  = if ("anweight" %in% names(raw)) anweight else NA_real_
  ) %>%
  filter(!is.na(gndr), !is.na(agea), !is.na(pspwght)) %>%
  # ESS вибірка для жителів 15+; фронтенд цікавлять дорослі (18+)
  filter(agea >= 18, agea <= 100)

# Які КАНОНІЧНІ змінні не знайшли (по жодному з alias-ів).
missing_canonical <- names(var_sources)[sapply(var_sources, is.na)]
present_canonical <- names(var_sources)[!sapply(var_sources, is.na)]
cat("✓ Canonical vars present:", paste(present_canonical, collapse=", "), "\n")
if (length(missing_canonical) > 0) {
  cat("✗ Canonical vars missing:", paste(missing_canonical, collapse=", "), "\n")
}

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
  out_path             = file.path(out_dir, "methodology.json"),
  wave                 = wave,
  n_respondents        = nrow(respondents),
  source_file          = basename(sav_path),
  variables_present    = present,
  variables_missing    = missing_required,
  variable_sources     = var_sources,
  canonical_present    = present_canonical,
  canonical_missing    = missing_canonical,
  weight_var           = if ("anweight" %in% names(raw)) "anweight" else "pspwght",
  fieldwork_year       = if ("essround" %in% names(raw)) {
                            if (unique(raw$essround) == 10) 2020
                            else if (unique(raw$essround) == 11) 2024
                            else NA
                          } else NA
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
