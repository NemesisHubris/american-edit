// Drawing kit shared by the scenes: engraved shapes, hatching, wheels,
// masonry, windows, columns, trees and ground detail. Everything returns
// InkItems (lines draw stroke by stroke; hatch and fills fade in after).
import type { InkItem } from "../components/InkDraw";
import { engrave, ellipseP, hatch, Pt, polyD, Poly, rectP, smoothD, Tone, tones } from "../lib/engrave";
import { TAU } from "../lib/math";
import { rng } from "../lib/random";

export const L = (d: string, w = 2, extra: Partial<InkItem> = {}): InkItem => ({ d, w, ...extra });
export const F = (d: string, fill: string, op = 1): InkItem => ({ d, kind: "fill", fill, op });
export const HT = (d: string, w = 1, op = 0.85, color?: string): InkItem => ({ d, kind: "hatch", w, op, color });

// Filled, hatched and outlined solid
export const solid = (
  poly: Poly,
  o: {
    fill?: string;
    op?: number;
    tone?: Tone;
    angle?: number;
    spacing?: number;
    levels?: number[];
    angles?: number[];
    w?: number;
    seed?: string;
    hw?: number;
    smooth?: boolean;
    order?: number;
  } = {},
): InkItem[] => {
  const items: InkItem[] = [];
  if (o.fill) items.push(F(polyD(poly), o.fill, o.op ?? 0.8));
  if (o.tone)
    engrave([poly], o.tone, { angle: o.angle ?? 35, spacing: o.spacing ?? 5, levels: o.levels, angles: o.angles, seed: o.seed ?? "solid", width: o.hw ?? 1 }).forEach((l) =>
      items.push(HT(l.d, l.w)),
    );
  items.push({ d: o.smooth ? smoothD(poly, true) : polyD(poly), w: o.w ?? 2.2, order: o.order });
  return items;
};

// Spoked wheel centred at 0,0 (rotate with a transform)
export const wheel = (r: number, spokes = 12, o: { hub?: number; rim?: number; felloe?: number } = {}): InkItem[] => {
  const hub = o.hub ?? r * 0.16;
  const rim = o.rim ?? r * 0.1;
  const items: InkItem[] = [];
  const circ = (rr: number) => polyD(ellipseP(0, 0, rr, rr, 64));
  items.push(L(circ(r), 3));
  items.push(L(circ(r - rim), 1.8));
  items.push(F(`${circ(r)}${circ(r - rim)}`, "wood", 0.8));
  const sp: string[] = [];
  for (let k = 0; k < spokes; k++) {
    const a = (k / spokes) * TAU;
    const b = 0.05;
    sp.push(polyD([
      [Math.cos(a - b) * hub, Math.sin(a - b) * hub],
      [Math.cos(a - 0.018) * (r - rim), Math.sin(a - 0.018) * (r - rim)],
      [Math.cos(a + 0.018) * (r - rim), Math.sin(a + 0.018) * (r - rim)],
      [Math.cos(a + b) * hub, Math.sin(a + b) * hub],
    ]));
  }
  items.push(F(sp.join(""), "wood", 0.9));
  items.push(L(sp.join(""), 1.3));
  items.push(L(circ(hub), 2));
  items.push(F(circ(hub), "metal", 0.9));
  items.push(L(circ(hub * 0.45), 1.2));
  // rim shading
  items.push(HT(hatch([ellipseP(0, 0, r, r, 48), ellipseP(0, 0, r - rim, r - rim, 48)], { angle: 60, spacing: 3.5, seed: "rim" }), 0.9, 0.7));
  return items;
};

