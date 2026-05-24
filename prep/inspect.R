suppressPackageStartupMessages(library(haven))
d <- read_sav("data/raw/ESS11e04_1-subset.sav")
# Шукаємо змінні зросту і ваги
hits <- grep("height|weight|weigh|bmi", names(d), value=TRUE, ignore.case=TRUE)
cat("height/weight vars (", length(hits), "):\n  ", paste(hits, collapse=", "), "\n", sep="")
for (v in hits) {
  if (v %in% names(d)) {
    vals <- d[[v]]
    cat("\n=== ", v, " ===\n  label: ", attr(vals, "label"), "\n", sep="")
    cat("  non-NA:", sum(!is.na(vals)), "of", length(vals), "\n")
    nums <- as.numeric(vals)
    valid <- nums[!is.na(nums) & nums < 900]
    if (length(valid) > 0) {
      cat("  range valid: ", min(valid), "-", max(valid),
          " | mean: ", round(mean(valid), 1), " | median: ", median(valid), "\n", sep="")
    }
  }
}
