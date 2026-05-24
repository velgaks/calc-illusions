// Pictogram (isotype chart) — 10×10 сітка з трирівневим заповненням:
//   solid filled  = round(share × 100)
//   ghost-filled  = до round(ciHigh × 100) — діапазон CI
//   empty outline = решта
//
// Це чесніше за «66%»: показує і точкову оцінку, і ширину невизначеності
// одним поглядом. Особливо корисно коли share близький до 0 — користувач
// бачить «0 solid, але до 3 у бажаному кольорі = так, можливо, просто не
// бачимо в малій вибірці».

const TOTAL = 100;

function PersonIcon({ state }) {
  // state: 'filled' | 'ghost' | 'empty'
  return (
    <svg
      className={`person-icon person-icon-${state}`}
      viewBox="0 0 24 28"
      aria-hidden="true"
    >
      <circle cx="12" cy="7" r="4.5" />
      <path d="M 3 28 C 3 18, 7 14, 12 14 C 17 14, 21 18, 21 28 Z" />
    </svg>
  );
}

export default function Pictogram({ share, ci }) {
  if (share == null || !isFinite(share)) return null;

  const filledExact = share * TOTAL;
  const filled = Math.round(filledExact);
  const ciLow  = ci?.low  != null ? Math.max(0, Math.round(ci.low  * TOTAL)) : filled;
  const ciHigh = ci?.high != null ? Math.min(TOTAL, Math.round(ci.high * TOTAL)) : filled;

  const icons = [];
  for (let i = 0; i < TOTAL; i++) {
    let s;
    if (i < filled)       s = 'filled';
    else if (i < ciHigh)  s = 'ghost';
    else                  s = 'empty';
    icons.push(<PersonIcon key={i} state={s} />);
  }

  // Caption: точкова + повний CI-діапазон якщо він ширший за точку
  let caption;
  const ciWide = ciHigh > filled || ciLow < filled;
  if (filled >= 1) {
    caption = ciWide
      ? <>≈ <strong>{filled}</strong> з {TOTAL} · CI {ciLow}–{ciHigh}</>
      : <><strong>{filled}</strong> з {TOTAL}</>;
  } else {
    if (ciHigh >= 1) {
      caption = <><strong>0</strong> з {TOTAL} solid · CI допускає до <strong>{ciHigh}</strong></>;
    } else {
      caption = <>менше <strong>1</strong> з {TOTAL} (≈ {(share * 1000).toFixed(1)} з 1 000)</>;
    }
  }

  return (
    <div className="pictogram-wrap">
      <div
        className="pictogram"
        role="img"
        aria-label={`${filled} з ${TOTAL}, інтервал до ${ciHigh}`}
      >
        {icons}
      </div>
      <p className="pictogram-caption">{caption}</p>
    </div>
  );
}
