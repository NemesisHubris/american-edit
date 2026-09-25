// The Hype: Berlin Wall, circuit board, vintage computer, 3D smartphone,
// jets, Mount Rushmore, Grand Canyon, city skyline.
import type { InkItem } from "../components/InkDraw";
import { usePalette } from "../lib/palette";
import { ellipseP, engrave, Pt, polyD, rectP, smoothD, stipple, Tone, tones } from "../lib/engrave";
import { TAU } from "../lib/math";
import { rng } from "../lib/random";
import { Cam, DEFAULT_CAM, poly3, pose, Pose, V3 } from "../lib/three";
import { F, HT, L, solid } from "./kit";

// ---------- Berlin Wall: slabs with a pipe top, covered in graffiti ----------
export const WALL_TOP = 330;
export const WALL_BOT = 900;
export const wallItems = (): InkItem[] => {
  const items: InkItem[] = [];
  const r = rng("wall");
  for (let x = -400; x < 2400; x += 170) {
    const slab = rectP(x, WALL_TOP + 30, 168, WALL_BOT - WALL_TOP - 30);
    items.push(F(polyD(slab), "stone", 1));
    items.push(HT(stipple([slab], { count: 160, seed: `ws${x}` }), 2, 0.4));
    items.push(L(polyD(slab), 2));
  }
  // graffiti blobs and tags in bright paint
  const paints = ["flagRed", "gold", "sky", "foliage", "flagBlue", "fire"];
  for (let i = 0; i < 26; i++) {
    const cx = -300 + r() * 2500;
    const cy = WALL_TOP + 90 + r() * 420;
    const pts: Pt[] = Array.from({ length: 10 }, (_, k) => {
      const a = (k / 10) * TAU;
      const rr = 40 + r() * 80;
      return [cx + Math.cos(a) * rr * 1.6, cy + Math.sin(a) * rr * 0.7] as Pt;
    });
    items.push(F(smoothD(pts, true), paints[i % paints.length], 0.85));
    items.push(L(smoothD(pts, true), 3));
    items.push(L(smoothD(Array.from({ length: 6 }, (_, k) => [cx - 120 + k * 50, cy + Math.sin(k * 2 + i) * 30] as Pt)), 5, { color: paints[(i + 2) % paints.length] }));
  }
  // round pipe along the top
  items.push(...solid([[-400, WALL_TOP], [2400, WALL_TOP], [2400, WALL_TOP + 40], [-400, WALL_TOP + 40]], { fill: "stone", op: 1, tone: tones.linear(0, WALL_TOP, 0, WALL_TOP + 40, 0.1, 0.9), angle: 0, spacing: 3, levels: [0.5], w: 2.6 }));
  return items;
};

// ---------- Circuit board ----------
export const circuitGeo = (w = 2400, h = 1500, seed = "pcb") => {
  const r = rng(seed);
  const traces: string[] = [];
  const pads: string[] = [];
  const G = 30;
  for (let i = 0; i < 70; i++) {
    let x = Math.round((r() * w - 200) / G) * G;
    let y = Math.round((r() * h - 200) / G) * G;
    const pts: Pt[] = [[x, y]];
    let dir = Math.floor(r() * 4);
    const n = 4 + Math.floor(r() * 7);
    for (let k = 0; k < n; k++) {
      const len = (2 + Math.floor(r() * 6)) * G;
      const d = [
        [1, 0],
        [0, 1],
        [-1, 0],
        [0, -1],
        [1, 1],
        [1, -1],
      ][dir];
      x += d[0] * len;
      y += d[1] * len;
      pts.push([x, y]);
      dir = r() < 0.5 ? (dir + 1) % 4 : r() < 0.5 ? 4 + Math.floor(r() * 2) : dir;
    }
    traces.push(polyD(pts, false));
    pads.push(polyD(ellipseP(pts[0][0], pts[0][1], 7, 7, 10)), polyD(ellipseP(x, y, 7, 7, 10)));
  }
  const chips = Array.from({ length: 7 }, () => ({ x: r() * w - 200, y: r() * h - 200, w: 120 + r() * 160, h: 80 + r() * 140 }));
  return { traces, pads: pads.join(""), chips };
};

