import { Bar, BarChart, CartesianGrid, LabelList, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartFrame from './ChartFrame.jsx';
import { DEPRIVATION_LABELS, OVERVIEW_CATEGORY_EN } from '../i18n/strings.js';

const numberFormat = locale => new Intl.NumberFormat(locale === 'uk' ? 'uk-UA' : 'en-US', { maximumFractionDigits: 0 });
const percentFormat = locale => new Intl.NumberFormat(locale === 'uk' ? 'uk-UA' : 'en-US', { style: 'percent', maximumFractionDigits: 0 });

function Key({ locale, items }) {
  return <div className="chart-key" aria-hidden="true">{items.map((item, index) => <span key={item} className={`key-color-${index}`}>{item}</span>)}</div>;
}

export function AgeSexChart({ rows, locale }) {
  const order = ['0–2', '3–6', '7–13', '14–15', '16–17', '18–29', '30–59', '60+'];
  const data = order.map(age => {
    const female = rows.find(row => row.age_band === age && row.sex === 'жіноча');
    const male = rows.find(row => row.age_band === age && row.sex === 'чоловіча');
    return { age, women: female?.weighted || 0, men: male?.weighted || 0, womenN: female?.n || 0, menN: male?.n || 0 };
  });
  const labels = locale === 'uk' ? ['Жінки', 'Чоловіки'] : ['Women', 'Men'];
  const fmt = numberFormat(locale);
  return <ChartFrame locale={locale} ariaLabel={locale === 'uk' ? 'Зважена чисельність населення за офіційними віковими групами SESH і статтю' : 'Weighted population by official SESH age band and sex'} table={
    <table><thead><tr><th>{locale === 'uk' ? 'Вік' : 'Age'}</th><th>{labels[0]}</th><th>{labels[1]}</th><th>n</th></tr></thead><tbody>{data.map(row => <tr key={row.age}><th>{row.age}</th><td>{fmt.format(row.women)}</td><td>{fmt.format(row.men)}</td><td>{fmt.format(row.womenN + row.menN)}</td></tr>)}</tbody></table>
  }>
    <Key locale={locale} items={labels} />
    <ResponsiveContainer width="100%" height={380}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 62, left: 5, bottom: 0 }}>
        <CartesianGrid horizontal={false} stroke="var(--grid)" />
        <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={value => `${Math.round(value / 1e6)}${locale === 'uk' ? ' млн' : 'm'}`} />
        <YAxis type="category" dataKey="age" axisLine={false} tickLine={false} width={48} />
        <Tooltip formatter={value => fmt.format(value)} />
        <Bar dataKey="women" name={labels[0]} fill="var(--blue)" radius={[0, 2, 2, 0]}>
          <LabelList dataKey="women" position="right" formatter={value => `${(value / 1e6).toFixed(1)}${locale === 'uk' ? ' млн' : 'm'}`} />
        </Bar>
        <Bar dataKey="men" name={labels[1]} fill="var(--orange)" radius={[0, 2, 2, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </ChartFrame>;
}

export function IncomeChart({ income, locale }) {
  const fmt = numberFormat(locale);
  const data = income.quantiles.map(row => ({ percentile: `p${Math.round(row.p * 100)}`, total: row.total, perCapita: Math.round(row.per_capita) }));
  const labels = locale === 'uk' ? ['Домогосподарство', 'На особу'] : ['Household', 'Per person'];
  return <ChartFrame locale={locale} ariaLabel={locale === 'uk' ? 'Перцентилі сукупного і подушового місячного доходу домогосподарств у гривнях' : 'Percentiles of total and per-person monthly household income in hryvnias'} table={
    <table><thead><tr><th>{locale === 'uk' ? 'Перцентиль' : 'Percentile'}</th><th>{labels[0]}</th><th>{labels[1]}</th></tr></thead><tbody>{data.map(row => <tr key={row.percentile}><th>{row.percentile}</th><td>{fmt.format(row.total)}</td><td>{fmt.format(row.perCapita)}</td></tr>)}</tbody></table>
  }>
    <Key locale={locale} items={labels} />
    <ResponsiveContainer width="100%" height={330}>
      <LineChart data={data} margin={{ top: 30, right: 50, left: 2, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--grid)" />
        <XAxis dataKey="percentile" axisLine={false} tickLine={false} />
        <YAxis axisLine={false} tickLine={false} tickFormatter={value => `${Math.round(value / 1000)}k`} width={45} />
        <Tooltip formatter={value => `${fmt.format(value)} ₴`} />
        <ReferenceLine x="p50" stroke="var(--ink-muted)" strokeDasharray="3 4" />
        <Line dataKey="total" name={labels[0]} stroke="var(--blue)" strokeWidth={3} dot={{ r: 4, fill: 'var(--blue)' }}>
          <LabelList dataKey="total" position="top" formatter={value => `${Math.round(value / 100) / 10}k`} />
        </Line>
        <Line dataKey="perCapita" name={labels[1]} stroke="var(--orange)" strokeWidth={3} dot={{ r: 4, fill: 'var(--orange)' }} />
      </LineChart>
    </ResponsiveContainer>
  </ChartFrame>;
}

const OVERVIEW_CATEGORY_UK = {
  'Працював (в тому числі займалась/вся бізнесом, будь-чим, що приносить дохід)': 'Працювали за дохід',
  'Не працював': 'Не працювали',
  'Не працював тимчасово (не більше місяця), хоча мав роботу або бізнес': 'Тимчасово не працювали',
  'Працював вдома (на власній земельній ділянці) для задоволення потреб членів родини без оплати': 'Неоплачувана праця для родини',
  'Робота, за яку платять заробітну плату, оформлена трудовим договором/ трудовою книжкою, контрактом чи іншим документом': 'Формальна наймана робота',
  'Робота за зарплату без оформлення документів, а на основі усної домовленості': 'Неформальна наймана робота',
  'Працював індивідуально на себе заради отримання доходу без оформлення підприємства та без інших осіб (ремонти, консульта': 'Самозайнятість без реєстрації',
  'Власник або керівник бізнесу, приватний підприємець (оформлене підприємство, ФОП)': 'Бізнес або ФОП',
  'Працював на сімейній земельній ділянці чи з худобою для вирощування на продаж': 'Сімейне господарство на продаж',
};

function overviewLabel(value, locale) { return locale === 'en' ? (OVERVIEW_CATEGORY_EN[value] || value) : (OVERVIEW_CATEGORY_UK[value] || value); }

export function EmploymentChart({ employment, locale }) {
  const fmt = numberFormat(locale);
  const pct = percentFormat(locale);
  const total = employment.status.reduce((sum, row) => sum + row.weighted, 0);
  const arrangementTotal = employment.arrangement.reduce((sum, row) => sum + row.weighted, 0);
  const status = employment.status.map(row => ({ ...row, label: overviewLabel(row.category, locale), share: row.weighted / total })).sort((a, b) => b.share - a.share);
  const arrangement = employment.arrangement.map(row => ({ ...row, label: overviewLabel(row.category, locale), share: row.weighted / arrangementTotal })).sort((a, b) => b.share - a.share);
  const data = status.map(row => ({ ...row, group: locale === 'uk' ? 'Статус, 15+' : 'Status, 15+' }));
  return <ChartFrame locale={locale} ariaLabel={locale === 'uk' ? 'Економічний статус населення віком 15 років і старше' : 'Economic status of people aged 15 and older'} table={
    <table><thead><tr><th>{locale === 'uk' ? 'Статус' : 'Status'}</th><th>{locale === 'uk' ? 'Частка' : 'Share'}</th><th>n</th></tr></thead><tbody>{[...status, ...arrangement].map((row, index) => <tr key={`${row.category}-${index}`}><th>{row.label}</th><td>{pct.format(row.share)}</td><td>{fmt.format(row.n)}</td></tr>)}</tbody></table>
  }>
    <ResponsiveContainer width="100%" height={230}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 54, left: 4, bottom: 0 }}>
        <XAxis type="number" domain={[0, 1]} axisLine={false} tickLine={false} tickFormatter={value => pct.format(value)} />
        <YAxis type="category" dataKey="label" axisLine={false} tickLine={false} width={165} tick={{ fontSize: 11 }} />
        <Tooltip formatter={value => pct.format(value)} />
        <Bar dataKey="share" fill="var(--blue)" radius={[0, 2, 2, 0]}><LabelList dataKey="share" position="right" formatter={value => pct.format(value)} /></Bar>
      </BarChart>
    </ResponsiveContainer>
    <p className="chart-subhead">{locale === 'uk' ? 'Тип роботи серед працюючих' : 'Work arrangement among workers'}</p>
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={arrangement} layout="vertical" margin={{ top: 0, right: 54, left: 4, bottom: 0 }}>
        <XAxis type="number" domain={[0, 1]} axisLine={false} tickLine={false} tickFormatter={value => pct.format(value)} />
        <YAxis type="category" dataKey="label" axisLine={false} tickLine={false} width={165} tick={{ fontSize: 10 }} />
        <Tooltip formatter={value => pct.format(value)} />
        <Bar dataKey="share" fill="var(--orange)" radius={[0, 2, 2, 0]}><LabelList dataKey="share" position="right" formatter={value => pct.format(value)} /></Bar>
      </BarChart>
    </ResponsiveContainer>
  </ChartFrame>;
}

