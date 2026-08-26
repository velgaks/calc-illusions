import test from 'node:test';
import assert from 'node:assert/strict';
import { MAX_FILTERS, parseQuery, serializeQuery } from '../src/lib/queryUrl.js';

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

test('explorer URL never keeps more than two filters', () => {
  const query = {
    unit: 'people', indicator: 'sex', breakdown: null, locale: 'uk', threshold: null,
    filters: [
      { id: 'region', op: 'eq', value: 'Донецька обл.' },
      { id: 'settlement', op: 'eq', value: 'urban' },
      { id: 'age', op: 'range', min: 18, max: 29 },
    ],
  };
  assert.equal(MAX_FILTERS, 2);
  assert.equal(parseQuery(serializeQuery(query)).filters.length, 2);
  assert.equal(parseQuery('?filter=region%7Ceq%7Ca&filter=settlement%7Ceq%7Curban&filter=age%7Crange%7C18%7C29').filters.length, 2);
});