// Irregular dry-stone wall
export const stoneWall = (x: number, y: number, w: number, h: number, seed = "wall", rows = 5): InkItem[] => {
  const r = rng(seed);
  const items: InkItem[] = [];
  const rh = h / rows;
  const outlines: string[] = [];
  const shades: string[] = [];
  const fills: string[] = [];
  for (let row = 0; row < rows; row++) {
    let cx = x - r() * 40;
    const yy = y + row * rh;
    while (cx < x + w) {
      const sw = 50 + r() * 90;
      const pts: Pt[] = [];
      const inset = 3;
      const x0 = cx + inset;
      const x1 = Math.min(x + w, cx + sw) - inset;
      const y0 = yy + inset + r() * 3;
      const y1 = yy + rh - inset - r() * 3;
      if (x1 - x0 > 12) {
        pts.push([x0 + 6, y0], [x1 - 8, y0 + r() * 4], [x1, y0 + 8], [x1 - r() * 4, y1 - 6], [x1 - 10, y1], [x0 + 8, y1 - r() * 3], [x0, y1 - 8], [x0 + r() * 3, y0 + 7]);
        const d = smoothD(pts, true, 0.35);
        outlines.push(d);
        fills.push(d);
        const cxx = (x0 + x1) / 2;
        const cyy = (y0 + y1) / 2;
        const tone: Tone = (px, py) => 0.25 + ((px - cxx) / (x1 - x0)) * 0.6 + ((py - cyy) / (y1 - y0)) * 0.6;
        shades.push(hatch([pts], { angle: 50 + r() * 20, spacing: 4.2, tone, threshold: 0.45, seed: `${seed}${row}${cx}`, step: 3 }));
      }
      cx += sw;
    }
  }
  items.push(F(fills.join(""), "stone", 0.75));
  items.push(HT(shades.join(""), 1, 0.8));
  items.push(L(outlines.join(""), 1.8));
  items.push(HT(hatch([rectP(x, y, w, h)], { angle: 0, spacing: rh, seed: seed + "m" }), 2.4, 0.5));
  return items;
};

// Brick courses clipped to a polygon
export const bricks = (poly: Poly, course = 12, seed = "brick"): string => {
  const courses = hatch([poly], { angle: 0, spacing: course, seed, trim: 0, minLen: 1 });
  let ys = Infinity;
  let ye = -Infinity;
  let xs = Infinity;
  let xe = -Infinity;
  for (const [px, py] of poly) {
    ys = Math.min(ys, py);
    ye = Math.max(ye, py);
    xs = Math.min(xs, px);
    xe = Math.max(xe, px);
  }
  const heads: string[] = [];
  let row = 0;
  for (let yy = ys; yy < ye; yy += course, row++) {
    for (let xx = xs + (row % 2) * course; xx < xe; xx += course * 2) heads.push(`M${xx.toFixed(1)} ${yy.toFixed(1)}v${course.toFixed(1)}`);
  }
  return courses + heads.join("");
};

// Multi-pane sash window with lintel, sill and shaded panes
export const sashWindow = (x: number, y: number, w: number, h: number, o: { cols?: number; rows?: number; arch?: boolean; shutters?: boolean; seed?: string } = {}): InkItem[] => {
  const cols = o.cols ?? 3;
  const rows = o.rows ?? 4;
  const items: InkItem[] = [];
  const frame: Pt[] = o.arch
    ? [[x, y + h], [x, y + w / 2], ...ellipseP(x + w / 2, y + w / 2, w / 2, w / 2, 16, Math.PI, TAU).slice(1, -1), [x + w, y + w / 2], [x + w, y + h]]
    : rectP(x, y, w, h);
  items.push(F(polyD(frame), "ink", 0.55));
  const glassTone: Tone = (px, py) => 0.45 + ((py - y) / h) * 0.35 + ((px - x) / w) * 0.15;
  items.push(HT(hatch([frame], { angle: 0, spacing: 3, tone: glassTone, threshold: 0.4, seed: o.seed ?? "win" }), 1, 0.9));
  const bars: string[] = [];
  for (let c = 1; c < cols; c++) bars.push(`M${(x + (w * c) / cols).toFixed(1)} ${(y + (o.arch ? w * 0.2 : 0)).toFixed(1)}V${(y + h).toFixed(1)}`);
  for (let rr = 1; rr < rows; rr++) bars.push(`M${x.toFixed(1)} ${(y + (h * rr) / rows).toFixed(1)}H${(x + w).toFixed(1)}`);
  items.push(L(bars.join(""), 1.6, { color: "paper" }));
  items.push(L(polyD(frame), 2.2));
  items.push(L(polyD(rectP(x - 6, y + h, w + 12, 7)), 1.6));
  if (!o.arch) {
    items.push(L(polyD([[x - 8, y - 4], [x + w + 8, y - 4], [x + w + 4, y - 16], [x - 4, y - 16]]), 1.6));
    items.push(F(polyD([[x - 8, y - 4], [x + w + 8, y - 4], [x + w + 4, y - 16], [x - 4, y - 16]]), "stone", 0.9));
  }
  if (o.shutters) {
    for (const sx of [x - w * 0.45 - 4, x + w + 4]) {
      items.push(F(polyD(rectP(sx, y, w * 0.45, h)), "wood", 0.8));
      items.push(L(polyD(rectP(sx, y, w * 0.45, h)), 1.4));
      items.push(HT(hatch([rectP(sx, y, w * 0.45, h)], { angle: 0, spacing: 5, seed: "sh" }), 0.9, 0.6));
    }
  }
  return items;
};

