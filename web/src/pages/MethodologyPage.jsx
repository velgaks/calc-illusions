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
          набору критеріїв.
        </p>
        <p>
          В основі — 2581 інтерв'ю з опитування{' '}
          <a href="https://www.europeansocialsurvey.org/" target="_blank" rel="noreferrer">ESS Ukraine</a>{' '}
          (поле 2024). Це репрезентативна вибірка дорослих: соціологи запитували про освіту,
          дохід, шлюб, мови, погляди, спосіб життя, зріст і вагу — все, що тут можна
          вибрати як фільтр. Чисельність когорт для перетворення частки в абсолютну
          кількість — з{' '}
          <a href="https://www.demography.org.ua/" target="_blank" rel="noreferrer">Інст. демографії</a>.
        </p>
      </section>

      <section>
        <h2>Дані</h2>
        <h3>ESS — основне джерело</h3>
        <SourceCard data={methodology.ess} />
        <h3>Чисельність когорт — Інститут демографії</h3>
        <SourceCard data={methodology.cohorts} />
      </section>

      <section>
        <h2>Надійність фільтрів</h2>
        <p>
          Колонка «надійність» показує наскільки можна довіряти кожному фільтру.
          Стать і вік ESS записує точно. Релігійність і політику міряти важче.
        </p>
        <ReliabilityTable />
      </section>

      <section>
        <h2>Алгоритм</h2>
        <pre className="formula">{`1. (стать, віковий діапазон) → N_base з cohorts
2. (дохід у грн) → дециль через income_deciles
3. ESS joint-частка (зріст уже у складі ESS):
     window = respondents[stать, вікове вікно]
     denom  = Σ pspwght[window]
     match  = window що задовольняють УСІ активні критерії
     numer  = Σ pspwght[match]
     joint  = numer / denom
4. Підсумок = joint × N_base
5. CI 95% — Wilson score interval на effective sample size
   (Kish: n_eff = (Σw)² / Σw²) — враховує дисперсію ваг`}</pre>
      </section>

      <section>
        <h2>Що варто пам'ятати</h2>
        <ul>
          <li>
            <strong>Окуповані території не враховані.</strong> Чисельність когорт — наявне
            населення підконтрольної території, ESS-польове дослідження теж там і тільки там.
          </li>
          <li>
            <strong>Дохід — про домогосподарство, не про людину.</strong> ESS питає
            сукупний місячний дохід всієї родини після податків. Якщо живеш сам — це
            твій дохід. Якщо вдвох — сумуй обох.
          </li>
          <li>
            <strong>Вузький набір → широкий інтервал.</strong> Коли активовано багато
            фільтрів, у статево-віковому вікні ESS лишається 5–10 людей, і довірчий інтервал
            виходить дуже широким — це частина показу, не баг.
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
  ['Стать',                  'high',
    'Людина сама каже «чоловік» чи «жінка». Відмов майже нема.'],
  ['Вік',                    'high',
    'Запитують рік народження. Точність висока.'],
  ['Зріст',                  'high',
    'ESS R11 питає зріст напряму, у см. Відповіли 96% респондентів. ESS виставляє NA коли BMI поза [16, 40] — тому дуже худих і дуже повних у вибірці немає.'],
  ['Освіта (бакети)',        'high',
    'Три бакети: «школа» (ISCED 1-3), «профтех/коледж» (4-5, молодший спеціаліст сюди), «вища, бак+» (6-7). Останній рівень узгоджений з UNESCO tertiary. ~0.2% NA.'],
  ['Дохід (дециль)',         'high',
    'ESS показує картку з 10 діапазонами сукупного місячного доходу домогосподарства, респондент вибирає літеру (J…H). Межі для України на 2024 — від ≤10 800 грн до >42 100 грн. Майже п\'ята опитаних відмовляється говорити про дохід, інших враховуємо.'],
  ['Не у шлюбі/партнерстві', 'high',
    'ESS питає двічі: про штамп і про спільне життя без нього. Поєднуємо обидва. Так не губляться пари без реєстрації.'],
  ['Немає своїх дітей <18',  'high',
    'Для кожного члена ДГ ESS знає рік народження і ким він респонденту доводиться. Беремо лише рідних/прийомних/пасинків молодше 18. Племінники, діти партнера, молодші брати не рахуються.'],
  ['Не курить',              'high',
    'Майже всі відповіли. Курці іноді применшують, але розбіжність невелика.'],
  ['Помірний алкоголь',      'medium',
    'Питають про частоту. Скільки на один раз залишається невідомим. До того ж люди систематично занижують споживання.'],
  ['Релігійність',           'medium',
    'Шкала від 0 до 10, «оцініть себе». Що значить «релігійний», кожен розуміє по-своєму.'],
  ['Політика лів-прав',      'low',
    'Одна шкала «лівий-правий» не описує українську політику. Тут грає роль мова, ставлення до Заходу, Майдан, релігія. Цей фільтр дає лише приблизне уявлення.'],
  ['Спорт',                  'medium',
    '«Скільки днів за тиждень була активність 30 хвилин і більше». Сюди потрапляє і пробіжка, і прогулянка з собакою. Межі розмиті.'],
  ['Мова вдома',             'high',
    'Сказали яку. Якщо вдома говорять двома, записували головну. Простий показник.']
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
