import { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Controls from '../components/Controls.jsx';
import Result from '../components/Result.jsx';
import Decomposition from '../components/Decomposition.jsx';
import { parseSearch, toSearch } from '../lib/urlState.js';
import { computeAll } from '../lib/calculator.js';
import { uk } from '../i18n/uk.js';

export default function HomePage({ data }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Стан читаємо з URL один раз при mount. Подальші зміни — через update().
  const [state, setState] = useState(() => parseSearch(location.search));

  // Якщо URL змінився ззовні (back/forward, paste), синхронізуємо стан.
  useEffect(() => {
    const fromUrl = parseSearch(location.search);
    if (toSearch(fromUrl) !== toSearch(state)) {
      setState(fromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const result = useMemo(() => computeAll(state, data), [state, data]);

  function update(patch) {
    const next = {
      ...state,
      ...patch,
      flags: patch.flags ? { ...state.flags, ...patch.flags } : state.flags
    };
    setState(next);
    navigate(
      { pathname: location.pathname, search: toSearch(next) },
      { replace: true }
    );
  }

  return (
    <section className="home">
      <header className="home-hero">
        <h1>{uk.appTagline}</h1>
        <p className="home-sub">
          Реальна частка з мікроданих ESS Ukraine (n = 2581, поле 2024) —
          а не множення окремих ймовірностей, яке вигадує неіснуючу унікальність.
        </p>
      </header>

      <div className="home-grid">
        <Controls state={state} onChange={update} data={data} />
        <Result result={result} data={data} state={state} />
      </div>

      <Decomposition result={result} state={state} data={data} />
    </section>
  );
}
