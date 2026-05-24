# weights.R — допоміжне для роботи з ESS-вагами.
#
# ESS Round 11 пропонує:
#   pspwght — post-stratification weight, для one-country analysis
#   pweight — population size weight (для cross-country)
#   anweight = pspwght × pweight, для аналізу що поєднує країни
#
# Для UA-only аналізу нам потрібен pspwght. Якщо є anweight — також зберігаємо.

# Перевірити що ваги в розумних межах. ESS pspwght зазвичай ≈ 1 з SD < 1.
validate_weights <- function(w, var_name = "pspwght") {
  stopifnot(is.numeric(w))
  if (any(is.na(w))) {
    warning(var_name, ": ", sum(is.na(w)), " NA — будуть виключені")
  }
  if (any(w < 0, na.rm = TRUE)) {
    stop(var_name, ": знайдено від'ємні ваги — це аномалія")
  }
  if (max(w, na.rm = TRUE) / mean(w, na.rm = TRUE) > 20) {
    warning(var_name, ": максимальна вага / середня > 20. ",
            "Можлива trimming-проблема. Перевір design.")
  }
  invisible(TRUE)
}

# Зважена частка з NA-handling.
weighted_share <- function(condition, weights) {
  w <- weights[!is.na(condition)]
  c <- condition[!is.na(condition)]
  if (sum(w) == 0) return(NA_real_)
  sum(w * as.numeric(c)) / sum(w)
}
