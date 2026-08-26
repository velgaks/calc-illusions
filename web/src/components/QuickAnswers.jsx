import { Link } from 'react-router-dom';
import { serializeQuery } from '../lib/queryUrl.js';

const pctFormatter = locale => new Intl.NumberFormat(locale === 'uk' ? 'uk-UA' : 'en-US', { style: 'percent', maximumFractionDigits: 0 });
const numberFormatter = locale => new Intl.NumberFormat(locale === 'uk' ? 'uk-UA' : 'en-US', { maximumFractionDigits: 0 });

function rowFor(distribution, category) {
  return distribution.rows.find(row => row.category === category);
}

function combinedRow(distribution, categories, label, tone = 'blue') {
  const selected = distribution.rows.filter(row => categories.includes(row.category));
  return {
    label,
    share: selected.reduce((sum, row) => sum + row.share, 0),
    weighted: selected.reduce((sum, row) => sum + row.weighted, 0),
    n: selected.reduce((sum, row) => sum + row.n, 0),
    baseN: distribution.base_n,
    tone,
  };
}

function selectedRow(distribution, category, label, tone = 'blue') {
  const row = rowFor(distribution, category);
  return { ...row, label, baseN: distribution.base_n, tone };
}

function MiniBars({ rows, locale, ariaLabel }) {
  const pct = pctFormatter(locale);
  const number = numberFormatter(locale);
  const copy = locale === 'uk'
    ? { exact: 'Точні значення', category: 'Відповідь', share: 'Частка', sample: 'Незважене n', base: 'База n' }
    : { exact: 'Exact values', category: 'Response', share: 'Share', sample: 'Unweighted n', base: 'Base n' };

  return <>
    <div className="mini-bars" role="img" aria-label={ariaLabel}>
      {rows.map(row => <div className="mini-bar-row" key={row.label}>
        <span>{row.label}</span>
        <span className="mini-bar-track" aria-hidden="true"><i className={`tone-${row.tone || 'blue'}`} style={{ width: `${Math.max(0, Math.min(100, row.share * 100))}%` }} /></span>
        <strong>{pct.format(row.share)}</strong>
      </div>)}
    </div>
    <details className="quick-table">
      <summary>{copy.exact}</summary>
      <table><thead><tr><th>{copy.category}</th><th>{copy.share}</th><th>{copy.sample}</th><th>{copy.base}</th></tr></thead>
        <tbody>{rows.map(row => <tr key={row.label}><th>{row.label}</th><td>{pct.format(row.share)}</td><td>{number.format(row.n)}</td><td>{number.format(row.baseN)}</td></tr>)}</tbody>
      </table>
    </details>
  </>;
}

function QuestionWording({ definitions, locale }) {
  const questions = [...new Set((definitions || []).map(definition => definition?.question_original_uk).filter(Boolean))];
  if (!questions.length) return null;
  return <div className="quick-wording">
    <span>{locale === 'uk' ? 'Оригінальне формулювання' : 'Original Ukrainian wording'}</span>
    {questions.map(question => <q lang="uk" key={question}>{question}</q>)}
  </div>;
}

function QuickCard({ title, answer, text, rows, locale, definitions, indicator, unit = 'households', wide = false }) {
  const query = serializeQuery({ unit, indicator, breakdown: null, filters: [], locale, threshold: null });
  return <article className={`quick-card${wide ? ' quick-card-wide' : ''}`}>
    <p className="quick-question">{title}</p>
    <h3>{answer}</h3>
    <p className="quick-answer-text">{text}</p>
    <MiniBars rows={rows} locale={locale} ariaLabel={`${title} ${answer}`} />
    <QuestionWording definitions={definitions} locale={locale} />
    <Link to={`/explore${query}`}>{locale === 'uk' ? 'Дослідити розрізи' : 'Explore breakdowns'} →</Link>
  </article>;
}

