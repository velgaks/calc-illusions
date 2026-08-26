import { Bar, BarChart, CartesianGrid, LabelList, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartFrame from './ChartFrame.jsx';
import { categoryLabel, orderedCategoryValues } from '../lib/stats.js';
import { t } from '../i18n/strings.js';

const nf = (locale, options = {}) => new Intl.NumberFormat(locale === 'uk' ? 'uk-UA' : 'en-US', options);

const BREAKDOWN_COLORS = [
  '#2a78d6', '#eb6834', '#236c49', '#7b8794', '#8b5fbf', '#c4901f', '#168b8b', '#d6336c',
  '#5598e7', '#d95926', '#5c7a35', '#55636f', '#1c5cab', '#f18a5d', '#4d8c68', '#9ca6b0',
  '#6e4aa8', '#ad7b16', '#0f6c70', '#b04a73', '#86b6ef', '#f2aa82', '#78a487', '#b3c2d1',
];

function chartDefinitions(variables, query) {
  return [query.indicator, query.breakdown]
    .filter(Boolean)
    .map(id => variables.find(variable => variable.id === id))
    .filter(Boolean);
}

function displayValue(value, locale) {
  return value == null ? '—' : nf(locale, { maximumFractionDigits: 1 }).format(value);
}

function Reliability({ level, locale }) {
  const copy = t(locale);
  return <span className={`reliability reliability-${level}`}>{copy[level]}</span>;
}

function SmallGroupNote({ rows, locale }) {
  const veryLow = rows.filter(row => row.reliability === 'veryLow').length;
  const caution = rows.filter(row => row.reliability === 'caution').length;
  if (!veryLow && !caution) return null;
  return <p className="small-group-note" role="note">
    {locale === 'uk'
      ? `Мала вибірка: n < 10 — ${veryLow}; n = 10–29 — ${caution}. Усі значення показано, але вони можуть бути нестабільними.`
      : `Small samples: n < 10 — ${veryLow}; n = 10–29 — ${caution}. All values are shown, but they may be unstable.`}
  </p>;
}

function BreakdownKey({ items }) {
  return <div className="chart-key breakdown-key" aria-hidden="true">
    {items.map(item => <span key={item.value} style={{ '--key-color': item.color }}>{item.label}</span>)}
  </div>;
}

function categoryOrder(dataset, variables, id, presentValues) {
  const definition = variables.find(variable => variable.id === id) || { id };
  return orderedCategoryValues(dataset, definition, presentValues);
}

function CategoricalChart({ result, dataset, variables, query, locale }) {
  const pct = nf(locale, { style: 'percent', maximumFractionDigits: 1 });
  const rows = result.rows.map(row => {
    const category = categoryLabel(dataset, query.indicator, row.category, locale);
    const breakdown = row.breakdown == null ? null : categoryLabel(dataset, query.breakdown, row.breakdown, locale);
    return { ...row, categoryLabel: category, breakdownLabel: breakdown, label: breakdown ? `${breakdown} — ${category}` : category };
  });
  const hasBreakdown = Boolean(query.breakdown);
  const visible = rows.slice(0, 40);
  const table = <table><thead><tr><th>{t(locale).value}</th>{hasBreakdown && <th>{t(locale).breakdown}</th>}<th>{t(locale).share}</th><th>{t(locale).count}</th><th>n</th><th>{locale === 'uk' ? 'Надійність' : 'Reliability'}</th></tr></thead><tbody>
    {rows.map(row => <tr key={`${row.breakdown ?? 'all'}-${row.category}`}><th>{row.categoryLabel}</th>{hasBreakdown && <td>{row.breakdownLabel}</td>}<td>{row.weightedShare == null ? '—' : pct.format(row.weightedShare)}</td><td>{row.weightedCount == null ? '—' : nf(locale, { maximumFractionDigits: 0 }).format(row.weightedCount)}</td><td>{row.n}</td><td><Reliability level={row.reliability} locale={locale} /></td></tr>)}
  </tbody></table>;

  if (hasBreakdown) {
    const categoryValues = categoryOrder(dataset, variables, query.indicator, rows.map(row => row.category));
    const breakdownValues = categoryOrder(dataset, variables, query.breakdown, rows.map(row => row.breakdown));
    const series = breakdownValues.map((value, index) => ({
      value,
      key: `breakdown_${index}`,
      label: categoryLabel(dataset, query.breakdown, value, locale),
      color: BREAKDOWN_COLORS[index % BREAKDOWN_COLORS.length],
    }));
    const data = categoryValues.slice(0, 40).map(category => {
      const point = { category, label: categoryLabel(dataset, query.indicator, category, locale) };
      for (const item of series) {
        point[item.key] = rows.find(row => row.category === category && row.breakdown === item.value)?.weightedShare ?? null;
      }
      return point;
    });
    const chartHeight = Math.max(300, data.length * Math.max(54, series.length * 22 + 16));
    const breakdownDefinition = variables.find(variable => variable.id === query.breakdown);
    return <ChartFrame locale={locale} definitions={chartDefinitions(variables, query)} ariaLabel={locale === 'uk' ? 'Зважені частки відповідей; кольори показують групи вибраного розрізу' : 'Weighted response shares; colours identify the selected breakdown groups'} table={table}>
      <p className="chart-series-title"><strong>{t(locale).breakdown}:</strong> {breakdownDefinition?.labels[locale]}</p>
      <BreakdownKey items={series} />
      <SmallGroupNote rows={rows} locale={locale} />
      <div className="grouped-bar-scroll">
        <div className="grouped-bar-canvas" style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 8, right: 72, left: 4, bottom: 4 }} barGap={2} barCategoryGap="18%">
              <CartesianGrid horizontal={false} stroke="var(--grid)" />
              <XAxis type="number" domain={[0, dataMax => Math.min(1, Math.max(0.1, Math.ceil(dataMax * 10) / 10))]} axisLine={false} tickLine={false} tickFormatter={value => pct.format(value)} />
              <YAxis type="category" dataKey="label" axisLine={false} tickLine={false} width={190} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(value, name) => [pct.format(value), series.find(item => item.key === name)?.label || name]} />
              {series.map(item => <Bar key={item.value} dataKey={item.key} name={item.label} fill={item.color} radius={[0, 2, 2, 0]} maxBarSize={18} isAnimationActive={false}>
                <LabelList dataKey={item.key} position="right" formatter={value => value == null ? '' : pct.format(value)} />
              </Bar>)}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {categoryValues.length > 40 && <p className="chart-note">{locale === 'uk' ? 'Графік показує перші 40 відповідей; усі значення є в таблиці.' : 'The chart shows the first 40 responses; the table contains all values.'}</p>}
    </ChartFrame>;
  }

  return <ChartFrame locale={locale} definitions={chartDefinitions(variables, query)} ariaLabel={locale === 'uk' ? 'Зважені частки категорій для вибраного запиту' : 'Weighted category shares for the selected query'} table={
    table
  }>
    <SmallGroupNote rows={rows} locale={locale} />
    <ResponsiveContainer width="100%" height={Math.max(260, visible.length * 42)}>
      <BarChart data={visible} layout="vertical" margin={{ top: 6, right: 62, left: 4, bottom: 0 }}>
        <CartesianGrid horizontal={false} stroke="var(--grid)" />
        <XAxis type="number" domain={[0, 'dataMax']} axisLine={false} tickLine={false} tickFormatter={value => pct.format(value)} />
        <YAxis type="category" dataKey="label" axisLine={false} tickLine={false} width={190} tick={{ fontSize: 10 }} />
        <Tooltip formatter={value => pct.format(value)} />
        <Bar dataKey="weightedShare" fill="var(--blue)" radius={[0, 2, 2, 0]}><LabelList dataKey="weightedShare" position="right" formatter={value => value == null ? '—' : pct.format(value)} /></Bar>
      </BarChart>
    </ResponsiveContainer>
    {rows.length > 40 && <p className="chart-note">{locale === 'uk' ? 'Графік показує перші 40 рядків; усі значення є в таблиці.' : 'The chart shows the first 40 rows; the table contains all values.'}</p>}
  </ChartFrame>;
}

