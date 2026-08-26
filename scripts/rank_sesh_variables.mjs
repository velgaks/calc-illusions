import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const metadata = JSON.parse(await readFile(new URL('public/data/metadata.json', root), 'utf8'));

const editorial = {
  people: {
    age: [20, 15, 19, 0, 'сюжет / розріз'],
    sex: [14, 15, 15, 4, 'розріз'],
    region: [17, 15, 19, 8, 'розріз'],
    settlement: [14, 15, 16, 5, 'розріз'],
    marital: [17, 15, 15, 0, 'сюжет'],
    education: [21, 15, 19, 0, 'сюжет / розріз'],
    moved_since_2014: [19, 11, 15, 0, 'сюжет'],
    idp: [23, 13, 18, 0, 'сюжет / розріз'],
    abroad_since_2022: [23, 13, 18, 0, 'сюжет'],
    household_size: [17, 13, 15, 6, 'контекст'],
    children_count: [17, 13, 15, 6, 'контекст / розріз'],
    work_status: [25, 15, 20, 0, 'сюжет'],
    work_arrangement: [22, 13, 19, 0, 'сюжет'],
    sector: [19, 13, 18, 0, 'сюжет / розріз'],
    occupation_group: [18, 12, 18, 0, 'сюжет / розріз'],
    weekly_hours: [18, 15, 18, 0, 'сюжет'],
    job_search: [21, 14, 17, 0, 'сюжет'],
    income_source: [24, 14, 20, 0, 'сюжет'],
    personal_income: [25, 13, 20, 0, 'сюжет'],
  },
  households: {
    region: [17, 15, 19, 8, 'розріз'],
    settlement: [14, 15, 16, 5, 'розріз'],
    household_size: [21, 15, 18, 0, 'сюжет'],
    children_count: [19, 15, 17, 2, 'сюжет / розріз'],
    hh_income_total: [25, 14, 20, 0, 'сюжет'],
    hh_income_per_capita: [25, 12, 20, 0, 'сюжет'],
    income_change: [24, 15, 20, 0, 'сюжет'],
    income_adequacy: [25, 15, 20, 0, 'сюжет'],
    relative_wealth: [19, 12, 16, 0, 'сюжет'],
    debt: [23, 15, 19, 0, 'сюжет'],
    used_savings: [24, 14, 20, 0, 'сюжет'],
    uses_credit: [20, 15, 17, 0, 'сюжет'],
    financial_stability: [24, 15, 20, 0, 'сюжет'],
    housing_tenure: [21, 14, 18, 0, 'сюжет / розріз'],
    dwelling_type: [16, 15, 16, 0, 'сюжет / розріз'],
    area_total: [15, 15, 15, 2, 'контекст'],
    area_per_capita: [19, 13, 17, 0, 'сюжет'],
    rooms: [14, 15, 13, 2, 'контекст'],
    adequate_area: [20, 15, 18, 0, 'сюжет'],
    winter_temperature: [22, 15, 19, 0, 'сюжет'],
    internet: [19, 15, 16, 0, 'сюжет / розріз'],
    car_count: [19, 15, 17, 0, 'сюжет'],
    public_transport: [19, 15, 17, 0, 'сюжет / розріз'],
    unexpected_expense: [25, 15, 20, 0, 'сюжет'],
    annual_holiday: [21, 13, 18, 0, 'сюжет'],
    payment_arrears: [23, 13, 19, 0, 'сюжет'],
    protein_meal: [25, 15, 20, 0, 'сюжет'],
    warm_home: [24, 15, 20, 0, 'сюжет'],
  },
};

