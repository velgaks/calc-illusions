import { Routes, Route, Link, NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import HomePage from './pages/HomePage.jsx';
import MethodologyPage from './pages/MethodologyPage.jsx';
import MockBanner from './components/MockBanner.jsx';
import { loadAllData, getMockLevel } from './data/loader.js';
import { uk } from './i18n/uk.js';

export default function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAllData()
      .then(setData)
      .catch(e => {
        console.error(e);
        setError(e.message);
      });
  }, []);

  if (error) {
    return (
      <div className="app">
        <main>
          <div className="error-box">
            <h2>Не вдалося завантажити дані</h2>
            <p><code>{error}</code></p>
            <p>Перевір, чи існують файли у <code>public/data/</code>. Запусти <code>node scripts/generate-mock-data.mjs</code> з кореня репо.</p>
          </div>
        </main>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="app">
        <main>
          <p style={{ opacity: 0.6 }}>Завантаження...</p>
        </main>
      </div>
    );
  }

  const mockLevel = getMockLevel(data);
  return (
    <div className="app">
      {mockLevel && <MockBanner level={mockLevel} />}
      <header className="app-header">
        <Link to="/" className="logo">
          <span className="logo-mark">∑</span>
          <span className="logo-text">{uk.appName}</span>
        </Link>
        <nav className="app-nav">
          <NavLink to="/" end>{uk.nav.home}</NavLink>
          <NavLink to="/methodology">{uk.nav.methodology}</NavLink>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<HomePage data={data} />} />
          <Route path="/methodology" element={<MethodologyPage data={data} />} />
        </Routes>
      </main>
      <footer className="app-footer">
        <small>
          Дані: <a href="https://www.europeansocialsurvey.org/" target="_blank" rel="noreferrer">ESS</a> ·{' '}
          <a href="https://www.demography.org.ua/" target="_blank" rel="noreferrer">Інст. демографії</a>
          {' · '}Код: MIT
        </small>
      </footer>
    </div>
  );
}
