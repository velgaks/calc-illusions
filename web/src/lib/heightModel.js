// heightModel.js — параметрична модель зросту з NCD-RisC.
// μ, σ беруться з external.height per (стать, когорта народження).

// Стандартна нормальна CDF — Abramowitz & Stegun 26.2.17.
// Похибка < 1.5e-7. Швидко, без залежностей.
export function phi(x) {
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;

  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x) / Math.SQRT2;
  const t = 1 / (1 + p * ax);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax);
  return 0.5 * (1 + sign * y);
}

export function probHeightAtLeast(hCm, muCm, sigmaCm) {
  if (sigmaCm <= 0) return hCm <= muCm ? 1 : 0;
  return 1 - phi((hCm - muCm) / sigmaCm);
}

// Зважене середнє ймовірності по когортах, що перекриваються з діапазоном
// народження користувача. Вагою служить кількість років перетину.
//
// Це наївна вага (роки замість справжньої чисельності когорти). Точніше
// було б використати external.cohorts.population. Для MVP — достатньо.
export function computeHeightFactor(hMinCm, sexCode, ageMin, ageMax, external, currentYear) {
  if (hMinCm == null) return 1;
  const sexKey = sexCode === 'M' ? 'male' : 'female';
  const cohorts = external?.height?.[sexKey];
  if (!cohorts || cohorts.length === 0) return 1;

  const year = currentYear ?? new Date().getFullYear();
  const birthYearMin = year - ageMax;
  const birthYearMax = year - ageMin;

  let totalWeight = 0;
  let weightedProb = 0;
  for (const c of cohorts) {
    const overlapMin = Math.max(birthYearMin, c.birth_year_min);
    const overlapMax = Math.min(birthYearMax, c.birth_year_max);
    if (overlapMax >= overlapMin) {
      const yearsOverlap = overlapMax - overlapMin + 1;
      const p = probHeightAtLeast(hMinCm, c.mu_cm, c.sigma_cm);
      weightedProb += yearsOverlap * p;
      totalWeight += yearsOverlap;
    }
  }
  return totalWeight > 0 ? weightedProb / totalWeight : 0;
}