export function DeprivationChart({ deprivation, locale }) {
  const pct = percentFormat(locale);
  const fmt = numberFormat(locale);
  const data = deprivation.map(row => ({
    label: DEPRIVATION_LABELS[row.variable][locale],
    withChildren: row.with_children.share,
    withoutChildren: row.without_children.share,
    withN: row.with_children.base_n,
    withoutN: row.without_children.base_n,
  }));
  const labels = locale === 'uk' ? ['З дітьми', 'Без дітей'] : ['With children', 'Without children'];
  return <ChartFrame locale={locale} ariaLabel={locale === 'uk' ? 'Частка домогосподарств, які не можуть дозволити собі окремі потреби, з дітьми і без дітей' : 'Share of households unable to afford selected needs, with and without children'} table={
    <table><thead><tr><th>{locale === 'uk' ? 'Пункт депривації' : 'Deprivation item'}</th><th>{labels[0]}</th><th>{labels[1]}</th><th>n</th></tr></thead><tbody>{data.map(row => <tr key={row.label}><th>{row.label}</th><td>{pct.format(row.withChildren)}</td><td>{pct.format(row.withoutChildren)}</td><td>{fmt.format(row.withN)} / {fmt.format(row.withoutN)}</td></tr>)}</tbody></table>
  }>
    <Key locale={locale} items={labels} />
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 58, left: 5, bottom: 0 }}>
        <CartesianGrid horizontal={false} stroke="var(--grid)" />
        <XAxis type="number" domain={[0, 1]} axisLine={false} tickLine={false} tickFormatter={value => pct.format(value)} />
        <YAxis type="category" dataKey="label" axisLine={false} tickLine={false} width={145} tick={{ fontSize: 11 }} />
        <Tooltip formatter={value => pct.format(value)} />
        <Bar dataKey="withChildren" name={labels[0]} fill="var(--blue)" radius={[0, 2, 2, 0]}><LabelList dataKey="withChildren" position="right" formatter={value => pct.format(value)} /></Bar>
        <Bar dataKey="withoutChildren" name={labels[1]} fill="var(--orange)" radius={[0, 2, 2, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </ChartFrame>;
}
