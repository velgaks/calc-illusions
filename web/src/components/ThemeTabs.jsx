import { useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import ChartFrame from './ChartFrame.jsx';
import { AgeSexChart, DeprivationChart, EmploymentChart, IncomeChart } from './OverviewCharts.jsx';

const THEMES = [
  { id: 'sociodemographic', label: { uk: 'Соцдем', en: 'People' } },
  { id: 'income', label: { uk: 'Доходи', en: 'Income' } },
  { id: 'employment', label: { uk: 'Зайнятість', en: 'Employment' } },
  { id: 'living', label: { uk: 'Житло й умови життя', en: 'Housing & living' } },
];

const CATEGORY_BLOCKS = {
  region: {
    unit: 'people', variable: 'region', wide: true, focus: ['м.Київ'],
    question: { uk: 'У яких областях живуть українці?', en: 'Where do Ukrainians live?' },
    finding: { uk: 'оціненого населення припадає на Київ', en: 'of the estimated population live in Kyiv city' },
  },
  settlement: {
    unit: 'people', variable: 'settlement', focus: ['urban'],
    question: { uk: 'Скільки людей живуть у містах і селах?', en: 'How many people live in urban and rural areas?' },
    finding: { uk: 'населення живе у міській місцевості', en: 'of the population live in urban areas' },
  },
  education: {
    unit: 'people', variable: 'education', wide: true, focus: ['Професійна (професійно-технічна) освіта'],
    question: { uk: 'Яку освіту мають українці?', en: 'What education do Ukrainians have?' },
    finding: { uk: 'населення 15+ мають професійну або професійно-технічну освіту', en: 'of people aged 15+ have vocational education' },
  },
  marital: {
    unit: 'people', variable: 'marital', wide: true, focus: ['Перебуваю в зареєстрованому шлюбі'],
    question: { uk: 'Який сімейний стан українців?', en: 'What is the marital status of Ukrainians?' },
    finding: { uk: 'населення 15+ перебувають у зареєстрованому шлюбі', en: 'of people aged 15+ are in a registered marriage' },
  },
  idp: {
    unit: 'people', variable: 'idp', focus: ['yes'],
    question: { uk: 'Скільки людей мають статус ВПО?', en: 'How many people have IDP status?' },
    finding: { uk: 'населення мають статус ВПО', en: 'of the population have IDP status' },
  },
  moved_since_2014: {
    unit: 'people', variable: 'moved_since_2014', wide: true,
    focus: ['Переїхав після початку гібридної війни з рф на Сході України (після 20 лютого 2014 року)'],
    question: { uk: 'Скільки людей переїхали після 2014 року?', en: 'How many people moved after 2014?' },
    finding: { uk: 'населення переїхали після 20 лютого 2014 року', en: 'of the population moved after 20 February 2014' },
  },
  abroad_since_2022: {
    unit: 'people', variable: 'abroad_since_2022', focus: ['yes'],
    question: { uk: 'Хто виїжджав за кордон після 24.02.2022?', en: 'Who stayed abroad after 24 February 2022?' },
    finding: { uk: 'населення перебували за кордоном щонайменше місяць після 24.02.2022', en: 'of the population stayed abroad for at least a month after 24 February 2022' },
  },
  income_adequacy: {
    unit: 'households', variable: 'income_adequacy', wide: true,
    focus: ['Постійно відмовляли собі в найнеобхіднішому, крім харчування', 'Не вдалося забезпечити навіть достатнє харчування'],
    question: { uk: 'На що домогосподарствам вистачає доходу?', en: 'What can households afford with their income?' },
    finding: { uk: 'домогосподарств бракує грошей на необхідне або навіть на достатнє харчування', en: 'of households lack money for essentials or even adequate food' },
  },
  income_change: {
    unit: 'households', variable: 'income_change', wide: true,
    focus: ['Значно зменшилися', 'Дещо зменшилися'],
    question: { uk: 'Як змінилися доходи порівняно з 2021 роком?', en: 'How has income changed since 2021?' },
    finding: { uk: 'домогосподарств повідомили про зменшення доходів', en: 'of households reported lower income' },
  },
  financial_stability: {
    unit: 'households', variable: 'financial_stability', focus: ['Не маємо фінансової стабільності'],
    question: { uk: 'Наскільки стабільні доходи родин?', en: 'How stable are household incomes?' },
    finding: { uk: 'домогосподарств не мають фінансової стабільності', en: 'of households report no financial stability' },
  },
  income_source: {
    unit: 'people', variable: 'income_source', wide: true, focus: ['Заробітна плата (чистий дохід, без податків і аліментів)'],
    question: { uk: 'Звідки українці отримують основний дохід?', en: 'What is Ukrainians’ main source of income?' },
    finding: { uk: 'населення 15+ назвали основним джерелом чисту зарплату', en: 'of people aged 15+ named net salary as their main income source' },
  },
  used_savings: {
    unit: 'households', variable: 'used_savings', focus: ['Заощаджень не маємо'],
    question: { uk: 'Чи доводилося витрачати заощадження?', en: 'Did households have to use savings?' },
    finding: { uk: 'домогосподарств узагалі не мали заощаджень', en: 'of households had no savings at all' },
  },
  debt: {
    unit: 'households', variable: 'debt', focus: ['Так'],
    question: { uk: 'Скільки родин мають борги або кредити?', en: 'How many households have debts or loans?' },
    finding: { uk: 'домогосподарств мають борги або кредити', en: 'of households have debts or loans' },
  },
  uses_credit: {
    unit: 'households', variable: 'uses_credit', focus: ['Так'],
    question: { uk: 'Скільки родин користуються позиками?', en: 'How many households use credit?' },
    finding: { uk: 'домогосподарств користуються позиками', en: 'of households use credit' },
  },
  relative_wealth: {
    unit: 'households', variable: 'relative_wealth', focus: ['Нижче середнього'],
    question: { uk: 'Як родини оцінюють свій достаток?', en: 'How do households assess their wealth?' },
    finding: { uk: 'домогосподарств вважають свій достаток нижчим за середній', en: 'of households consider themselves below average' },
  },
  sector: {
    unit: 'people', variable: 'sector', wide: true,
    focus: ['Оптова та роздрібна торгівля; ремонт автотранспортних засобів і мотоциклів'],
    question: { uk: 'У яких секторах працюють українці?', en: 'Which sectors employ Ukrainians?' },
    finding: { uk: 'зайнятих працюють у торгівлі та ремонті транспорту', en: 'of employed people work in trade and vehicle repair' },
  },
  occupation_group: {
    unit: 'people', variable: 'occupation_group', wide: true, focus: ['Робітники найпростіших професій'],
    question: { uk: 'Ким працюють українці?', en: 'What occupations do Ukrainians work in?' },
    finding: { uk: 'зайнятих належать до робітників найпростіших професій', en: 'of employed people work in elementary occupations' },
  },
  job_search: {
    unit: 'people', variable: 'job_search', focus: ['Так'],
    question: { uk: 'Скільки непрацюючих шукали роботу?', en: 'How many non-working people looked for a job?' },
    finding: { uk: 'непрацюючих, яким поставили питання, шукали роботу', en: 'of non-working respondents asked the question were looking for work' },
  },
  housing_tenure: {
    unit: 'households', variable: 'housing_tenure', wide: true, focus: ['Є власністю Вашої родини'],
    question: { uk: 'У власному чи орендованому житлі живуть родини?', en: 'Do households own or rent their homes?' },
    finding: { uk: 'домогосподарств живуть у житлі, що належить родині', en: 'of households live in a home owned by the family' },
  },
  dwelling_type: {
    unit: 'households', variable: 'dwelling_type', wide: true, focus: ['Індивідуальний будинок (садиба)'],
    question: { uk: 'У яких типах житла живуть українці?', en: 'What types of dwelling do households live in?' },
    finding: { uk: 'домогосподарств живуть в індивідуальних будинках', en: 'of households live in detached houses' },
  },
  adequate_area: {
    unit: 'households', variable: 'adequate_area', focus: ['Ні, потрібно більше площі'],
    question: { uk: 'Чи вистачає родинам житлової площі?', en: 'Do households have enough living space?' },
    finding: { uk: 'домогосподарств потребують більше житлової площі', en: 'of households say they need more living space' },
  },
  winter_temperature: {
    unit: 'households', variable: 'winter_temperature', focus: ['Ні'],
    question: { uk: 'Чи достатньо тепло вдома взимку?', en: 'Are homes warm enough in winter?' },
    finding: { uk: 'домогосподарств не можуть підтримувати комфортну температуру взимку', en: 'of households cannot keep a comfortable winter temperature' },
  },
  public_transport: {
    unit: 'households', variable: 'public_transport', focus: ['Так'],
    question: { uk: 'Чи є поруч громадський транспорт?', en: 'Is public transport available nearby?' },
    finding: { uk: 'домогосподарств мають доступ до громадського транспорту', en: 'of households have access to public transport' },
  },
  internet: {
    unit: 'households', variable: 'internet', focus: ['Так'],
    question: { uk: 'Скільки родин мають інтернет удома?', en: 'How many households have internet at home?' },
    finding: { uk: 'домогосподарств мають інтернет удома', en: 'of households have internet at home' },
  },
};

const THEME_BLOCKS = {
  sociodemographic: [
    { kind: 'ageSex' },
    { kind: 'category', id: 'region' },
    { kind: 'category', id: 'settlement' },
    { kind: 'category', id: 'education' },
    { kind: 'category', id: 'marital' },
    { kind: 'householdComposition' },
    { kind: 'category', id: 'idp' },
    { kind: 'category', id: 'moved_since_2014' },
    { kind: 'category', id: 'abroad_since_2022' },
  ],
  income: [
    { kind: 'incomeDistribution' },
    { kind: 'numeric', unit: 'people', variable: 'personal_income', format: 'money', question: { uk: 'Скільки люди отримують особисто?', en: 'How much personal income do people receive?' } },
    { kind: 'category', id: 'income_adequacy' },
    { kind: 'category', id: 'income_change' },
    { kind: 'category', id: 'financial_stability' },
    { kind: 'category', id: 'income_source' },
    { kind: 'category', id: 'used_savings' },
    { kind: 'category', id: 'debt' },
    { kind: 'category', id: 'uses_credit' },
    { kind: 'category', id: 'relative_wealth' },
  ],
  employment: [
    { kind: 'employmentStatus' },
    { kind: 'category', id: 'sector' },
    { kind: 'category', id: 'occupation_group' },
    { kind: 'numeric', unit: 'people', variable: 'weekly_hours', format: 'hours', question: { uk: 'Скільки годин на тиждень працюють українці?', en: 'How many hours per week do Ukrainians work?' } },
    { kind: 'category', id: 'job_search' },
  ],
  living: [
    { kind: 'category', id: 'housing_tenure' },
    { kind: 'category', id: 'dwelling_type' },
    { kind: 'area' },
    { kind: 'category', id: 'adequate_area' },
    { kind: 'numeric', unit: 'households', variable: 'rooms', format: 'rooms', question: { uk: 'Скільки кімнат у житлі?', en: 'How many rooms do homes have?' } },
    { kind: 'category', id: 'winter_temperature' },
    { kind: 'deprivation' },
    { kind: 'numeric', unit: 'households', variable: 'car_count', format: 'cars', question: { uk: 'Скільки родин мають автомобіль?', en: 'How many households have a car?' }, zeroShare: true },
    { kind: 'category', id: 'public_transport' },
    { kind: 'category', id: 'internet' },
  ],
};

const THEME_COPY = {
  sociodemographic: {
    title: { uk: 'Хто живе в Україні', en: 'Who lives in Ukraine' },
    text: { uk: 'Стать, вік, місце проживання, освіта, сімейний стан і досвід переміщення.', en: 'Age, sex, place of residence, education, marital status and displacement.' },
  },
  income: {
    title: { uk: 'Скільки мають і на що вистачає', en: 'How much people have and what it covers' },
    text: { uk: 'Доходи, їхня стабільність, достатність, борги та заощадження.', en: 'Income, its stability and adequacy, debts and savings.' },
  },
  employment: {
    title: { uk: 'Як і де працюють українці', en: 'How and where Ukrainians work' },
    text: { uk: 'Економічний статус, оформлення роботи, професії, сектори й пошук роботи.', en: 'Economic status, work arrangement, occupations, sectors and job search.' },
  },
  living: {
    title: { uk: 'У яких умовах живуть родини', en: 'How households live' },
    text: { uk: 'Житло, простір, тепло, транспорт, інтернет і матеріальні обмеження.', en: 'Housing, space, warmth, transport, internet and material constraints.' },
  },
};

const localeTag = locale => locale === 'uk' ? 'uk-UA' : 'en-US';
const percent = locale => new Intl.NumberFormat(localeTag(locale), { style: 'percent', maximumFractionDigits: 1 });
const whole = locale => new Intl.NumberFormat(localeTag(locale), { maximumFractionDigits: 0 });
const decimal = locale => new Intl.NumberFormat(localeTag(locale), { maximumFractionDigits: 1 });

function definitionFor(metadata, unit, id) {
  return metadata.units[unit].variables.find(variable => variable.id === id);
}

function definitionsFor(metadata, unit, ids) {
  return ids.map(id => definitionFor(metadata, unit, id)).filter(Boolean);
}

function categoryLabel(metadata, unit, variable, value, locale) {
  const entry = metadata.units[unit].dictionaries?.[variable]?.find(item => item.value === String(value));
  return entry?.labels?.[locale] || String(value);
}

function formatValue(value, format, locale) {
  if (value == null) return '—';
  const n = format === 'area' ? decimal(locale).format(value) : whole(locale).format(value);
  if (format === 'money') return locale === 'uk' ? `${n} грн` : `UAH ${n}`;
  if (format === 'hours') return locale === 'uk' ? `${n} год` : `${n} hrs`;
  if (format === 'area') return `${n} м²`;
  if (format === 'rooms') return locale === 'uk' ? `${n} кімн.` : `${n} rooms`;
  if (format === 'cars') return locale === 'uk' ? `${n} авто` : `${n} cars`;
  return n;
}

function UnitLabel({ unit, locale }) {
  return <span className={`theme-unit theme-unit-${unit}`}>{unit === 'people' ? (locale === 'uk' ? 'Люди' : 'People') : (locale === 'uk' ? 'Домогосподарства' : 'Households')}</span>;
}

function SmallCategoryNote({ rows, locale }) {
  if (!rows.some(row => row.n < 30)) return null;
  return <p className="theme-small-note">{locale === 'uk'
    ? 'Для категорій із n < 30 оцінки нестабільні; значення не приховуємо, незважене n є в таблиці.'
    : 'Estimates with n < 30 are unstable; values remain visible and unweighted n is reported in the table.'}</p>;
}

function orderRows(rows, categoryOrder = [], numeric = false) {
  const order = new Map(categoryOrder.map((value, index) => [String(value), index]));
  return [...rows].sort(order.size
    ? (a, b) => (order.get(String(a.category)) ?? Number.MAX_SAFE_INTEGER) - (order.get(String(b.category)) ?? Number.MAX_SAFE_INTEGER)
    : numeric
      ? (a, b) => Number(a.category) - Number(b.category)
      : (a, b) => b.share - a.share);
}

function DistributionBars({ rows, labelFor, locale, focus = [], numeric = false, format = null, categoryOrder = [] }) {
  const pct = percent(locale);
  const ordered = orderRows(rows, categoryOrder, numeric);
  return <div className={`overview-bars ${ordered.length > 12 ? 'overview-bars-scroll' : ''}`}>
    {ordered.map(row => {
      const highlighted = focus.some(value => String(value) === String(row.category));
      return <div className="overview-bar-row" key={row.category}>
        <span className="overview-bar-label">{numeric ? formatValue(row.category, format, locale) : labelFor(row.category)}</span>
        <span className="overview-bar-track" aria-hidden="true"><i className={highlighted ? 'is-focus' : ''} style={{ width: `${Math.max(row.share * 100, .35)}%` }} /></span>
        <strong>{pct.format(row.share)}</strong>
      </div>;
    })}
  </div>;
}

function CategoricalBlock({ config, overview, metadata, locale }) {
  const summary = overview.variable_summaries[config.unit][config.variable];
  const pct = percent(locale);
  const number = whole(locale);
  const focusRows = summary.rows.filter(row => config.focus.some(value => String(value) === String(row.category)));
  const focusShare = focusRows.reduce((sum, row) => sum + row.share, 0);
  const labelFor = value => categoryLabel(metadata, config.unit, config.variable, value, locale);
  const definition = definitionFor(metadata, config.unit, config.variable);
  const categoryOrder = definition.category_order || [];
  const rows = orderRows(summary.rows, categoryOrder);
  const title = `${pct.format(focusShare)} ${config.finding[locale]}`;
  const definitions = [definition];
  return <article className={`theme-card ${config.wide ? 'theme-card-wide' : ''}`}>
    <header className="theme-card-heading">
      <div><p className="theme-question">{config.question[locale]}</p><h3>{title}</h3></div>
      <UnitLabel unit={config.unit} locale={locale} />
    </header>
    <ChartFrame locale={locale} definitions={definitions} ariaLabel={`${config.question[locale]} ${title}`} table={
      <table><thead><tr><th>{locale === 'uk' ? 'Відповідь' : 'Response'}</th><th>{locale === 'uk' ? 'Частка' : 'Share'}</th><th>{locale === 'uk' ? 'Оцінка кількості' : 'Estimated count'}</th><th>n</th></tr></thead>
        <tbody>{rows.map(row => <tr key={row.category}><th>{labelFor(row.category)}</th><td>{pct.format(row.share)}</td><td>{number.format(row.weighted)}</td><td>{number.format(row.n)}</td></tr>)}</tbody></table>
    }>
      <DistributionBars rows={summary.rows} labelFor={labelFor} locale={locale} focus={config.focus} categoryOrder={categoryOrder} />
      <SmallCategoryNote rows={summary.rows} locale={locale} />
      <p className="theme-base">{locale === 'uk' ? 'База' : 'Base'}: n = {number.format(summary.base_n)} · {locale === 'uk' ? 'без відповіді / поза маршрутом' : 'missing / outside routing'}: {number.format(summary.missing_n)}</p>
    </ChartFrame>
  </article>;
}

function QuantileVisual({ summary, format, locale }) {
  return <div className="quantile-strip">
    {summary.quantiles.map(row => <div key={row.p}>
      <span>{row.p === .5 ? (locale === 'uk' ? 'медіана' : 'median') : `p${row.p * 100}`}</span>
      <i aria-hidden="true" />
      <strong>{formatValue(row.value, format, locale)}</strong>
    </div>)}
  </div>;
}

function QuantileTable({ summaries, labels, format, locale }) {
  return <table><thead><tr><th>{locale === 'uk' ? 'Перцентиль' : 'Percentile'}</th>{labels.map(label => <th key={label}>{label}</th>)}</tr></thead>
    <tbody>{summaries[0].quantiles.map((row, index) => <tr key={row.p}><th>{row.p === .5 ? (locale === 'uk' ? 'медіана' : 'median') : `p${row.p * 100}`}</th>{summaries.map(summary => <td key={`${row.p}-${summary.quantiles[index].value}`}>{formatValue(summary.quantiles[index].value, format, locale)}</td>)}</tr>)}</tbody></table>;
}

function NumericBlock({ config, overview, metadata, locale }) {
  const summary = overview.variable_summaries[config.unit][config.variable];
  const definition = definitionFor(metadata, config.unit, config.variable);
  const median = summary.quantiles.find(row => row.p === .5)?.value;
  const zeroRow = summary.rows?.find(row => Number(row.category) === 0);
  const title = config.zeroShare
    ? `${percent(locale).format(zeroRow?.share || 0)} ${locale === 'uk' ? 'домогосподарств не мають автомобіля' : 'of households do not have a car'}`
    : locale === 'uk'
      ? `Медіана — ${formatValue(median, config.format, locale)}`
      : `Median: ${formatValue(median, config.format, locale)}`;
  const number = whole(locale);
  const rows = summary.rows || [];
  return <article className="theme-card">
    <header className="theme-card-heading">
      <div><p className="theme-question">{config.question[locale]}</p><h3>{title}</h3></div>
      <UnitLabel unit={config.unit} locale={locale} />
    </header>
    <ChartFrame locale={locale} definitions={[definition]} ariaLabel={`${config.question[locale]} ${title}`} table={
      rows.length ? <table><thead><tr><th>{locale === 'uk' ? 'Значення' : 'Value'}</th><th>{locale === 'uk' ? 'Частка' : 'Share'}</th><th>n</th></tr></thead><tbody>{rows.map(row => <tr key={row.category}><th>{formatValue(row.category, config.format, locale)}</th><td>{percent(locale).format(row.share)}</td><td>{number.format(row.n)}</td></tr>)}</tbody></table>
        : <QuantileTable summaries={[summary]} labels={[definition.labels[locale]]} format={config.format} locale={locale} />
    }>
      {rows.length ? <DistributionBars rows={rows} labelFor={String} locale={locale} focus={config.zeroShare ? [0] : [median]} numeric format={config.format} /> : <QuantileVisual summary={summary} format={config.format} locale={locale} />}
      <SmallCategoryNote rows={rows} locale={locale} />
      <p className="theme-base">{locale === 'uk' ? 'База' : 'Base'}: n = {number.format(summary.base_n)} · {locale === 'uk' ? 'без відповіді / поза маршрутом' : 'missing / outside routing'}: {number.format(summary.missing_n)}</p>
    </ChartFrame>
  </article>;
}

function SpecialBlock({ unit, question, title, text, children, wide = true, locale }) {
  return <article className={`theme-card ${wide ? 'theme-card-wide' : ''}`}>
    <header className="theme-card-heading">
      <div><p className="theme-question">{question}</p><h3>{title}</h3>{text && <p className="theme-explainer">{text}</p>}</div>
      <UnitLabel unit={unit} locale={locale} />
    </header>
    {children}
  </article>;
}

function AgeSexBlock({ overview, metadata, locale }) {
  const aged60 = overview.age_sex.filter(row => row.age_band === '60+').reduce((sum, row) => sum + row.weighted, 0) / overview.totals.people;
  const title = locale === 'uk'
    ? `${percent(locale).format(aged60)} населення — люди віком 60 років або старше`
    : `${percent(locale).format(aged60)} of the population are aged 60 or older`;
  return <SpecialBlock unit="people" locale={locale} question={locale === 'uk' ? 'Яка статево-вікова структура населення?' : 'What is the population’s age and sex structure?'} title={title}>
    <AgeSexChart rows={overview.age_sex} locale={locale} definitions={definitionsFor(metadata, 'people', ['age', 'sex'])} />
  </SpecialBlock>;
}

function HouseholdCompositionBlock({ overview, metadata, locale }) {
  const size = overview.variable_summaries.households.household_size;
  const children = overview.variable_summaries.households.children_count;
  const medianSize = size.quantiles.find(row => row.p === .5).value;
  const withChildren = children.rows.filter(row => Number(row.category) > 0).reduce((sum, row) => sum + row.share, 0);
  const title = locale === 'uk'
    ? `Медіанний розмір — ${whole(locale).format(medianSize)} людини; ${percent(locale).format(withChildren)} домогосподарств мають дітей`
    : `Median size is ${whole(locale).format(medianSize)} people; ${percent(locale).format(withChildren)} of households have children`;
  const labels = locale === 'uk' ? ['Людей у домогосподарстві', 'Дітей до 18 років'] : ['People in household', 'Children under 18'];
  return <SpecialBlock unit="households" locale={locale} question={locale === 'uk' ? 'З кого складаються українські домогосподарства?' : 'Who makes up Ukrainian households?'} title={title}>
    <ChartFrame locale={locale} definitions={definitionsFor(metadata, 'households', ['household_size', 'children_count'])} ariaLabel={title} table={
      <table><thead><tr><th>{locale === 'uk' ? 'Кількість' : 'Count'}</th><th>{labels[0]}</th><th>{labels[1]}</th></tr></thead><tbody>{Array.from(new Set([...size.rows.map(row => row.category), ...children.rows.map(row => row.category)])).sort((a, b) => a - b).map(value => <tr key={value}><th>{value}</th><td>{size.rows.find(row => row.category === value) ? percent(locale).format(size.rows.find(row => row.category === value).share) : '—'}</td><td>{children.rows.find(row => row.category === value) ? percent(locale).format(children.rows.find(row => row.category === value).share) : '—'}</td></tr>)}</tbody></table>
    }>
      <div className="dual-distribution">
        <section><h4>{labels[0]}</h4><DistributionBars rows={size.rows} labelFor={String} locale={locale} focus={[medianSize]} numeric /></section>
        <section><h4>{labels[1]}</h4><DistributionBars rows={children.rows} labelFor={String} locale={locale} focus={[0]} numeric /></section>
      </div>
    </ChartFrame>
  </SpecialBlock>;
}

function IncomeDistributionBlock({ overview, metadata, locale }) {
  const median = overview.income.quantiles.find(row => row.p === .5);
  const title = locale === 'uk'
    ? `Половина домогосподарств має до ${whole(locale).format(median.total)} грн на місяць`
    : `Half of households have up to UAH ${whole(locale).format(median.total)} per month`;
  const text = locale === 'uk'
    ? `Медіанний простий дохід на особу — ${whole(locale).format(median.per_capita)} грн. Це не еквівалентний дохід OECD.`
    : `Median simple income per person is UAH ${whole(locale).format(median.per_capita)}. This is not OECD-equivalised income.`;
  return <SpecialBlock unit="households" locale={locale} question={locale === 'uk' ? 'Як розподілені доходи домогосподарств?' : 'How is household income distributed?'} title={title} text={text}>
    <IncomeChart income={overview.income} locale={locale} definitions={definitionsFor(metadata, 'households', ['hh_income_total', 'hh_income_per_capita'])} />
  </SpecialBlock>;
}

function EmploymentStatusBlock({ overview, metadata, locale }) {
  const statusTotal = overview.employment.status.reduce((sum, row) => sum + row.weighted, 0);
  const worked = overview.employment.status.find(row => row.category.startsWith('Працював ('))?.weighted || 0;
  const arrangementTotal = overview.employment.arrangement.reduce((sum, row) => sum + row.weighted, 0);
  const formal = overview.employment.arrangement.find(row => row.category.startsWith('Робота, за яку платять'))?.weighted || 0;
  const title = locale === 'uk'
    ? `${percent(locale).format(worked / statusTotal)} населення 15+ працювали; ${percent(locale).format(formal / arrangementTotal)} працюючих мали формальне оформлення`
    : `${percent(locale).format(worked / statusTotal)} of people aged 15+ worked; ${percent(locale).format(formal / arrangementTotal)} of workers were formally employed`;
  return <SpecialBlock unit="people" locale={locale} question={locale === 'uk' ? 'Скільки українців працюють і як оформлена їхня робота?' : 'How many Ukrainians work, and how is that work arranged?'} title={title}>
    <EmploymentChart employment={overview.employment} locale={locale} definitions={definitionsFor(metadata, 'people', ['work_status', 'work_arrangement'])} />
  </SpecialBlock>;
}

function AreaBlock({ overview, metadata, locale }) {
  const total = overview.variable_summaries.households.area_total;
  const perCapita = overview.variable_summaries.households.area_per_capita;
  const totalMedian = total.quantiles.find(row => row.p === .5).value;
  const perMedian = perCapita.quantiles.find(row => row.p === .5).value;
  const title = locale === 'uk'
    ? `Медіана — ${formatValue(totalMedian, 'area', locale)} на житло і ${formatValue(perMedian, 'area', locale)} на особу`
    : `Median: ${formatValue(totalMedian, 'area', locale)} per dwelling and ${formatValue(perMedian, 'area', locale)} per person`;
  const labels = locale === 'uk' ? ['Усього', 'На особу'] : ['Total', 'Per person'];
  return <SpecialBlock unit="households" locale={locale} question={locale === 'uk' ? 'Скільки житлової площі мають родини?' : 'How much living space do households have?'} title={title}>
    <ChartFrame locale={locale} definitions={definitionsFor(metadata, 'households', ['area_total', 'area_per_capita'])} ariaLabel={title} table={<QuantileTable summaries={[total, perCapita]} labels={labels} format="area" locale={locale} />}>
      <div className="dual-quantiles"><section><h4>{labels[0]}</h4><QuantileVisual summary={total} format="area" locale={locale} /></section><section><h4>{labels[1]}</h4><QuantileVisual summary={perCapita} format="area" locale={locale} /></section></div>
    </ChartFrame>
  </SpecialBlock>;
}

function DeprivationBlock({ overview, metadata, locale }) {
  const hardest = [...overview.deprivation].sort((a, b) => b.with_children.share - a.with_children.share)[0];
  const title = locale === 'uk'
    ? `${percent(locale).format(hardest.with_children.share)} домогосподарств із дітьми не можуть дозволити собі тиждень відпочинку поза домом`
    : `${percent(locale).format(hardest.with_children.share)} of households with children cannot afford a week away from home`;
  const variables = ['unexpected_expense', 'annual_holiday', 'payment_arrears', 'protein_meal', 'warm_home'];
  return <SpecialBlock unit="households" locale={locale} question={locale === 'uk' ? 'Чого родини не можуть собі дозволити?' : 'What are households unable to afford?'} title={title}>
    <DeprivationChart deprivation={overview.deprivation} locale={locale} definitions={definitionsFor(metadata, 'households', variables)} />
  </SpecialBlock>;
}

function ThemeBlock({ block, overview, metadata, locale }) {
  if (block.kind === 'category') return <CategoricalBlock config={CATEGORY_BLOCKS[block.id]} overview={overview} metadata={metadata} locale={locale} />;
  if (block.kind === 'numeric') return <NumericBlock config={block} overview={overview} metadata={metadata} locale={locale} />;
  if (block.kind === 'ageSex') return <AgeSexBlock overview={overview} metadata={metadata} locale={locale} />;
  if (block.kind === 'householdComposition') return <HouseholdCompositionBlock overview={overview} metadata={metadata} locale={locale} />;
  if (block.kind === 'incomeDistribution') return <IncomeDistributionBlock overview={overview} metadata={metadata} locale={locale} />;
  if (block.kind === 'employmentStatus') return <EmploymentStatusBlock overview={overview} metadata={metadata} locale={locale} />;
  if (block.kind === 'area') return <AreaBlock overview={overview} metadata={metadata} locale={locale} />;
  if (block.kind === 'deprivation') return <DeprivationBlock overview={overview} metadata={metadata} locale={locale} />;
  return null;
}

export default function ThemeTabs({ overview, metadata, locale }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabsRef = useRef(null);
  const requested = searchParams.get('theme');
  const active = THEMES.some(theme => theme.id === requested) ? requested : THEMES[0].id;
  const activeIndex = THEMES.findIndex(theme => theme.id === active);
  const blocks = useMemo(() => THEME_BLOCKS[active], [active]);

  useEffect(() => {
    const tab = tabsRef.current?.querySelector(`[data-theme="${active}"]`);
    if (!tab || !tabsRef.current) return;
    tabsRef.current.scrollTo({
      left: tab.offsetLeft - (tabsRef.current.clientWidth - tab.offsetWidth) / 2,
      behavior: 'smooth',
    });
  }, [active]);

  const selectTheme = id => {
    const next = new URLSearchParams(searchParams);
    if (id === THEMES[0].id) next.delete('theme'); else next.set('theme', id);
    setSearchParams(next, { replace: true });
  };
  const moveFocus = (event, index) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    let nextIndex = index;
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + THEMES.length) % THEMES.length;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % THEMES.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = THEMES.length - 1;
    selectTheme(THEMES[nextIndex].id);
    requestAnimationFrame(() => document.getElementById(`theme-tab-${THEMES[nextIndex].id}`)?.focus());
  };

  return <section className="theme-explorer" aria-labelledby="theme-explorer-title">
    <div className="theme-explorer-heading">
      <p className="eyebrow">{locale === 'uk' ? 'Україна у даних' : 'Ukraine in data'}</p>
      <h2 id="theme-explorer-title">{locale === 'uk' ? 'Що показало опитування' : 'What the survey found'}</h2>
      <p>{locale === 'uk' ? 'Оберіть тему. Кожен блок відповідає на окреме зрозуміле запитання; пов’язані пункти анкети показані разом.' : 'Choose a topic. Each block answers one clear question; related questionnaire items are kept together.'}</p>
    </div>
    <div className="theme-tabs" role="tablist" ref={tabsRef} aria-label={locale === 'uk' ? 'Теми огляду' : 'Overview topics'}>
      {THEMES.map((theme, index) => <button
        type="button"
        role="tab"
        id={`theme-tab-${theme.id}`}
        aria-controls={`theme-panel-${theme.id}`}
        aria-selected={theme.id === active}
        tabIndex={theme.id === active ? 0 : -1}
        data-theme={theme.id}
        className={theme.id === active ? 'active' : ''}
        onClick={() => selectTheme(theme.id)}
        onKeyDown={event => moveFocus(event, index)}
        key={theme.id}
      >{theme.label[locale]}</button>)}
    </div>
    <div className="theme-panel-heading">
      <span>{String(activeIndex + 1).padStart(2, '0')}</span>
      <div><h2>{THEME_COPY[active].title[locale]}</h2><p>{THEME_COPY[active].text[locale]}</p></div>
    </div>
    <div className="theme-panel" role="tabpanel" id={`theme-panel-${active}`} aria-labelledby={`theme-tab-${active}`}>
      {blocks.map((block, index) => <ThemeBlock key={`${active}-${block.id || block.kind}-${index}`} block={block} overview={overview} metadata={metadata} locale={locale} />)}
    </div>
  </section>;
}
