# `data/raw/`

Сюди кладемо сирі мікродані обстежень. **Усе в цій папці ігнорується git** — це навмисно: ESS-ліцензія забороняє розповсюджувати сирі файли.

## Що тут має бути

- `ESS11_UA.sav` — головна хвиля ESS Round 11, Ukraine
  (або `ESS11csUAe01.sav` як country-specific варіант — перевірити чи містить потрібні змінні)
- `ESS10UAe4.sav` — попередня хвиля, fallback якщо R11 thin

## Як отримати

1. Зареєструватися на [europeansocialsurvey.org](https://www.europeansocialsurvey.org/data/) (безкоштовно)
2. Завантажити Ukraine для потрібного раунду у форматі SPSS (`.sav`)
3. Покласти файл у цю папку з оригінальною назвою

Жодних додаткових кроків — `prep/build.R` сам знайде файл.

## Що йде далі

`Rscript prep/build.R` читає звідси, перекодовує і експортує у `public/data/`.
Деталі — у [`prep/README.md`](../../prep/README.md) і кореневому [`RUN_REAL.md`](../../RUN_REAL.md).
