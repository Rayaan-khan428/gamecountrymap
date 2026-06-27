import worldCountries from 'world-countries';

// JetPunk's "Countries of the World" uses 197 countries.
// In the world-countries dataset, `unMember` is true for 194 entries
// (it counts Vatican City as a member). Adding Taiwan, Kosovo, and
// Palestine — the three non-UN members JetPunk includes — gives 197.
const EXTRA = ['Taiwan', 'Kosovo', 'Palestine'];

export const CONTINENTS = [
  'Africa',
  'Asia',
  'Europe',
  'North America',
  'Oceania',
  'South America',
];

function continentOf(c) {
  if (c.region === 'Americas') {
    return c.subregion === 'South America' ? 'South America' : 'North America';
  }
  return c.region; // Africa, Asia, Europe, Oceania
}

const selected = worldCountries.filter(
  (c) => c.unMember || EXTRA.includes(c.name.common)
);

export const countries = selected
  .map((c) => ({
    id: c.cca3,
    name: c.name.common,
    official: c.name.official,
    ccn3: c.ccn3, // numeric ISO code; matches world-atlas geography ids
    cca2: c.cca2,
    cca3: c.cca3,
    continent: continentOf(c),
    altSpellings: c.altSpellings || [],
    latlng: c.latlng || [], // [lat, lng] — used to place island/microstate markers
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

export const TOTAL = countries.length;

export const countriesByContinent = CONTINENTS.reduce((acc, cont) => {
  acc[cont] = countries.filter((c) => c.continent === cont);
  return acc;
}, {});