// ---------- Vintage computer (origin: bottom centre of the case) ----------
export const computerItems = (): { items: InkItem[]; screen: Pt[] } => {
  const items: InkItem[] = [];
  const mon: Pt[] = [[-260, -700], [260, -700], [280, -300], [-280, -300]];
  items.push(...solid(mon, { fill: "sand", op: 1, tone: (x, y) => 0.25 + (x + 280) / 900 + (y + 700) / 2000, angle: 90, spacing: 3.6, levels: [0.55, 0.78], w: 3, seed: "mon" }));
  const screen: Pt[] = [[-200, -650], [200, -650], [210, -350], [-210, -350]];
  items.push(F(smoothD(screen, true, 0.15), "ink", 1));
  items.push(L(smoothD(screen, true, 0.15), 3));
  items.push(...solid([[-80, -300], [80, -300], [100, -250], [-100, -250]], { fill: "sand", op: 1, w: 2.2 }));
  const box: Pt[] = [[-360, -250], [360, -250], [380, -90], [-380, -90]];
  items.push(...solid(box, { fill: "sand", op: 1, tone: tones.linear(0, -250, 0, -90, 0.2, 0.7), angle: 0, spacing: 3.6, levels: [0.55], w: 3, seed: "box" }));
  items.push(L("M-300 -170h200M-300 -140h200", 6, { color: "ink" }));
  items.push(F(polyD(rectP(240, -200, 40, 18)), "flagRed", 1));
  const kb: Pt[] = [[-400, -80], [400, -80], [440, 0], [-440, 0]];
  items.push(...solid(kb, { fill: "sand", op: 1, w: 2.6 }));
  const keys: string[] = [];
  for (let row = 0; row < 4; row++) for (let k = 0; k < 14; k++) keys.push(polyD(rectP(-380 + k * 54 + row * 6, -72 + row * 18, 44, 14)));
  items.push(F(keys.join(""), "stone", 1));
  items.push(L(keys.join(""), 1));
  return { items, screen };
};

// ---------- Smartphone in 3D (cm units), screen facing +z at rest ----------
const roundRect = (w: number, h: number, r: number, n = 6): [number, number][] => {
  const out: [number, number][] = [];
  const corners: [number, number, number][] = [
    [w / 2 - r, h / 2 - r, 0],
    [-w / 2 + r, h / 2 - r, Math.PI / 2],
    [-w / 2 + r, -h / 2 + r, Math.PI],
    [w / 2 - r, -h / 2 + r, Math.PI * 1.5],
  ];
  for (const [cx, cy, a0] of corners) for (let i = 0; i <= n; i++) out.push([cx + Math.cos(a0 + (i / n) * (Math.PI / 2)) * r, cy + Math.sin(a0 + (i / n) * (Math.PI / 2)) * r]);
  return out;
};

