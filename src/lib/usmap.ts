// Accurate lower-48 geometry from us-atlas, projected once and cached.
import { geoAlbers, geoPath } from "d3-geo";
import { feature, merge, mesh } from "topojson-client";
import us from "us-atlas/states-10m.json";
import { memo } from "./math";
import { Pt, polyD, smoothD } from "./engrave";

type LonLat = [number, number];

const EXCLUDE = new Set(["02", "15", "60", "66", "69", "72", "78"]);
// The thirteen plus the lands they held in 1805 (ME, VT, WV)
export const ORIGINAL = new Set(["10", "42", "34", "13", "09", "25", "24", "45", "33", "51", "36", "37", "44", "23", "50", "54"]);

export const MAP_EXTENT: [[number, number], [number, number]] = [
  [170, 190],
  [1750, 960],
];

// Rivers and routes (lon, lat)
const MISSOURI: LonLat[] = [
  [-90.12, 38.82], [-91.5, 38.6], [-92.6, 38.9], [-94.6, 39.1], [-94.85, 39.77], [-95.6, 40.6], [-95.9, 41.26], [-96.4, 42.5],
  [-97.9, 42.85], [-99.3, 43.8], [-100.35, 44.37], [-100.5, 45.7], [-100.8, 46.8], [-101.4, 47.5], [-102.5, 47.6], [-104.0, 48.0],
  [-106.5, 48.0], [-108.7, 47.7], [-110.5, 47.8], [-111.3, 47.5], [-111.9, 47.0], [-111.5, 46.3], [-111.55, 45.93],
];
const MISSISSIPPI: LonLat[] = [
  [-95.2, 47.24], [-94.2, 46.35], [-93.27, 44.98], [-92.0, 44.4], [-91.25, 43.8], [-91.15, 42.8], [-90.66, 42.5], [-90.58, 41.52],
  [-91.1, 40.8], [-91.4, 40.0], [-90.9, 39.3], [-90.2, 38.63], [-89.5, 37.3], [-89.18, 37.0], [-89.5, 36.5], [-90.05, 35.15],
  [-90.9, 34.0], [-91.1, 33.0], [-90.88, 32.35], [-91.4, 31.56], [-91.6, 31.0], [-91.19, 30.45], [-90.07, 29.95], [-89.4, 29.2],
];
const OHIO: LonLat[] = [
  [-80.0, 40.44], [-80.7, 39.7], [-81.5, 39.3], [-82.4, 38.4], [-84.5, 39.1], [-85.76, 38.25], [-87.5, 37.9], [-88.4, 37.1], [-89.18, 37.0],
];
const COLUMBIA: LonLat[] = [
  [-117.0, 46.4], [-118.3, 46.3], [-119.1, 46.25], [-120.0, 45.9], [-121.2, 45.6], [-122.3, 45.55], [-122.8, 46.0], [-123.3, 46.2], [-123.95, 46.25],
];
export const LEWIS_CLARK: LonLat[] = [
  [-90.2, 38.63], ...MISSOURI, [-112.7, 45.0], [-113.44, 44.97], [-114.0, 45.5], [-114.3, 46.3], [-114.6, 46.6], [-115.6, 46.5],
  [-116.4, 46.5], ...COLUMBIA,
];
export const OREGON_TRAIL: LonLat[] = [
  [-94.42, 39.09], [-95.7, 39.05], [-96.7, 40.0], [-98.3, 40.6], [-99.0, 40.65], [-101.0, 41.1], [-102.4, 41.25], [-103.35, 41.7],
  [-104.55, 42.2], [-106.3, 42.85], [-107.9, 42.45], [-108.9, 42.35], [-110.3, 42.1], [-111.0, 42.3], [-112.4, 43.0], [-114.4, 42.7],
  [-116.2, 43.6], [-117.0, 43.8], [-117.8, 44.8], [-118.5, 45.6], [-119.8, 45.7], [-121.2, 45.6], [-122.6, 45.36],
];
const LOUISIANA: LonLat[] = [
  [-89.3, 28.6], [-89.6, 30.2], [-90.2, 30.4], [-91.2, 31.0], [-91.6, 31.0], [-91.4, 31.56], [-90.88, 32.35], [-91.1, 33.0], [-90.9, 34.0],
  [-90.05, 35.15], [-89.5, 36.5], [-89.18, 37.0], [-89.5, 37.3], [-90.2, 38.63], [-90.9, 39.3], [-91.4, 40.0], [-91.1, 40.8], [-90.58, 41.52],
  [-90.66, 42.5], [-91.15, 42.8], [-91.25, 43.8], [-92.0, 44.4], [-93.27, 44.98], [-94.2, 46.35], [-95.2, 47.24], [-95.2, 49.4],
  [-114.0, 49.4], [-113.3, 48.0], [-112.5, 46.6], [-113.0, 45.7], [-112.9, 44.5], [-111.5, 44.5], [-110.4, 44.1], [-109.6, 43.4],
  [-109.0, 42.4], [-107.8, 41.5], [-106.9, 40.5], [-106.3, 39.3], [-105.2, 38.45], [-104.6, 38.25], [-103.0, 38.05], [-101.0, 37.95],
  [-100.0, 37.75], [-100.0, 34.56], [-99.0, 34.2], [-98.0, 34.1], [-97.0, 33.85], [-96.0, 33.85], [-95.0, 33.9], [-94.04, 33.55],
  [-94.04, 32.0], [-93.8, 31.0], [-93.7, 30.1], [-93.84, 29.68], [-93.8, 28.6],
];

