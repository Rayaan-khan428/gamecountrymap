import { countries } from '../data/countries';
import { aliases } from '../data/aliases';

// Normalize a string for forgiving comparison: strip accents, lowercase,
// reduce all non-alphanumeric runs to single spaces, and trim.
export function normalize(s) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// Build a single lookup of every accepted (normalized) answer -> country id.
const lookup = new Map();

function add(str, id) {
  const n = normalize(str);
  if (n && !lookup.has(n)) lookup.set(n, id);
}

for (const c of countries) {
  add(c.name, c.id);
  add(c.official, c.id);
  for (const alt of c.altSpellings) {
    // Skip bare 2-3 letter ISO codes (e.g. "US", "DEU") to avoid surprise matches.
    if (/^[A-Z]{2,3}$/.test(alt)) continue;
    add(alt, c.id);
  }
}

for (const [id, names] of Object.entries(aliases)) {
  for (const n of names) add(n, id);
}

// Returns the matched country id (cca3) or null.
export function matchCountry(input) {
  return lookup.get(normalize(input)) ?? null;
}
