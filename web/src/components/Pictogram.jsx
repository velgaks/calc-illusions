// Pictogram (isotype chart) — 10×10 сітка людських силуетів,
// заповнено round(share × 100). Шкала змінюється коли частка занадто мала:
//   ≥ 1% → 100-сітка (filled = round(share × 100))
//   < 1% → caption «<1 з 100» + друга-precision у тис. як subtitle
//
// Без 3D, без декорацій, без axes — кожна фігурка = 1 одиниця.
// Якщо змінюєш кольори — `--accent` для filled, `--border` для unfilled.

const TOTAL = 100;

function PersonIcon({ filled }) {
  return (
    <svg
      className={`person-icon ${filled ? 'is-filled' : ''}`}
      viewBox="0 0 24 28"
      aria-hidden="true"
    >
      <circle cx="12" cy="7" r="4.5" />
      <path d="M 3 28 C 3 18, 7 14, 12 14 C 17 14, 21 18, 21 28 Z" />
    </svg>
  );
}

export default function Pictogram({ share, sex }) {
  if (share == null || !isFinite(share)) return null;
  const filledExact = share * TOTAL;
  const filled = Math.round(filledExact);

  const caption = filled >= 1
    ? `${filled} з ${TOTAL}`
    : `менше 1 з ${TOTAL}`;
  const subCaption = filled < 1
    ? `≈ ${(share * 1000).toFixed(filledExact < 0.1 ? 2 : 1)} з 1 000`
    : null;

  return (
    <div className="pictogram-wrap">
      <div
        className="pictogram"
        role="img"
        aria-label={`${filled} з ${TOTAL} людей відповідають твоїм критеріям`}
      >
        {Array.from({ length: TOTAL }, (_, i) => (
          <PersonIcon key={i} filled={i < filled} />
        ))}
      </div>
      <p className="pictogram-caption">
        <strong>{caption}</strong>
        {subCaption && <span className="pictogram-sub"> · {subCaption}</span>}
      </p>
    </div>
  );
}
