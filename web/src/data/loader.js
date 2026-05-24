// loader.js — завантажує 3 JSON-и один раз, кешує в пам'яті.

let cache = null;
let pending = null;

export async function loadAllData() {
  if (cache) return cache;
  if (pending) return pending;

  const base = import.meta.env.BASE_URL;
  pending = Promise.all([
    fetchJson(`${base}data/respondents.json`),
    fetchJson(`${base}data/external.json`),
    fetchJson(`${base}data/methodology.json`)
  ]).then(([respondents, external, methodology]) => {
    cache = { respondents, external, methodology };
    pending = null;
    return cache;
  });
  return pending;
}

async function fetchJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  return r.json();
}

export function isMockData({ respondents, external, methodology }) {
  return Boolean(respondents?.mock || external?.mock || methodology?.mock);
}

// Деталізований стан моку для адаптивного банера.
//   'demo'    — все синтетичне (немає реальних даних взагалі)
//   'partial' — ESS реальні, але зовнішні множники (зріст / когорти / доходи) — плейсхолдер
//   null      — все реальне, банер не потрібен
export function getMockLevel({ respondents, external }) {
  if (respondents?.mock) return 'demo';
  if (external?.mock) return 'partial';
  return null;
}
