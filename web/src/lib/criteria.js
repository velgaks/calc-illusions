// criteria.js — побудова списку активних ESS-критеріїв і перевірка
// respondent → satisfies-all. Спільне ядро для calculator, bootstrap, decomposition.

// state → плаский об'єкт з ключами тільки для АКТИВНИХ критеріїв.
// Це дозволяє декомпозиції тривіально робити leave-one-out через `delete`.
export function buildCriteria(state, incomeDecileMin) {
  const c = {};
  if (state.educationMin != null) c.eisced = state.educationMin;
  if (incomeDecileMin != null) c.hinctnta = incomeDecileMin;
  if (state.flags.smokesNo) c.smokes = 0;
  if (state.flags.moderateAlc) c.alcMax = 1;     // 0=ніколи або 1=рідко
  if (state.flags.noKidsHome) c.chldhm = 0;
  if (state.flags.married) c.marsts = 1;

  // Tri-state filters (null = не важливо)
  if (state.politics === 'left')  c.lrscaleMax = 4;
  if (state.politics === 'right') c.lrscaleMin = 6;
  if (state.sporty === 'yes')     c.dosprtMin = 3;
  if (state.sporty === 'no')      c.dosprtMax = 2;
  if (state.religious === 'yes')  c.rlgdgrMin = 5;
  if (state.religious === 'no')   c.rlgdgrMax = 4;
  if (state.language)             c.lnghom1 = state.language;

  return c;
}

// Дивись recode.R: невалідні/відмови → NA. Тут трактуємо NA як "не задовольняє"
// (consistent decision; фіксуємо в METHODOLOGY).
export function satisfiesAll(r, c) {
  if (c.eisced != null && (r.eisced == null || r.eisced < c.eisced)) return false;
  if (c.hinctnta != null && (r.hinctnta == null || r.hinctnta < c.hinctnta)) return false;
  if (c.smokes != null && r.smokes !== c.smokes) return false;
  if (c.alcMax != null && (r.alc == null || r.alc > c.alcMax)) return false;
  if (c.chldhm != null && r.chldhm !== c.chldhm) return false;
  if (c.marsts != null && r.marsts !== c.marsts) return false;

  if (c.lrscaleMin != null && (r.lrscale == null || r.lrscale < c.lrscaleMin)) return false;
  if (c.lrscaleMax != null && (r.lrscale == null || r.lrscale > c.lrscaleMax)) return false;
  if (c.dosprtMin != null && (r.dosprt == null || r.dosprt < c.dosprtMin)) return false;
  if (c.dosprtMax != null && (r.dosprt == null || r.dosprt > c.dosprtMax)) return false;
  if (c.rlgdgrMin != null && (r.rlgdgr == null || r.rlgdgr < c.rlgdgrMin)) return false;
  if (c.rlgdgrMax != null && (r.rlgdgr == null || r.rlgdgr > c.rlgdgrMax)) return false;
  if (c.lnghom1 != null && r.lnghom1 !== c.lnghom1) return false;

  return true;
}

// Людино-читабельна назва критерію для UI декомпозиції.
export function criterionLabel(key, state) {
  switch (key) {
    case 'eisced':
      return `Освіта ≥ ISCED ${state.educationMin}`;
    case 'hinctnta':
      return `Дохід ≥ ${(state.incomeMin ?? 0).toLocaleString('uk-UA')} грн/міс`;
    case 'smokes':
      return 'Не курить';
    case 'alcMax':
      return 'Помірно алкоголь';
    case 'chldhm':
      return 'Без дітей у домогосподарстві';
    case 'marsts':
      return 'У шлюбі або партнерстві';
    case 'lrscaleMax':
      return 'Політично лівий (0–4)';
    case 'lrscaleMin':
      return 'Політично правий (6–10)';
    case 'dosprtMin':
      return 'Спортивний (≥ 3 дні/тиждень)';
    case 'dosprtMax':
      return 'Неспортивний (≤ 2 дні/тиждень)';
    case 'rlgdgrMin':
      return 'Релігійний (≥ 5/10)';
    case 'rlgdgrMax':
      return 'Не релігійний (< 5/10)';
    case 'lnghom1': {
      const m = { ukr: 'українська', rus: 'російська', other: 'інша' };
      return `Мова вдома: ${m[state.language] ?? state.language}`;
    }
    default:
      return key;
  }
}
