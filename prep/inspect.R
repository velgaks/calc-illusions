suppressPackageStartupMessages(library(haven))
d <- read_sav("data/raw/ESS11e04_1-subset.sav")
# Шукаємо вік членів домогосподарства
pats <- c("yrbrn[0-9]","yrbrn","agec[0-9]","age[a-z]?[0-9]","child","hhsz")
for (p in pats) {
  hits <- grep(p, names(d), value=TRUE, ignore.case=TRUE)
  if (length(hits) > 0) cat("[", p, "]:", paste(hits, collapse=", "), "\n")
}
cat("\n--- Перевірка hhmmb розподілу і чи є yrbrn ---\n")
if ("hhmmb" %in% names(d)) {
  cat("hhmmb:", attr(d$hhmmb,"label"), "\n")
  cat("  distribution:\n")
  print(table(d$hhmmb, useNA="always"))
}
# Шукаємо вік дітей конкретно
for (v in c("yrbrn2","yrbrn3","yrbrn4","yrbrn5","yrbrn6","yrbrn7","yrbrn8","yrbrn9","yrbrn10")) {
  if (v %in% names(d)) {
    nonna <- sum(!is.na(d[[v]]))
    cat(v, ": present, non-NA =", nonna, "\n")
  }
}
