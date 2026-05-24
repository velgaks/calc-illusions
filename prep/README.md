# `prep/` — R препроцесинг

Перетворює сирий `.sav` файл з ESS data portal на три JSON-и для фронтенду.

## Вимоги

- R 4.2+ з Rscript у PATH
- Пакети: `haven`, `survey`, `dplyr`, `jsonlite`

Установка пакетів:

```r
install.packages(c("haven", "survey", "dplyr", "jsonlite"))
```

Або одним рядком з shell:

```bash
Rscript -e 'install.packages(c("haven","survey","dplyr","jsonlite"), repos="https://cloud.r-project.org")'
```

## Запуск

З кореня репозиторію:

```bash
Rscript prep/build.R
```

За замовчуванням скрипт:
1. Шукає у `data/raw/` файли за пріоритетом: `ESS11_UA.sav` → `ESS11csUAe01.sav` → `ESS10UAe4.sav`
2. Перекодовує змінні в єдину схему
3. Обчислює design-aware SE для joint-частки через `survey::svymean`
4. Експортує:
   - `public/data/respondents.json` (довга таблиця)
   - `public/data/external.json` (TODO — заповнюється вручну, скрипт лише валідує)
   - `public/data/methodology.json` (метадані з ESS, оновлюється автоматично)

## Файли модуля

- `build.R` — entry point, orchestrator
- `lib/recode.R` — функції перекодування ESS-змінних
- `lib/weights.R` — обробка `pspwght`/`anweight`
- `lib/bootstrap.R` — design-aware SE
- `lib/export.R` — запис JSON-ів

## Що далі

Після успішного запуску:
- Перевірити `public/data/methodology.json` → поле `variables_missing` має бути порожнім
- Якщо щось відсутнє — задокументувати в коментарі і прибрати відповідний контрол з UI
- Заповнити TODO в `public/data/external.json` вручну з NCD-RisC / Держстату / Інституту демографії
- Зібрати фронтенд: `cd web && npm install && npm run dev`

Повний чек-лист — у [`../RUN_REAL.md`](../RUN_REAL.md).
