import { uk } from '../i18n/uk.js';

const AGE_MIN = 18;
const AGE_MAX = 80;
const HEIGHT_MIN = 140;
const HEIGHT_MAX = 210;

export default function Controls({ state, onChange }) {
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
        <div className="dual-range">
          <input
            type="range"
            min={AGE_MIN} max={AGE_MAX}
            value={state.ageMin}
            onChange={e => {
              const v = parseInt(e.target.value, 10);
              onChange({ ageMin: Math.min(v, state.ageMax) });
            }}
            aria-label={`${uk.controls.ageFrom}`}
          />
          <input
            type="range"
            min={AGE_MIN} max={AGE_MAX}
            value={state.ageMax}
            onChange={e => {
              const v = parseInt(e.target.value, 10);
              onChange({ ageMax: Math.max(v, state.ageMin) });
            }}
            aria-label={`${uk.controls.ageTo}`}
          />
        </div>
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

      {/* Income */}
      <fieldset className="control-group">
        <legend>
          {uk.controls.incomeMin}
          <span className="legend-val">
            {state.incomeMin == null ? uk.controls.incomeDisable : state.incomeMin.toLocaleString('uk-UA')}
          </span>
        </legend>
        <div className="optional-range income">
          <input
            type="number"
            min="0"
            step="500"
            value={state.incomeMin ?? ''}
            placeholder="не важливо"
            onChange={e => {
              const v = e.target.value === '' ? null : Math.max(0, parseInt(e.target.value, 10) || 0);
              onChange({ incomeMin: v });
            }}
          />
          <span className="suffix">грн/міс</span>
        </div>
      </fieldset>

      {/* Education */}
      <fieldset className="control-group">
        <legend>{uk.controls.educationMin}</legend>
        <select
          value={state.educationMin ?? ''}
          onChange={e => {
            const v = e.target.value === '' ? null : parseInt(e.target.value, 10);
            onChange({ educationMin: v });
          }}
        >
          {uk.controls.educationLevels.map((label, i) => (
            <option key={i} value={i === 0 ? '' : i}>{label}</option>
          ))}
        </select>
      </fieldset>

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
