// Geometry helpers for the engraved look: contour paths, tone-driven hatching,
// curved (parametric) hatching and stippling. All output is SVG path data.
import { rng } from "./random";

export type Pt = [number, number];
export type Poly = Pt[];
export type Tone = (x: number, y: number) => number;

const n1 = (v: number) => (Math.round(v * 10) / 10).toString();

export const polyD = (pts: Pt[], close = true) =>
  pts.length === 0
    ? ""
    : "M" + pts.map(([x, y]) => `${n1(x)} ${n1(y)}`).join("L") + (close ? "Z" : "");

// Smooth path through points (Catmull-Rom -> cubic bezier)
export const smoothD = (pts: Pt[], closed = false, tension = 0.5) => {
  const n = pts.length;
  if (n < 3) return polyD(pts, closed);
  const get = (i: number) =>
    closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
  let d = `M${n1(pts[0][0])} ${n1(pts[0][1])}`;
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = get(i - 1);
    const p1 = get(i);
    const p2 = get(i + 1);
    const p3 = get(i + 2);
    const k = tension / 3;
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k];
    d += `C${n1(c1[0])} ${n1(c1[1])} ${n1(c2[0])} ${n1(c2[1])} ${n1(p2[0])} ${n1(p2[1])}`;
  }
  return closed ? d + "Z" : d;
};

export const rectP = (x: number, y: number, w: number, h: number): Poly => [
  [x, y],
  [x + w, y],
  [x + w, y + h],
  [x, y + h],
];

export const ellipseP = (cx: number, cy: number, rx: number, ry: number, n = 48, a0 = 0, a1 = Math.PI * 2): Poly => {
  const out: Pt[] = [];
  const full = Math.abs(a1 - a0 - Math.PI * 2) < 1e-6;
  const count = full ? n : n + 1;
  for (let i = 0; i < count; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  return out;
};

export const lineD = (x1: number, y1: number, x2: number, y2: number) =>
  `M${n1(x1)} ${n1(y1)}L${n1(x2)} ${n1(y2)}`;

export const circleD = (cx: number, cy: number, r: number) =>
  `M${n1(cx - r)} ${n1(cy)}a${n1(r)} ${n1(r)} 0 1 0 ${n1(2 * r)} 0a${n1(r)} ${n1(r)} 0 1 0 ${n1(-2 * r)} 0`;

export const transformPts = (pts: Pt[], f: (p: Pt) => Pt) => pts.map(f);
export const translateP = (pts: Pt[], dx: number, dy: number): Pt[] => pts.map(([x, y]) => [x + dx, y + dy]);
export const scaleP = (pts: Pt[], sx: number, sy: number, ox = 0, oy = 0): Pt[] =>
  pts.map(([x, y]) => [ox + (x - ox) * sx, oy + (y - oy) * sy]);

export type HatchOpts = {
  angle: number; // degrees; 0 = horizontal lines
  spacing: number;
  tone?: Tone; // darkness 0..1; lines drawn where tone > threshold
  threshold?: number;
  step?: number; // sampling step along lines when tone is used
  seed?: string;
  jitter?: number; // per-line threshold jitter
  wobble?: number; // perpendicular wobble in px
  trim?: number; // random trim of segment ends
  minLen?: number;
};

// Parallel lines clipped to polygons (even-odd), optionally gated by a tone field.
export const hatch = (polys: Poly[], o: HatchOpts): string => {
  const ang = (o.angle * Math.PI) / 180;
  const ca = Math.cos(ang);
  const sa = Math.sin(ang);
  const rp = polys.map((p) => p.map(([x, y]) => [x * ca + y * sa, -x * sa + y * ca] as Pt));
  let vmin = Infinity;
  let vmax = -Infinity;
  for (const p of rp)
    for (const [, v] of p) {
      vmin = Math.min(vmin, v);
      vmax = Math.max(vmax, v);
    }
  const r = rng(o.seed ?? "hatch");
  const thr = o.threshold ?? 0.5;
  const step = o.step ?? 4;
  const trim = o.trim ?? 1.2;
  const minLen = o.minLen ?? 2;
  const wob = o.wobble ?? 0;
  const out: string[] = [];
  const toXY = (u: number, v: number): Pt => [u * ca - v * sa, u * sa + v * ca];
  const emit = (a: number, b: number, v: number) => {
    const a2 = a + r() * trim;
    const b2 = b - r() * trim;
    if (b2 - a2 < minLen) return;
    const dv = wob ? (r() - 0.5) * wob : 0;
    const [x1, y1] = toXY(a2, v + dv);
    const [x2, y2] = toXY(b2, v - dv);
    out.push(`M${n1(x1)} ${n1(y1)}L${n1(x2)} ${n1(y2)}`);
  };
  for (let v = vmin + r() * o.spacing; v < vmax; v += o.spacing) {
    const xs: number[] = [];
    for (const poly of rp) {
      const n = poly.length;
      for (let i = 0; i < n; i++) {
        const [u1, v1] = poly[i];
        const [u2, v2] = poly[(i + 1) % n];
        if ((v1 <= v && v2 > v) || (v2 <= v && v1 > v)) xs.push(u1 + ((v - v1) / (v2 - v1)) * (u2 - u1));
      }
    }
    xs.sort((a, b) => a - b);
    const lj = (r() - 0.5) * (o.jitter ?? 0.12);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const a = xs[k];
      const b = xs[k + 1];
      if (!o.tone) {
        emit(a, b, v);
        continue;
      }
      let s: number | null = null;
      for (let u = a; u <= b + step * 0.5; u += step) {
        const uu = Math.min(u, b);
        const [x, y] = toXY(uu, v);
        const on = o.tone(x, y) > thr + lj;
        if (on && s === null) s = uu;
        if ((!on || uu >= b) && s !== null) {
          emit(s, uu, v);
          s = null;
        }
      }
    }
  }
  return out.join("");
};

