import { countriesByContinent } from '../data/countries';

const CONTINENT_COLORS = {
  Europe: '#2563c9', // blue
  Asia: '#d23b34', // red
  Africa: '#9b2fae', // purple
  'North America': '#e8912a', // orange
  'South America': '#2faa4d', // green
  Oceania: '#46a6e0', // light blue
};

// Each major continent is its own column; the two smallest (South America and
// Oceania) stack together in the last column — matching the JetPunk layout.
const COLUMNS = [
  ['Europe'],
  ['Asia'],
  ['Africa'],
  ['North America'],
  ['South America', 'Oceania'],
];

function Continent({ cont, guessed, ended }) {
  const list = countriesByContinent[cont];
  const got = list.filter((c) => guessed.has(c.id)).length;
  return (
    <section className="continent" style={{ '--cont': CONTINENT_COLORS[cont] }}>
      <header className="continent-head">
        <span className="continent-name">{cont}</span>
        <span className="continent-count">
          {got} / {list.length}
        </span>
      </header>
      <ol className="country-list">
        {list.map((c) => {
          const isGuessed = guessed.has(c.id);
          const revealed = ended && !isGuessed;
          const visible = isGuessed || revealed;
          return (
            <li
              key={c.id}
              className={
                'country-slot' + (isGuessed ? ' filled' : '') + (revealed ? ' missed' : '')
              }
            >
              {visible && (
                <span className={`fi fi-${c.cca2.toLowerCase()}`} aria-hidden="true" />
              )}
              <span className="country-name">{visible ? c.name : ''}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export default function CountryTable({ guessed, ended }) {
  return (
    <div className="table-cols">
      {COLUMNS.map((col, i) => (
        <div className="table-col" key={i}>
          {col.map((cont) => (
            <Continent key={cont} cont={cont} guessed={guessed} ended={ended} />
          ))}
        </div>
      ))}
    </div>
  );
}
