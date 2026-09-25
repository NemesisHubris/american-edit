// Drawings for The Founding: candle desk props, quill, Independence Hall,
// Liberty Bell, flintlock musket, tricorn, Durham boat.
import type { InkItem } from "../components/InkDraw";
import { ellipseP, hatch, hatchParam, Pt, polyD, rectP, smoothD, Tone, tones } from "../lib/engrave";
import { TAU } from "../lib/math";
import { rng } from "../lib/random";
import { bricks, F, HT, L, sashWindow, solid } from "./kit";

// ---------- Candle desk ----------
export const deskItems = (vx: number, vy: number): InkItem[] => {
  const items: InkItem[] = [];
  const top: Pt[] = [[-400, 720], [2320, 720], [2320, 1500], [-400, 1500]];
  items.push(F(polyD(top), "wood", 0.85));
  const planks: string[] = [];
  for (let k = -12; k <= 12; k++) {
    const bx = vx + k * 230;
    planks.push(`M${(vx + (bx - vx) * 0.2).toFixed(1)} 720L${(vx + (bx - vx) * 2.2).toFixed(1)} 1500`);
  }
  items.push(L(planks.join(""), 1.8));
  // grain: long wavy lines following the planks
  const r = rng("grain");
  const grain: string[] = [];
  for (let i = 0; i < 90; i++) {
    const k = -12 + r() * 24;
    const pts: Pt[] = [];
    for (let t = 0; t <= 1; t += 0.1) {
      const y = 720 + t * 780;
      const bx = vx + k * 230;
      const x = vx + (bx - vx) * (0.2 + t * 2) + Math.sin(t * 9 + i) * 6;
      pts.push([x, y]);
    }
    grain.push(smoothD(pts));
  }
  items.push(HT(grain.join(""), 1, 0.55));
  items.push(HT(hatch([top], { angle: 0, spacing: 5, tone: (x, y) => 0.2 + Math.abs(x - vx) / 2400 + (y - 720) / 1800, threshold: 0.42, seed: "desk" }), 1, 0.6));
  items.push(L("M-400 720H2320", 3));
  return items;
};

export const candleItems = (cx: number, top: number, base: number): InkItem[] => {
  const items: InkItem[] = [];
  const w = 34;
  const body: Pt[] = [[cx - w, top + 6], [cx + w, top + 6], [cx + w, base], [cx - w, base]];
  items.push(...solid(body, { fill: "flagWhite", op: 0.95, tone: tones.cylinder(cx, w, -0.6, 0.02), angle: 90, spacing: 3.5, levels: [0.45, 0.72], seed: "cand", w: 2.4 }));
  items.push(L(polyD(ellipseP(cx, top + 6, w, 9, 30)), 2));
  // drips
  items.push(L(smoothD([[cx - w + 6, top + 8], [cx - w + 4, top + 40], [cx - w + 10, top + 62], [cx - w + 14, top + 40], [cx - w + 16, top + 10]]), 1.8));
  items.push(L(smoothD([[cx + 10, top + 12], [cx + 12, top + 70], [cx + 18, top + 90], [cx + 22, top + 60], [cx + 20, top + 14]]), 1.8));
  items.push(L(`M${cx} ${top + 4}V${top - 12}`, 2.2)); // wick
  // brass holder
  const dish = ellipseP(cx, base + 8, 118, 28, 48);
  items.push(F(polyD(dish), "gold", 0.9));
  items.push(HT(hatch([dish], { angle: 0, spacing: 3.5, tone: (x) => 0.3 + (x - cx) / 200, threshold: 0.4, seed: "dish" }), 1, 0.8));
  items.push(L(polyD(dish), 2.4));
  items.push(L(polyD(ellipseP(cx, base + 2, 96, 20, 40)), 1.4));
  const cup: Pt[] = [[cx - w - 10, base - 18], [cx + w + 10, base - 18], [cx + w + 16, base + 6], [cx - w - 16, base + 6]];
  items.push(...solid(cup, { fill: "gold", op: 0.95, tone: tones.cylinder(cx, w + 12, -0.5), angle: 90, spacing: 3.2, w: 2, seed: "cup" }));
  items.push(L(`M${cx + 110} ${base + 4}c40 -6 50 36 8 40`, 3.2));
  return items;
};

