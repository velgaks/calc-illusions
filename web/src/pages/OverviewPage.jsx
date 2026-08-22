import { Link } from 'react-router-dom';
import { AgeSexChart, DeprivationChart, EmploymentChart, IncomeChart } from '../components/OverviewCharts.jsx';
import { t } from '../i18n/strings.js';

const fmt = (locale, options = {}) => new Intl.NumberFormat(locale === 'uk' ? 'uk-UA' : 'en-US', options);

function Story({ number, eyebrow, title, text, children }) {
  return <article className="story">
    <div className="story-number">{number}</div>
    <header><p className="eyebrow">{eyebrow}</p><h2>{title}</h2><p>{text}</p></header>
    <div className="story-visual">{children}</div>
  </article>;
}

export default function OverviewPage({ overview, metadata, locale }) {
  const copy = t(locale);
  const number = fmt(locale, { maximumFractionDigits: 0 });
  const decimal = fmt(locale, { maximumFractionDigits: 1 });
  const median = overview.income.quantiles.find(row => row.p === 0.5);
  const aged60 = overview.age_sex.filter(row => row.age_band === '60+').reduce((sum, row) => sum + row.weighted, 0) / overview.totals.people;
  const workTotal = overview.employment.status.reduce((sum, row) => sum + row.weighted, 0);
  const worked = overview.employment.status.find(row => row.category.startsWith('Працював ('))?.weighted || 0;
  const arrangementTotal = overview.employment.arrangement.reduce((sum, row) => sum + row.weighted, 0);
  const formal = overview.employment.arrangement.find(row => row.category.startsWith('Робота, за яку платять'))?.weighted || 0;
  const pct = value => fmt(locale, { style: 'percent', maximumFractionDigits: 0 }).format(value);
  const definitions = (unit, ids) => {
    const variables = metadata.units[unit].variables;
    return ids.map(id => variables.find(variable => variable.id === id)).filter(Boolean);
  };

  const content = locale === 'uk' ? {
    ageTitle: `${pct(aged60)} населення — віком 60 років або старше`,
    ageText: 'SESH використовує окремі дитячі групи й ширші дорослі категорії. Найбільша група — люди 30–59 років; жінки помітно переважають серед 60+.',
    incomeTitle: `Половина домогосподарств живе менш ніж на ${number.format(median.total)} грн на місяць`,
    incomeText: `Медіанний простий дохід на члена домогосподарства — ${number.format(median.per_capita)} грн. Це не еквівалентний дохід OECD: сукупний дохід просто поділено на кількість членів.`,
    workTitle: `${pct(worked / workTotal)} населення 15+ працювали, а ${pct(formal / arrangementTotal)} працюючих мали формальне оформлення`,
    workText: 'Статус стосується семи днів перед опитуванням. Тип роботи показано лише серед тих, хто працював або тимчасово був відсутній.',
    depTitle: 'Домогосподарства без дітей частіше повідомляли про кожну з показаних матеріальних депривацій',
    depText: 'Це описова різниця, а не причинний ефект. Для кожного пункту знаменник — домогосподарства, яким поставили відповідне запитання; відсутню відповідь не зараховано як «ні».',
    explore: 'Поставити власне запитання',
  } : {
    ageTitle: `${pct(aged60)} of the population are aged 60 or older`,
    ageText: 'SESH uses detailed child age bands and broader adult groups. People aged 30–59 are the largest group, while women clearly outnumber men among those aged 60+.',
    incomeTitle: `Half of households live on less than UAH ${number.format(median.total)} per month`,
    incomeText: `Median simple income per household member is UAH ${number.format(median.per_capita)}. This is not OECD-equivalised income: total income is divided by household size.`,
    workTitle: `${pct(worked / workTotal)} of people aged 15+ worked; ${pct(formal / arrangementTotal)} of workers were formally employed`,
    workText: 'Status refers to the seven days before the interview. Work arrangement is shown only for people who worked or were temporarily absent.',
    depTitle: 'Households without children reported every displayed material deprivation more often',
    depText: 'This is a descriptive difference, not a causal effect. Each denominator includes households asked that item; missing responses are not treated as “no”.',
    explore: 'Build your own query',
  };

  return <div className="page overview-page">
    <section className="hero">
      <p className="eyebrow">SESH · {copy.fieldwork}</p>
      <h1>{copy.title}</h1>
      <p className="dek">{copy.heroDek}</p>
      <div className="hero-stats">
        <div><strong>{decimal.format(overview.totals.people / 1e6)} {locale === 'uk' ? 'млн' : 'm'}</strong><span>{copy.populationEstimate}</span></div>
        <div><strong>{number.format(overview.totals.people_n)}</strong><span>{copy.interviewedPeople}</span></div>
        <div><strong>{number.format(overview.totals.households_n)}</strong><span>{copy.interviewedHouseholds}</span></div>
      </div>
      <p className="territory-note">{metadata.territory[locale]}</p>
      <Link className="primary-link" to={`/explore?lang=${locale}`}>{content.explore} →</Link>
    </section>
    <Story number="01" eyebrow={locale === 'uk' ? 'Статево-вікова структура' : 'Age and sex structure'} title={content.ageTitle} text={content.ageText}>
      <AgeSexChart rows={overview.age_sex} locale={locale} definitions={definitions('people', ['age', 'sex'])} />
    </Story>
    <Story number="02" eyebrow={locale === 'uk' ? 'Доходи домогосподарств' : 'Household income'} title={content.incomeTitle} text={content.incomeText}>
      <IncomeChart income={overview.income} locale={locale} definitions={definitions('households', ['hh_income_total', 'hh_income_per_capita'])} />
    </Story>
    <Story number="03" eyebrow={locale === 'uk' ? 'Зайнятість' : 'Employment'} title={content.workTitle} text={content.workText}>
      <EmploymentChart employment={overview.employment} locale={locale} definitions={definitions('people', ['work_status', 'work_arrangement'])} />
    </Story>
    <Story number="04" eyebrow={locale === 'uk' ? 'Матеріальні умови' : 'Material conditions'} title={content.depTitle} text={content.depText}>
      <DeprivationChart deprivation={overview.deprivation} locale={locale} definitions={definitions('households', ['unexpected_expense', 'annual_holiday', 'protein_meal', 'warm_home'])} />
    </Story>
  </div>;
}
