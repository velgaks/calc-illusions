import { Link } from 'react-router-dom';

export default function SourceBadge({ data }) {
  const { methodology } = data;
  const ess = methodology?.ess ?? {};
  const cohorts = methodology?.cohorts ?? {};
  const height = methodology?.height ?? {};

  return (
    <div className="source-badge">
      <span className="source-badge-label">Дані:</span>{' '}
      <span>
        ESS {ess.wave}
        {ess.n_respondents != null && `, n=${ess.n_respondents}`}
        {ess.fieldwork_year && `, поле ${ess.fieldwork_year}`}
      </span>
      <span className="source-badge-sep">·</span>
      <span>
        Когорти: {shortenSource(cohorts.source)}
        {cohorts.estimate_date && `, ${cohorts.estimate_date}`}
      </span>
      <span className="source-badge-sep">·</span>
      <span>
        Зріст: NCD-RisC
        {height.publication_year && `, ${height.publication_year}`}
      </span>
      <span className="source-badge-sep">·</span>
      <Link to="/methodology" className="methodology-link">повна методологія →</Link>
    </div>
  );
}

function shortenSource(s) {
  if (!s) return 'TODO';
  if (s.length < 40) return s;
  return s.slice(0, 37) + '...';
}