export const inkwellItems = (x: number, y: number): InkItem[] => {
  const items: InkItem[] = [];
  const body: Pt[] = [[x - 70, y - 90], [x + 70, y - 90], [x + 80, y], [x - 80, y]];
  items.push(...solid(body, { fill: "inkSoft", op: 0.6, tone: (px) => 0.3 + (px - x) / 180, angle: 70, spacing: 3.2, levels: [0.4, 0.7], seed: "iw", w: 2.4 }));
  items.push(L(polyD(ellipseP(x, y - 90, 70, 14, 40)), 2));
  const neck: Pt[] = [[x - 34, y - 90], [x + 34, y - 90], [x + 30, y - 118], [x - 30, y - 118]];
  items.push(...solid(neck, { fill: "ink", op: 0.8, w: 2 }));
  items.push(L(polyD(ellipseP(x, y - 118, 30, 7, 30)), 2));
  items.push(L(`M${x - 50} ${y - 70}q10 30 0 60`, 2, { color: "paper", op: 0.8 }));
  return items;
};

export const booksItems = (x: number, y: number): InkItem[] => {
  const items: InkItem[] = [];
  const specs = [
    [0, 0, 360, 56],
    [18, -56, 320, 48],
    [-10, -104, 340, 44],
  ];
  specs.forEach(([dx, dy, w, h], i) => {
    const b: Pt[] = [[x + dx, y + dy - h], [x + dx + w, y + dy - h], [x + dx + w + 20, y + dy - h + 8], [x + dx + w + 20, y + dy + 8], [x + dx + 20, y + dy + 8], [x + dx, y + dy]];
    items.push(...solid(b, { fill: i % 2 ? "brick" : "wood", op: 0.85, tone: (px, py) => 0.35 + (py - (y + dy - h)) / (h * 2), angle: 0, spacing: 3.4, levels: [0.45, 0.75], seed: `bk${i}`, w: 2.2 }));
    items.push(L(`M${x + dx + w} ${y + dy - h}V${y + dy}M${x + dx + 30} ${y + dy - h + 10}H${x + dx + w - 30}M${x + dx + 30} ${y + dy - 10}H${x + dx + w - 30}`, 1.4));
    const pages: string[] = [];
    for (let k = 1; k < 6; k++) pages.push(`M${x + dx + w + 2} ${y + dy - h + 2 + (k * h) / 6}l18 8`);
    items.push(L(pages.join(""), 0.9));
  });
  return items;
};