const questions = {
  'people.age': 'Який віковий склад населення?',
  'people.sex': 'Який розподіл населення за статтю?',
  'people.region': 'Як результати відрізняються між областями?',
  'people.settlement': 'Чим відрізняються місто і село?',
  'people.marital': 'У якому сімейному стані живуть люди 15+?',
  'people.education': 'Яку освіту мають українці 15+?',
  'people.moved_since_2014': 'Скільки людей переїхали після 2014 року?',
  'people.idp': 'Скільки людей мають статус ВПО?',
  'people.abroad_since_2022': 'Скільки виїжджали за кордон на місяць або більше?',
  'people.household_size': 'У домогосподарствах якого розміру живуть люди?',
  'people.children_count': 'Скільки людей живуть у родинах із дітьми?',
  'people.work_status': 'Скільки людей працюють?',
  'people.work_arrangement': 'Наскільки поширена формальна і неформальна робота?',
  'people.sector': 'У яких секторах працюють українці?',
  'people.occupation_group': 'У яких професійних групах працюють українці?',
  'people.weekly_hours': 'Скільки годин на тиждень працюють?',
  'people.job_search': 'Скільки непрацюючих шукають роботу?',
  'people.income_source': 'Звідки люди отримують основний дохід?',
  'people.personal_income': 'Який особистий місячний дохід українців?',
  'households.region': 'Як домогосподарства відрізняються між областями?',
  'households.settlement': 'Чим відрізняються домогосподарства міста і села?',
  'households.household_size': 'Скільки людей живуть разом?',
  'households.children_count': 'Скільки домогосподарств мають дітей?',
  'households.hh_income_total': 'Який загальний місячний дохід домогосподарства?',
  'households.hh_income_per_capita': 'Скільки доходу припадає на одну людину?',
  'households.income_change': 'Як змінився дохід порівняно з 2021 роком?',
  'households.income_adequacy': 'На що вистачає доходу?',
  'households.relative_wealth': 'Як родини оцінюють свій достаток?',
  'households.debt': 'Скільки родин мають несплачені борги або кредити?',
  'households.used_savings': 'Скільки родин витрачали заощадження?',
  'households.uses_credit': 'Скільки родин користуються позиками?',
  'households.financial_stability': 'Наскільки фінансово стабільними почуваються родини?',
  'households.housing_tenure': 'Житло власне, орендоване чи соціальне?',
  'households.dwelling_type': 'У якому типі житла живуть родини?',
  'households.area_total': 'Яка загальна площа житла?',
  'households.area_per_capita': 'Скільки житлової площі припадає на людину?',
  'households.rooms': 'Скільки кімнат у помешканні?',
  'households.adequate_area': 'Чи достатньо родині житлової площі?',
  'households.winter_temperature': 'Чи комфортна температура вдома взимку?',
  'households.internet': 'Чи є інтернет удома?',
  'households.car_count': 'Скільки родин мають автомобіль?',
  'households.public_transport': 'Чи є громадський транспорт у межах 500 метрів?',
  'households.unexpected_expense': 'Чи може родина покрити несподівані витрати?',
  'households.annual_holiday': 'Чи може родина оплатити тижневу відпустку?',
  'households.payment_arrears': 'Чи може родина погасити прострочені платежі?',
  'households.protein_meal': 'Чи може родина дозволити поживну їжу через день?',
  'households.warm_home': 'Чи може родина підтримувати житло теплим?',
};

function weightedQuantile(values, weights, q) {
  const ordered = values.map((value, index) => [value, weights[index]]).sort((a, b) => a[0] - b[0]);
  const target = q * ordered.reduce((sum, item) => sum + item[1], 0);
  let cumulative = 0;
  for (const item of ordered) {
    cumulative += item[1];
    if (cumulative >= target) return item[0];
  }
  return ordered.at(-1)?.[0];
}

function categoricalVariation(codes, weights) {
  const totals = new Map();
  let total = 0;
  codes.forEach((code, index) => {
    if (code == null) return;
    const weight = weights[index];
    totals.set(code, (totals.get(code) || 0) + weight);
    total += weight;
  });
  const probabilities = [...totals.values()].map(value => value / total);
  const entropy = -probabilities.reduce((sum, p) => sum + p * Math.log(p), 0);
  const normalizedEntropy = probabilities.length > 1 ? entropy / Math.log(probabilities.length) : 0;
  const dominance = Math.max(...probabilities);
  return {
    categories: probabilities.length,
    dominance,
    variation: 0.65 * normalizedEntropy + 0.35 * (1 - dominance),
  };
}

function numericVariation(values, weights) {
  const unique = new Set(values).size;
  const p10 = weightedQuantile(values, weights, 0.1);
  const p25 = weightedQuantile(values, weights, 0.25);
  const p50 = weightedQuantile(values, weights, 0.5);
  const p75 = weightedQuantile(values, weights, 0.75);
  const p90 = weightedQuantile(values, weights, 0.9);
  const robustSpread = Math.max(0, p90 - p10) / (Math.abs(p90) + Math.abs(p10) + 1);
  const uniqueScore = Math.min(1, Math.log2(unique + 1) / 8);
  return {
    categories: unique,
    dominance: null,
    variation: 0.65 * robustSpread + 0.35 * uniqueScore,
    quantiles: [p10, p25, p50, p75, p90],
  };
}

