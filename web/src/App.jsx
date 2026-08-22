import { useEffect, useState } from 'react';
import { Link, NavLink, Route, Routes } from 'react-router-dom';
import { loadOverview } from './data/loader.js';
import { t } from './i18n/strings.js';
import ExplorerPage from './pages/ExplorerPage.jsx';
import MethodologyPage from './pages/MethodologyPage.jsx';
import OverviewPage from './pages/OverviewPage.jsx';

export default function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [locale, setLocale] = useState(() => window.location.hash.includes('lang=en') || window.location.search.includes('lang=en') ? 'en' : 'uk');
  const copy = t(locale);

  useEffect(() => { loadOverview().then(setData).catch(error => setError(error.message)); }, []);
  useEffect(() => { document.documentElement.lang = locale; document.title = locale === 'uk' ? 'Україна у даних: доходи та умови життя українців' : 'Ukraine in Data: Income and Living Conditions'; }, [locale]);

  const withLocale = path => locale === 'en' ? `${path}?lang=en` : path;
  return <div className="app">
    <header className="site-header">
      <Link to={withLocale('/')} className="wordmark"><span className="flag-mark" aria-hidden="true" />{copy.title}</Link>
      <nav aria-label={locale === 'uk' ? 'Головна навігація' : 'Main navigation'}>
        <NavLink to={withLocale('/')} end>{copy.navOverview}</NavLink>
        <NavLink to={withLocale('/explore')}>{copy.navExplorer}</NavLink>
        <NavLink to={withLocale('/methodology')}>{copy.navMethodology}</NavLink>
      </nav>
      <button type="button" className="locale-button" onClick={() => setLocale(current => current === 'uk' ? 'en' : 'uk')} aria-label={copy.localeAction}>{locale === 'uk' ? 'EN' : 'УКР'}</button>
    </header>
    <main>
      {error && <div className="error-box"><h2>{locale === 'uk' ? 'Не вдалося завантажити дані' : 'Could not load data'}</h2><p>{error}</p></div>}
      {!data && !error && <p className="loading">{locale === 'uk' ? 'Завантажуємо SESH…' : 'Loading SESH…'}</p>}
      {data && <Routes>
        <Route path="/" element={<OverviewPage {...data} locale={locale} />} />
        <Route path="/explore" element={<ExplorerPage locale={locale} onLocaleChange={setLocale} />} />
        <Route path="/methodology" element={<MethodologyPage metadata={data.metadata} locale={locale} />} />
      </Routes>}
    </main>
    <footer><span>{copy.authorCredit}</span><span>SESH 2023/24 · {copy.dataLicense}</span><span>{copy.codeLicense} · github.com/velgaks/ukraine-in-data</span></footer>
  </div>;
}
