export const UI = {
  uk: {
    title: 'Україна у даних', navOverview: 'Огляд', navExplorer: 'Конструктор', navMethodology: 'Методологія',
    localeAction: 'Switch to English', fieldwork: 'грудень 2023 — лютий 2024',
    heroDek: 'Скільки заробляють українці, де й ким працюють, у яких умовах живуть? Досліджуйте дані SESH 2023/24 про 18 837 людей і 8 023 домогосподарства.',
    populationEstimate: 'оцінка населення', interviewedPeople: 'опитаних людей', interviewedHouseholds: 'домогосподарства',
    people: 'Люди', households: 'Домогосподарства', indicator: 'Показник', breakdown: 'Розріз', noBreakdown: 'Без розрізу', filters: 'Фільтри', addFilter: 'Додати фільтр', filterLimit: 'Максимум два фільтри', remove: 'Видалити',
    variable: 'Змінна', category: 'Категорія', from: 'Від', to: 'До', threshold: 'Поріг', apply: 'Застосувати',
    copyLink: 'Копіювати посилання', copied: 'Скопійовано', downloadCsv: 'CSV результату',
    loadingDataset: 'Завантажуємо детальний масив…', queryResult: 'Результат запиту', weightedCount: 'Зважена кількість', weightedShare: 'Частка', sampleN: 'Незважене n', clusters: 'домогосподарств-кластерів', excluded: 'виключено через пропуски або маршрут', universe: 'Universe',
    exactTable: 'Таблиця точних значень', value: 'Значення', share: 'Частка', count: 'Оцінка кількості', sample: 'Вибірка', median: 'Медіана', percentile: 'Перцентиль',
    veryLow: 'Дуже мала вибірка: менш ніж 10 спостережень. Значення показано, але воно вкрай нестабільне.', caution: 'Обережно: 10–29 спостережень. Оцінка нестабільна.', reliable: 'Щонайменше 30 спостережень.',
    sources: 'Джерела й авторство', source: 'Джерело', dataLicense: 'Дані CC BY-NC-SA 4.0', codeLicense: 'Код MIT',
    explorerIntro: 'Сформуйте власне запитання до SESH. Людей і домогосподарства система рахує окремо — із власними вагами та знаменниками.',
    chooseIndicator: 'Оберіть показник', allCategories: 'Усі категорії', methodologyTitle: 'Як читати ці дані',
    chartAlternative: 'Текстова альтернатива', p10: 'p10', p25: 'p25', p50: 'медіана', p75: 'p75', p90: 'p90', atOrBelow: 'на рівні або нижче порога',
    demography: 'Демографія', income: 'Доходи', employment: 'Зайнятість', living: 'Умови життя',
    authorCredit: 'Автор дашборду: Valentyn Hatsko, TG: @gorbach_squad.', retrieved: 'отримано у серпні 2026.',
  },
  en: {
    title: 'Ukraine in Data', navOverview: 'Overview', navExplorer: 'Explorer', navMethodology: 'Methodology',
    localeAction: 'Перемкнути українською', fieldwork: 'December 2023 — February 2024',
    heroDek: 'How much do Ukrainians earn, where do they work, and what are their living conditions? Explore SESH 2023/24 data on 18,837 people and 8,023 households.',
    populationEstimate: 'estimated population', interviewedPeople: 'people observed', interviewedHouseholds: 'households',
    people: 'People', households: 'Households', indicator: 'Indicator', breakdown: 'Breakdown', noBreakdown: 'No breakdown', filters: 'Filters', addFilter: 'Add filter', filterLimit: 'Maximum two filters', remove: 'Remove',
    variable: 'Variable', category: 'Category', from: 'From', to: 'To', threshold: 'Threshold', apply: 'Apply',
    copyLink: 'Copy link', copied: 'Copied', downloadCsv: 'Download CSV',
    loadingDataset: 'Loading detailed dataset…', queryResult: 'Query result', weightedCount: 'Weighted count', weightedShare: 'Share', sampleN: 'Unweighted n', clusters: 'household clusters', excluded: 'excluded by routing or missingness', universe: 'Universe',
    exactTable: 'Exact-value table', value: 'Value', share: 'Share', count: 'Estimated count', sample: 'Sample', median: 'Median', percentile: 'Percentile',
    veryLow: 'Very small sample: fewer than 10 observations. The value is shown but highly unstable.', caution: 'Caution: 10–29 observations. This estimate is unstable.', reliable: 'At least 30 observations.',
    sources: 'Sources and credits', source: 'Source', dataLicense: 'Data CC BY-NC-SA 4.0', codeLicense: 'Code MIT',
    explorerIntro: 'Build your own question from SESH. People and households are always estimated separately, using their own weights and denominators.',
    chooseIndicator: 'Choose an indicator', allCategories: 'All categories', methodologyTitle: 'How to read these data',
    chartAlternative: 'Text alternative', p10: 'p10', p25: 'p25', p50: 'median', p75: 'p75', p90: 'p90', atOrBelow: 'at or below threshold',
    demography: 'Demography', income: 'Income', employment: 'Employment', living: 'Living conditions',
    authorCredit: 'Dashboard by Valentyn Hatsko, TG: @gorbach_squad.', retrieved: 'retrieved August 2026.',
  },
};

export const OVERVIEW_CATEGORY_EN = {
  'жіноча': 'Women', 'чоловіча': 'Men',
  'Працював (в тому числі займалась/вся бізнесом, будь-чим, що приносить дохід)': 'Worked for income',
  'Не працював': 'Did not work',
  'Не працював тимчасово (не більше місяця), хоча мав роботу або бізнес': 'Temporarily absent from work',
  'Працював вдома (на власній земельній ділянці) для задоволення потреб членів родини без оплати': 'Unpaid household production',
  'Робота, за яку платять заробітну плату, оформлена трудовим договором/ трудовою книжкою, контрактом чи іншим документом': 'Formal salaried work',
  'Робота за зарплату без оформлення документів, а на основі усної домовленості': 'Informal salaried work',
  'Працював індивідуально на себе заради отримання доходу без оформлення підприємства та без інших осіб (ремонти, консульта': 'Unregistered self-employment',
  'Власник або керівник бізнесу, приватний підприємець (оформлене підприємство, ФОП)': 'Registered business / sole proprietor',
  'Працював на сімейній земельній ділянці чи з худобою для вирощування на продаж': 'Family farming for sale',
  'Інше': 'Other',
};

export const DEPRIVATION_LABELS = {
  unexpected_expense: { uk: 'Несподівані витрати', en: 'Unexpected expense' },
  annual_holiday: { uk: 'Тиждень відпочинку', en: 'One-week holiday' },
  payment_arrears: { uk: 'Прострочені платежі', en: 'Payment arrears' },
  protein_meal: { uk: 'Білкова їжа через день', en: 'Protein meal every other day' },
  warm_home: { uk: 'Достатньо тепле житло', en: 'Adequately warm home' },
};

export function t(locale) { return UI[locale] || UI.uk; }