function NumericChart({ result, dataset, variables, query, locale }) {
  const pct = nf(locale, { style: 'percent', maximumFractionDigits: 0 });
  const number = nf(locale, { maximumFractionDigits: 1 });
  const quantileRows = result.rows;
  if (result.groups?.length) {
    const breakdownDefinition = variables.find(variable => variable.id === query.breakdown);
    const order = new Map((breakdownDefinition?.category_order || []).map((value, index) => [value, index]));
    const data = result.groups.map(group => ({
      breakdown: group.breakdown,
      label: categoryLabel(dataset, query.breakdown, group.breakdown, locale),
      median: group.quantiles.find(row => row.p === 0.5)?.value,
      n: group.n,
      reliability: group.reliability,
    })).sort((a, b) => order.size
      ? (order.get(a.breakdown) ?? Number.MAX_SAFE_INTEGER) - (order.get(b.breakdown) ?? Number.MAX_SAFE_INTEGER)
      : (b.median ?? -Infinity) - (a.median ?? -Infinity));
    return <ChartFrame locale={locale} definitions={chartDefinitions(variables, query)} ariaLabel={locale === 'uk' ? 'Зважена медіана числового показника за вибраним розрізом' : 'Weighted median of the numeric indicator by selected breakdown'} table={
      <table><thead><tr><th>{t(locale).breakdown}</th><th>{t(locale).median}</th><th>n</th><th>{locale === 'uk' ? 'Надійність' : 'Reliability'}</th></tr></thead><tbody>{data.map(row => <tr key={row.label}><th>{row.label}</th><td>{row.median == null ? '—' : number.format(row.median)}</td><td>{row.n}</td><td><Reliability level={row.reliability} locale={locale} /></td></tr>)}</tbody></table>
    }>
      <SmallGroupNote rows={data} locale={locale} />
      <ResponsiveContainer width="100%" height={Math.max(260, data.length * 42)}>
        <BarChart data={data} layout="vertical" margin={{ top: 6, right: 62, left: 4, bottom: 0 }}>
          <CartesianGrid horizontal={false} stroke="var(--grid)" />
          <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={value => number.format(value)} />
          <YAxis type="category" dataKey="label" axisLine={false} tickLine={false} width={180} tick={{ fontSize: 10 }} />
          <Tooltip formatter={value => number.format(value)} />
          <Bar dataKey="median" fill="var(--orange)" radius={[0, 2, 2, 0]}><LabelList dataKey="median" position="right" formatter={value => number.format(value)} /></Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>;
  }
  return <ChartFrame locale={locale} definitions={chartDefinitions(variables, query)} ariaLabel={locale === 'uk' ? 'Зважена кумулятивна крива числового показника' : 'Weighted cumulative distribution curve for the numeric indicator'} table={
    <table><thead><tr><th>{t(locale).percentile}</th><th>{t(locale).value}</th></tr></thead><tbody>{quantileRows.map(row => <tr key={row.p}><th>p{Math.round(row.p * 100)}</th><td>{row.value == null ? '—' : number.format(row.value)}</td></tr>)}</tbody></table>
  }>
    <ResponsiveContainer width="100%" height={360}>
      <LineChart data={result.cdf} margin={{ top: 18, right: 30, left: 2, bottom: 8 }}>
        <CartesianGrid vertical={false} stroke="var(--grid)" />
        <XAxis dataKey="value" type="number" domain={['dataMin', 'dataMax']} axisLine={false} tickLine={false} tickFormatter={value => number.format(value)} />
        <YAxis dataKey="p" type="number" domain={[0, 1]} axisLine={false} tickLine={false} tickFormatter={value => pct.format(value)} width={48} />
        <Tooltip formatter={(value, name) => name === 'p' ? pct.format(value) : number.format(value)} />
        <Line dataKey="p" stroke="var(--blue)" strokeWidth={3} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  </ChartFrame>;
}

