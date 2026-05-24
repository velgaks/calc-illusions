import { uk } from '../i18n/uk.js';

const AGE_MIN = 18;
const AGE_MAX = 80;
const HEIGHT_MIN = 140;
const HEIGHT_MAX = 210;

export default function Controls({ state, onChange, data }) {
  return (
    <form className="controls" onSubmit={e => e.preventDefault()}>
      {/* Sex */}
      <fieldset className="control-group">
        <legend>{uk.controls.sex}</legend>
        <div className="radio-row">
          {['M', 'F'].map(opt => (
            <label key={opt} className={`radio ${state.sex === opt ? 'active' : ''}`}>
              <input
                type="radio"
                name="sex"
                value={opt}
                checked={state.sex === opt}
                onChange={() => onChange({ sex: opt })}
              />
              <span>{opt === 'M' ? uk.controls.male : uk.controls.female}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Age range */}
      <fieldset className="control-group">
        <legend>
          {uk.controls.ageRange}
          <span className="legend-val">{state.ageMin}–{state.ageMax}</span>
        </legend>
        <DualRange
          min={AGE_MIN} max={AGE_MAX}
          valueMin={state.ageMin}
          valueMax={state.ageMax}
          onChangeMin={v => onChange({ ageMin: Math.min(v, state.ageMax) })}
          onChangeMax={v => onChange({ ageMax: Math.max(v, state.ageMin) })}
          ariaLabelMin={uk.controls.ageFrom}
          ariaLabelMax={uk.controls.ageTo}
        />
      </fieldset>

      {/* Height */}
      <fieldset className="control-group">
        <legend>
          {uk.controls.heightMin}
          <span className="legend-val">
            {state.heightMin == null ? uk.controls.heightDisable : `≥ ${state.heightMin}`}
          </span>
        </legend>
        <div className="optional-range">
          <input
            type="range"
            min={HEIGHT_MIN} max={HEIGHT_MAX}
            value={state.heightMin ?? 170}
            disabled={state.heightMin == null}
            onChange={e => onChange({ heightMin: parseInt(e.target.value, 10) })}
          />
          <button
            type="button"
            className="toggle-mini"
            onClick={() => onChange({ heightMin: state.heightMin == null ? 175 : null })}
          >
            {state.heightMin == null ? 'увімкнути' : 'скинути'}
          </button>
        </div>
      </fieldset>

      {/* Income — ESS decile slider */}
      <fieldset className="control-group">
        <legend>
          {uk.controls.incomeDecile}
          <span className="legend-val">
            {state.incomeDecileMin == null
              ? uk.controls.incomeDecileDisable
              : `≥ ${state.incomeDecileMin}-й`}
          </span>
        </legend>
        <div className="optional-range">
          <input
            type="range"
            min="1" max="10" step="1"
            value={state.incomeDecileMin ?? 5}
            disabled={state.incomeDecileMin == null}
            onChange={e => onChange({ incomeDecileMin: parseInt(e.target.value, 10) })}
          />
          <button
            type="button"
            className="toggle-mini"
            onClick={() => onChange({
              incomeDecileMin: state.incomeDecileMin == null ? 5 : null
            })}
          >
            {state.incomeDecileMin == null ? 'увімкнути' : 'скинути'}
          </button>
        </div>
        {state.incomeDecileMin != null && data?.external?.income_deciles?.bounds_uah && (
          <p className="control-hint">
            {uk.controls.incomeDecileHint}
            <strong>
              {formatUah(decileLowerBoundUah(state.incomeDecileMin, data.external))}
            </strong>
            {' '}грн/міс на члена ДГ
          </p>
        )}
      </fieldset>

      {/* Education — 3 buckets */}
      <ChoiceGroup
        label={uk.controls.educationMin}
        value={state.education}
        options={[
          { value: null,         label: uk.controls.educationBuckets.any },
          { value: 'basic',      label: uk.controls.educationBuckets.basic },
          { value: 'vocational', label: uk.controls.educationBuckets.vocational },
          { value: 'higher',     label: uk.controls.educationBuckets.higher }
        ]}
        onChange={v => onChange({ education: v })}
      />

      {/* Flags */}
      <fieldset className="control-group">
        <legend>Інші критерії</legend>
        <div className="checks">
          {Object.entries(uk.controls.flags).map(([key, label]) => (
            <label key={key} className="check">
              <input
                type="checkbox"
                checked={state.flags[key]}
                onChange={e => onChange({
                  flags: { ...state.flags, [key]: e.target.checked }
                })}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Tri-state: спорт */}
      <ChoiceGroup
        label={uk.controls.choices.sportyLabel}
        value={state.sporty}
        options={[
          { value: null,  label: uk.controls.choices.any },
          { value: 'yes', label: uk.controls.choices.sportyYes },
          { value: 'no',  label: uk.controls.choices.sportyNo }
        ]}
        onChange={v => onChange({ sporty: v })}
      />

      {/* Tri-state: релігійність */}
      <ChoiceGroup
        label={uk.controls.choices.religiousLabel}
        value={state.religious}
        options={[
          { value: null,  label: uk.controls.choices.any },
          { value: 'yes', label: uk.controls.choices.religiousYes },
          { value: 'no',  label: uk.controls.choices.religiousNo }
        ]}
        onChange={v => onChange({ religious: v })}
      />

      {/* Tri-state: політика */}
      <ChoiceGroup
        label={uk.controls.choices.politicsLabel}
        value={state.politics}
        options={[
          { value: null,    label: uk.controls.choices.any },
          { value: 'left',  label: uk.controls.choices.politicsLeft },
          { value: 'right', label: uk.controls.choices.politicsRight }
        ]}
        onChange={v => onChange({ politics: v })}
      />

      {/* Multi-state: мова вдома */}
      <ChoiceGroup
        label={uk.controls.choices.languageLabel}
        value={state.language}
        options={[
          { value: null,    label: uk.controls.choices.any },
          { value: 'ukr',   label: uk.controls.choices.languageUkr },
          { value: 'rus',   label: uk.controls.choices.languageRus },
          { value: 'other', label: uk.controls.choices.languageOther }
        ]}
        onChange={v => onChange({ language: v })}
      />
    </form>
  );
}

// Нижня межа N-го децилю в грн = верхня межа (N-1)-го децилю.
// bounds_uah[i] = верхня межа децилю (i+1). Для децилю 1 нижня = 0.
function decileLowerBoundUah(decileN, external) {
  if (decileN <= 1) return 0;
  return external.income_deciles.bounds_uah[decileN - 2];
}
function formatUah(n) {
  if (n == null) return '—';
  if (n >= 1000) return Math.round(n / 100) / 10 + ' тис.';
  return String(n);
}

// Dual-range з підсвіченим інтервалом між ручками.
// Базовий <input type=range> не вміє «fill між значеннями», тому накладаємо
// абсолютно-позиціонований fill-div, а нативний track робимо прозорим.
function DualRange({ min, max, valueMin, valueMax, onChangeMin, onChangeMax, ariaLabelMin, ariaLabelMax }) {
  const span = max - min;
  const leftPct  = ((valueMin - min) / span) * 100;
  const rightPct = 100 - ((valueMax - min) / span) * 100;
  return (
    <div className="dual-range">
      <div className="dual-range-track" />
      <div className="dual-range-fill" style={{ left: `${leftPct}%`, right: `${rightPct}%` }} />
      <input
        type="range"
        min={min} max={max}
        value={valueMin}
        onChange={e => onChangeMin(parseInt(e.target.value, 10))}
        aria-label={ariaLabelMin}
      />
      <input
        type="range"
        min={min} max={max}
        value={valueMax}
        onChange={e => onChangeMax(parseInt(e.target.value, 10))}
        aria-label={ariaLabelMax}
      />
    </div>
  );
}

function ChoiceGroup({ label, value, options, onChange }) {
  return (
    <fieldset className="control-group">
      <legend>{label}</legend>
      <div className="choice-row">
        {options.map(opt => {
          const key = opt.value ?? '_any';
          const active = value === opt.value;
          return (
            <button
              key={key}
              type="button"
              className={`choice ${active ? 'active' : ''}`}
              onClick={() => onChange(opt.value)}
              aria-pressed={active}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
