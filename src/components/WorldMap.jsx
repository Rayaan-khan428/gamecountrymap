import { useState, useMemo, useEffect, useRef } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from 'react-simple-maps';
import { geoMiller } from 'd3-geo-projection';
import { geoCentroid } from 'd3-geo';
import { feature } from 'topojson-client';
import topology from 'world-atlas/countries-110m.json';
import { countries } from '../data/countries';
import { PROJECTIONS, AZIMUTHAL } from '../data/projections';

// Map the numeric ISO code used by the atlas (geo.id === ccn3) back to our
// country id (cca3) and display name.
const byCcn3 = new Map(
  countries.filter((c) => c.ccn3).map((c) => [c.ccn3, c])
);
const byId = new Map(countries.map((c) => [c.id, c]));

// Territories that render as their own geography but should be colored with a
// parent country (e.g. guessing "Denmark" fills Greenland). Geography id -> cca3.
const TERRITORY_PARENT = {
  304: 'DNK', // Greenland -> Denmark
  630: 'USA', // Puerto Rico -> United States
  540: 'FRA', // New Caledonia -> France
  260: 'FRA', // French Southern & Antarctic Lands -> France
  238: 'GBR', // Falkland Islands -> United Kingdom
};

// Some geographies have no ISO id on this atlas; match them by name instead.
const NAME_PARENT = {
  Kosovo: 'UNK',
};

// Markers are only for genuine island nations that would otherwise be invisible
// in open ocean. We skip landlocked/continental microstates (Monaco, Vatican,
// San Marino, Liechtenstein, Andorra, Kosovo) and the cluttered Caribbean
// Lesser Antilles chain — blobs over/near land hurt the look.
const NO_MARKER = new Set([
  'AND', 'LIE', 'MCO', 'SMR', 'VAT', 'UNK', // not islands
  'ATG', 'BRB', 'DMA', 'GRD', 'KNA', 'LCA', 'VCT', // Caribbean chain above Venezuela
]);

const presentCcn3 = new Set(topology.objects.countries.geometries.map((g) => g.id));
const islandCountries = countries.filter(
  (c) =>
    (!c.ccn3 || !presentCcn3.has(c.ccn3)) &&
    c.latlng.length === 2 &&
    !NO_MARKER.has(c.id)
);

const ANTARCTICA_ID = '010';
const WIDTH = 800;
const HEIGHT = 460;
const ZOOM_K = 3.2;

// Land features (sans Antarctica) used to auto-fit non-default projections.
const landFC = feature(topology, topology.objects.countries);
const landNoAntarctica = {
  type: 'FeatureCollection',
  features: landFC.features.filter((f) => f.id !== ANTARCTICA_ID),
};

function buildProjection(id, rotation) {
  // Default Miller: tuned manually to crop Antarctica and frame nicely.
  if (id === 'miller') {
    return geoMiller().translate([WIDTH / 2, 250]).scale(125);
  }
  const entry = PROJECTIONS.find((p) => p.id === id) || PROJECTIONS[0];
  const proj = entry.factory();
  if (AZIMUTHAL.has(id) && proj.rotate) proj.rotate(rotation);
  const fitObj = AZIMUTHAL.has(id) ? { type: 'Sphere' } : landNoAntarctica;
  proj.fitExtent(
    [
      [14, 14],
      [WIDTH - 14, HEIGHT - 14],
    ],
    fitObj
  );
  return proj;
}

// Dark-theme palette
const LAND = '#2b3442'; // unguessed land (dark slate)
const FOUND = '#f4c142'; // guessed: bright gold
const MISSED = '#c9714a'; // missed: terracotta
const COAST = '#0d1117'; // borders ≈ ocean, for crisp separation
const BLOB = '#3a4757'; // unguessed island marker
const BLOB_EDGE = '#0d1117';

