# export.R — запис JSON у public/data/.
#
# Формат respondents.json:
#   {
#     "mock": false,
#     "source": "ESS11_UA.sav",
#     "wave": "ESS11",
#     "n": 1234,
#     "weight_var": "pspwght",
#     "generated_at": "2026-05-24T10:30:00Z",
#     "precomputed_se": { "M_25_34": { "n": 234, "n_eff": 198, ... }, ... },
#     "respondents": [ { "id":1, "gndr":1, "agea":34, ... }, ... ]
#   }

export_respondents <- function(df, precomputed_se, wave, source_file, out_path) {
  payload <- list(
    mock           = FALSE,
    source         = source_file,
    wave           = wave,
    n              = nrow(df),
    weight_var     = "pspwght",
    generated_at   = format(Sys.time(), "%Y-%m-%dT%H:%M:%SZ", tz = "UTC"),
    precomputed_se = precomputed_se,
    respondents    = df
  )
  write_json(
    payload,
    out_path,
    auto_unbox = TRUE,
    na         = "null",
    digits     = 4,
    pretty     = FALSE   # compact для меншого розміру
  )
  invisible(out_path)
}

# Оновити public/data/methodology.json — частково (тільки секцію ESS).
# external та інші секції залишаємо як є (там TODO заповнює людина).
update_methodology <- function(out_path, wave, n_respondents, source_file,
                                variables_present, variables_missing,
                                weight_var, fieldwork_year) {
  current <- if (file.exists(out_path)) {
    fromJSON(out_path, simplifyVector = FALSE)
  } else {
    list()
  }
  current$ess <- list(
    source             = "European Social Survey",
    url                = "https://www.europeansocialsurvey.org/",
    wave               = wave,
    file               = source_file,
    n_respondents      = n_respondents,
    weight_var         = weight_var,
    fieldwork_year     = fieldwork_year,
    variables_present  = as.list(variables_present),
    variables_missing  = as.list(variables_missing),
    updated_at         = format(Sys.time(), "%Y-%m-%dT%H:%M:%SZ", tz = "UTC")
  )
  write_json(
    current, out_path,
    auto_unbox = TRUE, na = "null", pretty = TRUE
  )
  invisible(out_path)
}