export function aggregateCsv(result, dataset, query, locale) {
  const quote = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
  if (result.type === 'categorical') {
    const rows = [['category', 'breakdown', 'weighted_count', 'weighted_share', 'n', 'clusters', 'reliability']];
    result.rows.forEach(row => rows.push([
      categoryLabel(dataset, query.indicator, row.category, locale),
      row.breakdown == null ? '' : categoryLabel(dataset, query.breakdown, row.breakdown, locale),
      row.weightedCount ?? '', row.weightedShare ?? '', row.n, row.clusterN, row.reliability,
    ]));
    return rows.map(row => row.map(quote).join(',')).join('\n');
  }
  const rows = [['percentile', 'value']];
  result.rows.forEach(row => rows.push([row.p, row.value]));
  return rows.map(row => row.map(quote).join(',')).join('\n');
}

export default function ExplorerResult({ result, dataset, variables, query, definition, locale }) {
  const copy = t(locale);
  const integer = nf(locale, { maximumFractionDigits: 0 });
  const pct = nf(locale, { style: 'percent', maximumFractionDigits: 1 });
  const selectedN = result.type === 'numeric' && query.threshold != null ? result.thresholdN : result.sampleN;
  const selectedClusters = result.type === 'numeric' && query.threshold != null ? result.thresholdClusterN : result.clusterN;
  return <section className="query-result" aria-live="polite">
    <div className="result-heading"><div><p className="eyebrow">{copy.queryResult}</p><h2>{definition.labels[locale]}</h2></div><Reliability level={result.reliability} locale={locale} /></div>
    <div className="result-cards">
      <div><span>{copy.weightedCount}</span><strong>{result.weightedTotal == null ? '—' : integer.format(result.weightedTotal)}</strong></div>
      <div><span>{copy.weightedShare}</span><strong>{result.weightedShare == null ? '—' : pct.format(result.weightedShare)}</strong></div>
      <div><span>{copy.sampleN}</span><strong>{integer.format(selectedN)}</strong></div>
      {query.unit === 'people' && <div><span>{copy.clusters}</span><strong>{integer.format(selectedClusters)}</strong></div>}
    </div>
    <p className="universe"><strong>{copy.universe}:</strong> {result.universe[locale]}. {query.threshold != null ? `${copy.weightedCount}: ${copy.atOrBelow} ${integer.format(query.threshold)}. ` : ''}{integer.format(result.exclusions.missing)} {copy.excluded}.</p>
    {result.type === 'categorical'
      ? <CategoricalChart result={result} dataset={dataset} variables={variables} query={query} locale={locale} />
      : <NumericChart result={result} dataset={dataset} variables={variables} query={query} locale={locale} />}
  </section>;
}
