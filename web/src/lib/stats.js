/**
 * @typedef {Object} DatasetManifest
 * @property {'people'|'households'} unit
 * @property {number} n
 * @property {number} weightTotal
 * @property {VariableDefinition[]} variables
 * @property {Record<string, Array<{value:string, labels:Record<string,string>}>>} dictionaries
 */

/**
 * @typedef {Object} VariableDefinition
 * @property {string} id
 * @property {'categorical'|'numeric'} type
 * @property {'demography'|'income'|'employment'|'living'} topic
 * @property {Record<'uk'|'en', string>} labels
 * @property {Record<'uk'|'en', string>} universe
 * @property {string[]=} category_order Logical order for ordinal categories
 * @property {string[]} operations
 * @property {string} eligibility
 * @property {'exclude'} missingPolicy
 */

/**
 * @typedef {Object} ExplorerQuery
 * @property {'people'|'households'} unit
 * @property {string} indicator
 * @property {string|null} breakdown
 * @property {Array<{id:string, op:'eq'|'range', value?:string, min?:number|null, max?:number|null}>} filters
 * @property {'uk'|'en'} locale
 * @property {number|null} threshold
 */

/**
 * @typedef {Object} QueryResult
 * @property {'categorical'|'numeric'} type
 * @property {number|null} weightedTotal
 * @property {number|null} weightedShare
 * @property {Array<Object>} rows
 * @property {number} sampleN
 * @property {number} clusterN
 * @property {{filteredOut:number, missing:number}} exclusions
 * @property {'veryLow'|'caution'|'reliable'} reliability
 * @property {Record<'uk'|'en', string>} universe
 */

export function reliabilityForN(n) {
  if (n < 10) return 'veryLow';
  if (n < 30) return 'caution';
  return 'reliable';
}

export function variableDefinitions(metadata, unit) {
  return metadata.units[unit].variables.map(variable => ({
    ...variable,
    operations: variable.type === 'numeric' ? ['distribution', 'threshold', 'range'] : ['share', 'breakdown', 'equals'],
    eligibility: variable.universe.uk,
    missingPolicy: 'exclude',
  }));
}

export function makeManifest(metadata, dataset) {
  return {
    unit: dataset.unit,
    n: dataset.n,
    weightTotal: metadata.units[dataset.unit].weight_total,
    variables: variableDefinitions(metadata, dataset.unit),
    dictionaries: dataset.dictionaries,
  };
}

export function rawValue(dataset, id, index) {
  const value = dataset.columns[id]?.[index];
  if (value == null) return null;
  const dictionary = dataset.dictionaries[id];
  return dictionary ? dictionary[value]?.value ?? null : value;
}

export function categoryLabel(dataset, id, value, locale = 'uk') {
  const entry = dataset.dictionaries[id]?.find(item => item.value === value);
  return entry?.labels?.[locale] || entry?.labels?.uk || String(value);
}

export function orderedCategoryValues(dataset, definition, presentValues = null) {
  const present = presentValues ? new Set(presentValues.map(String)) : null;
  const dictionaryValues = (dataset.dictionaries[definition?.id] || []).map(entry => entry.value);
  const preferred = definition?.category_order || dictionaryValues;
  const ordered = [];
  for (const value of [...preferred, ...dictionaryValues, ...(presentValues || [])]) {
    const text = String(value);
    if ((!present || present.has(text)) && !ordered.includes(text)) ordered.push(text);
  }
  return ordered;
}

export function weightedQuantile(values, weights, probability) {
  if (!values.length) return null;
  const order = values.map((value, index) => ({ value, weight: weights[index] }))
    .filter(row => Number.isFinite(row.value) && Number.isFinite(row.weight) && row.weight > 0)
    .sort((a, b) => a.value - b.value);
  if (!order.length) return null;
  const total = order.reduce((sum, row) => sum + row.weight, 0);
  const target = Math.min(1, Math.max(0, probability)) * total;
  let cumulative = 0;
  for (const row of order) {
    cumulative += row.weight;
    if (cumulative >= target) return row.value;
  }
  return order.at(-1).value;
}

function passFilter(dataset, index, filter) {
  const value = rawValue(dataset, filter.id, index);
  if (value == null) return false;
  if (filter.op === 'eq') return String(value) === String(filter.value);
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return false;
  if (filter.min != null && numeric < filter.min) return false;
  if (filter.max != null && numeric > filter.max) return false;
  return true;
}

function sumWeights(dataset, indices) {
  return indices.reduce((sum, index) => sum + dataset.columns.weight[index], 0);
}

function groupIndices(dataset, indices, id) {
  const groups = new Map();
  for (const index of indices) {
    const value = rawValue(dataset, id, index);
    if (value == null) continue;
    if (!groups.has(value)) groups.set(value, []);
    groups.get(value).push(index);
  }
  return groups;
}

