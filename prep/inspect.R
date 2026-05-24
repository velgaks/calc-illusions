# Перевіряємо точну комбінацію з UI напряму на raw ESS R11.
# Фільтри зі скріншоту:
#   Чол 33-47, зріст >= 180, дохід >= 8 дец., вища (eisced 5-7),
#   не курить, помірний алк, спортивний (dosprt >= 3),
#   релігійний (rlgdgr >= 5), україномовний

suppressPackageStartupMessages(library(haven))
suppressPackageStartupMessages(library(dplyr))

d <- read_sav("data/raw/ESS11e04_1-subset.sav")

apply_filter <- function(df, expr, label) {
  before <- nrow(df)
  before_w <- sum(df$pspwght, na.rm = TRUE)
  out <- df %>% filter(!!rlang::parse_expr(expr))
  after <- nrow(out)
  after_w <- sum(out$pspwght, na.rm = TRUE)
  cat(sprintf("%-45s | n: %4d → %4d (-%3d)  | wsum: %6.1f → %6.1f\n",
              label, before, after, before - after, before_w, after_w))
  out
}

cat("=== Прогресивне звуження ===\n")
cat(sprintf("%-45s | %15s | %16s\n", "Filter", "n drop", "weighted sum"))
cat(strrep("-", 90), "\n")

w <- d
w <- apply_filter(w, "gndr == 1",                                "Чол.")
w <- apply_filter(w, "agea >= 33 & agea <= 47",                  "Вік 33-47")
w <- apply_filter(w, "!is.na(height) & height >= 180",           "Зріст >= 180")
w <- apply_filter(w, "!is.na(hinctnta) & hinctnta >= 8",         "Дохід >= 8 дец.")
w <- apply_filter(w, "!is.na(eisced) & eisced >= 5",             "Вища (ISCED 5-7)")
w <- apply_filter(w, "!is.na(cgtsmok) & cgtsmok %in% c(4,5,6)",  "Не курить")
w <- apply_filter(w, "!is.na(alcfreq) & alcfreq %in% c(4,5,6,7)","П'є помірно або менше")
w <- apply_filter(w, "!is.na(dosprt) & dosprt >= 3",             "Спортивний (>= 3 дні/тиждень)")
w <- apply_filter(w, "!is.na(rlgdgr) & rlgdgr >= 5",             "Релігійний (>= 5)")
w <- apply_filter(w, "!is.na(lnghom1) & toupper(lnghom1) == 'UKR'", "Україномовний")

cat("\n=== Фінал ===\n")
cat("Респондентів, що пройшли усі фільтри:", nrow(w), "\n")
if (nrow(w) > 0) {
  print(w %>% select(idno, agea, eisced, hinctnta, height, cgtsmok,
                     alcfreq, dosprt, rlgdgr, lnghom1, pspwght))
}

# Загальна базова чисельність М 33-47 за нашими external.json:
cat("\nЯкщо хоч 1 знайдений → екстраполяція:\n")
total_window <- d %>% filter(gndr == 1, agea >= 33, agea <= 47)
share_unweighted <- nrow(w) / nrow(total_window)
share_weighted <- if (nrow(w) > 0) sum(w$pspwght) / sum(total_window$pspwght) else 0
cat(sprintf("  Window n=%d, matched=%d → unweighted %.2f%%, weighted %.2f%%\n",
            nrow(total_window), nrow(w), share_unweighted*100, share_weighted*100))
