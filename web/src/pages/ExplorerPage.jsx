import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ExplorerResult, { aggregateCsv } from '../components/ExplorerResult.jsx';
import { loadDataset } from '../data/loader.js';
import { t } from '../i18n/strings.js';
import { MAX_FILTERS, parseQuery, serializeQuery } from '../lib/queryUrl.js';
import { orderedCategoryValues, runQuery, variableDefinitions } from '../lib/stats.js';

const DEFAULT_INDICATOR = { people: 'sex', households: 'hh_income_total' };

function groupedVariables(variables) {
  return ['demography', 'income', 'employment', 'living'].map(topic => ({ topic, items: variables.filter(variable => variable.topic === topic) })).filter(group => group.items.length);
}

function firstCategory(dataset, definition) {
  return orderedCategoryValues(dataset, definition)[0] || '';
}

function CategoryOptions({ dataset, definition, locale }) {
  const dictionary = dataset.dictionaries[definition.id] || [];
  return orderedCategoryValues(dataset, definition).map(value => {
    const entry = dictionary.find(item => item.value === value);
    return <option key={value} value={value}>{entry?.labels?.[locale] || entry?.labels?.uk || value}</option>;
  });
}

function FilterEditor({ filter, index, variables, dataset, locale, onChange, onRemove }) {
  const copy = t(locale);
  const definition = variables.find(variable => variable.id === filter.id) || variables[0];
  const changeVariable = id => {
    const next = variables.find(variable => variable.id === id);
    if (next.type === 'categorical') onChange(index, { id, op: 'eq', value: firstCategory(dataset, next) });
    else onChange(index, { id, op: 'range', min: null, max: null });
  };
  return <div className="filter-row">
    <label><span>{copy.variable}</span><select value={definition.id} onChange={event => changeVariable(event.target.value)}>{variables.map(variable => <option key={variable.id} value={variable.id}>{variable.labels[locale]}</option>)}</select></label>
    {definition.type === 'categorical' ? <label><span>{copy.category}</span><select value={filter.value ?? ''} onChange={event => onChange(index, { ...filter, value: event.target.value })}><CategoryOptions dataset={dataset} definition={definition} locale={locale} /></select></label> : <>
      <label><span>{copy.from}</span><input type="number" value={filter.min ?? ''} onChange={event => onChange(index, { ...filter, min: event.target.value === '' ? null : Number(event.target.value) })} /></label>
      <label><span>{copy.to}</span><input type="number" value={filter.max ?? ''} onChange={event => onChange(index, { ...filter, max: event.target.value === '' ? null : Number(event.target.value) })} /></label>
    </>}
    <button type="button" className="icon-button" onClick={() => onRemove(index)} aria-label={copy.remove}>×</button>
  </div>;
}

