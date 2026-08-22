import { Bar, BarChart, CartesianGrid, LabelList, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartFrame from './ChartFrame.jsx';
import { categoryLabel } from '../lib/stats.js';
import { t } from '../i18n/strings.js';

const nf = (locale, options = {}) => new Intl.NumberFormat(locale === 'uk' ? 'uk-UA' : 'en-US', options);

function displayValue(value, locale) {
  return value == null ? '—' : nf(locale, { maximumFractionDigits: 1 }).format(value);
}

function Reliability({ level, locale }) {
  const copy = t(locale);
  return <span className={`reliability reliability-${level}`}>{copy[level]}</span>;
}

function CategoricalChart({ result, dataset, query, locale }) {
  const pct = nf(locale, { style: 'percent', maximumFractionDigits: 1 });
  const rows = result.rows.map(row => {
    const category = categoryLabel(dataset, query.indicator, row.category, locale);
    const breakdown = row.breakdown == null ? null : categoryLabel(dataset, query.breakdown, row.breakdown, locale);
    return { ...row, label: breakdown ? `${breakdown} — ${category}` : category };
  });
  const visible = rows.slice(0, 40);
  return <ChartFrame locale={locale} ariaLabel={locale === 'uk' ? 'Зважені частки категорій для вибраного запиту' : 'Weighted category shares for the selected query'} table={
    <table><thead><tr><th>{t(locale).value}</th><th>{t(locale).share}</th><th>{t(locale).count}</th><th>n</th><th>{locale === 'uk' ? 'Надійність' : 'Reliability'}</th></tr></thead><tbody>
      {rows.map(row => <tr key={row.label}><th>{row.label}</th><td>{row.weightedShare == null ? '—' : pct.format(row.weightedShare)}</td><td>{row.weightedCount == null ? '—' : nf(locale, { maximumFractionDigits: 0 }).format(row.weightedCount)}</td><td>{row.n}</td><td><Reliability level={row.reliability} locale={locale} /></td></tr>)}
    </tbody></table>
  }>
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

function NumericChart({ result, dataset, query, locale }) {
  const pct = nf(locale, { style: 'percent', maximumFractionDigits: 0 });
  const number = nf(locale, { maximumFractionDigits: 1 });
  const quantileRows = result.rows;
  if (result.groups?.length) {
    const data = result.groups.map(group => ({
      label: categoryLabel(dataset, query.breakdown, group.breakdown, locale),
      median: group.quantiles.find(row => row.p === 0.5)?.value,
      n: group.n,
      reliability: group.reliability,
    })).sort((a, b) => (b.median ?? -Infinity) - (a.median ?? -Infinity));
    return <ChartFrame locale={locale} ariaLabel={locale === 'uk' ? 'Зважена медіана числового показника за вибраним розрізом' : 'Weighted median of the numeric indicator by selected breakdown'} table={
      <table><thead><tr><th>{t(locale).breakdown}</th><th>{t(locale).median}</th><th>n</th><th>{locale === 'uk' ? 'Надійність' : 'Reliability'}</th></tr></thead><tbody>{data.map(row => <tr key={row.label}><th>{row.label}</th><td>{row.reliability === 'suppressed' ? '—' : number.format(row.median)}</td><td>{row.n}</td><td><Reliability level={row.reliability} locale={locale} /></td></tr>)}</tbody></table>
    }>
      <ResponsiveContainer width="100%" height={Math.max(260, data.length * 42)}>
        <BarChart data={data.map(row => ({ ...row, median: row.reliability === 'suppressed' ? null : row.median }))} layout="vertical" margin={{ top: 6, right: 62, left: 4, bottom: 0 }}>
          <CartesianGrid horizontal={false} stroke="var(--grid)" />
          <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={value => number.format(value)} />
          <YAxis type="category" dataKey="label" axisLine={false} tickLine={false} width={180} tick={{ fontSize: 10 }} />
          <Tooltip formatter={value => number.format(value)} />
          <Bar dataKey="median" fill="var(--orange)" radius={[0, 2, 2, 0]}><LabelList dataKey="median" position="right" formatter={value => number.format(value)} /></Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>;
  }
  return <ChartFrame locale={locale} ariaLabel={locale === 'uk' ? 'Зважена кумулятивна крива числового показника' : 'Weighted cumulative distribution curve for the numeric indicator'} table={
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

export default function ExplorerResult({ result, dataset, query, definition, locale }) {
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
      ? <CategoricalChart result={result} dataset={dataset} query={query} locale={locale} />
      : <NumericChart result={result} dataset={dataset} query={query} locale={locale} />}
  </section>;
}