// ---------- Quill (nib at 0,0, feather rising along -y) ----------
export const quillItems = (len: number): InkItem[] => {
  const items: InkItem[] = [];
  const shaftAt = (t: number): Pt => [Math.sin(t * 1.4) * len * 0.05, -t * len];
  const shaft = Array.from({ length: 21 }, (_, i) => shaftAt(i / 20));
  const vane = (side: number): Pt[] => {
    const pts: Pt[] = [];
    for (let i = 0; i <= 24; i++) {
      const t = 0.22 + (0.78 * i) / 24;
      const [sx, sy] = shaftAt(t);
      const w = side > 0 ? 58 : 44;
      const width = w * Math.sin(Math.min(1, (t - 0.2) / 0.8) * Math.PI) ** 0.7 * (1 - 0.15 * Math.sin(t * 30));
      pts.push([sx + side * width, sy - width * 0.25]);
    }
    return pts;
  };
  for (const side of [-1, 1]) {
    const edge = vane(side);
    const poly = [...Array.from({ length: 25 }, (_, i) => shaftAt(0.22 + (0.78 * i) / 24)), ...edge.slice().reverse()];
    items.push(F(polyD(poly), side > 0 ? "flagWhite" : "paper", 0.95));
    // barbs
    const barbs: string[] = [];
    for (let i = 0; i < 60; i++) {
      const t = 0.24 + (0.74 * i) / 60;
      const [sx, sy] = shaftAt(t);
      const k = Math.min(24, Math.round(((t - 0.22) / 0.78) * 24));
      const [ex, ey] = edge[k];
      barbs.push(`M${sx.toFixed(1)} ${sy.toFixed(1)}Q${((sx + ex) / 2).toFixed(1)} ${((sy + ey) / 2 + 6).toFixed(1)} ${ex.toFixed(1)} ${(ey - 10).toFixed(1)}`);
    }
    items.push(HT(barbs.join(""), 0.9, side > 0 ? 0.55 : 0.85));
    items.push(L(smoothD(edge), 1.8));
  }
  items.push(L(smoothD(shaft), 3.2));
  // nib
  items.push(L(polyD([[0, 0], [-7, -60], [7, -60]]), 2));
  items.push(F(polyD([[0, 0], [-7, -60], [7, -60]]), "ink", 0.8));
  items.push(L("M0 -4V-30", 1));
  return items;
};

