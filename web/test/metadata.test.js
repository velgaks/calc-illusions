import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const metadataPath = new URL('../../public/data/metadata.json', import.meta.url);

test('every explorer variable carries source questionnaire wording', async () => {
  const metadata = JSON.parse(await readFile(metadataPath, 'utf8'));
  for (const unit of ['people', 'households']) {
    for (const variable of metadata.units[unit].variables) {
      assert.ok(variable.source, `${unit}.${variable.id} is missing its source field`);
      assert.ok(variable.question_original_uk, `${unit}.${variable.id} is missing questionnaire wording`);
      assert.match(variable.question_mode, /^(asked|recorded)$/);
    }
  }
});

test('derived indicators retain both the original question and calculation note', async () => {
  const metadata = JSON.parse(await readFile(metadataPath, 'utf8'));
  const perCapita = metadata.units.households.variables.find(variable => variable.id === 'hh_income_per_capita');
  assert.match(perCapita.question_original_uk, /загальний дохід Вашого домогосподарства/i);
  assert.match(perCapita.derivation.uk, /V1 поділено/);

  const region = metadata.units.people.variables.find(variable => variable.id === 'region');
  assert.equal(region.question_mode, 'recorded');
});