export type EngraveLayer = { d: string; w: number };

// Classic engraving cross-hatch: up to 4 passes at different angles, each
// kicking in at a darker tone level.
export const engrave = (
  polys: Poly[],
  tone: Tone,
  o: {
    angle?: number;
    spacing?: number;
    levels?: number[];
    angles?: number[];
    width?: number;
    seed?: string;
    step?: number;
    wobble?: number;
  } = {},
): EngraveLayer[] => {
  const base = o.angle ?? 35;
  const levels = o.levels ?? [0.2, 0.45, 0.7, 0.88];
  const angles = o.angles ?? [base, base + 90, base + 45, base - 45];
  const sp = o.spacing ?? 5;
  const w = o.width ?? 1.1;
  return levels.map((lv, i) => ({
    d: hatch(polys, {
      angle: angles[i % angles.length],
      spacing: sp * (i === 0 ? 1 : 1.15),
      tone,
      threshold: lv,
      step: o.step ?? 3,
      seed: `${o.seed ?? "eng"}-${i}`,
      wobble: o.wobble ?? 0.3,
    }),
    w: w * (i === 0 ? 1 : 0.85),
  }));
};

// Hatch lines that follow a surface: map(u, v) -> point. Lines run along u at
// fixed v. Useful for cylinders, bells, domes, cloth and waves.
export const hatchParam = (
  map: (u: number, v: number) => Pt,
  o: {
    lines: number;
    samples?: number;
    tone?: (u: number, v: number) => number;
    threshold?: number;
    v0?: number;
    v1?: number;
    u0?: number;
    u1?: number;
    seed?: string;
  },
): string => {
  const samples = o.samples ?? 40;
  const v0 = o.v0 ?? 0;
  const v1 = o.v1 ?? 1;
  const u0 = o.u0 ?? 0;
  const u1 = o.u1 ?? 1;
  const r = rng(o.seed ?? "hp");
  const thr = o.threshold ?? 0.5;
  const out: string[] = [];
  for (let li = 0; li < o.lines; li++) {
    const v = v0 + ((v1 - v0) * (li + 0.5)) / o.lines;
    const lj = (r() - 0.5) * 0.12;
    let seg: Pt[] = [];
    const flush = () => {
      if (seg.length > 1) out.push(polyD(seg, false));
      seg = [];
    };
    for (let si = 0; si <= samples; si++) {
      const u = u0 + ((u1 - u0) * si) / samples;
      const on = o.tone ? o.tone(u, v) > thr + lj : true;
      if (on) seg.push(map(u, v));
      else flush();
    }
    flush();
  }
  return out.join("");
};

// Stipple dots (render with stroke-linecap round; stroke width = dot size)
export const stipple = (polys: Poly[], o: { count: number; tone?: Tone; seed?: string; bbox?: [number, number, number, number] }) => {
  const r = rng(o.seed ?? "st");
  let [x0, y0, x1, y1] = o.bbox ?? [Infinity, Infinity, -Infinity, -Infinity];
  if (!o.bbox)
    for (const p of polys)
      for (const [x, y] of p) {
        x0 = Math.min(x0, x);
        y0 = Math.min(y0, y);
        x1 = Math.max(x1, x);
        y1 = Math.max(y1, y);
      }
  const out: string[] = [];
  for (let i = 0; i < o.count; i++) {
    const x = x0 + r() * (x1 - x0);
    const y = y0 + r() * (y1 - y0);
    if (!polys.some((p) => inside(p, x, y))) continue;
    if (o.tone && r() > o.tone(x, y)) continue;
    out.push(`M${n1(x)} ${n1(y)}l0.1 0`);
  }
  return out.join("");
};

export const inside = (poly: Poly, x: number, y: number) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};

// Common tone fields
export const tones = {
  // Shading across a vertical cylinder: dark on the right by default
  cylinder:
    (cx: number, r: number, light = -0.45, ambient = 0.15): Tone =>
    (x) => {
      const nx = Math.max(-1, Math.min(1, (x - cx) / r));
      const nz = Math.sqrt(Math.max(0, 1 - nx * nx));
      const lit = Math.max(0, nx * light + nz * Math.sqrt(1 - light * light));
      return Math.min(1, ambient + (1 - lit) * 0.95);
    },
  linear:
    (x0: number, y0: number, x1: number, y1: number, a = 0, b = 1): Tone =>
    (x, y) => {
      const dx = x1 - x0;
      const dy = y1 - y0;
      const t = ((x - x0) * dx + (y - y0) * dy) / (dx * dx + dy * dy);
      return a + (b - a) * Math.max(0, Math.min(1, t));
    },
  radial:
    (cx: number, cy: number, r: number, inner = 0, outer = 1): Tone =>
    (x, y) => {
      const t = Math.min(1, Math.hypot(x - cx, y - cy) / r);
      return inner + (outer - inner) * t;
    },
  sphere:
    (cx: number, cy: number, r: number, lx = -0.5, ly = -0.6): Tone =>
    (x, y) => {
      const nx = (x - cx) / r;
      const ny = (y - cy) / r;
      const d2 = nx * nx + ny * ny;
      if (d2 > 1) return 1;
      const nz = Math.sqrt(1 - d2);
      const lz = Math.sqrt(Math.max(0, 1 - lx * lx - ly * ly));
      const lit = Math.max(0, nx * lx + ny * ly + nz * lz);
      return Math.min(1, 0.08 + (1 - lit) * 0.95);
    },
  const: (v: number): Tone => () => v,
};
