import { uk } from '../i18n/uk.js';

export default function MethodologyPage({ data }) {
  const { methodology } = data;

  return (
    <article className="methodology">
      <h1>Методологія</h1>

      <section>
        <h2>Що це</h2>
        <p>
          Оцінка частки людей на підконтрольній території України, які одночасно відповідають
          набору критеріїв. Принципова відмінність від поширених «калькуляторів унікальності» —
          ми не перемножуємо маргінальні частки (бо це припускає незалежність ознак, якої немає),
          а беремо joint-розподіл з мікроданих репрезентативного опитування.
        </p>
      </section>

      <section>
        <h2>Дані</h2>
        <h3>ESS — основне джерело joint-розподілу</h3>
        <SourceCard data={methodology.ess} />
        <h3>Зріст — NCD Risk Factor Collaboration</h3>
        <SourceCard data={methodology.height} />
        <h3>Чисельність когорт — Інститут демографії</h3>
        <SourceCard data={methodology.cohorts} />
        <h3>Дохідні децилі — Держстат</h3>
        <SourceCard data={methodology.income} />
      </section>

      <section>
        <h2>Надійність фільтрів</h2>
        <p>
          Не всі критерії однаково точні. Нижче — самоповідомлена оцінка для
          кожного фільтра: що в ESS прямий чесний показник, що з паростком сумніву,
          а що варто читати з посмішкою.
        </p>
        <ReliabilityTable />
      </section>

      <section>
        <h2>Алгоритм</h2>
        <pre className="formula">{`1. (стать, віковий діапазон) → N_base з cohorts
2. (дохід у грн) → дециль через income_deciles
3. ESS joint-частка:
     window = respondents[stать, вікове вікно]
     denom  = Σ pspwght[window]
     match  = window що задовольняють ESS-критерії
     numer  = Σ pspwght[match]
     joint  = numer / denom
4. P(зріст ≥ h) — Φ((h − μ) / σ) per cohort, weighted
5. Підсумок = joint × p_height
6. Bootstrap 500 ресемплів → CI 95%`}</pre>
      </section>

      <section>
        <h2>Обмеження</h2>
        <ul>
          <li>
            <strong>Підконтрольна територія ≠ міжнародно визнані кордони.</strong> Усі чисельні
            оцінки — наявне населення, де можливе фактичне дослідження.
          </li>
          <li>
            <strong>Bootstrap у браузері ігнорує survey design.</strong> Реальне CI ширше, ніж
            показане. Точніше CI — через <code>survey::svymean</code> у R-stage, опціональний
            показ як «design-adjusted».
          </li>
          <li>
            <strong>Зріст — Normal-модель.</strong> Не враховує селекційних ефектів.
          </li>
          <li>
            <strong>Дохід.</strong> ESS питає про домогосподарство, ОУЖД — на особу. Конверсія
            спірна, фіксуємо явно.
          </li>
        </ul>
      </section>

      <section>
        <h2>Що це НЕ</h2>
        <ul>
          <li>НЕ оцінка ймовірності існування конкретної людини.</li>
          <li>НЕ заміна перепису населення.</li>
          <li>НЕ комерційний або політичний інструмент.</li>
        </ul>
        <p>
          Повна методологія в репо: <a href="https://github.com/" target="_blank" rel="noreferrer">METHODOLOGY.md</a>.
        </p>
      </section>
    </article>
  );
}

const RELIABILITY_ROWS = [
  ['Стать',                  'high',   'ESS питає напряму, 0% NA'],
  ['Вік',                    'high',   'Рік народження → точний вік, 0% NA'],
  ['Зріст',                  'medium', 'Не з ESS — параметричний з NCD-RisC. Normal-модель per cohort'],
  ['Освіта (бакети)',        'high',   '~0.2% NA. Бакети дають великий запас n у кожній клітинці'],
  ['Дохід (дециль)',         'high',   'Прямий ESS-показник. ~18% відмов — обчислюємо на non-NA'],
  ['Не у шлюбі/партнерстві', 'high',   'Об\'єднано marsts + rshpsts, коректно враховує ESS routing'],
  ['Немає дітей',            'high',   'Виведено з yrbrn2..13 (роки народження членів ДГ), ~95% покриття'],
  ['Не курить',              'high',   '~0.3% NA. Невелика soc-desirability bias'],
  ['Помірний алкоголь',      'medium', 'Само-звіт частоти. Систематичне заниження споживання типове'],
  ['Релігійність',           'medium', '0-10 шкала. Культурна варіація що значить «релігійний»'],
  ['Політика лів-прав',      'low',    'Одновимірна lrscale погано маппиться на UA-реальність (мультидимензіональну)'],
  ['Спорт',                  'medium', 'Само-визначення «активність 30+ хв», ~6% NA'],
  ['Мова вдома',             'high',   'Само-звіт основної мови, ~0% NA']
];

function ReliabilityTable() {
  return (
    <table className="reliability-table">
      <thead>
        <tr>
          <th>Фільтр</th>
          <th>Надійність</th>
          <th>Каверат</th>
        </tr>
      </thead>
      <tbody>
        {RELIABILITY_ROWS.map(([name, level, caveat]) => (
          <tr key={name}>
            <td>{name}</td>
            <td><span className={`reliability-badge reliability-${level}`}>{
              level === 'high' ? 'висока' : level === 'medium' ? 'середня' : 'низька'
            }</span></td>
            <td className="reliability-caveat">{caveat}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SourceCard({ data }) {
  if (!data) return null;
  return (
    <div className="source-card">
      <div className="source-card-row">
        <span className="k">Джерело:</span>
        <span className="v">{data.source}</span>
      </div>
      {data.url && (
        <div className="source-card-row">
          <span className="k">URL:</span>
          <a href={data.url} target="_blank" rel="noreferrer">{data.url}</a>
        </div>
      )}
      {data.wave && (
        <div className="source-card-row">
          <span className="k">Хвиля:</span>
          <span className="v">{data.wave}</span>
        </div>
      )}
      {data.fieldwork_year && (
        <div className="source-card-row">
          <span className="k">Рік поля:</span>
          <span className="v">{data.fieldwork_year}</span>
        </div>
      )}
      {data.n_respondents != null && (
        <div className="source-card-row">
          <span className="k">n:</span>
          <span className="v">{data.n_respondents}</span>
        </div>
      )}
      {data.disclaimer && (
        <div className="source-card-row warn">
          <span className="k">⚠</span>
          <span className="v">{data.disclaimer}</span>
        </div>
      )}
    </div>
  );
}