// Fluted classical column with capital and base; cylinder shading
export const column = (x: number, yTop: number, yBot: number, r: number, o: { doric?: boolean; seed?: string; flutes?: number } = {}): InkItem[] => {
  const items: InkItem[] = [];
  const body: Pt[] = [
    [x - r * 0.9, yTop],
    [x + r * 0.9, yTop],
    [x + r, yBot],
    [x - r, yBot],
  ];
  items.push(F(polyD(body), "stone", 0.7));
  engrave([body], tones.cylinder(x, r, -0.55, 0.08), { angle: 90, spacing: 4.5, levels: [0.35, 0.62, 0.85], angles: [90, 80, 100], seed: o.seed ?? "col" }).forEach((l) =>
    items.push(HT(l.d, l.w)),
  );
  const fl = o.flutes ?? 7;
  const flutes: string[] = [];
  for (let k = 1; k < fl; k++) {
    const t = -1 + (2 * k) / fl;
    const sx = Math.sin((t * Math.PI) / 2);
    flutes.push(`M${(x + sx * r * 0.9).toFixed(1)} ${(yTop + 6).toFixed(1)}L${(x + sx * r).toFixed(1)} ${(yBot - 6).toFixed(1)}`);
  }
  items.push(L(flutes.join(""), 1.1, { op: 0.8 }));
  items.push(L(polyD(body), 2.4));
  // capital
  const capH = r * 0.55;
  const cap: Pt[] = o.doric
    ? [[x - r * 1.35, yTop - capH], [x + r * 1.35, yTop - capH], [x + r * 1.35, yTop - capH * 0.55], [x + r * 0.95, yTop], [x - r * 0.95, yTop], [x - r * 1.35, yTop - capH * 0.55]]
    : [[x - r * 1.5, yTop - capH], [x + r * 1.5, yTop - capH], [x + r * 1.2, yTop], [x - r * 1.2, yTop]];
  items.push(...solid(cap, { fill: "stone", op: 0.8, tone: tones.linear(x, yTop - capH, x, yTop, 0.3, 0.8), angle: 0, spacing: 4, w: 2.2, seed: "cap" }));
  if (!o.doric) {
    for (const s of [-1, 1]) items.push(L(polyD(ellipseP(x + s * r * 1.3, yTop - capH * 0.45, capH * 0.35, capH * 0.35, 20)), 1.6));
  }
  // base
  const base: Pt[] = [[x - r * 1.3, yBot], [x + r * 1.3, yBot], [x + r * 1.4, yBot + r * 0.4], [x - r * 1.4, yBot + r * 0.4]];
  items.push(...solid(base, { fill: "stone", op: 0.8, tone: tones.linear(x - r, 0, x + r, 0, 0.2, 0.8), angle: 90, spacing: 4, w: 2.2, seed: "base" }));
  return items;
};

