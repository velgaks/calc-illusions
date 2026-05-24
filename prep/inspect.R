suppressPackageStartupMessages({ library(haven); library(dplyr) })
d <- read_sav("data/raw/ESS11e04_1-subset.sav")
wshare <- function(cond, w) {
  ok <- !is.na(cond) & !is.na(w)
  sum(w[ok] * as.numeric(cond[ok])) / sum(w[ok])
}

cat("== Уточнення підозрілих маргіналів ==\n\n")

# Куріння — повна декомпозиція
m_smk <- d %>% filter(gndr == 1, agea >= 18, !is.na(cgtsmok))
cat("Чоловіки 18+, розподіл cgtsmok:\n")
for (code in 1:6) {
  share <- wshare(m_smk$cgtsmok == code, m_smk$pspwght)
  labels <- c("1=daily 10+", "2=daily <10", "3=not every day", "4=quit", "5=tried few times", "6=never")
  cat(sprintf("  %-20s %.1f%%\n", labels[code], share*100))
}
cat("  --- агрегати ---\n")
cat(sprintf("  daily (1+2):           %.1f%% ← WHO 'current daily' definition\n",
            wshare(m_smk$cgtsmok %in% c(1,2), m_smk$pspwght)*100))
cat(sprintf("  current (1+2+3):       %.1f%% ← наше 'смокс' зараз\n",
            wshare(m_smk$cgtsmok %in% c(1,2,3), m_smk$pspwght)*100))
cat(sprintf("  ever-smoked (1-4):     %.1f%%\n",
            wshare(m_smk$cgtsmok %in% c(1,2,3,4), m_smk$pspwght)*100))

# Освіта — за рівнем
adults <- d %>% filter(agea >= 25, !is.na(eisced))
cat("\nДорослі 25+, ISCED:\n")
for (lev in 1:7) {
  share <- wshare(adults$eisced == lev, adults$pspwght)
  cat(sprintf("  ISCED %d: %.1f%%\n", lev, share*100))
}
cat("  --- агрегати ---\n")
cat(sprintf("  ISCED 5-7 (наше «вища»):  %.1f%% ← включно з молодший спеціаліст\n",
            wshare(adults$eisced %in% c(5,6,7), adults$pspwght)*100))
cat(sprintf("  ISCED 6-7 (bachelor+):    %.1f%% ← стандартне 'tertiary' UNESCO\n",
            wshare(adults$eisced %in% c(6,7), adults$pspwght)*100))
cat(sprintf("  ISCED 7 (master+):        %.1f%%\n",
            wshare(adults$eisced == 7, adults$pspwght)*100))
