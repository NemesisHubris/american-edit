// Drawings for Manifest Destiny: conifers, sea stacks and bluffs, the Alamo
// church facade, covered wagon, ox, pioneer.
import type { InkItem } from "../components/InkDraw";
import { engrave, ellipseP, hatch, Pt, polyD, rectP, smoothD, stipple, Tone, tones } from "../lib/engrave";
import { TAU } from "../lib/math";
import { rng } from "../lib/random";
import { F, HT, L, solid } from "./kit";

// Conifer: stacked scalloped tiers, dark on the right
export const pine = (x: number, y: number, h: number, seed = "pine"): InkItem[] => {
  const r = rng(seed);
  const items: InkItem[] = [];
  items.push(...solid([[x - h * 0.02, y], [x - h * 0.012, y - h * 0.3], [x + h * 0.012, y - h * 0.3], [x + h * 0.02, y]], { fill: "wood", op: 0.9, w: 1.6 }));
  const tiers = 6;
  const outline: string[] = [];
  const shade: string[] = [];
  const fills: string[] = [];
  for (let t = 0; t < tiers; t++) {
    const k = t / tiers;
    const ty = y - h * 0.12 - k * h * 0.78;
    const w = h * 0.26 * (1 - k * 0.85);
    const th = h * 0.26;
    const pts: Pt[] = [[x, ty - th]];
    const n = 7;
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      pts.push([x + w * (u * 2 - 1) * 1, ty + (i % 2 ? -th * 0.06 : th * 0.04) + r() * 4]);
    }
    const poly = [pts[0], ...pts.slice(1).reverse().map((p) => p), pts[0]];
    const tier: Pt[] = [[x, ty - th], ...pts.slice(1)];
    fills.push(polyD(tier));
    outline.push(polyD(tier));
    const tone: Tone = (px, py) => 0.3 + ((px - x) / w) * 0.5 + ((py - (ty - th)) / th) * 0.3;
    shade.push(hatch([tier], { angle: 65, spacing: 3.2, tone, threshold: 0.35, seed: `${seed}${t}` }));
    shade.push(hatch([tier], { angle: -30, spacing: 3.6, tone, threshold: 0.68, seed: `${seed}${t}b` }));
    void poly;
  }
  items.push(F(fills.join(""), "foliage", 0.85));
  items.push(HT(shade.join(""), 1, 0.9));
  items.push(L(outline.join(""), 1.5));
  return items;
};

// Rock mass (sea stack / cliff) from a silhouette, facet cracks and hatching
export const rock = (pts: Pt[], seed = "rock", lightLeft = true): InkItem[] => {
  const r = rng(seed);
  let x0 = Infinity;
  let x1 = -Infinity;
  let y0 = Infinity;
  let y1 = -Infinity;
  for (const [x, y] of pts) {
    x0 = Math.min(x0, x);
    x1 = Math.max(x1, x);
    y0 = Math.min(y0, y);
    y1 = Math.max(y1, y);
  }
  const tone: Tone = (x, y) => 0.25 + (lightLeft ? (x - x0) / (x1 - x0) : (x1 - x) / (x1 - x0)) * 0.55 + ((y - y0) / (y1 - y0)) * 0.25;
  const items: InkItem[] = [F(polyD(pts), "stone", 0.9)];
  engrave([pts], tone, { angle: 75, spacing: 4, levels: [0.35, 0.58, 0.8], angles: [75, 160, 20], seed }).forEach((l) => items.push(HT(l.d, l.w)));
  const cracks: string[] = [];
  for (let i = 0; i < 14; i++) {
    const cx = x0 + r() * (x1 - x0);
    const cy = y0 + (0.1 + r() * 0.8) * (y1 - y0);
    cracks.push(smoothD([[cx, cy], [cx + (r() - 0.5) * 30, cy + 20 + r() * 40], [cx + (r() - 0.5) * 50, cy + 60 + r() * 60]]));
  }
  items.push(L(cracks.join(""), 1.3, { op: 0.8 }));
  items.push(L(smoothD(pts, true, 0.3), 2.6));
  return items;
};

