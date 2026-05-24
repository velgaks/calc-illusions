// describeState.js — людино-читабельний опис активних фільтрів.
//
// Використовується в Result як підпис «Чоловік 25–35, у шлюбі, з вищою освітою».
// Прикметники з ґендерним закінченням (sporty, religious, lng) залежать від state.sex.

const M = 'm', F = 'f';

// Базові частини (стать + вік) присутні завжди.
function base(state) {
  const sex = state.sex === 'M' ? 'Чоловік' : 'Жінка';
  return [sex, `${state.ageMin}–${state.ageMax} років`];
}

// Прикметник з вибором за статтю.
function adj(state, masc, fem) {
  return state.sex === 'M' ? masc : fem;
}

const EDU = {
  basic:      'школа',
  vocational: 'профтех / коледж',
  higher:     'вища освіта (бак+)'
};

export function describeState(state) {
  const parts = base(state);

  if (state.heightMin != null)        parts.push(`зріст від ${state.heightMin} см`);
  if (state.incomeDecileMin != null)  parts.push(`дохід від ${state.incomeDecileMin}-го децилю`);
  if (state.education && EDU[state.education]) parts.push(EDU[state.education]);

  if (state.flags?.notMarried)        parts.push('не у шлюбі');
  if (state.flags?.smokesNo)          parts.push('не курить');
  if (state.flags?.moderateAlc)       parts.push('пʼє помірно');
  if (state.flags?.noKidsHome)        parts.push('без своїх дітей вдома');

  if (state.politics === 'left')      parts.push('лівих поглядів');
  if (state.politics === 'right')     parts.push('правих поглядів');

  if (state.sporty === 'yes')         parts.push(adj(state, 'спортивний', 'спортивна'));
  if (state.sporty === 'no')          parts.push(adj(state, 'неспортивний', 'неспортивна'));

  if (state.religious === 'yes')      parts.push(adj(state, 'релігійний', 'релігійна'));
  if (state.religious === 'no')       parts.push(adj(state, 'не релігійний', 'не релігійна'));

  if (state.language === 'ukr')       parts.push(adj(state, 'україномовний', 'україномовна'));
  if (state.language === 'rus')       parts.push(adj(state, 'російськомовний', 'російськомовна'));
  if (state.language === 'other')     parts.push(adj(state, 'іншомовний', 'іншомовна'));

  return parts.join(', ');
}

// Чи активний бодай один фільтр поза статтю/віком (дублікат з Result, експорт для зручності)
export function hasActiveFilters(state) {
  if (state.heightMin != null) return true;
  if (state.incomeDecileMin != null) return true;
  if (state.education != null) return true;
  if (state.politics != null) return true;
  if (state.sporty != null) return true;
  if (state.religious != null) return true;
  if (state.language != null) return true;
  for (const v of Object.values(state.flags ?? {})) if (v) return true;
  return false;
}
