suppressPackageStartupMessages(library(haven))
d <- read_sav("data/raw/ESS11e04_1-subset.sav")
cat("rshipa2 label:", attr(d$rshipa2, "label"), "\n")
lbl <- attr(d$rshipa2, "labels")
if (!is.null(lbl)) { cat("\nlabels:\n"); print(lbl) }
cat("\ndistribution rshipa2:\n")
print(table(d$rshipa2, useNA = "always"))
# Combined: how many respondents have at least one OWN child (code 2 = son/daughter) under 18?
field_year <- 2024
cnt_with_own_minor <- 0
cnt_with_minor_total <- 0
cnt_with_kid_any_age <- 0
for (i in 1:nrow(d)) {
  has_own_minor <- FALSE
  has_any_minor <- FALSE
  has_kid_any_age <- FALSE
  for (n in 2:13) {
    rcode <- d[[paste0("rshipa", n)]][i]
    yr <- d[[paste0("yrbrn", n)]][i]
    if (!is.na(yr)) {
      age <- field_year - yr
      if (age >= 0 && age < 18) has_any_minor <- TRUE
      if (!is.na(rcode) && rcode == 2) {
        has_kid_any_age <- TRUE
        if (age >= 0 && age < 18) has_own_minor <- TRUE
      }
    }
  }
  if (has_own_minor) cnt_with_own_minor <- cnt_with_own_minor + 1
  if (has_any_minor) cnt_with_minor_total <- cnt_with_minor_total + 1
  if (has_kid_any_age) cnt_with_kid_any_age <- cnt_with_kid_any_age + 1
}
cat("\nResp з власною дитиною <18:", cnt_with_own_minor, "\n")
cat("Resp з будь-яким членом <18 у ДГ (старе):", cnt_with_minor_total, "\n")
cat("Resp з власною дитиною будь-якого віку у ДГ:", cnt_with_kid_any_age, "\n")
