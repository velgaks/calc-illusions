import { Link } from 'react-router-dom';
import ThemeTabs from '../components/ThemeTabs.jsx';
import { t } from '../i18n/strings.js';

const fmt = (locale, options = {}) => new Intl.NumberFormat(locale === 'uk' ? 'uk-UA' : 'en-US', options);

export default function OverviewPage({ overview, metadata, locale }) {
  const copy = t(locale);
  const number = fmt(locale, { maximumFractionDigits: 0 });
  const decimal = fmt(locale, { maximumFractionDigits: 1 });

  return <div className="page overview-page">
    <section className="hero">
      <p className="eyebrow">SESH · {copy.fieldwork}</p>
      <h1>{copy.title}</h1>
      <p className="dek">{copy.heroDek}</p>
      <div className="hero-stats">
        <div><strong>{decimal.format(overview.totals.people / 1e6)} {locale === 'uk' ? 'млн' : 'm'}</strong><span>{copy.populationEstimate}</span></div>
        <div><strong>{number.format(overview.totals.people_n)}</strong><span>{copy.interviewedPeople}</span></div>
        <div><strong>{number.format(overview.totals.households_n)}</strong><span>{copy.interviewedHouseholds}</span></div>
      </div>
      <p className="territory-note">{metadata.territory[locale]}</p>
      <Link className="primary-link" to={`/explore?lang=${locale}`}>{locale === 'uk' ? 'Поставити власне запитання' : 'Build your own query'} →</Link>
    </section>
    <ThemeTabs overview={overview} metadata={metadata} locale={locale} />
  </div>;
}
