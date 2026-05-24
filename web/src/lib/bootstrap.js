// bootstrap.js — CI для joint-частки через bootstrap.
//
// СТРАТЕГІЯ: uniform resample індексів з заміщенням, weighted statistic.
// Це стандартний bootstrap для weighted estimator (не "weighted resample",
// який дав би зміщену оцінку SE).
//
// ОБМЕЖЕННЯ: ігнорує survey design (страти, кластери). Дає SE нижче
// за істинну. Точне CI — через `survey::svymean` у R-stage.

import { satisfiesAll } from './criteria.js';

// Mulberry32 — детермінований PRNG. Дозволяє reproducible CI в dev.
function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function bootstrapShareCi(window, criteria, options = {}) {
  const { nResamples = 500, ciLevel = 0.95, seed = 42 } = options;
  const N = window.length;
  if (N === 0) return { low: 0, high: 0, point: 0 };

  const rnd = seed != null ? mulberry32(seed) : Math.random;

  // Pre-compute: per-respondent (pspwght, matchesCriteria).
  // Це дозволяє переписати inner loop без виклику satisfiesAll на кожному resample.
  const w = new Float64Array(N);
  const m = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    w[i] = window[i].pspwght;
    m[i] = satisfiesAll(window[i], criteria) ? 1 : 0;
  }

  const shares = new Float64Array(nResamples);
  for (let b = 0; b < nResamples; b++) {
    let denom = 0;
    let numer = 0;
    for (let j = 0; j < N; j++) {
      const idx = Math.floor(rnd() * N);
      const wi = w[idx];
      denom += wi;
      if (m[idx]) numer += wi;
    }
    shares[b] = denom > 0 ? numer / denom : 0;
  }

  // Сортуємо для quantile.
  const sorted = Array.from(shares).sort((a, b) => a - b);
  const alpha = (1 - ciLevel) / 2;
  const iLo = Math.max(0, Math.floor(alpha * sorted.length));
  const iHi = Math.min(sorted.length - 1, Math.floor((1 - alpha) * sorted.length));

  // Точкова — медіана bootstrap-розподілу (стабільніше за повторений виклик calc)
  const iMid = Math.floor(sorted.length / 2);

  return { low: sorted[iLo], high: sorted[iHi], point: sorted[iMid] };
}
