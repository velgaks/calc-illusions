export const DEFAULT_QUERY = { unit: 'people', indicator: 'sex', breakdown: null, filters: [], locale: 'uk', threshold: null };
export const MAX_FILTERS = 2;

export function parseQuery(search = '') {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const unit = params.get('unit') === 'households' ? 'households' : 'people';
  const filters = params.getAll('filter').map(value => {
    const [id, op, first, second] = value.split('|');
    if (!id || !['eq', 'range'].includes(op)) return null;
    return op === 'eq'
      ? { id, op, value: first ?? '' }
      : { id, op, min: first === '' ? null : Number(first), max: second === '' ? null : Number(second) };
  }).filter(Boolean).slice(0, MAX_FILTERS);
  const threshold = params.has('threshold') && params.get('threshold') !== '' ? Number(params.get('threshold')) : null;
  return {
    unit,
    indicator: params.get('indicator') || (unit === 'people' ? 'sex' : 'hh_income_total'),
    breakdown: params.get('breakdown') || null,
    filters,
    locale: params.get('lang') === 'en' ? 'en' : 'uk',
    threshold: Number.isFinite(threshold) ? threshold : null,
  };
}

export function serializeQuery(query) {
  const params = new URLSearchParams();
  params.set('unit', query.unit);
  params.set('indicator', query.indicator);
  if (query.breakdown) params.set('breakdown', query.breakdown);
  if (query.locale === 'en') params.set('lang', 'en');
  if (query.threshold != null && Number.isFinite(Number(query.threshold))) params.set('threshold', String(query.threshold));
  for (const filter of (query.filters || []).slice(0, MAX_FILTERS)) {
    const value = filter.op === 'eq'
      ? [filter.id, 'eq', filter.value ?? ''].join('|')
      : [filter.id, 'range', filter.min ?? '', filter.max ?? ''].join('|');
    params.append('filter', value);
  }
  return `?${params.toString()}`;
}