// ---------- Independence Hall (front, ground at gy, centred cx) ----------
export const hallItems = (cx: number, gy: number): { items: InkItem[]; order: number } => {
  const items: InkItem[] = [];
  const bw = 820;
  const x0 = cx - bw / 2;
  const eave = gy - 330;
  const facade = rectP(x0, eave, bw, gy - eave);
  items.push(F(polyD(facade), "brick", 0.75));
  items.push(HT(bricks(facade, 9, "hall"), 0.8, 0.55));
  items.push(HT(hatch([facade], { angle: 0, spacing: 4.5, tone: (x) => 0.3 + (cx - x) / 1400, threshold: 0.42, seed: "hallsh" }), 1, 0.5));
  // belt course, water table, cornice with modillions
  items.push(...solid(rectP(x0 - 6, gy - 172, bw + 12, 14), { fill: "stone", op: 1, w: 1.8 }));
  items.push(...solid(rectP(x0 - 10, gy - 34, bw + 20, 34), { fill: "stone", op: 1, tone: tones.const(0.5), angle: 0, spacing: 4, w: 2 }));
  const cornice: Pt[] = [[x0 - 26, eave - 30], [x0 + bw + 26, eave - 30], [x0 + bw + 12, eave], [x0 - 12, eave]];
  items.push(...solid(cornice, { fill: "flagWhite", op: 1, tone: tones.linear(0, eave - 30, 0, eave, 0.2, 0.9), angle: 0, spacing: 3, w: 2.2 }));
  const mods: string[] = [];
  for (let x = x0 - 6; x < x0 + bw + 6; x += 16) mods.push(polyD(rectP(x, eave - 10, 7, 8)));
  items.push(L(mods.join(""), 1));
  // roof with balustrade and chimneys
  const roof: Pt[] = [[x0 - 20, eave - 30], [x0 + bw + 20, eave - 30], [x0 + bw - 70, eave - 120], [x0 + 70, eave - 120]];
  items.push(...solid(roof, { fill: "steel", op: 0.85, tone: tones.const(0.55), angle: 75, spacing: 4, levels: [0.3, 0.6], w: 2.2, seed: "roof" }));
  const bal: string[] = [];
  for (let x = x0 + 90; x < x0 + bw - 90; x += 14) bal.push(`M${x} ${eave - 120}v-26`);
  items.push(L(`M${x0 + 80} ${eave - 150}H${x0 + bw - 80}M${x0 + 80} ${eave - 122}H${x0 + bw - 80}` + bal.join(""), 1.6));
  for (const chx of [x0 + 90, x0 + bw - 130]) items.push(...solid(rectP(chx, eave - 200, 40, 80), { fill: "brick", op: 0.9, tone: tones.const(0.45), angle: 0, spacing: 4, w: 2 }));
  // windows: two storeys, seven bays, centre doorway
  const bay = bw / 7;
  for (let b = 0; b < 7; b++) {
    const wx = x0 + b * bay + bay * 0.26;
    const ww = bay * 0.48;
    items.push(...sashWindow(wx, eave + 34, ww, 110, { cols: 3, rows: 4, seed: `u${b}` }));
    if (b !== 3) items.push(...sashWindow(wx, gy - 150, ww, 110, { cols: 3, rows: 4, seed: `l${b}` }));
  }
  // doorway with pediment and fanlight
  const dx = cx - 46;
  items.push(...sashWindow(dx, gy - 150, 92, 150, { cols: 2, rows: 3, arch: true, seed: "door" }));
  items.push(L(polyD([[dx - 22, gy - 160], [cx, gy - 205], [dx + 114, gy - 160]]), 2.4));
  items.push(F(polyD([[dx - 22, gy - 160], [cx, gy - 205], [dx + 114, gy - 160]]), "stone", 1));
  for (const px of [dx - 16, dx + 100]) items.push(...solid(rectP(px, gy - 160, 12, 160), { fill: "stone", op: 1, w: 1.6 }));
  // steps
  for (let k = 0; k < 3; k++) items.push(L(polyD(rectP(cx - 90 - k * 16, gy + k * 12, 180 + k * 32, 12)), 1.6));
  // tower: brick shaft, then white wooden steeple stages
  const tw = 150;
  const tTop = eave - 360;
  const tower = rectP(cx - tw / 2, tTop, tw, eave - 120 - tTop);
  items.push(F(polyD(tower), "brick", 0.8));
  items.push(HT(bricks(tower, 9, "twr"), 0.8, 0.55));
  items.push(HT(hatch([tower], { angle: 90, spacing: 4, tone: (x) => (x - cx) / tw + 0.4, threshold: 0.5, seed: "twsh" }), 1, 0.6));
  items.push(L(polyD(tower), 2.4));
  items.push(...sashWindow(cx - 26, tTop + 70, 52, 120, { cols: 2, rows: 5, arch: true, seed: "tw1" }));
  // clock face
  items.push(F(polyD(ellipseP(cx, tTop + 30, 26, 26, 30)), "flagWhite", 1));
  items.push(L(polyD(ellipseP(cx, tTop + 30, 26, 26, 30)), 2));
  items.push(L(`M${cx} ${tTop + 30}l0 -18M${cx} ${tTop + 30}l12 6`, 1.6));
  // steeple: octagonal stage, arched cupola, lantern, spire
  const st1 = rectP(cx - 62, tTop - 110, 124, 110);
  items.push(...solid(st1, { fill: "flagWhite", op: 1, tone: tones.cylinder(cx, 62, -0.5), angle: 90, spacing: 3.6, levels: [0.4, 0.7], w: 2.2, seed: "st1" }));
  for (const ax of [cx - 44, cx - 10, cx + 24]) items.push(...sashWindow(ax, tTop - 96, 20, 78, { cols: 1, rows: 3, arch: true, seed: `st${ax}` }));
  items.push(...solid([[cx - 76, tTop - 110], [cx + 76, tTop - 110], [cx + 64, tTop - 126], [cx - 64, tTop - 126]], { fill: "flagWhite", op: 1, w: 2 }));
  const st2 = rectP(cx - 42, tTop - 216, 84, 90);
  items.push(...solid(st2, { fill: "flagWhite", op: 1, tone: tones.cylinder(cx, 42, -0.5), angle: 90, spacing: 3.4, levels: [0.4, 0.7], w: 2.2, seed: "st2" }));
  for (const ax of [cx - 30, cx + 4]) items.push(...sashWindow(ax, tTop - 204, 26, 66, { cols: 1, rows: 3, arch: true, seed: `sb${ax}` }));
  items.push(...solid([[cx - 54, tTop - 216], [cx + 54, tTop - 216], [cx + 30, tTop - 240], [cx - 30, tTop - 240]], { fill: "flagWhite", op: 1, w: 2 }));
  const spire: Pt[] = [[cx - 26, tTop - 240], [cx + 26, tTop - 240], [cx + 4, tTop - 380], [cx - 4, tTop - 380]];
  items.push(...solid(spire, { fill: "flagWhite", op: 1, tone: tones.cylinder(cx, 26, -0.5), angle: 90, spacing: 3, levels: [0.45], w: 2.2, seed: "spire" }));
  items.push(L(polyD(ellipseP(cx, tTop - 392, 10, 10, 20)), 2));
  items.push(L(`M${cx} ${tTop - 402}V${tTop - 450}M${cx - 14} ${tTop - 430}H${cx + 14}`, 2));
  items.push(L(polyD(facade), 2.6));
  // side arcades
  for (const sd of [-1, 1]) {
    const ax0 = sd < 0 ? x0 - 330 : x0 + bw;
    const arc = rectP(ax0, gy - 170, 330, 170);
    items.push(F(polyD(arc), "brick", 0.7));
    items.push(HT(bricks(arc, 9, `arc${sd}`), 0.8, 0.5));
    for (let k = 0; k < 4; k++) {
      const ax = ax0 + 22 + k * 78;
      items.push(F(polyD([[ax, gy], [ax, gy - 80], ...ellipseP(ax + 26, gy - 80, 26, 30, 12, Math.PI, TAU).slice(1, -1), [ax + 52, gy - 80], [ax + 52, gy]]), "ink", 0.7));
      items.push(L(polyD([[ax, gy], [ax, gy - 80], ...ellipseP(ax + 26, gy - 80, 26, 30, 12, Math.PI, TAU).slice(1, -1), [ax + 52, gy - 80], [ax + 52, gy]], false), 1.6));
    }
    items.push(L(polyD(arc), 2.2));
    items.push(...solid([[ax0 - 10, gy - 170], [ax0 + 340, gy - 170], [ax0 + 320, gy - 205], [ax0 + 10, gy - 205]], { fill: "steel", op: 0.85, tone: tones.const(0.5), angle: 75, spacing: 4, w: 2 }));
  }
  return { items, order: 0 };
};

