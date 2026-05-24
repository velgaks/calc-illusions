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

# Шлюбний стан: ESS marsts 1..6 (legal married, civil union, separated, divorced, widowed, single).
# Бінаризуємо: married_or_union (1/2) vs not (3-6).
recode_marsts <- function(x) {
  x <- as.numeric(x)
  case_when(
    x %in% c(1, 2) ~ 1L,           # одружений/в партнерстві
    x %in% c(3, 4, 5, 6) ~ 0L,     # неодружений/не в партнерстві
    TRUE ~ NA_integer_
  )
}

# Діти у домогосподарстві: ESS chldhm 1=yes, 2=no.
recode_chldhm <- function(x) {
  x <- as.numeric(x)
  case_when(
    x == 1 ~ 1L,
    x == 2 ~ 0L,
    TRUE ~ NA_integer_
  )
}

# Куріння. ESS cgtsmke: 1=every day, 2=several/week, 3=once/week, 4=less, 5=never tried, 6=quit.
# Бінаризуємо: smokes (1/2/3/4) vs not (5/6).
# TODO: можливо краще тримати ESS-кодування 5-категорій для UI слайдера інтенсивності.
recode_smoking <- function(x) {
  x <- as.numeric(x)
  case_when(
    x %in% c(1, 2, 3, 4) ~ 1L,    # курить регулярно
    x %in% c(5, 6) ~ 0L,           # ніколи / кинув
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

# Мова вдома. ESS lnghom1: string ISO 639-3 (3-літерний код), напр. "ukr", "rus".
# Категоризуємо: ukr / rus / other. NA → other.
recode_lnghom1 <- function(x) {
  x <- as.character(x)
  case_when(
    x == "ukr" ~ "ukr",
    x == "rus" ~ "rus",
    !is.na(x) & nchar(x) >= 2 ~ "other",
    TRUE ~ NA_character_
  )
}