export const PLACES: Record<string, LonLat> = {
  stLouis: [-90.2, 38.63],
  newOrleans: [-90.07, 29.95],
  sanAntonio: [-98.49, 29.43],
  fortClatsop: [-123.88, 46.14],
  independence: [-94.42, 39.09],
  oregonCity: [-122.6, 45.36],
  philadelphia: [-75.16, 39.95],
  washington: [-77.04, 38.9],
  newYork: [-74.0, 40.71],
  boston: [-71.06, 42.36],
  chicago: [-87.63, 41.88],
  denver: [-104.99, 39.74],
  sanFrancisco: [-122.42, 37.77],
  losAngeles: [-118.24, 34.05],
  seattle: [-122.33, 47.61],
  houston: [-95.37, 29.76],
  atlanta: [-84.39, 33.75],
  miami: [-80.19, 25.76],
  dallas: [-96.8, 32.78],
  phoenix: [-112.07, 33.45],
  minneapolis: [-93.27, 44.98],
  saltLake: [-111.89, 40.76],
  kansasCity: [-94.58, 39.1],
  nashville: [-86.78, 36.16],
  detroit: [-83.05, 42.33],
};

// Exterior boundary segments that are land borders (not coast / lake shore)
const isLandBorder = ([lon, lat]: LonLat) =>
  (lat > 48.95 && lon < -94.9 && lon > -123.1) || // 49th parallel
  (lon > -95.3 && lon < -89.9 && lat > 48.0) || // Minnesota north
  (lon < -66.95 && lon > -71.6 && lat >= 45.05) || // Maine
  (lat > 44.95 && lat < 45.06 && lon > -75 && lon < -71.4) || // 45th parallel
  (lon > -76.4 && lon < -74.6 && lat > 44.0 && lat < 45.06) || // St Lawrence
  (lat > 31.2 && lat < 32.8 && lon > -117.13 && lon < -106.4) || // Mexico land
  (lat < 31.9 && lon > -106.7 && ((lon < -97.6 && lat < 30) || (lon < -97.3 && lat < 26.3))); // Rio Grande

export type USMap = {
  states: { id: string; name: string; d: string; c: Pt; original: boolean }[];
  land: string;
  coast: string;
  rivers: string[];
  louisiana: string;
  proj: (p: LonLat) => Pt;
  pts: (ll: LonLat[]) => Pt[];
};

export const getUSMap = (): USMap =>
  memo("usmap", () => {
    const topo = us as unknown as { objects: { states: { geometries: { id: string }[] } } };
    const fc = feature(topo, topo.objects.states);
    const lower = fc.features.filter((f) => !EXCLUDE.has(f.id));
    const collection = { type: "FeatureCollection", features: lower };
    const projection = geoAlbers().fitExtent(MAP_EXTENT, collection);
    const path = geoPath(projection).digits(1);
    const proj = (p: LonLat): Pt => projection(p) as Pt;
    const pts = (ll: LonLat[]) => ll.map(proj);
    const states = lower.map((f) => ({
      id: f.id,
      name: f.properties.name,
      d: path(f) ?? "",
      c: path.centroid(f) as Pt,
      original: ORIGINAL.has(f.id),
    }));
    const lowerGeoms = topo.objects.states.geometries.filter((g) => !EXCLUDE.has(g.id));
    const land = path(merge(topo, lowerGeoms)) ?? "";
    // Coastline: exterior arcs minus land borders
    const ext = mesh(topo, topo.objects.states, (a, b) => a === b);
    const runs: Pt[][] = [];
    for (const line of ext.coordinates) {
      let run: Pt[] = [];
      for (let i = 0; i < line.length; i++) {
        const p = line[i] as LonLat;
        const inBox = p[0] > -125.5 && p[0] < -66 && p[1] > 24 && p[1] < 50;
        if (inBox && !isLandBorder(p)) run.push(proj(p));
        else {
          if (run.length > 1) runs.push(run);
          run = [];
        }
      }
      if (run.length > 1) runs.push(run);
    }
    const coast = runs.map((r) => polyD(r, false)).join("");
    const rivers = [MISSISSIPPI, MISSOURI, OHIO, COLUMBIA].map((r) => smoothD(pts(r)));
    const louisiana = polyD(pts(LOUISIANA));
    return { states, land, coast, rivers, louisiana, proj, pts };
  });

// Arc-length parametrisation of a polyline, for things that travel along it
export const along = (pts: Pt[]) => {
  const L = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = L[L.length - 1];
  const at = (t: number) => {
    const s = Math.max(0, Math.min(1, t)) * total;
    let i = 1;
    while (i < L.length - 1 && L[i] < s) i++;
    const k = (s - L[i - 1]) / Math.max(1e-6, L[i] - L[i - 1]);
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    return { x: x0 + (x1 - x0) * k, y: y0 + (y1 - y0) * k, angle: (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI };
  };
  return { total, at, d: smoothD(pts) };
};
