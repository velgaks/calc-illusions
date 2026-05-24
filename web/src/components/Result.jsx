import { useState } from 'react';
import { uk } from '../i18n/uk.js';
import SourceBadge from './SourceBadge.jsx';
import Pictogram from './Pictogram.jsx';
import { describeState, hasActiveFilters } from '../lib/describeState.js';

export default function Result({ result, data, state }) {
  const [showFormula, setShowFormula] = useState(false);
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (result.warning === 'zero_n') {
    return (
      <div className="result result-warn">
        <p>{uk.result.zeroN}</p>
      </div>
    );
  }

  if (!hasActiveFilters(state)) {
    return (
      <div className="result result-empty">
        <p className="result-empty-pretitle">{uk.result.emptyPretitle}</p>
        <div className="result-empty-base">
          ≈ <strong>{formatCount(result.nBase)}</strong>{' '}
          {state.sex === 'M' ? 'чоловіків' : 'жінок'}{' '}
          {state.ageMin}–{state.ageMax} років
        </div>
        <p className="result-empty-hint">{uk.result.emptyHint}</p>
        <SourceBadge data={data} />
      </div>
    );
  }

  return (
    <div className="result">
      <p className="result-summary">{describeState(state)}</p>

      <Pictogram share={result.shareFinal} ci={result.ci} />

      {result.nMatch === 0 && result.nWindow > 0 && (
        <p className="result-zero-note">
          У ESS-вибірці серед {result.nWindow} {state.sex === 'M' ? 'чоловіків' : 'жінок'}{' '}
          {state.ageMin}–{state.ageMax} років жоден не пройшов усі фільтри одночасно.
          Це <strong>не означає, що таких не існує</strong> — лише що вибірка надто мала,
          щоб їх ловити. Верхня межа CI ({formatShare(result.ci.high)}) — це чесна оцінка
          того, скільки їх <em>може</em> бути.
        </p>
      )}

      <div className="result-big">
        <div className="big-share">{formatShare(result.shareFinal)}</div>
        <div className="big-share-ci">
          {uk.result.ci}: {formatShare(result.ci.low)}–{formatShare(result.ci.high)}
        </div>
      </div>

      <div className="result-count">
        ≈ <strong>{formatCount(result.countFinal)}</strong> людей{' '}
        <span className="muted">{uk.result.ofTotal} {formatCount(result.nBase)}</span>
        <div className="count-ci">
          {uk.result.ci}: {formatCount(result.countCi.low)} – {formatCount(result.countCi.high)}
        </div>
      </div>

      <p className="result-suffix">{uk.result.suffix}</p>

      {result.warning === 'low_n' && (
        <p className="result-low-n">
          {uk.result.lowN.replace('{n}', String(result.nWindow))}
        </p>
      )}

      <button
        type="button"
        className="result-toggle"
        onClick={() => setShowFormula(s => !s)}
        aria-expanded={showFormula}
      >
        {showFormula ? '▾' : '▸'} {uk.result.formula}
      </button>

      {showFormula && (
        <div className="result-formula">
          <p className="formula-label">{uk.result.formulaLabel}:</p>
          <div className="formula-grid">
            <span>ESS joint share</span>
            <code>{formatShare(result.jointShare)}</code>
            <span>× зріст</span>
            <code>{formatShare(result.heightFactor)}</code>
            <span className="formula-eq">= підсумок</span>
            <code className="formula-eq"><strong>{formatShare(result.shareFinal)}</strong></code>
          </div>
          <p className="formula-meta">
            n у статево-віковому вікні ESS: <strong>{result.nWindow}</strong>,
            з них задовольняють критеріям: <strong>{result.nMatch}</strong>
          </p>
        </div>
      )}

      <div className="result-actions">
        <button type="button" onClick={copy} className="copy-btn">
          {copied ? uk.result.copied : uk.result.copy}
        </button>
      </div>

      <SourceBadge data={data} />
    </div>
  );
}

function formatShare(s) {
  if (s == null || !isFinite(s)) return '—';
  if (s >= 0.1) return (s * 100).toFixed(1) + '%';
  if (s >= 0.01) return (s * 100).toFixed(2) + '%';
  if (s >= 0.001) return (s * 100).toFixed(3) + '%';
  if (s === 0) return '0%';
  return (s * 100).toExponential(2) + '%';
}

function formatCount(n) {
  if (n == null || !isFinite(n)) return '—';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + ' млн';
  if (n >= 10_000) return Math.round(n / 1000).toLocaleString('uk-UA') + ' тис.';
  if (n >= 1000) return (n / 1000).toFixed(1) + ' тис.';
  return Math.round(n).toLocaleString('uk-UA');
}
