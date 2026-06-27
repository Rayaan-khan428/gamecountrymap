import { countries, TOTAL } from '../data/countries';
import { formatTime } from '../hooks/useTimer';

export default function Results({ guessed, elapsedSec }) {
  const score = guessed.size;
  const pct = Math.round((score / TOTAL) * 100);

  // WPM, Monkeytype-style: characters of the countries you got, / 5, per minute.
  let chars = 0;
  for (const c of countries) if (guessed.has(c.id)) chars += c.name.length;
  const minutes = elapsedSec / 60;
  const wpm = minutes > 0 ? Math.round(chars / 5 / minutes) : 0;

  const perfect = score === TOTAL;

  const stats = [
    { val: `${score} / ${TOTAL}`, lbl: 'Countries' },
    { val: `${pct}%`, lbl: 'Percent' },
    { val: formatTime(elapsedSec), lbl: 'Time' },
    { val: wpm, lbl: 'WPM' },
  ];

  return (
    <div className="results">
      <div className="results-headline">
        {perfect
          ? `Perfect! You named all ${TOTAL} countries.`
          : 'Time! Here’s how you did.'}
      </div>
      <div className="results-grid">
        {stats.map((s) => (
          <div className="result-stat" key={s.lbl}>
            <span className="rs-val">{s.val}</span>
            <span className="rs-lbl">{s.lbl}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
