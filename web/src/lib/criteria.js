// criteria.js — побудова списку активних ESS-критеріїв і перевірка
// respondent → satisfies-all. Спільне ядро для calculator, bootstrap, decomposition.

// Бакети освіти → набір валідних eisced-кодів.
const EDU_BUCKET_SETS = {
  basic:      new Set([1, 2, 3]),
  vocational: new Set([4]),
  higher:     new Set([5, 6, 7])
};

// state → плаский об'єкт з ключами тільки для АКТИВНИХ критеріїв.
// Це дозволяє декомпозиції тривіально робити leave-one-out через `delete`.
export function buildCriteria(state) {
  const c = {};
  if (state.education && EDU_BUCKET_SETS[state.education]) {
    c.eiscedSet = EDU_BUCKET_SETS[state.education];
  }
  if (state.incomeDecileMin != null) c.hinctnta = state.incomeDecileMin;
  if (state.heightMin != null) c.heightMin = state.heightMin;
  if (state.flags.smokesNo)     c.smokes = 0;
  if (state.flags.moderateAlc)  c.alcMax = 1;
  if (state.flags.noKidsHome)   c.kidsHome = 0;
  if (state.flags.notMarried)   c.marsts = 0;   // ІНВЕРСІЯ: 0 = не у шлюбі/партнерстві

  // Tri-state filters
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
  if (c.eiscedSet != null && (r.eisced == null || !c.eiscedSet.has(r.eisced))) return false;
  if (c.hinctnta != null && (r.hinctnta == null || r.hinctnta < c.hinctnta)) return false;
  if (c.heightMin != null && (r.height == null || r.height < c.heightMin)) return false;
  if (c.smokes != null && r.smokes !== c.smokes) return false;
  if (c.alcMax != null && (r.alc == null || r.alc > c.alcMax)) return false;
  if (c.kidsHome != null && r.kidsHome !== c.kidsHome) return false;
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
    case 'eiscedSet': {
      const m = { basic: 'базова', vocational: 'профтех', higher: 'вища' };
      return `Освіта: ${m[state.education] ?? state.education}`;
    }
    case 'hinctnta':
      return `Дохід ≥ ${state.incomeDecileMin}-го децилю`;
    case 'heightMin':
      return `Зріст ≥ ${state.heightMin} см`;
    case 'smokes':
      return 'Не курить';
    case 'alcMax':
      return 'Помірно алкоголь';
    case 'kidsHome':
      return 'Немає своїх дітей <18 вдома';
    case 'marsts':
      return 'Не у шлюбі або партнерстві';
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
