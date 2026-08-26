import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { orderedCategoryValues, reliabilityForN, runQuery, weightedQuantile } from '../src/lib/stats.js';

function metadata(n) {
  return { units: { people: { n, weight_total: n, variables: [
    { id: 'group', type: 'categorical', topic: 'demography', labels: { uk: 'Група', en: 'Group' }, universe: { uk: 'Усі', en: 'All' } },
    { id: 'value', type: 'numeric', topic: 'income', labels: { uk: 'Значення', en: 'Value' }, universe: { uk: 'Ті, хто відповів', en: 'Respondents' } },
    { id: 'breakdown', type: 'categorical', topic: 'demography', labels: { uk: 'Розріз', en: 'Breakdown' }, universe: { uk: 'Усі', en: 'All' } },
  ] } } };
}

function dataset(n, overrides = {}) {
  return {
    unit: 'people', n,
    columns: {
      cluster: Array.from({ length: n }, (_, i) => Math.floor(i / 2) + 1),
      weight: Array.from({ length: n }, () => 1),
      group: Array.from({ length: n }, (_, i) => i % 2),
      value: Array.from({ length: n }, (_, i) => i + 1),
      breakdown: Array.from({ length: n }, (_, i) => i % 2),
      ...overrides,
    },
    dictionaries: {
      group: [{ value: 'a', labels: { uk: 'А', en: 'A' } }, { value: 'b', labels: { uk: 'Б', en: 'B' } }],
      breakdown: [{ value: 'x', labels: { uk: 'X', en: 'X' } }, { value: 'y', labels: { uk: 'Y', en: 'Y' } }],
    },
  };
}

test('reliability boundaries are exact', () => {
  assert.equal(reliabilityForN(9), 'veryLow');
  assert.equal(reliabilityForN(10), 'caution');
  assert.equal(reliabilityForN(29), 'caution');
  assert.equal(reliabilityForN(30), 'reliable');
});

test('weighted quantiles use survey weights', () => {
  assert.equal(weightedQuantile([10, 20, 30], [1, 8, 1], 0.5), 20);
  assert.equal(weightedQuantile([10, 20, 30], [1, 1, 8], 0.9), 30);
});

test('missing values are excluded rather than treated as a category', () => {
  const data = dataset(4, { group: [0, 1, null, 0], weight: [1, 2, 3, 4] });
  const result = runQuery(data, metadata(4), { unit: 'people', indicator: 'group', breakdown: null, filters: [], locale: 'uk', threshold: null });
  assert.equal(result.sampleN, 3);
  assert.equal(result.exclusions.missing, 1);
  assert.equal(result.weightedTotal, 7, 'small-sample values remain visible');
  assert.deepEqual(result.rows.map(row => row.weightedCount).sort((a, b) => a - b), [2, 5]);
  assert.equal(result.reliability, 'veryLow');
});

test('filters and breakdown use their own denominators', () => {
  const data = dataset(40);
  const result = runQuery(data, metadata(40), { unit: 'people', indicator: 'group', breakdown: 'breakdown', filters: [{ id: 'value', op: 'range', min: 11, max: 30 }], locale: 'uk', threshold: null });
  assert.equal(result.sampleN, 20);
  assert.equal(result.exclusions.filteredOut, 20);
  assert.equal(result.rows.length, 2);
  assert.equal(result.rows.every(row => row.weightedShare === 1), true);
});

test('ordinal categories keep their declared order', () => {
  const data = dataset(4);
  const meta = metadata(4);
  meta.units.people.variables[0].category_order = ['b', 'a'];
  const definition = meta.units.people.variables[0];
  const result = runQuery(data, meta, { unit: 'people', indicator: 'group', breakdown: null, filters: [], locale: 'uk', threshold: null });

  assert.deepEqual(result.rows.map(row => row.category), ['b', 'a']);
  assert.deepEqual(orderedCategoryValues(data, definition), ['b', 'a']);
});

test('numeric thresholds keep small qualifying counts visible with a warning', () => {
  const data = dataset(30);
  const small = runQuery(data, metadata(30), { unit: 'people', indicator: 'value', breakdown: null, filters: [], locale: 'uk', threshold: 9 });
  assert.equal(small.thresholdN, 9);
  assert.equal(small.weightedTotal, 9);
  assert.equal(small.reliability, 'veryLow');
  assert.equal(small.cdf.length, 21, 'base distribution remains available at base n=30');
  const caution = runQuery(data, metadata(30), { unit: 'people', indicator: 'value', breakdown: null, filters: [], locale: 'uk', threshold: 10 });
  assert.equal(caution.reliability, 'caution');
  assert.equal(caution.weightedTotal, 10);
});

