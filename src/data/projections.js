import {
  geoEqualEarth,
  geoNaturalEarth1,
  geoMercator,
  geoEquirectangular,
  geoOrthographic,
} from 'd3-geo';
import {
  geoMiller,
  geoRobinson,
  geoWinkel3,
  geoMollweide,
  geoEckert4,
  geoVanDerGrinten,
  geoSinusoidal,
  geoAitoff,
  geoHammer,
} from 'd3-geo-projection';

// A grab-bag of map projections for the (for-fun) settings menu.
// `miller` is the default and is configured specially in WorldMap.
export const PROJECTIONS = [
  { id: 'miller', label: 'Miller', factory: geoMiller },
  { id: 'equalEarth', label: 'Equal Earth', factory: geoEqualEarth },
  { id: 'naturalEarth', label: 'Natural Earth', factory: geoNaturalEarth1 },
  { id: 'robinson', label: 'Robinson', factory: geoRobinson },
  { id: 'winkel3', label: 'Winkel Tripel', factory: geoWinkel3 },
  { id: 'mollweide', label: 'Mollweide', factory: geoMollweide },
  { id: 'eckert4', label: 'Eckert IV', factory: geoEckert4 },
  { id: 'aitoff', label: 'Aitoff', factory: geoAitoff },
  { id: 'hammer', label: 'Hammer', factory: geoHammer },
  { id: 'vanDerGrinten', label: 'Van der Grinten', factory: geoVanDerGrinten },
  { id: 'sinusoidal', label: 'Sinusoidal', factory: geoSinusoidal },
  { id: 'mercator', label: 'Mercator', factory: geoMercator },
  { id: 'equirectangular', label: 'Equirectangular', factory: geoEquirectangular },
  { id: 'orthographic', label: 'Orthographic (Globe)', factory: geoOrthographic },
];

export const AZIMUTHAL = new Set(['orthographic']);
