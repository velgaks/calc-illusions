import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { reliabilityForN, runQuery, weightedQuantile } from '../src/lib/stats.js';

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
  assert.equal(reliabilityForN(9), 'suppressed');
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
  assert.equal(result.weightedTotal, null, 'overall result is suppressed at n<10');
  assert.equal(result.rows.every(row => row.weightedCount === null), true);
});

test('filters and breakdown use their own denominators', () => {
  const data = dataset(40);
  const result = runQuery(data, metadata(40), { unit: 'people', indicator: 'group', breakdown: 'breakdown', filters: [{ id: 'value', op: 'range', min: 11, max: 30 }], locale: 'uk', threshold: null });
  assert.equal(result.sampleN, 20);
  assert.equal(result.exclusions.filteredOut, 20);
  assert.equal(result.rows.length, 2);
  assert.equal(result.rows.every(row => row.weightedShare === 1), true);
});

test('numeric thresholds suppress only small qualifying counts', () => {
  const data = dataset(30);
  const small = runQuery(data, metadata(30), { unit: 'people', indicator: 'value', breakdown: null, filters: [], locale: 'uk', threshold: 9 });
  assert.equal(small.thresholdN, 9);
  assert.equal(small.weightedTotal, null);
  assert.equal(small.cdf.length, 21, 'base distribution remains available at base n=30');
  const caution = runQuery(data, metadata(30), { unit: 'people', indicator: 'value', breakdown: null, filters: [], locale: 'uk', threshold: 10 });
  assert.equal(caution.reliability, 'caution');
  assert.equal(caution.weightedTotal, 10);
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
