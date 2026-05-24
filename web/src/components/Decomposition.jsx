import { useMemo } from 'react';
import { decompose } from '../lib/decomposition.js';
import { uk } from '../i18n/uk.js';

const TOP_N = 5;

export default function Decomposition({ state, data }) {
  const items = useMemo(
    () => decompose(state, data),
    [state, data]
  );

  if (items.length === 0) return null;

  // Найбільша значуща дельта — для масштабування барів.
  const maxDelta = Math.max(...items.map(i => i.delta), 1e-9);

  return (
    <section className="decomposition">
      <h2 className="decomposition-title">{uk.result.decomposition}</h2>
      <p className="decomposition-hint">{uk.result.decompositionHint}</p>

      <ul className="decomposition-list">
        {items.slice(0, TOP_N).map(item => (
          <li key={item.key} className="decomposition-item">
            <div className="decomposition-bar-row">
              <div className="decomposition-label">{item.label}</div>
              <div className="decomposition-value">
                {formatPct(item.shareWithout)}{' '}
                <span className="muted">
                  (+{formatPctDelta(item.delta)})
                </span>
              </div>
            </div>
            <div className="decomposition-bar">
              <div
                className="decomposition-bar-fill"
                style={{ width: `${(item.delta / maxDelta) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function formatPct(s) {
  if (s >= 0.1) return (s * 100).toFixed(1) + '%';
  if (s >= 0.01) return (s * 100).toFixed(2) + '%';
  return (s * 100).toFixed(3) + '%';
}

function formatPctDelta(d) {
  if (d >= 0.01) return (d * 100).toFixed(1) + ' п.п.';
  if (d >= 0.001) return (d * 100).toFixed(2) + ' п.п.';
  return (d * 100).toFixed(3) + ' п.п.';
}