// The Alamo church facade, ground at gy, centred cx
export const alamoItems = (cx: number, gy: number): InkItem[] => {
  const items: InkItem[] = [];
  const W = 760;
  const H = 440;
  const x0 = cx - W / 2;
  const top = gy - H;
  // facade with the camelback parapet
  const face: Pt[] = [[x0, gy], [x0, top + 40]];
  for (let i = 0; i <= 30; i++) {
    const t = i / 30;
    const x = x0 + t * W;
    const hump = Math.exp(-Math.pow((t - 0.5) / 0.16, 2)) * 120;
    const scroll = Math.exp(-Math.pow((t - 0.3) / 0.05, 2)) * 22 + Math.exp(-Math.pow((t - 0.7) / 0.05, 2)) * 22;
    face.push([x, top + 40 - hump - scroll * 0.6 + (t < 0.18 || t > 0.82 ? 8 : 0)]);
  }
  face.push([x0 + W, gy]);
  items.push(F(polyD(face), "stone", 0.9));
  items.push(HT(stipple([face], { count: 2600, seed: "alamo", tone: (x, y) => 0.25 + (x - x0) / (W * 3) + (y - top) / (H * 4) }), 2.2, 0.5));
  items.push(HT(hatch([face], { angle: 0, spacing: 5.5, tone: (x) => 0.3 + (x - x0) / W * 0.4, threshold: 0.5, seed: "alsh", trim: 6 }), 1, 0.45));
  items.push(L(polyD(face), 3));
  // cornice line under the parapet
  items.push(L(`M${x0} ${top + 48}H${x0 + W}M${x0} ${top + 60}H${x0 + W}`, 2));
  // central doorway (arched) with engaged columns
  const dw = 110;
  const dh = 210;
  const door: Pt[] = [[cx - dw / 2, gy], [cx - dw / 2, gy - dh + dw / 2], ...ellipseP(cx, gy - dh + dw / 2, dw / 2, dw / 2, 18, Math.PI, TAU).slice(1, -1), [cx + dw / 2, gy - dh + dw / 2], [cx + dw / 2, gy]];
  items.push(F(polyD(door), "ink", 0.85));
  items.push(HT(hatch([door], { angle: 90, spacing: 6, seed: "door" }), 1.2, 0.6, "inkSoft"));
  items.push(L(polyD(door), 3));
  items.push(L(polyD(ellipseP(cx, gy - dh + dw / 2, dw / 2 + 16, dw / 2 + 16, 18, Math.PI, TAU), false), 2.2));
  const colsX = [cx - 150, cx - 95, cx + 95, cx + 150];
  colsX.forEach((x, i) => {
    const colTop = gy - 250;
    items.push(...solid(rectP(x - 12, colTop, 24, 250), { fill: "stone", op: 1, tone: tones.cylinder(x, 12, -0.5), angle: 90, spacing: 3, w: 2, seed: `ac${i}` }));
    items.push(L(`M${x - 18} ${colTop}h36M${x - 16} ${colTop + 8}h32M${x - 18} ${gy}h36`, 2));
    // upper storey columns
    items.push(...solid(rectP(x - 10, gy - 390, 20, 120), { fill: "stone", op: 1, tone: tones.cylinder(x, 10, -0.5), angle: 90, spacing: 3, w: 1.8, seed: `au${i}` }));
  });
  items.push(L(`M${cx - 190} ${gy - 262}H${cx + 190}M${cx - 190} ${gy - 272}H${cx + 190}`, 2.2));
  // niches between the column pairs
  for (const nx of [cx - 122, cx + 122]) {
    for (const ny of [gy - 90, gy - 205]) {
      const niche: Pt[] = [[nx - 20, ny + 50], [nx - 20, ny], ...ellipseP(nx, ny, 20, 22, 10, Math.PI, TAU).slice(1, -1), [nx + 20, ny], [nx + 20, ny + 50]];
      items.push(F(polyD(niche), "ink", 0.6));
      items.push(L(polyD(niche), 1.8));
    }
  }
  // upper window above door
  const uw: Pt[] = [[cx - 40, gy - 290], [cx - 40, gy - 340], ...ellipseP(cx, gy - 340, 40, 40, 12, Math.PI, TAU).slice(1, -1), [cx + 40, gy - 340], [cx + 40, gy - 290]];
  items.push(F(polyD(uw), "ink", 0.8));
  items.push(L(polyD(uw), 2.4));
  // side window openings and battle scars
  for (const wx of [x0 + 70, x0 + W - 130]) {
    items.push(F(polyD(rectP(wx, gy - 330, 60, 90)), "ink", 0.7));
    items.push(L(polyD(rectP(wx, gy - 330, 60, 90)), 2));
  }
  const r = rng("scars");
  const scars: string[] = [];
  for (let i = 0; i < 30; i++) {
    const sx = x0 + 20 + r() * (W - 40);
    const sy = top + 80 + r() * (H - 100);
    scars.push(polyD(ellipseP(sx, sy, 3 + r() * 6, 2 + r() * 4, 8)));
  }
  items.push(L(scars.join(""), 1.4, { op: 0.8 }));
  // ground
  items.push(L(`M${x0 - 300} ${gy}H${x0 + W + 300}`, 2.6));
  return items;
};