export default function WorldMap({ guessed, ended, paused, onResume, interactive }) {
  const [tooltip, setTooltip] = useState(null);
  const [focus, setFocus] = useState(null); // [px, py] in projected space, or null
  const [projId, setProjId] = useState('miller');
  const [menuOpen, setMenuOpen] = useState(false);
  const [rotation, setRotation] = useState([-10, -18]);
  const [dragging, setDragging] = useState(false);
  const settingsRef = useRef(null);
  const rotationRef = useRef(rotation);
  rotationRef.current = rotation;
  const dragRef = useRef(null);

  const isAzimuthal = AZIMUTHAL.has(projId);
  const projection = useMemo(
    () => buildProjection(projId, rotation),
    [projId, rotation]
  );

  // Drag-to-spin for the globe (azimuthal projections only)
  const onFrameMouseDown = (e) => {
    if (!isAzimuthal) return;
    dragRef.current = {
      x: e.clientX,
      y: e.clientY,
      rot: rotationRef.current,
      moved: false,
    };
    setDragging(true);
  };

  useEffect(() => {
    if (!dragging) return;
    const move = (e) => {
      const d = dragRef.current;
      if (!d) return;
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) d.moved = true;
      const k = 0.3; // degrees per pixel
      const lambda = d.rot[0] + dx * k;
      let phi = d.rot[1] - dy * k;
      phi = Math.max(-90, Math.min(90, phi));
      setRotation([lambda, phi]);
    };
    const up = () => setDragging(false);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
  }, [dragging]);

  // True right after a drag, so the trailing click doesn't trigger a zoom
  const consumeDrag = () => {
    if (dragRef.current?.moved) {
      dragRef.current.moved = false;
      return true;
    }
    return false;
  };

  // Close the projection menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [menuOpen]);

  const zoomed = focus !== null;
  const cursor = isAzimuthal
    ? dragging
      ? 'grabbing'
      : 'grab'
    : zoomed
    ? 'zoom-out'
    : 'zoom-in';

  const show = (name) => () => interactive && setTooltip(name);
  const hide = () => setTooltip(null);

  const zoomTo = (lonLat) => {
    if (zoomed) {
      setFocus(null);
      return;
    }
    const p = projection(lonLat);
    if (p) setFocus(p);
  };

  const groupTransform = focus
    ? `translate(${WIDTH / 2} ${HEIGHT / 2}) scale(${ZOOM_K}) translate(${-focus[0]} ${-focus[1]})`
    : undefined;

  return (
    <div className="map-wrap">
      <div className="map-settings" ref={settingsRef}>
        <button
          className={'gear-btn' + (menuOpen ? ' active' : '')}
          onClick={() => setMenuOpen((o) => !o)}
          title="Map projection"
          aria-label="Map projection settings"
        >
          ⚙
        </button>
        {menuOpen && (
          <div className="proj-menu">
            <div className="proj-menu-title">Globe projection</div>
            {PROJECTIONS.map((p) => (
              <button
                key={p.id}
                className={'proj-item' + (p.id === projId ? ' active' : '')}
                onClick={() => {
                  setProjId(p.id);
                  setFocus(null);
                  setMenuOpen(false);
                }}
              >
                {p.label}
                {p.id === 'miller' && <span className="proj-tag">default</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="map-frame" onMouseDown={onFrameMouseDown}>
        <ComposableMap
          projection={projection}
          width={WIDTH}
          height={HEIGHT}
          style={{ width: '100%', height: 'auto' }}
        >
          {/* Background catches clicks on open ocean to zoom back out */}
          <rect
            x={0}
            y={0}
            width={WIDTH}
            height={HEIGHT}
            fill="transparent"
            style={{ cursor: isAzimuthal ? cursor : zoomed ? 'zoom-out' : 'default' }}
            onClick={() => {
              if (consumeDrag()) return;
              if (zoomed) setFocus(null);
            }}
          />

          <g transform={groupTransform}>
            <Geographies geography={topology}>
              {({ geographies }) =>
                geographies
                  .filter((geo) => geo.id !== ANTARCTICA_ID)
                  .map((geo) => {
                    const country =
                      byCcn3.get(geo.id) ||
                      byId.get(TERRITORY_PARENT[geo.id]) ||
                      byId.get(NAME_PARENT[geo.properties?.name]);
                    const isGuessed = country && guessed.has(country.id);
                    const isMissed = ended && country && !isGuessed;
                    const fill = isGuessed ? FOUND : isMissed ? MISSED : LAND;
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={fill}
                        stroke={COAST}
                        strokeWidth={0.5}
                        vectorEffect="non-scaling-stroke"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (consumeDrag() || isAzimuthal) return;
                          zoomTo(geoCentroid(geo));
                        }}
                        onMouseEnter={
                          interactive && country ? show(country.name) : undefined
                        }
                        onMouseLeave={hide}
                        style={{
                          default: { outline: 'none', cursor },
                          hover: {
                            outline: 'none',
                            cursor,
                            filter: interactive ? 'brightness(1.12)' : 'none',
                          },
                          pressed: { outline: 'none' },
                        }}
                      />
                    );
                  })
              }
            </Geographies>

            {/* Island-nation markers */}
            {islandCountries.map((c) => {
              const isGuessed = guessed.has(c.id);
              const isMissed = ended && !isGuessed;
              const fill = isGuessed ? FOUND : isMissed ? MISSED : BLOB;
              const [lat, lng] = c.latlng;
              return (
                <Marker
                  key={c.id}
                  coordinates={[lng, lat]}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (consumeDrag() || isAzimuthal) return;
                    zoomTo([lng, lat]);
                  }}
                  onMouseEnter={interactive ? show(c.name) : undefined}
                  onMouseLeave={hide}
                  style={{ default: { cursor }, hover: { cursor }, pressed: {} }}
                >
                  <ellipse
                    rx={6}
                    ry={4.6}
                    fill={fill}
                    stroke={BLOB_EDGE}
                    strokeWidth={0.8}
                    vectorEffect="non-scaling-stroke"
                    style={{ cursor }}
                  />
                </Marker>
              );
            })}
          </g>
        </ComposableMap>

        {paused && (
          <div className="map-paused">
            <div className="map-paused-inner">
              <span className="map-paused-title">Paused</span>
              <button className="nav-btn primary" onClick={onResume}>
                Resume
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="map-tooltip">
        {tooltip ??
          (isAzimuthal
            ? 'Drag to spin the globe'
            : zoomed
            ? 'Click anywhere to zoom out'
            : 'Click a region to zoom in')}
      </div>
    </div>
  );
}
