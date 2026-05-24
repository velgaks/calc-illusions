suppressPackageStartupMessages(library(haven))
d <- read_sav("data/raw/ESS11e04_1-subset.sav")
v <- d$lnghom1
cat("class:", paste(class(v), collapse="/"), "\n")
cat("typeof:", typeof(v), "\n")
cat("length:", length(v), "\n")
cat("first 20 raw values:\n")
for (i in 1:20) cat("  [", i, "] '", v[i], "' (nchar=", nchar(v[i]), ")\n", sep="")