export const Phone3D: React.FC<{ at: Pose; light: number; t: number; cam?: Cam }> = ({ at, light, t, cam = DEFAULT_CAM }) => {
  const pal = usePalette();
  const W = 7.1;
  const H = 14.7;
  const T = 0.8;
  const outline = roundRect(W, H, 1.1);
  const front = outline.map(([x, y]) => pose([x, y, -T / 2], at));
  const back = outline.map(([x, y]) => pose([x, y, T / 2], at));
  const fP = poly3(front, cam);
  const bP = poly3(back, cam);
  const nodes: React.ReactNode[] = [];
  // which face points to the camera? (screen normal is -z local)
  const c0 = pose([0, 0, 0], at);
  const nz = pose([0, 0, -1], at);
  const facing = (nz[0] - c0[0]) * -c0[0] + (nz[1] - c0[1]) * -c0[1] + (nz[2] - c0[2]) * -c0[2] > 0;
  // side band
  const all = [...fP, ...bP];
  const p = all.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o: Pt, a: Pt, b: Pt) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: Pt[] = [];
  for (const q of p) {
    while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  const up: Pt[] = [];
  for (const q of p.slice().reverse()) {
    while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
    up.push(q);
  }
  nodes.push(<path key="band" d={polyD([...lo.slice(0, -1), ...up.slice(0, -1)])} fill={pal.steel} stroke={pal.ink} strokeWidth={3} />);
  if (!facing) {
    nodes.push(<path key="back" d={polyD(bP)} fill={pal.metal} stroke={pal.ink} strokeWidth={2.4} />);
    const lens = poly3(ellipseP(0, 0, 0.7, 0.7, 20).map(([x, y]) => pose([x - 2.2, y + 5.6, T / 2 + 0.05], at) as V3), cam);
    nodes.push(<path key="lens" d={polyD(lens)} fill={pal.ink} stroke={pal.ink} strokeWidth={2} />);
  } else {
    nodes.push(<path key="glass" d={polyD(fP)} fill={pal.ink} stroke={pal.ink} strokeWidth={2.4} />);
    // affine map for the screen UI from three projected corners
    const P = (x: number, y: number) => poly3([pose([x, y, -T / 2 - 0.01], at)], cam)[0];
    const o = P(-W / 2 + 0.4, H / 2 - 0.4);
    const ax = P(W / 2 - 0.4, H / 2 - 0.4);
    const ay = P(-W / 2 + 0.4, -H / 2 + 0.4);
    if (o && ax && ay) {
      const sw = 630;
      const sh = 1390;
      const m = [(ax[0] - o[0]) / sw, (ax[1] - o[1]) / sw, (ay[0] - o[0]) / sh, (ay[1] - o[1]) / sh, o[0], o[1]];
      const icons = ["flagRed", "gold", "foliage", "sky", "fire", "flagBlue", "dawn", "glow"];
      nodes.push(
        <g key="ui" transform={`matrix(${m.join(" ")})`} opacity={light}>
          <defs>
            <linearGradient id="phonebg" x1="0" y1="0" x2="0.4" y2="1">
              <stop offset="0" stopColor="#2a64d6" />
              <stop offset="0.6" stopColor="#7a3fc4" />
              <stop offset="1" stopColor="#e26a3a" />
            </linearGradient>
          </defs>
          <rect x={0} y={0} width={sw} height={sh} rx={60} fill="url(#phonebg)" />
          <rect x={220} y={30} width={190} height={40} rx={20} fill="#000" />
          <text x={315} y={260} textAnchor="middle" fontSize={120} fill="#fff" fontFamily="sans-serif" fontWeight={300}>
            {`9:4${Math.floor(t / 20) % 10}`}
          </text>
          {Array.from({ length: 20 }, (_, i) => {
            const col = i % 4;
            const row = Math.floor(i / 4);
            const pop = Math.max(0, Math.min(1, light * 3 - 1 - i * 0.04));
            return <rect key={i} x={60 + col * 135 + (1 - pop) * 40} y={420 + row * 160 + (1 - pop) * 40} width={100 * pop} height={100 * pop} rx={24} fill={(pal as unknown as Record<string, string>)[icons[i % icons.length]]} />;
          })}
          <rect x={40} y={1180} width={550} height={150} rx={50} fill="#ffffff" opacity={0.25} />
        </g>,
      );
    }
    nodes.push(<path key="rim" d={polyD(fP)} fill="none" stroke={pal.ink} strokeWidth={5} />);
  }
  return <g>{nodes}</g>;
};

// ---------- Jet (plan view), nose along -y, centred ----------
export const jetD = (s = 1) => {
  const pts: Pt[] = [
    [0, -130], [10, -100], [16, -60], [22, -30], [90, 30], [92, 50], [26, 44], [28, 80], [60, 110], [58, 124], [18, 112], [12, 124], [-12, 124], [-18, 112], [-58, 124], [-60, 110], [-28, 80], [-26, 44], [-92, 50], [-90, 30], [-22, -30], [-16, -60], [-10, -100],
  ];
  return polyD(pts.map(([x, y]) => [x * s, y * s] as Pt));
};

// ---------- Mount Rushmore: heads sculpted purely by tone-driven hatching ----------
type Head = { x: number; y: number; s: number; d: number; beard?: boolean; glasses?: boolean };
const headTone = (h: Head): Tone => (x, y) => {
  const S = h.s;
  const nx = (x - h.x) / (0.72 * S);
  const ny = (y - h.y) / S;
  const r2 = nx * nx + ny * ny;
  if (r2 > 1) return 0.35 + (r2 - 1) * 0.6;
  const nz = Math.sqrt(1 - r2);
  const lit = Math.max(0, -0.55 * nx - 0.35 * ny + 0.76 * nz);
  let t = 0.08 + (1 - lit) * 0.62;
  const ridge = h.d * 0.12;
  for (const ex of [-0.34, 0.34]) t += 0.6 * Math.exp(-((nx - ex - h.d * 0.08) ** 2 / 0.02 + (ny + 0.16) ** 2 / 0.009));
  t += 0.3 * Math.exp(-((ny + 0.05) ** 2) / 0.003) * Math.exp(-((nx - ridge) ** 2) / 0.25);
  if (nx > ridge && nx < ridge + 0.14 && ny > -0.25 && ny < 0.22) t += 0.45 * (1 - (nx - ridge) / 0.14);
  t += 0.5 * Math.exp(-((nx - ridge) ** 2 / 0.03 + (ny - 0.26) ** 2 / 0.0025));
  if (Math.abs(nx - ridge) < 0.24) t += 0.55 * Math.exp(-((ny - 0.43) ** 2) / 0.0012);
  if (Math.abs(nx - ridge) < 0.2) t += 0.25 * Math.exp(-((ny - 0.53) ** 2) / 0.002);
  t += 0.18 * Math.exp(-((nx - 0.5) ** 2 / 0.02 + (ny - 0.2) ** 2 / 0.04));
  if (ny > 0.78) t += (ny - 0.78) * 1.4;
  const hair = Math.min(1, Math.max(0, (-0.45 - ny) / 0.2));
  t += hair * (0.2 + Math.sin(nx * 18 + ny * 6) * 0.1);
  if (h.beard && ny > 0.4) t += 0.35;
  return Math.min(1, t);
};

