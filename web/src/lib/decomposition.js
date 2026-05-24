// decomposition.js — leave-one-out по активних критеріях.
//
// Для кожного активного критерію c обчислюємо joint-частку без c.
// Δ = shareWithout − shareWith. Top за Δ — критерії, що звужують найсильніше.
// Інтерпретація для UI: "якщо прибрати X, частка зросте до Y%".

import { buildCriteria, satisfiesAll, criterionLabel } from './criteria.js';

export function decompose(state, data) {
  const respList = data.respondents.respondents;
  const sexCode = state.sex === 'M' ? 1 : 2;
  const win = respList.filter(
    r => r.gndr === sexCode && r.agea >= state.ageMin && r.agea <= state.ageMax
  );
  const denom = win.reduce((a, r) => a + r.pspwght, 0);
  if (denom <= 0) return [];

  const full = buildCriteria(state);
  const keys = Object.keys(full);
  if (keys.length === 0) return [];

  const shareWith = sumWeighted(win, full) / denom;

  const out = [];
  for (const key of keys) {
    const reduced = { ...full };
    delete reduced[key];
    const shareWithout = sumWeighted(win, reduced) / denom;
    out.push({
      key,
      label: criterionLabel(key, state),
      shareWithout,
      shareWith,
      delta: shareWithout - shareWith
    });
  }
  out.sort((a, b) => b.delta - a.delta);
  return out;
}

function sumWeighted(window, criteria) {
  let s = 0;
  for (const r of window) if (satisfiesAll(r, criteria)) s += r.pspwght;
  return s;
}