function categoricalResult(dataset, query, indices, definition, breakdownDefinition, exclusions) {
  const totalWeight = sumWeights(dataset, indices);
  const breakdownGroups = query.breakdown ? groupIndices(dataset, indices, query.breakdown) : new Map([[null, indices]]);
  const rows = [];
  for (const [breakdown, group] of breakdownGroups) {
    const denominator = sumWeights(dataset, group);
    for (const [category, categoryIndices] of groupIndices(dataset, group, query.indicator)) {
      const n = categoryIndices.length;
      const weighted = sumWeights(dataset, categoryIndices);
      rows.push({
        category,
        breakdown,
        weightedCount: weighted,
        weightedShare: denominator ? weighted / denominator : 0,
        n,
        clusterN: new Set(categoryIndices.map(index => dataset.columns.cluster[index])).size,
        reliability: reliabilityForN(n),
      });
    }
  }
  const categoryOrder = new Map((definition.category_order || []).map((value, index) => [value, index]));
  const breakdownOrder = new Map((breakdownDefinition?.category_order || []).map((value, index) => [value, index]));
  const orderValue = (order, value) => order.has(value) ? order.get(value) : Number.MAX_SAFE_INTEGER;
  rows.sort((a, b) => {
    const breakdownComparison = breakdownOrder.size
      ? orderValue(breakdownOrder, a.breakdown) - orderValue(breakdownOrder, b.breakdown)
      : String(a.breakdown).localeCompare(String(b.breakdown), 'uk');
    if (breakdownComparison) return breakdownComparison;
    if (categoryOrder.size) return orderValue(categoryOrder, a.category) - orderValue(categoryOrder, b.category);
    return (b.weightedShare ?? -1) - (a.weightedShare ?? -1);
  });
  return {
    type: 'categorical', weightedTotal: totalWeight, weightedShare: indices.length ? 1 : null,
    rows, sampleN: indices.length, clusterN: new Set(indices.map(index => dataset.columns.cluster[index])).size,
    exclusions, reliability: reliabilityForN(indices.length), universe: definition.universe,
  };
}

function numericSummary(dataset, indices, id) {
  const values = indices.map(index => Number(rawValue(dataset, id, index)));
  const weights = indices.map(index => dataset.columns.weight[index]);
  const quantiles = [0.1, 0.25, 0.5, 0.75, 0.9].map(p => ({ p, value: weightedQuantile(values, weights, p) }));
  const cdf = Array.from({ length: 21 }, (_, index) => index / 20).map(p => ({ p, value: weightedQuantile(values, weights, p) }));
  return { quantiles, cdf };
}

function numericResult(dataset, query, indices, definition, exclusions) {
  const totalWeight = sumWeights(dataset, indices);
  const atOrBelow = query.threshold == null ? indices : indices.filter(index => Number(rawValue(dataset, query.indicator, index)) <= query.threshold);
  const selectedWeight = sumWeights(dataset, atOrBelow);
  const reliabilityN = query.threshold == null ? indices.length : atOrBelow.length;
  const groups = query.breakdown ? [...groupIndices(dataset, indices, query.breakdown)].map(([breakdown, group]) => ({
    breakdown,
    n: group.length,
    clusterN: new Set(group.map(index => dataset.columns.cluster[index])).size,
    reliability: reliabilityForN(group.length),
    ...numericSummary(dataset, group, query.indicator),
  })) : [];
  const baseSummary = numericSummary(dataset, indices, query.indicator);
  return {
    type: 'numeric',
    weightedTotal: query.threshold == null ? totalWeight : selectedWeight,
    weightedShare: query.threshold == null ? (indices.length ? 1 : null) : (totalWeight ? selectedWeight / totalWeight : null),
    rows: baseSummary.quantiles,
    cdf: baseSummary.cdf,
    groups,
    sampleN: indices.length,
    thresholdN: atOrBelow.length,
    clusterN: new Set(indices.map(index => dataset.columns.cluster[index])).size,
    thresholdClusterN: new Set(atOrBelow.map(index => dataset.columns.cluster[index])).size,
    exclusions,
    reliability: reliabilityForN(reliabilityN),
    universe: definition.universe,
  };
}

export function runQuery(dataset, metadata, query) {
  const definitions = variableDefinitions(metadata, dataset.unit);
  const definition = definitions.find(variable => variable.id === query.indicator);
  const breakdownDefinition = definitions.find(variable => variable.id === query.breakdown);
  if (!definition) throw new Error(`Unknown indicator: ${query.indicator}`);
  const filtered = [];
  for (let index = 0; index < dataset.n; index += 1) {
    if (query.filters.every(filter => passFilter(dataset, index, filter))) filtered.push(index);
  }
  const valid = filtered.filter(index => rawValue(dataset, query.indicator, index) != null && (!query.breakdown || rawValue(dataset, query.breakdown, index) != null));
  const exclusions = { filteredOut: dataset.n - filtered.length, missing: filtered.length - valid.length };
  return definition.type === 'categorical'
    ? categoricalResult(dataset, query, valid, definition, breakdownDefinition, exclusions)
    : numericResult(dataset, query, valid, definition, exclusions);
}
