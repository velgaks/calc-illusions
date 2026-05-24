// calculator.js — головна функція computeAll: state + data → result.
//
// Алгоритм:
//   1. base cohort N з external.cohorts
//   2. uah → hinctnta дециль через external.income_deciles
//   3. joint share з ESS (зважено)
//   4. height factor (Φ((h−μ)/σ) per cohort, weighted)
//   5. shareFinal = joint × height
//   6. bootstrap CI на joint, проектуємо на shareFinal лінійно

import { buildCriteria, satisfiesAll } from './criteria.js';
import { computeHeightFactor } from './heightModel.js';
import { bootstrapShareCi } from './bootstrap.js';

const LOW_N_THRESHOLD = 30;

export function computeAll(state, data) {
  const { respondents, external } = data;
  const sexCode = state.sex === 'M' ? 1 : 2;

  // 1. Базова чисельність когорти за статтю і віковим вікном
  const nBase = sumCohortPopulation(state, external);

  // 2. Joint share з ESS (дохідний дециль уже у state, без перерахунку з UAH)
  const respList = respondents.respondents;
  const win = respList.filter(
    r => r.gndr === sexCode && r.agea >= state.ageMin && r.agea <= state.ageMax
  );
  const denom = win.reduce((a, r) => a + r.pspwght, 0);
  const criteria = buildCriteria(state);
  const matched = win.filter(r => satisfiesAll(r, criteria));
  const numer = matched.reduce((a, r) => a + r.pspwght, 0);
  const jointShare = denom > 0 ? numer / denom : 0;

  // 4. Height
  const heightFactor = computeHeightFactor(
    state.heightMin, state.sex, state.ageMin, state.ageMax, external
  );

  // 5. Підсумок
  const shareFinal = jointShare * heightFactor;
  const countFinal = shareFinal * nBase;

  // 6. Bootstrap CI на joint, проекція через лінійну композицію.
  // Спрощено: heightFactor вважаємо детермінованим.
  const bs = bootstrapShareCi(win, criteria);
  const ci = {
    low:  bs.low  * heightFactor,
    high: bs.high * heightFactor
  };
  const countCi = { low: ci.low * nBase, high: ci.high * nBase };

  // 7. Warnings
  let warning = null;
  if (win.length === 0) warning = 'zero_n';
  else if (win.length < LOW_N_THRESHOLD) warning = 'low_n';

  return {
    shareFinal,
    countFinal,
    ci,
    countCi,
    jointShare,
    heightFactor,
    nWindow: win.length,
    nMatch: matched.length,
    nBase,
    incomeDecileMin: state.incomeDecileMin,
    warning,
    isMock: Boolean(respondents.mock || external.mock)
  };
}

function sumCohortPopulation(state, external) {
  const sexKey = state.sex === 'M' ? 'male' : 'female';
  const buckets = external?.cohorts?.[sexKey];
  if (!Array.isArray(buckets)) return 0;
  let total = 0;
  for (const b of buckets) {
    const overlapMin = Math.max(state.ageMin, b.age_min);
    const overlapMax = Math.min(state.ageMax, b.age_max);
    if (overlapMax >= overlapMin) {
      const bucketYears = b.age_max - b.age_min + 1;
      const overlapYears = overlapMax - overlapMin + 1;
      // Лінійна пропорція — припускаємо рівномірний розподіл всередині 5-річного бакета
      total += b.population * (overlapYears / bucketYears);
    }
  }
  return total;
}