export const rushmoreItems = (): InkItem[] => {
  const items: InkItem[] = [];
  const cliff: Pt[] = [[-500, 1300], [-500, 420], [-200, 300], [100, 200], [400, 130], [700, 100], [1000, 110], [1300, 90], [1600, 150], [1900, 250], [2400, 380], [2400, 1300]];
  items.push(F(polyD(cliff), "stone", 1));
  const heads: Head[] = [
    { x: 520, y: 470, s: 230, d: -0.6 },
    { x: 840, y: 430, s: 205, d: 0.6 },
    { x: 1120, y: 560, s: 180, d: -0.2, glasses: true },
    { x: 1450, y: 480, s: 225, d: 0.3, beard: true },
  ];
  const faceTone: Tone = (x, y) => {
    let best = 0.3 + (y - 100) / 2600 + Math.max(0, Math.sin(x / 70 + y / 300)) * 0.25;
    for (const h of heads) {
      const nx = (x - h.x) / (0.72 * h.s);
      const ny = (y - h.y) / h.s;
      if (nx * nx + ny * ny <= 1) return headTone(h)(x, y);
    }
    return best;
  };
  engrave([cliff], faceTone, { angle: 72, spacing: 3.6, levels: [0.28, 0.46, 0.64, 0.82], angles: [72, 162, 27, 117], seed: "rush", width: 1.1, step: 2.5 }).forEach((l) => items.push(HT(l.d, l.w)));
  const r = rng("rush");
  const cracks: string[] = [];
  for (let i = 0; i < 40; i++) {
    const x = r() * 2600 - 400;
    const y = 180 + r() * 800;
    if (heads.some((h) => ((x - h.x) / (0.72 * h.s)) ** 2 + ((y - h.y) / h.s) ** 2 < 1.3)) continue;
    cracks.push(smoothD([[x, y], [x + (r() - 0.5) * 40, y + 40 + r() * 60], [x + (r() - 0.5) * 60, y + 100 + r() * 80]]));
  }
  items.push(L(cracks.join(""), 1.4, { op: 0.7 }));
  // a few confident contour strokes per face
  heads.forEach((h) => {
    const S = h.s;
    const rx = h.x + h.d * 0.12 * 0.72 * S;
    items.push(L(smoothD([[h.x - S * 0.46, h.y - S * 0.1], [h.x - S * 0.2, h.y - S * 0.14], [h.x + S * 0.02, h.y - S * 0.08]]), 2, { op: 0.7 }));
    items.push(L(smoothD([[h.x + S * 0.06, h.y - S * 0.08], [h.x + S * 0.28, h.y - S * 0.14], [h.x + S * 0.5, h.y - S * 0.08]]), 2, { op: 0.7 }));
    items.push(L(smoothD([[rx, h.y - S * 0.1], [rx + S * 0.05, h.y + S * 0.1], [rx + S * 0.1, h.y + S * 0.24], [rx - S * 0.04, h.y + S * 0.27]]), 2.2, { op: 0.8 }));
    items.push(L(smoothD([[rx - S * 0.16, h.y + S * 0.43], [rx, h.y + S * 0.45], [rx + S * 0.16, h.y + S * 0.42]]), 2.2, { op: 0.8 }));
    items.push(L(smoothD([[h.x - S * 0.66, h.y + S * 0.2], [h.x - S * 0.4, h.y + S * 0.75], [h.x, h.y + S * 0.95], [h.x + S * 0.42, h.y + S * 0.74], [h.x + S * 0.66, h.y + S * 0.2]]), 1.6, { op: 0.45 }));
    if (h.glasses) items.push(L(polyD(ellipseP(h.x - S * 0.26, h.y - S * 0.16, S * 0.14, S * 0.09, 16)) + polyD(ellipseP(h.x + S * 0.26, h.y - S * 0.16, S * 0.14, S * 0.09, 16)), 2.4));
  });
  const talus: Pt[] = [[-500, 1300], [-500, 900], [300, 860], [1000, 900], [1700, 870], [2400, 920], [2400, 1300]];
  items.push(F(smoothD(talus, true), "ground", 0.9));
  items.push(HT(stipple([talus], { count: 1400, seed: "talus" }), 3, 0.6));
  return items;
};

