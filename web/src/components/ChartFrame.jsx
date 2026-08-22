import { t } from '../i18n/strings.js';

export default function ChartFrame({ locale, ariaLabel, children, table, className = '' }) {
  const copy = t(locale);
  return <figure className={`chart-frame ${className}`}>
    <div className="chart-visual" role="img" aria-label={ariaLabel}>{children}</div>
    <details className="chart-table"><summary>{copy.exactTable}</summary>{table}</details>
    <figcaption>{copy.chartBy} {copy.source}: SESH 2023/24, {copy.retrieved}<br />{copy.dataCode}</figcaption>
  </figure>;
}