export default function QuickAnswers({ overview, metadata, locale }) {
  const quick = overview.quick_answers;
  const pct = pctFormatter(locale);
  const definitions = (unit, ids) => ids.map(id => metadata.units[unit].variables.find(variable => variable.id === id)).filter(Boolean);

  const single = rowFor(quick.household_size, '1');
  const withChildren = overview.totals.households_with_children_share;
  const hardship = combinedRow(
    quick.income_adequacy,
    ['Постійно відмовляли собі в найнеобхіднішому, крім харчування', 'Не вдалося забезпечити навіть достатнє харчування'],
    locale === 'uk' ? 'Не вистачало на необхідне або їжу' : 'Could not afford essentials or enough food',
    'orange',
  );
  const incomeRows = locale === 'uk' ? [
    selectedRow(quick.income_adequacy, 'Не вдалося забезпечити навіть достатнє харчування', 'Не вистачало навіть на достатнє харчування', 'orange'),
    selectedRow(quick.income_adequacy, 'Постійно відмовляли собі в найнеобхіднішому, крім харчування', 'Відмовляли собі в найнеобхіднішому', 'orange'),
    selectedRow(quick.income_adequacy, 'Було достатньо, але заощаджень не робили', 'Вистачало, але без заощаджень'),
    selectedRow(quick.income_adequacy, 'Було достатньо і робили заощадження', 'Вистачало і заощаджували'),
    selectedRow(quick.income_adequacy, 'Важко відповісти', 'Важко відповісти', 'muted'),
  ] : [
    selectedRow(quick.income_adequacy, 'Не вдалося забезпечити навіть достатнє харчування', 'Could not afford enough food', 'orange'),
    selectedRow(quick.income_adequacy, 'Постійно відмовляли собі в найнеобхіднішому, крім харчування', 'Cut back on essentials', 'orange'),
    selectedRow(quick.income_adequacy, 'Було достатньо, але заощаджень не робили', 'Enough, but no savings'),
    selectedRow(quick.income_adequacy, 'Було достатньо і робили заощадження', 'Enough and able to save'),
    selectedRow(quick.income_adequacy, 'Важко відповісти', 'Difficult to answer', 'muted'),
  ];

  const sizeRows = ['1', '2', '3', '4', '5+'].map((category, index) => selectedRow(
    quick.household_size,
    category,
    locale === 'uk' ? `${category} ${category === '1' ? 'особа' : category === '5+' ? 'осіб' : 'особи'}` : `${category} ${category === '1' ? 'person' : 'people'}`,
    index === 0 ? 'orange' : 'blue',
  ));
  const expenseRows = locale === 'uk' ? [
    selectedRow(quick.unexpected_expense, 'Ні', 'Не можуть покрити', 'orange'),
    selectedRow(quick.unexpected_expense, 'Так', 'Можуть покрити'),
  ] : [
    selectedRow(quick.unexpected_expense, 'Ні', 'Cannot cover', 'orange'),
    selectedRow(quick.unexpected_expense, 'Так', 'Can cover'),
  ];
  const housingRows = locale === 'uk' ? [
    selectedRow(quick.housing_tenure, 'Є власністю Вашої родини', 'Власність родини'),
    selectedRow(quick.housing_tenure, 'Ваша родина орендує', 'Оренда', 'orange'),
    combinedRow(quick.housing_tenure, ['Соціальне житло, надане для переселенців', 'Інше'], 'Соціальне або інше', 'muted'),
  ] : [
    selectedRow(quick.housing_tenure, 'Є власністю Вашої родини', 'Family-owned'),
    selectedRow(quick.housing_tenure, 'Ваша родина орендує', 'Rented', 'orange'),
    combinedRow(quick.housing_tenure, ['Соціальне житло, надане для переселенців', 'Інше'], 'Social or other', 'muted'),
  ];
  const accessRows = [
    selectedRow(quick.internet, 'Так', locale === 'uk' ? 'Інтернет удома' : 'Internet at home'),
    selectedRow(quick.public_transport, 'Так', locale === 'uk' ? 'Транспорт у межах 500 м' : 'Transport within 500 m', 'orange'),
  ];
  const mobilityRows = [
    selectedRow(quick.moved_since_2014, 'Переїхав після початку гібридної війни з рф на Сході України (після 20 лютого 2014 року)', locale === 'uk' ? 'Переїхали після 20.02.2014' : 'Moved after 20 Feb 2014'),
    selectedRow(quick.idp, 'yes', locale === 'uk' ? 'Мають статус ВПО' : 'Have IDP status', 'orange'),
    selectedRow(quick.abroad_since_2022, 'yes', locale === 'uk' ? 'Виїжджали за кордон на місяць+' : 'Stayed abroad for a month+', 'muted'),
  ];

  const copy = locale === 'uk' ? {
    eyebrow: 'Українці та їхні домогосподарства',
    heading: 'Що показує опитування',
    intro: 'Кожна цифра — зважена оцінка для окремо зазначеної групи. Посилання «Дослідити розрізи» відкриває область, тип поселення та інші порівняння.',
    compositionQ: 'Зі скількох людей складаються домогосподарства?',
    compositionA: `${pct.format(single.share)} складаються з однієї людини`,
    compositionT: `У ${pct.format(withChildren)} домогосподарств є хоча б одна дитина до 18 років. Найпоширеніші — домогосподарства з двох людей.`,
    incomeQ: 'На що вистачало доходу протягом останнього року?',
    incomeA: `${pct.format(hardship.share)} не вистачало на найнеобхідніше або достатнє харчування`,
    incomeT: 'Ще 39% сказали, що доходу вистачало, але заощаджувати не вдавалося.',
    expenseQ: 'Чи можна було покрити несподівані витрати?',
    expenseA: `${pct.format(expenseRows[0].share)} домогосподарств не могли цього зробити`,
    expenseT: 'Це відповідь про можливість здійснити необхідні несподівані витрати, а не про конкретний випадок витрачання грошей.',
    housingQ: 'Житло власне чи орендоване?',
    housingA: `${pct.format(housingRows[0].share)} жили у помешканні, що належить родині`,
    housingT: `${pct.format(housingRows[1].share)} орендували житло; соціальне та інші варіанти разом становили ${pct.format(housingRows[2].share)}.`,
    accessQ: 'Чи є вдома інтернет і поруч громадський транспорт?',
    accessA: `${pct.format(accessRows[0].share)} мали інтернет удома`,
    accessT: `${pct.format(accessRows[1].share)} мали зручний доступ до громадського транспорту на відстані до 500 метрів.`,
    mobilityQ: 'Скільки людей переїжджали після 2014 року або виїжджали після 2022-го?',
    mobilityA: `${pct.format(mobilityRows[0].share)} переїхали після 20 лютого 2014 року`,
    mobilityT: 'Ці показники мають різні формулювання і знаменники. Оцінка охоплює лише людей, які на момент опитування жили на охопленій підконтрольній території України.',
  } : {
    eyebrow: 'Ukrainians and their households',
    heading: 'What the survey shows',
    intro: 'Each figure is a weighted estimate for the stated population. “Explore breakdowns” opens region, settlement type, and other comparisons.',
    compositionQ: 'How large are Ukrainian households?',
    compositionA: `${pct.format(single.share)} consist of one person`,
    compositionT: `${pct.format(withChildren)} of households include at least one child under 18. Two-person households are the most common.`,
    incomeQ: 'What could households afford with their income?',
    incomeA: `${pct.format(hardship.share)} could not afford essentials or enough food`,
    incomeT: 'Another 39% said income was enough, but they were unable to save.',
    expenseQ: 'Could households cover an unexpected expense?',
    expenseA: `${pct.format(expenseRows[0].share)} could not`,
    expenseT: 'This measures the ability to meet a necessary unexpected expense, not whether a specific expense occurred.',
    housingQ: 'Was the dwelling owned or rented?',
    housingA: `${pct.format(housingRows[0].share)} lived in a family-owned dwelling`,
    housingT: `${pct.format(housingRows[1].share)} rented; social and other arrangements together accounted for ${pct.format(housingRows[2].share)}.`,
    accessQ: 'Did households have internet and nearby public transport?',
    accessA: `${pct.format(accessRows[0].share)} had internet at home`,
    accessT: `${pct.format(accessRows[1].share)} had convenient public transport within 500 metres.`,
    mobilityQ: 'How many people moved after 2014 or went abroad after 2022?',
    mobilityA: `${pct.format(mobilityRows[0].share)} moved after 20 February 2014`,
    mobilityT: 'These measures use different wording and denominators. The estimate covers only people living in the surveyed government-controlled territory at the time of interview.',
  };

  return <section className="quick-answers" aria-labelledby="quick-answers-heading">
    <header className="quick-answers-heading">
      <p className="eyebrow">{copy.eyebrow}</p>
      <h2 id="quick-answers-heading">{copy.heading}</h2>
      <p>{copy.intro}</p>
    </header>
    <div className="quick-grid">
      <QuickCard title={copy.compositionQ} answer={copy.compositionA} text={copy.compositionT} rows={sizeRows} locale={locale} definitions={definitions('households', ['household_size', 'children_count'])} indicator="household_size" />
      <QuickCard title={copy.incomeQ} answer={copy.incomeA} text={copy.incomeT} rows={incomeRows} locale={locale} definitions={definitions('households', ['income_adequacy'])} indicator="income_adequacy" wide />
      <QuickCard title={copy.expenseQ} answer={copy.expenseA} text={copy.expenseT} rows={expenseRows} locale={locale} definitions={definitions('households', ['unexpected_expense'])} indicator="unexpected_expense" />
      <QuickCard title={copy.housingQ} answer={copy.housingA} text={copy.housingT} rows={housingRows} locale={locale} definitions={definitions('households', ['housing_tenure'])} indicator="housing_tenure" />
      <QuickCard title={copy.accessQ} answer={copy.accessA} text={copy.accessT} rows={accessRows} locale={locale} definitions={definitions('households', ['internet', 'public_transport'])} indicator="internet" />
      <QuickCard title={copy.mobilityQ} answer={copy.mobilityA} text={copy.mobilityT} rows={mobilityRows} locale={locale} definitions={definitions('people', ['moved_since_2014', 'idp', 'abroad_since_2022'])} indicator="idp" unit="people" wide />
    </div>
  </section>;
}
