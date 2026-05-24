# recode.R — перекодування ESS-змінних
#
# Кожна recode_* функція приймає вектор з .sav і повертає чистий вектор
# у схемі, з якою працює фронтенд. NA для відмов, "не знаю", невалідних.
#
# Коди беремо з ESS R11 codebook (europeansocialsurvey.org/data/round-index).
# Для R10 більшість збігається; різниці зафіксовані inline.

# Стать: 1=чол, 2=жін. ESS уже в цій схемі — просто чистимо рефузи.
recode_gndr <- function(x) {
  x <- as.numeric(x)
  ifelse(x %in% c(1, 2), x, NA_real_)
}

# Вік: ESS `agea` уже точний (15+). Цензуруємо 100+ як 100 для стабільності.
recode_agea <- function(x) {
  x <- as.numeric(x)
  x[x < 0 | x > 120] <- NA
  pmin(x, 100)
}

# ISCED 2011: ESS eisced 1..7, інші коди (55, 77, 88, 99) — рефузи/інше.
recode_eisced <- function(x) {
  x <- as.numeric(x)
  ifelse(x >= 1 & x <= 7, x, NA_real_)
}

# Дохідний дециль домогосподарства: 1..10. ESS hinctnta.
# 77 — refuse, 88 — DK, 99 — no answer.
recode_hinctnta <- function(x) {
  x <- as.numeric(x)
  ifelse(x >= 1 & x <= 10, x, NA_real_)
}

# Шлюбний / партнерський стан.
#
# ESS R10/R11 мають ДВІ змінні з complementary routing:
#   - marsts (legal marital status) — питають у тих, хто НЕ живе з партнером зараз.
#     Тому marsts має багато NA (45% у R10 UA).
#   - rshpsts (relationship status of currently-cohabiting partner) — питають у тих,
#     хто ЖИВЕ з партнером. NA у тих, хто живе один.
#
# Об'єднання: "currently married OR in cohabiting partnership" =
#   rshpsts ∈ {1,2,3,4}  OR  marsts ∈ {1,2}.
# Це дає коректне визначення "у стосунках зараз" для partner-search калькулятора.
recode_partnered <- function(marsts, rshpsts = NULL) {
  m <- as.numeric(marsts)
  legal_married_or_union <- m %in% c(1, 2)

  if (!is.null(rshpsts)) {
    r <- as.numeric(rshpsts)
    cohabiting <- r %in% c(1, 2, 3, 4)   # married OR registered union OR living with partner
  } else {
    cohabiting <- rep(FALSE, length(m))
  }

  # Один з двох сигналів → партнер; обидва NA / refusal → NA
  partnered <- legal_married_or_union | cohabiting

  # NA якщо обидва вихідні NA
  m_na <- is.na(m) | !(m %in% c(1, 2, 3, 4, 5, 6))
  r_na <- if (!is.null(rshpsts)) {
    is.na(as.numeric(rshpsts)) | !(as.numeric(rshpsts) %in% c(1, 2, 3, 4, 5, 6))
  } else {
    rep(TRUE, length(m))
  }

  ifelse(m_na & r_na, NA_integer_, as.integer(partnered))
}

# Старий recode_marsts залишаємо для зворотньої сумісності, але build.R йде через recode_partnered.
recode_marsts <- function(x) recode_partnered(x, NULL)

# Діти у домогосподарстві: ESS chldhm 1=yes, 2=no.
recode_chldhm <- function(x) {
  x <- as.numeric(x)
  case_when(
    x == 1 ~ 1L,
    x == 2 ~ 0L,
    TRUE ~ NA_integer_
  )
}

# Куріння. Два варіанти запитання між хвилями:
#
# R10 cgtsmke: 1=every day ... 4=less than once/week, 5=never tried, 6=quit.
#   → курить = 1..4, не курить = 5..6
#
# R11 cgtsmok: 1=daily 10+, 2=daily ≤9, 3=not every day, 4=quit, 5=only few times, 6=never.
#   → курить = 1..3, не курить = 4..6
#
# Уніфікуємо як «зараз курить»: для cgtsmke ⊂ {1,2,3,4} → 1; для cgtsmok ⊂ {1,2,3} → 1.
# Розрізняємо за діапазоном кодів: cgtsmke може мати 6 = quit (currently NOT smoking),
# cgtsmok має 4 = quit. Тому єдина безпечна форма — конкретний recode.
# Тут робимо liberal version: коди 1, 2, 3 → smoker, 4, 5, 6 → ні. Це працює і для cgtsmok.
# Для cgtsmke вкажемо окрему функцію якщо доведеться, але зараз R11 — головний шлях.
recode_smoking <- function(x) {
  x <- as.numeric(x)
  case_when(
    x %in% c(1, 2, 3) ~ 1L,    # курить регулярно
    x %in% c(4, 5, 6) ~ 0L,    # кинув / тільки кілька разів / ніколи
    TRUE ~ NA_integer_
  )
}

# Алкоголь. ESS alcfreq: 1=every day, 2=several/week, 3=once/week, 4=2-3/month,
# 5=once/month, 6=less than once/month, 7=never.
# Категоризуємо: 0=never (7), 1=rare (4-6), 2=often (1-3).
recode_alcohol <- function(x) {
  x <- as.numeric(x)
  case_when(
    x == 7 ~ 0L,
    x %in% c(4, 5, 6) ~ 1L,
    x %in% c(1, 2, 3) ~ 2L,
    TRUE ~ NA_integer_
  )
}

# Релігійність. ESS rlgdgr: 0=not religious at all ... 10=very religious.
# Зберігаємо як є, чистимо рефузи (77, 88, 99).
recode_rlgdgr <- function(x) {
  x <- as.numeric(x)
  ifelse(x >= 0 & x <= 10, x, NA_real_)
}

# Політика left-right. ESS lrscale: 0=left ... 10=right.
recode_lrscale <- function(x) {
  x <- as.numeric(x)
  ifelse(x >= 0 & x <= 10, x, NA_real_)
}

# Спорт. ESS dosprt: к-сть днів за останні 7, коли був ≥30 хв фіз. активності.
# 0..7. Рефузи: 77, 88, 99 → NA.
recode_dosprt <- function(x) {
  x <- as.numeric(x)
  ifelse(x >= 0 & x <= 7, x, NA_real_)
}

# Мова вдома. ESS lnghom1: string ISO 639-3 (3-літерний код).
# R10 використовує lowercase ("ukr","rus"), R11 — UPPERCASE ("UKR","RUS").
# Нормалізуємо через tolower, потім категоризуємо: ukr / rus / other.
recode_lnghom1 <- function(x) {
  x <- tolower(as.character(x))
  case_when(
    x == "ukr" ~ "ukr",
    x == "rus" ~ "rus",
    !is.na(x) & nchar(x) >= 2 ~ "other",
    TRUE ~ NA_character_
  )
}