// ---------- Grand Canyon: buttes with cliffs, talus, strata, haze by depth ----------
export const mesaLayer = (yBase: number, height: number, seed: string, near = 0.5, gorge = false, x0 = -900, x1 = 2800): InkItem[] => {
  const r = rng(seed);
  const top: Pt[] = [];
  const faces: { xa: number; xb: number; top: number }[] = [];
  let x = x0;
  top.push([x, yBase]);
  while (x < x1) {
    const inGorge = gorge && x > 650 && x < 1150;
    const H = inGorge ? height * 0.1 : height * (0.55 + r() * 0.45);
    const talus = H * 0.45;
    const tw = inGorge ? 60 : 80 + r() * 260;
    const slope = talus * 0.9;
    const cliffW = 10 + r() * 20;
    top.push([x + slope, yBase - talus], [x + slope + cliffW, yBase - H], [x + slope + cliffW + tw, yBase - H], [x + slope + 2 * cliffW + tw, yBase - talus], [x + 2 * slope + 2 * cliffW + tw, yBase]);
    faces.push({ xa: x + slope + cliffW, xb: x + slope + cliffW + tw, top: yBase - H });
    x += 2 * slope + 2 * cliffW + tw + (r() < 0.4 ? 40 + r() * 120 : 0);
    top.push([x, yBase]);
  }
  const poly: Pt[] = [[x0, yBase + 500], ...top, [x1, yBase + 500]];
  const fill = near > 0.6 ? "brick" : near > 0.35 ? "fire" : "dawn";
  const items: InkItem[] = [F(polyD(poly), fill, 0.95)];
  // light from the low sun on the left: right halves of buttes fall into shadow
  const tone: Tone = (px, py) => {
    let t = 0.2 + (py - (yBase - height)) / (height * 3);
    for (const fc of faces) if (px > fc.xa && px < fc.xb + 60 && py > fc.top) t += (px - (fc.xa + fc.xb) / 2) / (fc.xb - fc.xa + 1) > 0.1 ? 0.45 : 0;
    return t;
  };
  engrave([poly], tone, { angle: 90, spacing: 4, levels: [0.42, 0.62, 0.8], angles: [90, 70, 110], seed: seed + "e", width: 1 }).forEach((l) => items.push(HT(l.d, l.w)));
  const strata: string[] = [];
  for (const fc of faces) for (let k = 1; k < 6; k++) strata.push(`M${fc.xa.toFixed(0)} ${(fc.top + k * height * 0.07).toFixed(0)}H${fc.xb.toFixed(0)}`);
  items.push(L(strata.join(""), 1.2, { op: 0.6 }));
  items.push(L(polyD(top, false), 2.4));
  if (near < 0.5) items.push(F(polyD(poly), "sky", 0.45 * (1 - near * 1.6)));
  return items;
};

// ---------- Night skyline ----------
export const skylineGeo = (seed = "city") => {
  const r = rng(seed);
  const rects: { x: number; w: number; h: number }[] = [];
  for (let x = -300; x < 2300; ) {
    const w = 60 + r() * 140;
    rects.push({ x, w, h: 120 + Math.pow(r(), 2) * 520 });
    x += w + 6;
  }
  const windows: string[] = [];
  for (const b of rects) for (let yy = 900 - b.h + 20; yy < 890; yy += 26) for (let xx = b.x + 12; xx < b.x + b.w - 12; xx += 22) if (r() > 0.45) windows.push(`M${xx.toFixed(0)} ${yy.toFixed(0)}h8`);
  return { d: rects.map((b) => polyD(rectP(b.x, 900 - b.h, b.w, b.h))).join(""), windows: windows.join("") };
};

export { rectP };