// Covered wagon in profile facing left (west). Origin: ground under centre.
// Returns the static body; wheels are drawn separately so they can turn.
export const wagonBody = (): InkItem[] => {
  const items: InkItem[] = [];
  const bed: Pt[] = [[-170, -110], [170, -110], [180, -60], [-180, -60]];
  items.push(...solid(bed, { fill: "wood", op: 0.95, tone: tones.linear(0, -110, 0, -60, 0.3, 0.8), angle: 0, spacing: 3.2, levels: [0.4, 0.7], w: 2.4, seed: "bed" }));
  items.push(L("M-178 -86H176M-100 -110V-60M0 -110V-60M100 -110V-60", 1.3));
  // canvas bonnet over hoops
  const bonnet: Pt[] = [[-190, -112]];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    bonnet.push([-190 + t * 380, -112 - Math.sin(t * Math.PI) * 150 - (t < 0.12 || t > 0.88 ? 20 : 0)]);
  }
  bonnet.push([190, -112]);
  items.push(F(polyD(bonnet), "flagWhite", 0.95));
  items.push(HT(hatch([bonnet], { angle: 90, spacing: 4, tone: (x, y) => 0.2 + (y + 262) / 300 + (x > 100 ? 0.2 : 0), threshold: 0.55, seed: "bon" }), 1, 0.7));
  const hoops: string[] = [];
  for (const hx of [-130, -60, 10, 80, 150]) hoops.push(`M${hx} -112Q${hx + 6} -200 ${hx} ${-112 - Math.sin(((hx + 190) / 380) * Math.PI) * 150}`);
  items.push(L(hoops.join(""), 1.4, { op: 0.8 }));
  items.push(L(smoothD(bonnet.slice(1, -1)), 2.6));
  // puckered opening at the back and front
  items.push(L(polyD(ellipseP(186, -150, 14, 40, 16)), 1.6));
  items.push(L(polyD(ellipseP(-186, -150, 14, 40, 16)), 1.6));
  // tongue toward the oxen, water barrel, bucket
  items.push(L("M-180 -66L-330 -40", 4));
  items.push(...solid(rectP(120, -104, 40, 44), { fill: "wood", op: 1, w: 1.6 }));
  items.push(L("M-150 -60l-6 20h24l-6 -20", 1.6));
  return items;
};

// Ox in profile facing left; legs animated by `phase`
export const oxBody = (): InkItem[] => {
  const body: Pt[] = [
    [-100, -120], [-60, -140], [40, -140], [100, -128], [120, -100], [118, -60], [90, -50], [-70, -50], [-100, -70], [-130, -96], [-150, -110], [-160, -130], [-140, -140],
  ];
  return [
    ...solid(body, { fill: "wood", op: 0.9, tone: (x, y) => 0.3 + (y + 140) / 140 + x / 600, angle: 20, spacing: 3.4, levels: [0.45, 0.72], w: 2.2, seed: "ox", smooth: true }),
    L("M-150 -132q-20 -30 -6 -40M-138 -136q10 -30 26 -30", 2.2),
    L(polyD(ellipseP(-146, -118, 4, 4, 8)), 2),
    L("M120 -96q30 10 24 50", 1.8),
  ];
};

export const pioneerBody = (): InkItem[] => [
  ...solid([[-14, -96], [14, -96], [18, -40], [-18, -40]], { fill: "inkSoft", op: 0.9, w: 1.8 }),
  F(polyD(ellipseP(0, -110, 12, 13, 14)), "skin", 1),
  L(polyD(ellipseP(0, -110, 12, 13, 14)), 1.8),
  ...solid([[-26, -118], [26, -118], [14, -126], [10, -140], [-10, -140], [-14, -126]], { fill: "ink", op: 0.85, w: 1.8 }),
];