// ---------- Liberty Bell (pivot at 0,0 = yoke centre; bell hangs below) ----------
export const bellGeo = () => {
  const items: InkItem[] = [];
  const H = 520;
  const top = 90;
  const rOf = (v: number) => 150 + 40 * v + 175 * Math.pow(v, 3.2);
  const yOf = (v: number) => top + v * H;
  const e = 0.2;
  const surf = (u: number, v: number): Pt => {
    const th = Math.PI * (1 - u);
    const r = rOf(v);
    return [Math.cos(th) * r, yOf(v) + Math.sin(th) * r * e];
  };
  const left = Array.from({ length: 30 }, (_, i) => [-rOf(i / 29), yOf(i / 29)] as Pt);
  const right = Array.from({ length: 30 }, (_, i) => [rOf(i / 29), yOf(i / 29)] as Pt);
  const lip = ellipseP(0, yOf(1), rOf(1), rOf(1) * e, 60, 0, Math.PI);
  const crown = ellipseP(0, top, rOf(0), 95, 30, Math.PI, TAU);
  const body: Pt[] = [...crown, ...right, ...lip.slice().reverse(), ...left.slice().reverse()];
  items.push(F(polyD(body), "metal", 0.95));
  const tone = (u: number, v: number) => 0.1 + Math.pow(u, 1.2) * 0.8 + (v > 0.9 ? 0.15 : 0);
  items.push(HT(hatchParam(surf, { lines: 110, samples: 36, tone, threshold: 0.3, seed: "bellw" }), 1, 0.9));
  items.push(HT(hatchParam((v, u) => surf(u, v), { lines: 60, samples: 30, tone: (v, u) => tone(u, v), threshold: 0.62, seed: "bellv" }), 1, 0.85));
  items.push(HT(hatch([crown.concat([[rOf(0), top], [-rOf(0), top]])], { angle: 20, spacing: 3.6, tone: (x) => 0.3 + x / 250, threshold: 0.45, seed: "crown" }), 1, 0.85));
  // bands
  for (const v of [0.08, 0.16, 0.86, 0.93]) items.push(L(polyD(Array.from({ length: 31 }, (_, i) => surf(i / 30, v)), false), v > 0.8 ? 2.6 : 2.2));
  // mouth interior + clapper
  items.push(F(polyD(ellipseP(0, yOf(1), rOf(1) * 0.96, rOf(1) * e * 0.9, 50)), "ink", 0.9));
  items.push(L(polyD(ellipseP(0, yOf(1), rOf(1), rOf(1) * e, 60)), 3.2));
  items.push(L(smoothD(left), 3.2));
  items.push(L(smoothD(right), 3.2));
  items.push(L(polyD(crown, false), 3));
  // yoke with iron straps
  const yoke: Pt[] = [[-430, -30], [430, -30], [450, 10], [430, 50], [-430, 50], [-450, 10]];
  items.push(...solid(yoke, { fill: "wood", op: 0.95, tone: tones.linear(0, -30, 0, 50, 0.25, 0.85), angle: 0, spacing: 3.4, levels: [0.4, 0.7], w: 3, seed: "yoke" }));
  const grainR = rng("yk");
  const gr: string[] = [];
  for (let i = 0; i < 16; i++) {
    const y = -20 + grainR() * 60;
    gr.push(smoothD([[-420, y], [-200, y + 4], [0, y - 3], [200, y + 3], [420, y]]));
  }
  items.push(L(gr.join(""), 0.9, { op: 0.6 }));
  for (const sx of [-110, 70]) {
    const strap: Pt[] = [[sx, -34], [sx + 40, -34], [sx + 40, top - 20], [sx, top - 20]];
    items.push(...solid(strap, { fill: "steel", op: 1, tone: tones.const(0.5), angle: 90, spacing: 3, w: 2 }));
    items.push(L(`M${sx + 20} -10v10M${sx + 20} 30v10`, 3));
  }
  // the crack: widened zig-zag from the lip upward
  const r = rng("crack");
  const crack: Pt[] = [];
  let cxk = -70;
  for (let v = 1; v >= 0.3; v -= 0.035) {
    cxk += (r() - 0.45) * 16;
    const [px, py] = surf(0.5 + cxk / (2 * rOf(v)), v);
    crack.push([px, py]);
  }
  const crackD = polyD(crack, false);
  return { items, crackD, rOf, yOf, surf };
};