// Engraved deciduous tree: trunk, branching limbs and scalloped foliage masses
export const tree = (x: number, y: number, h: number, seed = "tree", o: { width?: number; dark?: number } = {}): InkItem[] => {
  const r = rng(seed);
  const items: InkItem[] = [];
  const tw = h * 0.05;
  const trunk: Pt[] = [
    [x - tw * 1.4, y],
    [x - tw * 0.8, y - h * 0.2],
    [x - tw * 0.6, y - h * 0.45],
    [x + tw * 0.6, y - h * 0.45],
    [x + tw * 0.8, y - h * 0.2],
    [x + tw * 1.4, y],
  ];
  items.push(...solid(trunk, { fill: "wood", op: 0.8, tone: tones.cylinder(x, tw, -0.5), angle: 90, spacing: 3.5, w: 2, seed: seed + "t" }));
  const W = h * (o.width ?? 0.75);
  const masses: { cx: number; cy: number; rx: number; ry: number }[] = [];
  for (let i = 0; i < 9; i++) {
    const a = r() * TAU;
    const d = Math.sqrt(r());
    masses.push({ cx: x + Math.cos(a) * d * W * 0.35, cy: y - h * 0.62 + Math.sin(a) * d * h * 0.22, rx: W * (0.18 + r() * 0.12), ry: h * (0.13 + r() * 0.08) });
  }
  masses.sort((a, b) => a.cy - b.cy);
  const outline: string[] = [];
  const shade: string[] = [];
  const fill: string[] = [];
  masses.forEach((m, i) => {
    const pts: Pt[] = [];
    const n = 22;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * TAU;
      const sc = 1 + 0.12 * Math.sin(a * 7 + i) + 0.06 * Math.sin(a * 13 + i * 2);
      pts.push([m.cx + Math.cos(a) * m.rx * sc, m.cy + Math.sin(a) * m.ry * sc]);
    }
    const d = smoothD(pts, true, 0.5);
    outline.push(d);
    fill.push(d);
    const tone: Tone = (px, py) => (o.dark ?? 0.2) + ((px - m.cx) / m.rx) * 0.35 + ((py - m.cy) / m.ry) * 0.45 + 0.2;
    shade.push(hatch([pts], { angle: 30 + r() * 30, spacing: 3.8, tone, threshold: 0.42, seed: seed + i, step: 3 }));
    shade.push(hatch([pts], { angle: -40, spacing: 4.2, tone, threshold: 0.78, seed: seed + i + "b", step: 3 }));
  });
  items.push(F(fill.join(""), "foliage", 0.75));
  items.push(HT(shade.join(""), 1, 0.85));
  items.push(L(outline.join(""), 1.5));
  return items;
};

// Grass tufts along a ground line
export const grass = (x0: number, x1: number, y: number | ((x: number) => number), seed = "grass", density = 0.12, height = 22): string => {
  const r = rng(seed);
  const out: string[] = [];
  const gy = typeof y === "number" ? () => y : y;
  for (let x = x0; x < x1; x += 1 / density) {
    const xx = x + r() * 6;
    const yy = gy(xx);
    const n = 2 + Math.floor(r() * 3);
    for (let k = 0; k < n; k++) {
      const hh = height * (0.5 + r() * 0.8);
      const lean = (r() - 0.5) * hh * 0.8;
      out.push(`M${(xx + k * 2).toFixed(1)} ${yy.toFixed(1)}q${(lean * 0.3).toFixed(1)} ${(-hh * 0.6).toFixed(1)} ${lean.toFixed(1)} ${(-hh).toFixed(1)}`);
    }
  }
  return out.join("");
};

// Ground plane: a horizon line, perspective furrows and stippled texture
export const groundHatch = (x0: number, x1: number, yTop: number, yBot: number, seed = "gnd", spacing = 6): string => {
  const tone: Tone = (_, py) => 0.2 + ((py - yTop) / (yBot - yTop)) * 0.7;
  return hatch([rectP(x0, yTop, x1 - x0, yBot - yTop)], { angle: 0, spacing, tone, threshold: 0.3, seed, trim: 8, wobble: 1.2, step: 10 });
};

export { ellipseP, polyD, rectP, smoothD, tones, hatch, engrave };