export default function ExplorerPage({ locale, onLocaleChange }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState(() => ({ ...parseQuery(location.search), locale }));
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const copy = t(locale);

  useEffect(() => {
    setPayload(null); setError(null);
    loadDataset(query.unit).then(setPayload).catch(error => setError(error.message));
  }, [query.unit]);

  useEffect(() => {
    if (query.locale !== locale) setQuery(current => ({ ...current, locale }));
  }, [locale, query.locale]);

  useEffect(() => {
    navigate({ pathname: '/explore', search: serializeQuery({ ...query, locale }) }, { replace: true });
  }, [query, locale, navigate]);

  const readyPayload = payload?.dataset?.unit === query.unit ? payload : null;
  const variables = readyPayload ? variableDefinitions(readyPayload.metadata, query.unit) : [];
  const indicator = variables.find(variable => variable.id === query.indicator) || variables[0];
  const result = useMemo(() => readyPayload && indicator ? runQuery(readyPayload.dataset, readyPayload.metadata, { ...query, indicator: indicator.id }) : null, [readyPayload, query, indicator]);

  const changeUnit = unit => setQuery({ unit, indicator: DEFAULT_INDICATOR[unit], breakdown: null, filters: [], threshold: null, locale });
  const updateFilter = (index, filter) => setQuery(current => ({ ...current, filters: current.filters.map((item, itemIndex) => itemIndex === index ? filter : item) }));
  const addFilter = () => {
    if (!readyPayload || !variables.length || query.filters.length >= MAX_FILTERS) return;
    const variable = variables.find(item => item.id === 'region') || variables[0];
    const filter = variable.type === 'categorical'
      ? { id: variable.id, op: 'eq', value: firstCategory(readyPayload.dataset, variable) }
      : { id: variable.id, op: 'range', min: null, max: null };
    setQuery(current => ({ ...current, filters: [...current.filters, filter] }));
  };
  const copyLink = async () => { await navigator.clipboard.writeText(window.location.href); setCopied(true); window.setTimeout(() => setCopied(false), 1600); };
  const downloadCsv = () => {
    const csv = aggregateCsv(result, readyPayload.dataset, { ...query, indicator: indicator.id }, locale);
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `sesh-${query.unit}-${indicator.id}.csv`; link.click(); URL.revokeObjectURL(url);
  };

  return <div className="page explorer-page">
    <section className="explorer-hero"><p className="eyebrow">SESH 2023/24</p><h1>{copy.navExplorer}</h1><p>{copy.explorerIntro}</p></section>
    <div className="unit-toggle" role="group" aria-label={locale === 'uk' ? 'Одиниця аналізу' : 'Unit of analysis'}>
      <button type="button" className={query.unit === 'people' ? 'active' : ''} onClick={() => changeUnit('people')}>{copy.people}</button>
      <button type="button" className={query.unit === 'households' ? 'active' : ''} onClick={() => changeUnit('households')}>{copy.households}</button>
    </div>
    {error && <div className="error-box">{error}</div>}
    {!readyPayload && !error && <p className="loading-inline">{copy.loadingDataset}</p>}
    {readyPayload && indicator && <>
      <section className="query-builder" aria-label={locale === 'uk' ? 'Параметри запиту' : 'Query parameters'}>
        <div className="builder-main">
          <label><span>{copy.indicator}</span><select value={indicator.id} onChange={event => setQuery(current => ({ ...current, indicator: event.target.value, breakdown: current.breakdown === event.target.value ? null : current.breakdown, threshold: null }))}>
            {groupedVariables(variables).map(group => <optgroup key={group.topic} label={copy[group.topic]}>{group.items.map(variable => <option key={variable.id} value={variable.id}>{variable.labels[locale]}</option>)}</optgroup>)}
          </select></label>
          <label><span>{copy.breakdown}</span><select value={query.breakdown || ''} onChange={event => setQuery(current => ({ ...current, breakdown: event.target.value || null }))}>
            <option value="">{copy.noBreakdown}</option>{variables.filter(variable => variable.type === 'categorical' && variable.id !== indicator.id).map(variable => <option key={variable.id} value={variable.id}>{variable.labels[locale]}</option>)}
          </select></label>
          {indicator.type === 'numeric' && <label><span>{copy.threshold}</span><input type="number" value={query.threshold ?? ''} placeholder={locale === 'uk' ? 'необов’язково' : 'optional'} onChange={event => setQuery(current => ({ ...current, threshold: event.target.value === '' ? null : Number(event.target.value) }))} /></label>}
        </div>
        <div className="filters"><div className="filters-heading"><h2>{copy.filters}</h2><button type="button" onClick={addFilter} disabled={query.filters.length >= MAX_FILTERS}>{query.filters.length >= MAX_FILTERS ? copy.filterLimit : `+ ${copy.addFilter}`}</button></div>
          {query.filters.map((filter, index) => <FilterEditor key={`${index}-${filter.id}`} filter={filter} index={index} variables={variables} dataset={readyPayload.dataset} locale={locale} onChange={updateFilter} onRemove={removeIndex => setQuery(current => ({ ...current, filters: current.filters.filter((_, index) => index !== removeIndex) }))} />)}
        </div>
        <div className="query-actions"><button type="button" onClick={copyLink}>{copied ? copy.copied : copy.copyLink}</button><button type="button" onClick={downloadCsv}>{copy.downloadCsv}</button></div>
      </section>
      <ExplorerResult result={result} dataset={readyPayload.dataset} variables={variables} query={{ ...query, indicator: indicator.id }} definition={indicator} locale={locale} />
    </>}
  </div>;
}
