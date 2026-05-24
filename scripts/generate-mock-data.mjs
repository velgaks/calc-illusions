// scripts/generate-mock-data.mjs
//
// Генерує детермінований mock для public/data/.
// Запуск: `node scripts/generate-mock-data.mjs` з кореня репо.
//
// Mock замінюється на справжні дані через `Rscript prep/build.R`.
// Усі файли мають top-level "mock": true і явні TODO у external.json.

import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT = join(ROOT, 'public', 'data');
mkdirSync(OUT, { recursive: true });

const SEED = 42;

// ---- Seeded PRNG (Mulberry32) ----------------------------------------------
function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(SEED);
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const round = (x, d = 4) => Math.round(x * 10 ** d) / 10 ** d;
function gaussian(mu, sigma) {
  const u = Math.max(rnd(), 1e-12), v = rnd();
  return mu + sigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
const pick = arr => arr[Math.floor(rnd() * arr.length)];

// ---- 500 синтетичних респондентів з реалістичними кореляціями --------------
// 500 ≈ типовий розмір ESS UA window після фільтрації за статтю+віком,
// дозволяє побачити реалістичні відсотки і ширину CI на dev.
// Реальні дані (~1500–2000) — через `Rscript prep/build.R`.
const N_MOCK = 500;
const respondents = [];
for (let i = 0; i < N_MOCK; i++) {
  const gndr = i < N_MOCK / 2 ? 1 : 2;                    // 1=чол, 2=жін
  const agea = clamp(Math.round(gaussian(45, 17)), 18, 80);

  // Освіта: молодші частіше з вищою (cohort effect, ↑ із зменшенням віку)
  const eisced = clamp(Math.round(gaussian(4 + (50 - agea) * 0.02, 1.5)), 1, 7);

  // Дохідний дециль: позитивна кореляція з eisced (Spearman ~0.4)
  const hinctnta = clamp(Math.round(eisced + gaussian(1, 2)), 1, 10);

  // Шлюб: ймовірність росте з віком, плато ~85%
  const married_p = clamp(0.02 * agea + 0.1, 0.05, 0.85);
  const marsts = rnd() < married_p ? 1 : 0;

  // Діти у домогосподарстві: пік 30-45
  const child_p = agea < 25 ? 0.08 : agea < 50 ? 0.5 : 0.12;
  const chldhm = rnd() < child_p ? 1 : 0;

  // Куріння: чоловіки частіше, освічені рідше
  const smoke_base = gndr === 1 ? 0.35 : 0.18;
  const smoke_p = clamp(smoke_base - (eisced - 4) * 0.04, 0.05, 0.6);
  const smokes = rnd() < smoke_p ? 1 : 0;

  // Алкоголь: 0=ніколи, 1=рідко, 2=часто (скошено)
  const alc = pick([0, 1, 1, 1, 2, 2]);

  // Релігійність 0-10: позитивно з віком, негативно з освітою
  const rlgdgr = clamp(
    Math.round(gaussian(4.5 + (agea - 45) * 0.05 - (eisced - 4) * 0.3, 2.5)),
    0, 10
  );

  // Політика 0-10 (left-right): позитивно з релігійністю (right-shift), плюс шум
  const lrscale = clamp(
    Math.round(gaussian(4.8 + (rlgdgr - 5) * 0.25 + (agea - 45) * 0.01, 2.3)),
    0, 10
  );

  // Спорт 0-7 днів: негативно з віком, позитивно з освітою
  const sport_mu = Math.max(0.3, 3.5 - (agea - 25) * 0.04 + (eisced - 4) * 0.2);
  const dosprt = clamp(Math.round(gaussian(sport_mu, 1.5)), 0, 7);

  // Мова вдома: 60% укр, 30% рос, 10% інша — наближення UA-2026
  const lang_p = rnd();
  const lnghom1 = lang_p < 0.6 ? 'ukr' : lang_p < 0.9 ? 'rus' : 'other';

  // Зріст / вага — синтетика для dev. Реальні з ESS R11 height/weighta.
  const heightMu = gndr === 1 ? 178 + (50 - agea) * 0.04 : 164 + (50 - agea) * 0.04;
  const height = clamp(Math.round(gaussian(heightMu, gndr === 1 ? 7 : 6.3)), 140, 200);
  const weightMu = gndr === 1 ? 80 : 65;
  const weight = clamp(Math.round(gaussian(weightMu, 12)), 40, 130);

  // pspwght: близько 1, обрізаний від екстремумів
  const pspwght = clamp(gaussian(1.0, 0.3), 0.2, 2.5);

  respondents.push({
    id: i + 1,
    gndr, agea, eisced, hinctnta, marsts, chldhm, smokes, alc,
    rlgdgr, lrscale, dosprt, lnghom1, height, weight,
    pspwght: round(pspwght)
  });
}

// ---- Synthetic precomputed SE (для UI development) -------------------------
const precomputed_se = {};
for (const sex of [1, 2]) {
  for (const [lo, hi] of [[18, 24], [25, 34], [35, 44], [45, 54], [55, 64], [65, 100]]) {
    const key = `${sex === 1 ? 'M' : 'F'}_${lo}_${hi}`;
    const group = respondents.filter(r => r.gndr === sex && r.agea >= lo && r.agea <= hi);
    const wsum = group.reduce((a, r) => a + r.pspwght, 0);
    const w2sum = group.reduce((a, r) => a + r.pspwght ** 2, 0);
    precomputed_se[key] = {
      n: group.length,
      n_eff: w2sum > 0 ? round(wsum * wsum / w2sum, 1) : 0,
      pspwght_sum: round(wsum)
    };
  }
}

const respondentsPayload = {
  mock: true,
  source: 'Synthetic seed-42, NOT real ESS. Replace via `Rscript prep/build.R`.',
  wave: 'mock',
  n: respondents.length,
  weight_var: 'pspwght',
  generated_at: new Date().toISOString(),
  precomputed_se,
  respondents
};

writeFileSync(
  join(OUT, 'respondents.json'),
  JSON.stringify(respondentsPayload),
  'utf8'
);
console.log(`✓ respondents.json (${respondents.length} рядків)`);

// ---- external.json — параметри поза ESS ------------------------------------
// УСЕ З TODO. Реальні числа заповнює людина з першоджерел перед prod-збіркою.
const external = {
  mock: true,
  _note: 'Усі числа нижче — placeholder для розробки UI. Заміни вручну з першоджерел перед prod.',

  // NCD-RisC: μ, σ зросту в см, 5-річні когорти народження.
  // Placeholder базується на загальних оцінках для Європи; НЕ використовувати для prod.
  height: {
    _source_TODO: 'ncdrisc.org → latest Lancet adult-height paper, Ukraine cohorts',
    male: [
      { birth_year_min: 1940, birth_year_max: 1949, mu_cm: 173.0, sigma_cm: 7.1 },
      { birth_year_min: 1950, birth_year_max: 1959, mu_cm: 174.5, sigma_cm: 7.0 },
      { birth_year_min: 1960, birth_year_max: 1969, mu_cm: 175.5, sigma_cm: 7.0 },
      { birth_year_min: 1970, birth_year_max: 1979, mu_cm: 176.5, sigma_cm: 6.9 },
      { birth_year_min: 1980, birth_year_max: 1989, mu_cm: 177.3, sigma_cm: 6.9 },
      { birth_year_min: 1990, birth_year_max: 1999, mu_cm: 178.0, sigma_cm: 6.8 },
      { birth_year_min: 2000, birth_year_max: 2009, mu_cm: 178.4, sigma_cm: 6.8 }
    ],
    female: [
      { birth_year_min: 1940, birth_year_max: 1949, mu_cm: 160.5, sigma_cm: 6.4 },
      { birth_year_min: 1950, birth_year_max: 1959, mu_cm: 161.3, sigma_cm: 6.3 },
      { birth_year_min: 1960, birth_year_max: 1969, mu_cm: 162.0, sigma_cm: 6.3 },
      { birth_year_min: 1970, birth_year_max: 1979, mu_cm: 163.2, sigma_cm: 6.3 },
      { birth_year_min: 1980, birth_year_max: 1989, mu_cm: 164.4, sigma_cm: 6.2 },
      { birth_year_min: 1990, birth_year_max: 1999, mu_cm: 165.3, sigma_cm: 6.2 },
      { birth_year_min: 2000, birth_year_max: 2009, mu_cm: 165.8, sigma_cm: 6.2 }
    ]
  },

  // Інститут демографії: статево-вікова чисельність, target ≈ 30.5 млн.
  // Placeholder спрощений: 5-річні групи, схожа на загальні пропорції UA.
  cohorts: {
    _source_TODO: 'demography.org.ua → найсвіжіша оцінка для підконтрольної території',
    _target_total: 30500000,
    male: [
      { age_min: 18, age_max: 24, population: 720000 },
      { age_min: 25, age_max: 34, population: 1700000 },
      { age_min: 35, age_max: 44, population: 1900000 },
      { age_min: 45, age_max: 54, population: 1750000 },
      { age_min: 55, age_max: 64, population: 1600000 },
      { age_min: 65, age_max: 100, population: 1450000 }
    ],
    female: [
      { age_min: 18, age_max: 24, population: 700000 },
      { age_min: 25, age_max: 34, population: 1700000 },
      { age_min: 35, age_max: 44, population: 2050000 },
      { age_min: 45, age_max: 54, population: 2050000 },
      { age_min: 55, age_max: 64, population: 2100000 },
      { age_min: 65, age_max: 100, population: 2780000 }
    ]
  },

  // Держстат, ОУЖД: межі дохідних децилів у грн/міс.
  // Placeholder базується на загальних оцінках 2023–2024; НЕ для prod.
  // ВАЖЛИВО: per capita чи household — фіксувати окремо.
  income_deciles: {
    _source_TODO: 'ukrstat.gov.ua → ОУЖД, остання публічна таблиця',
    _unit: 'UAH/month per person (TODO: підтвердити одиницю при заповненні)',
    _year: 2023,
    bounds_uah: [
      // верхня межа кожного децилю; деци 10 = +∞
      4200, 5800, 7200, 8800, 10500, 12500, 15000, 18500, 25000, null
    ]
  }
};

writeFileSync(
  join(OUT, 'external.json'),
  JSON.stringify(external, null, 2),
  'utf8'
);
console.log('✓ external.json (mock з TODO)');

// ---- methodology.json — метадані для UI ------------------------------------
const methodology = {
  mock: true,
  generated_at: new Date().toISOString(),
  ess: {
    source: 'Synthetic mock — НЕ ESS',
    url: 'https://www.europeansocialsurvey.org/',
    wave: 'mock',
    file: 'mock',
    n_respondents: respondents.length,
    weight_var: 'pspwght',
    fieldwork_year: null,
    variables_present: ['gndr', 'agea', 'eisced', 'hinctnta', 'marsts', 'chldhm', 'smokes', 'alc', 'pspwght'],
    variables_missing: [],
    updated_at: new Date().toISOString()
  },
  height: {
    source: 'NCD Risk Factor Collaboration (TODO заповнити)',
    url: 'https://ncdrisc.org/',
    publication_year: null,
    license: 'CC BY 4.0 (типово для NCD-RisC)'
  },
  cohorts: {
    source: 'Інститут демографії та досліджень якості життя ім. М.В. Птухи НАН України (TODO)',
    url: 'https://www.demography.org.ua/',
    estimate_date: null,
    territory: 'підконтрольна територія України'
  },
  income: {
    source: 'Держстат, Обстеження умов життя домогосподарств (ОУЖД) (TODO)',
    url: 'https://www.ukrstat.gov.ua/',
    year: 2023,
    unit: 'TODO підтвердити при заповненні: per capita чи на домогосподарство'
  }
};

writeFileSync(
  join(OUT, 'methodology.json'),
  JSON.stringify(methodology, null, 2),
  'utf8'
);
console.log('✓ methodology.json');

console.log(`\n🎉 Готово. Файли у ${OUT}`);
