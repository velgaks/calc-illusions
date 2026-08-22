const cache = new Map();

async function fetchJson(name) {
  if (cache.has(name)) return cache.get(name);
  const request = fetch(`${import.meta.env.BASE_URL}data/${name}.json`).then(response => {
    if (!response.ok) throw new Error(`${name}.json: HTTP ${response.status}`);
    return response.json();
  });
  cache.set(name, request);
  return request;
}

export function loadOverview() {
  return Promise.all([fetchJson('overview'), fetchJson('metadata')])
    .then(([overview, metadata]) => ({ overview, metadata }));
}

export function loadDataset(unit) {
  if (!['people', 'households'].includes(unit)) throw new Error(`Unknown unit: ${unit}`);
  return Promise.all([fetchJson(unit), fetchJson('metadata')])
    .then(([dataset, metadata]) => ({ dataset, metadata }));
}
