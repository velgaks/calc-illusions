// ci.js (історично bootstrap.js) — CI для joint-частки.
//
// Аналітичний Wilson score interval, design-aware через effective sample size
// (формула Kish: n_eff = (Σw)² / Σw²). Це коректно враховує weight variance —
// без in-browser bootstrap, без «ігнорує survey design» каверату.
//
// Wilson score interval (Wilson 1927) краще за normal approximation для
// крайніх p (~0% або ~100%), бо ніколи не виходить за [0, 1].

import { satisfiesAll } from './criteria.js';

const Z_95 = 1.95996398454;  // 97.5 percentile of standard normal

// Effective sample size — Kish's formula.
// Для рівних ваг повертає n; для нерівних — менше (відображає реальну точність).
function effectiveSampleSize(window) {
  if (window.length === 0) return 0;
  let sumW = 0, sumW2 = 0;
  for (const r of window) {
    sumW  += r.pspwght;
    sumW2 += r.pspwght * r.pspwght;
  }
  if (sumW2 === 0) return 0;
  return (sumW * sumW) / sumW2;
}

// Wilson score interval. Стабільне CI навіть для p близького до 0 чи 1.
function wilsonInterval(p, n, z = Z_95) {
  if (n < 1) return { low: 0, high: 1, point: p };
  const denom = 1 + (z * z) / n;
  const center = (p + (z * z) / (2 * n)) / denom;
  const halfWidth = (z / denom) * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return {
    low:  Math.max(0, center - halfWidth),
    high: Math.min(1, center + halfWidth),
    point: p
  };
}

// Публічний API — той же сигнал що раніше bootstrapShareCi, але без bootstrap.
export function bootstrapShareCi(window, criteria) {
  if (window.length === 0) return { low: 0, high: 0, point: 0 };

  let wAll = 0, wMatch = 0;
  for (const r of window) {
    wAll += r.pspwght;
    if (satisfiesAll(r, criteria)) wMatch += r.pspwght;
  }
  const p = wAll > 0 ? wMatch / wAll : 0;
  const nEff = effectiveSampleSize(window);
  return wilsonInterval(p, nEff);
}
