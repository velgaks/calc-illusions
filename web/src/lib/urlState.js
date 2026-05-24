// urlState.js — серіалізація стану калькулятора у querystring.
//
// Працює з HashRouter: react-router передасть нам уже розпарсений `search`
// (частина після `?` у `#/?…`). Тут тільки чисті функції parseSearch / toSearch.

export const DEFAULT_STATE = Object.freeze({
  sex: 'M',
  ageMin: 25,
  ageMax: 35,
  heightMin: null,
  incomeMin: null,
  educationMin: null,
  politics: null,    // null | 'left' | 'right'
  sporty: null,      // null | 'yes' | 'no'
  religious: null,   // null | 'yes' | 'no'
  language: null,    // null | 'ukr' | 'rus' | 'other'
  flags: Object.freeze({
    smokesNo: false,
    moderateAlc: false,
    noKidsHome: false,
    married: false
  })
});

const FLAG_CHARS = { smokesNo: 's', moderateAlc: 'a', noKidsHome: 'k', married: 'm' };
const LANG_VALUES = new Set(['ukr', 'rus', 'other']);

export function parseSearch(searchString) {
  if (!searchString || searchString === '?') return cloneDefault();
  const sp = new URLSearchParams(
    searchString.startsWith('?') ? searchString.slice(1) : searchString
  );

  const state = cloneDefault();

  const s = sp.get('s');
  if (s === 'M' || s === 'F') state.sex = s;

  const a = sp.get('a');
  if (a) {
    const m = a.match(/^(\d+)-(\d+)$/);
    if (m) {
      const lo = parseInt(m[1], 10);
      const hi = parseInt(m[2], 10);
      if (lo >= 18 && lo <= 100 && hi >= lo && hi <= 100) {
        state.ageMin = lo;
        state.ageMax = hi;
      }
    }
  }

  const h = parseIntInRange(sp.get('h'), 100, 250);
  if (h != null) state.heightMin = h;

  const i = parseIntInRange(sp.get('i'), 0, 10_000_000);
  if (i != null) state.incomeMin = i;

  const e = parseIntInRange(sp.get('e'), 1, 7);
  if (e != null) state.educationMin = e;

  const f = sp.get('f');
  if (f) {
    for (const [key, ch] of Object.entries(FLAG_CHARS)) {
      if (f.includes(ch)) state.flags[key] = true;
    }
  }

  const p = sp.get('p');
  if (p === 'l') state.politics = 'left';
  else if (p === 'r') state.politics = 'right';

  const spr = sp.get('sp');
  if (spr === '1') state.sporty = 'yes';
  else if (spr === '0') state.sporty = 'no';

  const rel = sp.get('rel');
  if (rel === '1') state.religious = 'yes';
  else if (rel === '0') state.religious = 'no';

  const lng = sp.get('lng');
  if (lng && LANG_VALUES.has(lng)) state.language = lng;

  return state;
}

export function toSearch(state) {
  const sp = new URLSearchParams();
  if (state.sex !== DEFAULT_STATE.sex) sp.set('s', state.sex);
  if (state.ageMin !== DEFAULT_STATE.ageMin || state.ageMax !== DEFAULT_STATE.ageMax) {
    sp.set('a', `${state.ageMin}-${state.ageMax}`);
  }
  if (state.heightMin != null) sp.set('h', String(state.heightMin));
  if (state.incomeMin != null) sp.set('i', String(state.incomeMin));
  if (state.educationMin != null) sp.set('e', String(state.educationMin));

  const flagChars = [];
  for (const [key, ch] of Object.entries(FLAG_CHARS)) {
    if (state.flags[key]) flagChars.push(ch);
  }
  if (flagChars.length) sp.set('f', flagChars.join(''));

  if (state.politics) sp.set('p', state.politics === 'left' ? 'l' : 'r');
  if (state.sporty) sp.set('sp', state.sporty === 'yes' ? '1' : '0');
  if (state.religious) sp.set('rel', state.religious === 'yes' ? '1' : '0');
  if (state.language) sp.set('lng', state.language);

  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

function cloneDefault() {
  return {
    ...DEFAULT_STATE,
    flags: { ...DEFAULT_STATE.flags }
  };
}

function parseIntInRange(s, lo, hi) {
  if (s == null) return null;
  const n = parseInt(s, 10);
  if (!Number.isFinite(n) || n < lo || n > hi) return null;
  return n;
}
