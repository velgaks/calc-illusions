# RUN_REAL.md — перехід з mock на реальні дані

Цей чек-лист описує, як замінити синтетичний mock на справжні мікродані ESS.
Після виконання банер «DEMO DATA» зникне і калькулятор показуватиме реальні оцінки.

## Передумови

- R 4.2+ з `Rscript` у PATH
- Node 18+
- ~100 МБ вільного місця

## Кроки

### 1. Установити R-пакети

```bash
Rscript -e 'install.packages(c("haven","survey","dplyr","jsonlite"), repos="https://cloud.r-project.org")'
```

(~1–2 хв, тягне з CRAN).

### 2. Перевірити, який .sav-файл у `data/raw/`

```bash
ls -la data/raw/
```

Має бути хоча б один з:
- `ESS11_UA.sav` (повна головна хвиля R11) — **бажано**
- `ESS11csUAe01.sav` (country-specific R11) — fallback, якщо повної R11 нема
- `ESS10UAe4.sav` (хвиля R10) — fallback, якщо R11 thin

> Якщо нічого нема — завантаж з [europeansocialsurvey.org](https://www.europeansocialsurvey.org/data/) → Ukraine. Реєстрація безкоштовна.

### 3. Запустити R-pipeline

```bash
Rscript prep/build.R
```

Очікувано:
```
📂 Читаю: ESS11_UA.sav
   n_rows = 1500, n_cols = 600
   wave = ESS11
✓ Присутні змінні (10): gndr, agea, eisced, ...
✓ Після перекодування і фільтра 18+: n = 1450
✓ Precomputed SE для 12 груп
✓ Записано respondents.json (1450 рядків)
✓ Оновлено methodology.json
```

Якщо `⚠ external.json все ще mock:true` — це нормально на цьому етапі. Заповнимо у кроці 5.

### 4. Перевірити, які змінні є в твоєму файлі

Відкрий `public/data/methodology.json`. Поле `ess.variables_missing` має бути `[]`. Якщо щось відсутнє:

- Не вигадуй fallback в коді
- Зафіксуй у коментарі в `web/src/i18n/uk.js` що цей контрол прибраний
- Закоментуй відповідний контрол в `web/src/components/Controls.jsx`

### 5. Заповнити `public/data/external.json` реальними числами

Це найдовший крок. Відкрий файл — у ньому placeholder з префіксом `_source_TODO`.

#### 5a. Зріст: NCD-RisC

1. Зайди на [ncdrisc.org](https://ncdrisc.org/) → найсвіжіша публікація про дорослий зріст
2. Завантаж CSV з оцінками μ і σ зросту за статтю і когортами для Ukraine
3. Замінь масиви `height.male` і `height.female` (у см, по 5-річних когортах народження)
4. Поле `_source_TODO` → видали; додай `_source` з посиланням на публікацію

#### 5b. Чисельність когорт: Інститут демографії

1. Зайди на [demography.org.ua](https://www.demography.org.ua/) → найсвіжіша оцінка чисельності
2. Знайди статево-вікову декомпозицію для **підконтрольної території**
3. Замінь масиви `cohorts.male` і `cohorts.female`
4. `_target_total` має бути ≈30.5 млн (загалом)

#### 5c. Дохідні децилі: Держстат

1. Зайди на [ukrstat.gov.ua](https://www.ukrstat.gov.ua/) → ОУЖД → розподіл доходів
2. Знайди межі дохідних децилів — переконайся: **на одну особу чи на домогосподарство** (вибери одне і зафіксуй у `_unit`)
3. Замінь `income_deciles.bounds_uah` — масив 10 значень, верхня межа кожного децилю; останній — `null` (+∞)
4. Оновити `_year`

#### 5d. Зафіксувати у `methodology.json`

Постав `mock: false` у топі external.json. Оновити `methodology.json` — у блоках `height`, `cohorts`, `income` заповнити `source` і `year` реальними значеннями.

### 6. Перевірити, що банер DEMO зник

```bash
cd web
npm install      # якщо вперше
npm run dev
```

Відкрий `http://127.0.0.1:5173`. Червоного банера зверху бути не повинно. Якщо є — щось у JSON-ах ще має `mock: true`.

### 7. Прогнати швидку перевірку

Введи реальні параметри (наприклад: чол. 30–40, ISCED ≥ 5, дохід ≥ 25 000 грн). Перевір:

- ✓ Частка має сенс (~1–10%, не 0%, не 100%)
- ✓ CI має ширину 1–5 п.п. (не 0–0, не 0–100)
- ✓ n у вікні (видно в розгорнутій формулі) → 100+
- ✓ Бейдж під результатом показує **ESS11**, реальний `n`, рік поля
- ✓ Декомпозиція ранжує критерії розумно

### 8. Production-білд

```bash
cd web
npm run build:gh    # для GitHub Pages з base path
# або: npm run build для іншого хостингу
npm run preview     # перевірити локально
```

### 9. Деплой на GitHub Pages

Найпростіше через GH Actions. Створи `.github/workflows/deploy.yml`:

```yaml
name: Deploy
on: { push: { branches: [main] } }
permissions: { contents: read, pages: write, id-token: write }
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm, cache-dependency-path: web/package-lock.json }
      - run: cd web && npm ci
      - run: cd web && VITE_BASE_PATH=/calc-illusions/ npm run build
      - uses: actions/upload-pages-artifact@v3
        with: { path: web/dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: github-pages
    steps:
      - uses: actions/deploy-pages@v4
```

Налаштувати в Settings → Pages → Build and deployment → GitHub Actions.

> **Важливо:** заміни `/calc-illusions/` на фактичну назву репо.

### 10. Smoke перед публікацією

- Відкрий продакшн-URL у браузері
- Перевір `/methodology` — всі джерела з реальними посиланнями, року, n
- Скопіюй посилання з активним стейтом → відкрий у incognito → стейт відновився
- DevTools → Network → переконайся що `/data/*.json` віддаються з правильним base path

## Що зробити коли вийде нова хвиля ESS

1. Завантажити новий .sav у `data/raw/`
2. `Rscript prep/build.R` — він автоматично підбере найсвіжіший доступний
3. Перевірити `methodology.json` → `ess.wave` і `ess.fieldwork_year`
4. Commit `public/data/*.json` (JSON-и комітимо у git — це збірка для статичного сайту)

## Troubleshooting

**`Error: cannot find function "read_sav"`** — не встановлений `haven`. Запусти крок 1.

**`Не знайдено жодного .sav файлу`** — файл не в `data/raw/`, або має нестандартну назву. Перевір крок 2.

**Банер DEMO лишається після кроку 6** — хоча б один з JSON-ів все ще має `mock: true`. Перевір усі три у `public/data/`.

**0% з реалістичними критеріями** — це підозріло. Перевір розгорнуту формулу: якщо `n у вікні < 30` — занадто вузьке вікно. Якщо `n ≥ 100`, але матчиться 0 → можливо неправильно перекодовано якусь змінну, або сам набір критеріїв нереалістичний.

**Build падає на GH Actions** — переконайся що `web/package-lock.json` закомічений.