test('numeric distributions remain visible below ten observations', () => {
  const result = runQuery(dataset(4), metadata(4), { unit: 'people', indicator: 'value', breakdown: null, filters: [], locale: 'uk', threshold: null });
  assert.equal(result.reliability, 'veryLow');
  assert.equal(result.weightedTotal, 4);
  assert.equal(result.cdf.length, 21);
  assert.deepEqual(result.rows.map(row => row.value), [1, 1, 2, 3, 4]);
});

test('income regression anchors stay fixed', async () => {
  const overview = JSON.parse(await readFile(new URL('../../public/data/overview.json', import.meta.url), 'utf8'));
  assert.deepEqual(overview.income.quantiles.map(row => row.total), [4300, 7500, 14900, 25000, 35000]);
  assert.deepEqual(overview.income.quantiles.map(row => Math.round(row.per_capita * 100) / 100), [2625, 4000, 6500, 10000, 16666.67]);
  assert.equal(overview.totals.people_n, 18837);
  assert.equal(overview.totals.households_n, 8023);
  assert.ok(Math.abs(overview.totals.average_household_size - 2.29425) < 0.0001);
  assert.ok(Math.abs(overview.totals.households_with_children_share - 0.268823) < 0.0001);
  assert.ok(Math.abs(overview.age_sex.reduce((sum, row) => sum + row.weighted, 0) - overview.totals.people) < 0.01);
  const aged60 = overview.age_sex.filter(row => row.age_band === '60+').reduce((sum, row) => sum + row.weighted, 0) / overview.totals.people;
  assert.ok(Math.abs(aged60 - 0.25492) < 0.0001);
});

test('overview contains compact summaries for every published variable', async () => {
  const overview = JSON.parse(await readFile(new URL('../../public/data/overview.json', import.meta.url), 'utf8'));
  const metadataFile = JSON.parse(await readFile(new URL('../../public/data/metadata.json', import.meta.url), 'utf8'));
  const peopleIds = metadataFile.units.people.variables.map(variable => variable.id);
  const householdIds = metadataFile.units.households.variables.map(variable => variable.id);

  assert.equal(peopleIds.length, 19);
  assert.equal(householdIds.length, 28);
  assert.deepEqual(Object.keys(overview.variable_summaries.people), peopleIds);
  assert.deepEqual(Object.keys(overview.variable_summaries.households), householdIds);
  assert.equal(overview.variable_summaries.people.age.base_n, 18837);
  assert.equal(overview.variable_summaries.people.marital.missing_n, 3321);
  assert.equal(overview.variable_summaries.households.area_total.base_n, 7735);
  assert.equal(overview.variable_summaries.households.area_total.missing_n, 288);
  assert.equal(overview.deprivation.length, 5, 'the E1.1–E1.5 battery stays together');
  assert.deepEqual(metadataFile.units.households.variables.find(variable => variable.id === 'income_adequacy').category_order, [
    'Не вдалося забезпечити навіть достатнє харчування',
    'Постійно відмовляли собі в найнеобхіднішому, крім харчування',
    'Було достатньо, але заощаджень не робили',
    'Було достатньо і робили заощадження',
    'Важко відповісти',
  ]);
});

test('overview quick-answer anchors stay fixed', async () => {
  const overview = JSON.parse(await readFile(new URL('../../public/data/overview.json', import.meta.url), 'utf8'));
  const quick = overview.quick_answers;
  const share = (distribution, category) => quick[distribution].rows.find(row => row.category === category).share;
  const closeTo = (actual, expected) => assert.ok(Math.abs(actual - expected) < 0.00001, `${actual} should be close to ${expected}`);

  closeTo(share('household_size', '1'), 0.291104);
  closeTo(
    share('income_adequacy', 'Постійно відмовляли собі в найнеобхіднішому, крім харчування')
      + share('income_adequacy', 'Не вдалося забезпечити навіть достатнє харчування'),
    0.430617,
  );
  closeTo(share('unexpected_expense', 'Ні'), 0.53877);
  closeTo(share('housing_tenure', 'Є власністю Вашої родини'), 0.890375);
  closeTo(share('internet', 'Так'), 0.853326);
  closeTo(share('public_transport', 'Так'), 0.798722);
  closeTo(share('idp', 'yes'), 0.031291);
  closeTo(share('abroad_since_2022', 'yes'), 0.039333);
  assert.equal(quick.idp.base_n, 16958);
  assert.equal(quick.idp.missing_n, 1879);
});