// ---------- Flintlock musket, muzzle at 0,0, lying along +x ----------
export const musketItems = (len: number, seed = "musket"): InkItem[] => {
  const items: InkItem[] = [];
  const bl = len * 0.66;
  const barrel: Pt[] = [[0, -5], [bl, -7], [bl, 7], [0, 5]];
  items.push(...solid(barrel, { fill: "steel", op: 1, tone: tones.linear(0, -7, 0, 7, 0.2, 0.9), angle: 0, spacing: 2.4, levels: [0.5], w: 2, seed }));
  items.push(L(`M4 11H${bl - 20}`, 2.4));
  for (const bx of [bl * 0.28, bl * 0.55, bl * 0.8]) items.push(...solid(rectP(bx, -9, 9, 22), { fill: "gold", op: 1, w: 1.4 }));
  const stock: Pt[] = [
    [bl * 0.12, 6], [bl, 8], [bl + 20, -10], [bl + 60, -12], [len - 30, 4], [len, 10], [len + 6, 52], [len - 20, 56], [bl + 90, 26], [bl + 40, 22], [bl * 0.12, 18],
  ];
  items.push(...solid(stock, { fill: "wood", op: 0.95, tone: (x, y) => 0.25 + (y + 10) / 90 + Math.max(0, (x - bl) / len) * 0.2, angle: 12, spacing: 3.2, levels: [0.4, 0.68], w: 2.2, seed: seed + "s" }));
  items.push(...solid([[len - 4, 8], [len + 6, 10], [len + 12, 54], [len + 2, 56]], { fill: "gold", op: 1, w: 1.6 }));
  // lock plate, hammer, frizzen, trigger guard
  items.push(...solid([[bl - 20, 8], [bl + 50, 8], [bl + 56, 22], [bl - 14, 22]], { fill: "steel", op: 1, w: 1.6 }));
  items.push(L(`M${bl + 18} 8c-6 -16 6 -30 18 -26l-4 8c-6 0 -10 8 -6 18`, 2));
  items.push(L(`M${bl - 6} 8v-16h10`, 2));
  items.push(L(`M${bl + 60} 22c10 22 50 22 60 2`, 2.2));
  items.push(L(`M${bl + 80} 22l4 16`, 2));
  items.push(L(`M${bl * 0.3} 20Q${bl * 0.7} 150 ${bl + 130} 40`, 2, { op: 0.9 }));
  return items;
};

