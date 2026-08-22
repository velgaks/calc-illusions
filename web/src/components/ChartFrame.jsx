import { t } from '../i18n/strings.js';

function QuestionnaireContext({ locale, definitions }) {
  const entries = [];
  for (const definition of definitions || []) {
    if (!definition?.question_original_uk) continue;
    let entry = entries.find(item => item.question === definition.question_original_uk && item.mode === definition.question_mode);
    if (!entry) {
      entry = { question: definition.question_original_uk, mode: definition.question_mode, labels: [], sources: [], derivations: [] };
      entries.push(entry);
    }
    entry.labels.push(definition.labels[locale]);
    if (definition.source && !entry.sources.includes(definition.source)) entry.sources.push(definition.source);
    if (definition.derivation?.[locale] && !entry.derivations.includes(definition.derivation[locale])) entry.derivations.push(definition.derivation[locale]);
  }
  if (!entries.length) return null;
  const uk = locale === 'uk';
  return <aside className="question-wording" aria-label={uk ? 'Формулювання анкети' : 'Questionnaire wording'}>
    <p>{uk ? 'Що було в анкеті' : 'What the questionnaire asked'}</p>
    <dl>{entries.map(entry => <div key={`${entry.mode}-${entry.question}`}>
      <dt>{entry.labels.join(' / ')} <code>{entry.sources.join(', ')}</code></dt>
      <dd>
        <span className="question-mode">{entry.mode === 'recorded' ? (uk ? 'Службове поле, окремого питання не ставили' : 'Recorded field, not a separate respondent question') : (uk ? 'Оригінальне формулювання' : 'Original Ukrainian wording')}</span>
        {entry.mode === 'recorded' ? <span lang="uk">{entry.question}</span> : <q lang="uk">{entry.question}</q>}
        {entry.derivations.map(note => <span className="question-derivation" key={note}>{note}</span>)}
      </dd>
    </div>)}</dl>
  </aside>;
}

export default function ChartFrame({ locale, ariaLabel, children, table, definitions = [], className = '' }) {
  const copy = t(locale);
  return <figure className={`chart-frame ${className}`}>
    <QuestionnaireContext locale={locale} definitions={definitions} />
    <div className="chart-visual" role="img" aria-label={ariaLabel}>{children}</div>
    <details className="chart-table"><summary>{copy.exactTable}</summary>{table}</details>
    <figcaption>{copy.source}: SESH 2023/24, {copy.retrieved}</figcaption>
  </figure>;
}
