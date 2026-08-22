import test from 'node:test';
import assert from 'node:assert/strict';
import { parseQuery, serializeQuery } from '../src/lib/queryUrl.js';

test('explorer URL round-trips every query field', () => {
  const query = {
    unit: 'households', indicator: 'hh_income_total', breakdown: 'settlement', locale: 'en', threshold: 15000,
    filters: [
      { id: 'region', op: 'eq', value: 'Київська (без м.Києва) обл.' },
      { id: 'household_size', op: 'range', min: 2, max: 5 },
    ],
  };
  assert.deepEqual(parseQuery(serializeQuery(query)), query);
});

test('URL parser falls back safely', () => {
  assert.deepEqual(parseQuery('?unit=not-a-unit&threshold=nope'), {
    unit: 'people', indicator: 'sex', breakdown: null, filters: [], locale: 'uk', threshold: null,
  });
});