export const tricornItems = (x: number, y: number, s = 1): InkItem[] => {
  const pts: Pt[] = [
    [-120, 0], [-90, -40], [-40, -70], [0, -84], [40, -70], [90, -40], [120, 0], [60, -14], [0, -8], [-60, -14],
  ].map(([px, py]) => [x + px * s, y + py * s] as Pt);
  const crown: Pt[] = [[-60, -40], [-40, -100], [40, -100], [60, -40]].map(([px, py]) => [x + px * s, y + py * s] as Pt);
  return [
    ...solid(crown, { fill: "ink", op: 0.8, tone: tones.const(0.8), angle: 70, spacing: 3, w: 2, smooth: true }),
    ...solid(pts, { fill: "ink", op: 0.85, tone: tones.const(0.8), angle: 20, spacing: 3, w: 2.4, smooth: true }),
    L(smoothD([[x - 100 * s, y - 20 * s], [x, y - 36 * s], [x + 100 * s, y - 20 * s]]), 1.4, { color: "gold" }),
  ];
};

// ---------- Durham boat (side), centred at 0,0 waterline ----------
export const boatItems = (len: number, seed = "boat"): InkItem[] => {
  const items: InkItem[] = [];
  const hull: Pt[] = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    hull.push([-len / 2 + t * len, -Math.pow(Math.abs(t - 0.5) * 2, 3) * 26 - 30]);
  }
  for (let i = 20; i >= 0; i--) {
    const t = i / 20;
    hull.push([-len / 2 + t * len, 14 - (1 - Math.pow(Math.abs(t - 0.5) * 2, 2)) * 6]);
  }
  items.push(...solid(hull, { fill: "wood", op: 0.95, tone: (_, y) => 0.4 + (y + 30) / 60, angle: 0, spacing: 2.8, levels: [0.4, 0.7], w: 2.4, seed, smooth: true }));
  const planks: string[] = [];
  for (const k of [0.3, 0.6]) planks.push(smoothD(Array.from({ length: 11 }, (_, i) => [-len / 2 + (i / 10) * len, -30 + k * 44 - Math.pow(Math.abs(i / 10 - 0.5) * 2, 3) * 26 * (1 - k)] as Pt)));
  items.push(L(planks.join(""), 1.2));
  return items;
};

export const hullTone: Tone = () => 0.5;
export { rectP };