const ranking = [];
for (const unit of ['people', 'households']) {
  const dataset = JSON.parse(await readFile(new URL(`public/data/${unit}.json`, root), 'utf8'));
  const weights = dataset.columns.weight;
  for (const variable of metadata.units[unit].variables) {
    const column = dataset.columns[variable.id];
    const validIndices = column.map((value, index) => value == null ? null : index).filter(index => index != null);
    const validValues = validIndices.map(index => column[index]);
    const validWeights = validIndices.map(index => weights[index]);
    const coverage = validValues.length / dataset.n;
    const metrics = variable.type === 'categorical'
      ? categoricalVariation(validValues, validWeights)
      : numericVariation(validValues, validWeights);
    const [interest, clarity, story, penalty, role] = editorial[unit][variable.id];
    const coveragePoints = 20 * Math.sqrt(coverage);
    const variationPoints = 20 * metrics.variation;
    const score = coveragePoints + variationPoints + interest + clarity + story - penalty;
    ranking.push({
      unit,
      id: variable.id,
      label: variable.labels.uk,
      type: variable.type,
      topic: variable.topic,
      role,
      question: questions[`${unit}.${variable.id}`],
      score: Math.round(score),
      scoreExact: score,
      coverage,
      validN: validValues.length,
      missingN: dataset.n - validValues.length,
      variation: metrics.variation,
      categories: metrics.categories,
      dominance: metrics.dominance,
      quantiles: metrics.quantiles,
    });
  }
}

ranking.sort((a, b) => b.scoreExact - a.scoreExact || b.validN - a.validN);

const groupDefinitions = [
  {
    id: 'material_deprivation',
    label: 'Матеріальні депривації',
    unit: 'households',
    role: 'сюжет / батарея',
    question: 'Що з базових потреб домогосподарство не може собі дозволити?',
    members: ['households.unexpected_expense', 'households.annual_holiday', 'households.payment_arrears', 'households.protein_meal', 'households.warm_home'],
  },
  {
    id: 'household_income',
    label: 'Дохід домогосподарства',
    unit: 'households',
    role: 'сюжет / спільне джерело V1',
    question: 'Який місячний дохід домогосподарства загалом і на одну людину?',
    members: ['households.hh_income_total', 'households.hh_income_per_capita'],
  },
  {
    id: 'household_composition',
    label: 'Склад домогосподарства',
    unit: 'people + households',
    role: 'сюжет / розріз',
    question: 'Скільки людей і дітей живуть у домогосподарстві?',
    members: ['households.household_size', 'households.children_count', 'people.household_size', 'people.children_count'],
  },
  {
    id: 'dwelling_area',
    label: 'Площа житла',
    unit: 'households',
    role: 'сюжет / спільне джерело B4',
    question: 'Яка площа житла загалом і на одну людину?',
    members: ['households.area_total', 'households.area_per_capita'],
  },
  {
    id: 'region',
    label: 'Область проживання',
    unit: 'people + households',
    role: 'розріз',
    question: 'Як результати відрізняються між областями?',
    members: ['people.region', 'households.region'],
  },
  {
    id: 'settlement',
    label: 'Місто / село',
    unit: 'people + households',
    role: 'розріз',
    question: 'Чим відрізняються місто і село?',
    members: ['people.settlement', 'households.settlement'],
  },
];

const rankingByKey = new Map(ranking.map(row => [`${row.unit}.${row.id}`, row]));
const groupedKeys = new Set(groupDefinitions.flatMap(group => group.members));
const candidates = groupDefinitions.map(group => {
  const members = group.members.map(key => rankingByKey.get(key)).filter(Boolean);
  const best = members.reduce((current, row) => row.scoreExact > current.scoreExact ? row : current);
  return {
    ...group,
    score: Math.round(best.scoreExact),
    scoreExact: best.scoreExact,
    validN: [...new Set(members.map(row => row.validN))].join(' / '),
    missingPct: [...new Set(members.map(row => (100 * (1 - row.coverage)).toFixed(1)))].join(' / '),
    memberLabels: members.map(row => `${row.unit}.${row.id}`),
  };
});

for (const row of ranking) {
  if (groupedKeys.has(`${row.unit}.${row.id}`)) continue;
  candidates.push({
    ...row,
    validN: String(row.validN),
    missingPct: (100 * (1 - row.coverage)).toFixed(1),
    memberLabels: [`${row.unit}.${row.id}`],
  });
}
candidates.sort((a, b) => b.scoreExact - a.scoreExact || String(a.label).localeCompare(String(b.label), 'uk'));

const output = process.argv.includes('--variables') ? ranking : candidates;

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(output, null, 2));
} else {
  console.log(['rank', 'score', 'unit', 'id', 'label', 'role', 'valid_n', 'missing_pct', 'members', 'question'].join('\t'));
  output.slice(0, 30).forEach((row, index) => {
    console.log([
      index + 1,
      row.score,
      row.unit,
      row.id,
      row.label,
      row.role,
      row.validN,
      row.missingPct ?? (100 * (1 - row.coverage)).toFixed(1),
      row.memberLabels?.join(',') || `${row.unit}.${row.id}`,
      row.question,
    ].join('\t'));
  });
}
