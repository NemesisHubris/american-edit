// Saturn V on the mobile launcher with its umbilical tower; lunar module;
// astronaut. Rocket base at (0,0), s = pixels per metre.
import type { InkItem } from "../components/InkDraw";
import { ellipseP, engrave, hatch, Pt, polyD, rectP, smoothD, tones } from "../lib/engrave";
import { TAU } from "../lib/math";
import { rng } from "../lib/random";
import { F, HT, L, solid } from "./kit";

export const SATURN_H = 121;

export const saturnVItems = (s: number): { items: InkItem[]; vents: Pt[]; engines: Pt[] } => {
  const items: InkItem[] = [];
  const Y = (m: number) => -m * s;
  const cyl = (m0: number, m1: number, r0: number, r1: number, fill: string, seed: string) => {
    const poly: Pt[] = [[-r0 * s, Y(m0)], [r0 * s, Y(m0)], [r1 * s, Y(m1)], [-r1 * s, Y(m1)]];
    items.push(F(polyD(poly), fill, 0.97));
    engrave([poly], tones.cylinder(0, Math.max(r0, r1) * s, -0.55, 0.02), { angle: 90, spacing: Math.max(2.4, s * 0.35), levels: [0.42, 0.68, 0.87], angles: [90, 20, 160], seed }).forEach((l) => items.push(HT(l.d, l.w)));
    items.push(L(polyD(poly), 2.6));
    return poly;
  };
  // roll-pattern blacks
  const black = (m0: number, m1: number, r: number, side: number) => {
    const x0 = side > 0 ? 0 : -r * s;
    const x1 = side > 0 ? r * s : 0;
    items.push(F(polyD([[x0, Y(m0)], [x1, Y(m0)], [x1, Y(m1)], [x0, Y(m1)]]), "ink", 0.85));
  };
  cyl(0, 42, 5, 5, "flagWhite", "sic");
  black(0, 6, 5, 1);
  black(36, 42, 5, -1);
  black(36, 42, 5, 1);
  const str: string[] = [];
  for (let k = -9; k <= 9; k++) str.push(`M${(k / 10) * 5 * s} ${Y(1)}V${Y(35)}`);
  items.push(L(str.join(""), 0.9, { op: 0.5 }));
  cyl(42, 47, 5, 5, "flagWhite", "is1");
  black(42, 47, 5, 1);
  cyl(47, 72, 5, 5, "flagWhite", "sii");
  cyl(72, 78, 5, 3.3, "flagWhite", "is2");
  black(72, 78, 3.3, 1);
  cyl(78, 96, 3.3, 3.3, "flagWhite", "sivb");
  black(84, 96, 3.3, 1);
  cyl(96, 97, 3.3, 3.3, "steel", "iu");
  cyl(97, 104, 3.3, 1.95, "flagWhite", "sla");
  cyl(104, 108, 1.95, 1.95, "metal", "sm");
  cyl(108, 111.5, 1.95, 0.4, "metal", "cm");
  // launch escape tower: truss + motor + nose
  const truss: string[] = [];
  for (let m = 111.5; m < 116; m += 0.9) truss.push(`M${-0.5 * s} ${Y(m)}L${0.5 * s} ${Y(m + 0.9)}M${0.5 * s} ${Y(m)}L${-0.5 * s} ${Y(m + 0.9)}`);
  items.push(L(truss.join("") + `M${-0.5 * s} ${Y(111.5)}V${Y(116)}M${0.5 * s} ${Y(111.5)}V${Y(116)}`, 1.6));
  cyl(116, 119.5, 0.5, 0.45, "flagRed", "les");
  cyl(119.5, 121, 0.45, 0.05, "ink", "nose");
  // seams between stages
  for (const m of [6, 36, 42, 47, 72, 78, 84, 96, 97]) items.push(L(`M${-5.2 * s} ${Y(m)}H${5.2 * s}`, 1.6, { op: 0.6 }));
  // fins and engine fairings
  const engines: Pt[] = [];
  for (const sd of [-1, 1]) {
    const fin: Pt[] = [[sd * 4.9 * s, Y(7)], [sd * 8.2 * s, Y(0.5)], [sd * 8.6 * s, Y(-2)], [sd * 5 * s, Y(-1)]];
    items.push(...solid(fin, { fill: "metal", op: 1, tone: tones.const(0.55), angle: sd > 0 ? 60 : 120, spacing: 3, levels: [0.4], w: 2.4, seed: `fin${sd}` }));
    const fair: Pt[] = [[sd * 2.4 * s, Y(0)], [sd * 4.6 * s, Y(0)], [sd * 4.2 * s, Y(-3.6)], [sd * 2.8 * s, Y(-3.6)]];
    items.push(...solid(fair, { fill: "steel", op: 1, tone: tones.const(0.5), angle: 90, spacing: 3, w: 2.2 }));
    const bell: Pt[] = [[sd * 3.0 * s, Y(-3.6)], [sd * 4.0 * s, Y(-3.6)], [sd * 5.1 * s, Y(-7.4)], [sd * 1.9 * s, Y(-7.4)]];
    items.push(...solid(bell, { fill: "ink", op: 0.9, tone: tones.const(0.7), angle: 90, spacing: 2.4, w: 2.2 }));
    engines.push([sd * 3.5 * s, Y(-7.4)]);
  }
  items.push(...solid([[-1.6 * s, Y(0)], [1.6 * s, Y(0)], [1.8 * s, Y(-7.4)], [-1.8 * s, Y(-7.4)]], { fill: "ink", op: 0.9, w: 2.2 }));
  engines.splice(1, 0, [0, Y(-7.4)]);
  // lettering band: USA
  items.push(F(`M${-0.6 * s} ${Y(30)}h${1.2 * s}v${-1.2 * s}h${-1.2 * s}Z`, "ink", 0));
  const vents: Pt[] = [
    [5 * s, Y(40)],
    [-5 * s, Y(44)],
    [5 * s, Y(70)],
    [-3.3 * s, Y(80)],
    [3.3 * s, Y(92)],
  ];
  return { items, vents, engines };
};

// Launch umbilical tower left of the rocket, with swing arms and hammerhead
export const towerItems = (s: number): InkItem[] => {
  const items: InkItem[] = [];
  const Y = (m: number) => -m * s;
  const x0 = -30 * s;
  const x1 = -18 * s;
  const lines: string[] = [];
  for (let m = 0; m < 116; m += 6) {
    lines.push(`M${x0} ${Y(m)}L${x1} ${Y(m + 6)}M${x1} ${Y(m)}L${x0} ${Y(m + 6)}M${x0} ${Y(m)}H${x1}`);
  }
  items.push(F(polyD([[x0, Y(0)], [x1, Y(0)], [x1, Y(116)], [x0, Y(116)]]), "brick", 0.25));
  items.push(L(lines.join(""), 1.4));
  items.push(L(`M${x0} ${Y(0)}V${Y(116)}M${x1} ${Y(0)}V${Y(116)}`, 3.4));
  // swing arms
  for (const m of [18, 38, 56, 73, 86, 95, 108]) {
    const armEnd = m > 96 ? -2 * s : m > 78 ? -3.3 * s : -5 * s;
    const arm: Pt[] = [[x1, Y(m)], [armEnd, Y(m)], [armEnd, Y(m + 2)], [x1, Y(m + 2.2)]];
    items.push(...solid(arm, { fill: "brick", op: 0.7, w: 1.8 }));
    const tr: string[] = [];
    for (let x = x1; x < armEnd - 1; x += 1.6 * s) tr.push(`M${x} ${Y(m)}L${x + 0.8 * s} ${Y(m + 2)}L${x + 1.6 * s} ${Y(m)}`);
    items.push(L(tr.join(""), 0.9, { op: 0.8 }));
  }
  // hammerhead crane
  items.push(...solid([[x0 - 4 * s, Y(116)], [x1 + 14 * s, Y(116)], [x1 + 14 * s, Y(119)], [x0 - 4 * s, Y(119)]], { fill: "brick", op: 0.8, w: 2 }));
  items.push(L(`M${x0 + 2 * s} ${Y(119)}V${Y(123)}M${x0 + 2 * s} ${Y(123)}L${x1 + 14 * s} ${Y(119)}`, 1.6));
  // mobile launcher platform
  const ml: Pt[] = [[-42 * s, Y(0)], [26 * s, Y(0)], [26 * s, Y(-8)], [-42 * s, Y(-8)]];
  items.push(...solid(ml, { fill: "steel", op: 1, tone: tones.linear(0, Y(0), 0, Y(-8), 0.3, 0.8), angle: 0, spacing: 3.2, levels: [0.45, 0.7], w: 3, seed: "ml" }));
  items.push(F(polyD([[-9 * s, Y(0)], [9 * s, Y(0)], [7 * s, Y(-8)], [-7 * s, Y(-8)]]), "ink", 0.85));
  for (const x of [-7, 7]) items.push(...solid([[x * s - 1.2 * s, Y(0)], [x * s + 1.2 * s, Y(0)], [x * s + 0.6 * s, Y(2.4)], [x * s - 0.6 * s, Y(2.4)]], { fill: "steel", op: 1, w: 1.8 }));
  return items;
};

// Lunar module, front view: base of footpads at y=0, centred x=0
export const lmItems = (s: number): InkItem[] => {
  const items: InkItem[] = [];
  const Y = (m: number) => -m * s;
  // legs
  for (const sd of [-1, 1]) {
    items.push(L(`M${sd * 2.1 * s} ${Y(2.2)}L${sd * 4.3 * s} ${Y(0.25)}M${sd * 2.1 * s} ${Y(1.2)}L${sd * 4.3 * s} ${Y(0.3)}M${sd * 2.1 * s} ${Y(3.2)}L${sd * 3.6 * s} ${Y(1.3)}`, 3.2));
    items.push(...solid(ellipseP(sd * 4.3 * s, Y(0.15), 0.55 * s, 0.18 * s, 16), { fill: "metal", op: 1, w: 2 }));
    items.push(L(`M${sd * 4.3 * s} ${Y(0)}l0 ${1.4 * s}`, 1.4));
  }
  items.push(L(`M0 ${Y(1.6)}L0 ${Y(0.25)}`, 3));
  items.push(...solid(ellipseP(0, Y(0.15), 0.5 * s, 0.14 * s, 14), { fill: "metal", op: 1, w: 2 }));
  // descent stage: gold-foil octagonal box
  const ds: Pt[] = [[-2.2 * s, Y(1.4)], [2.2 * s, Y(1.4)], [2.6 * s, Y(2.0)], [2.6 * s, Y(3.2)], [2.2 * s, Y(3.6)], [-2.2 * s, Y(3.6)], [-2.6 * s, Y(3.2)], [-2.6 * s, Y(2.0)]];
  items.push(F(polyD(ds), "gold", 0.95));
  const r = rng("foil");
  const crinkle: string[] = [];
  for (let i = 0; i < 70; i++) {
    const x = (r() - 0.5) * 5 * s;
    const y = Y(1.5 + r() * 2);
    crinkle.push(`M${x} ${y}l${(r() - 0.5) * 30} ${(r() - 0.5) * 16}`);
  }
  items.push(HT(crinkle.join(""), 1.1, 0.7));
  items.push(HT(hatch([ds], { angle: 90, spacing: 3.4, tone: (x) => 0.2 + x / (6 * s), threshold: 0.35, seed: "ds" }), 1, 0.6));
  items.push(L(polyD(ds), 2.6));
  // descent engine bell
  items.push(...solid([[-0.6 * s, Y(1.4)], [0.6 * s, Y(1.4)], [0.9 * s, Y(0.7)], [-0.9 * s, Y(0.7)]], { fill: "ink", op: 0.9, w: 2 }));
  // ascent stage
  const as: Pt[] = [[-2.0 * s, Y(3.6)], [2.0 * s, Y(3.6)], [2.3 * s, Y(4.6)], [1.7 * s, Y(6.0)], [-1.7 * s, Y(6.0)], [-2.3 * s, Y(4.6)]];
  items.push(...solid(as, { fill: "stone", op: 1, tone: tones.linear(-2 * s, 0, 2 * s, 0, 0.2, 0.75), angle: 70, spacing: 3.2, levels: [0.45, 0.7], w: 2.8, seed: "as" }));
  for (const sd of [-1, 1]) items.push(...solid([[sd * 0.3 * s, Y(4.4)], [sd * 1.3 * s, Y(4.6)], [sd * 1.0 * s, Y(5.4)]], { fill: "ink", op: 0.9, w: 2 }));
  items.push(...solid(rectP(-0.6 * s, Y(4.4), 1.2 * s, 0.8 * s), { fill: "steel", op: 1, w: 2 }));
  // antennae and RCS quads
  items.push(L(`M${1.2 * s} ${Y(6)}l${0.6 * s} ${-1.2 * s}M${-1.4 * s} ${Y(6)}l${-0.2 * s} ${-0.9 * s}`, 2));
  items.push(...solid(ellipseP(1.8 * s, Y(7.3), 0.5 * s, 0.35 * s, 16), { fill: "flagWhite", op: 1, w: 2 }));
  for (const sd of [-1, 1]) items.push(L(`M${sd * 2.3 * s} ${Y(4.9)}h${sd * 0.5 * s}m0 ${-0.25 * s}v${0.5 * s}`, 2.2));
  return items;
};

// Astronaut in an A7L suit, saluting (right arm up), feet at 0,0, height ~ 1.9*s
export const astronautItems = (s: number): InkItem[] => {
  const items: InkItem[] = [];
  const Y = (m: number) => -m * s;
  // backpack
  items.push(...solid(rectP(-0.42 * s, Y(1.72), 0.5 * s, 0.75 * s), { fill: "flagWhite", op: 1, tone: tones.const(0.5), angle: 90, spacing: 3, w: 2.2 }));
  // legs + boots
  for (const sd of [-1, 1]) {
    const leg: Pt[] = [[sd * 0.06 * s, Y(0.95)], [sd * 0.3 * s, Y(0.95)], [sd * 0.3 * s, Y(0.12)], [sd * 0.05 * s, Y(0.12)]];
    items.push(...solid(leg, { fill: "flagWhite", op: 1, tone: tones.cylinder(sd * 0.18 * s, 0.13 * s, -0.5), angle: 90, spacing: 2.8, levels: [0.5], w: 2.2 }));
    items.push(L(`M${sd * 0.05 * s} ${Y(0.55)}h${sd * 0.25 * s}M${sd * 0.05 * s} ${Y(0.7)}q${sd * 0.12 * s} ${0.04 * s} ${sd * 0.25 * s} 0`, 1.2));
    items.push(...solid([[sd * 0.02 * s, Y(0.14)], [sd * 0.34 * s, Y(0.14)], [sd * 0.38 * s, 0], [sd * 0.0 * s, 0]], { fill: "stone", op: 1, w: 2 }));
  }
  // torso
  const torso: Pt[] = [[-0.34 * s, Y(0.95)], [0.34 * s, Y(0.95)], [0.38 * s, Y(1.55)], [-0.38 * s, Y(1.55)]];
  items.push(...solid(torso, { fill: "flagWhite", op: 1, tone: tones.cylinder(0, 0.36 * s, -0.5), angle: 90, spacing: 2.8, levels: [0.45, 0.72], w: 2.4, seed: "torso" }));
  items.push(...solid(rectP(-0.16 * s, Y(1.4), 0.32 * s, 0.2 * s), { fill: "steel", op: 1, w: 1.6 }));
  // left arm down, right arm saluting
  items.push(...solid([[-0.36 * s, Y(1.52)], [-0.52 * s, Y(1.45)], [-0.5 * s, Y(0.95)], [-0.36 * s, Y(0.95)]], { fill: "flagWhite", op: 1, w: 2.2 }));
  items.push(...solid([[0.36 * s, Y(1.52)], [0.66 * s, Y(1.38)], [0.34 * s, Y(1.86)], [0.22 * s, Y(1.8)], [0.5 * s, Y(1.44)], [0.34 * s, Y(1.4)]], { fill: "flagWhite", op: 1, w: 2.2 }));
  // helmet with gold visor
  items.push(...solid(ellipseP(0, Y(1.78), 0.26 * s, 0.27 * s, 28), { fill: "flagWhite", op: 1, w: 2.6 }));
  items.push(...solid(ellipseP(0.05 * s, Y(1.77), 0.19 * s, 0.17 * s, 24), { fill: "gold", op: 1, tone: tones.sphere(0.05 * s, Y(1.77), 0.19 * s), angle: 30, spacing: 2.4, levels: [0.55], w: 2 }));
  items.push(L(smoothD([[-0.06 * s, Y(1.86)], [0.02 * s, Y(1.9)], [0.1 * s, Y(1.86)]]), 2, { color: "paper", op: 0.9 }));
  return items;
};

// Earth disc with simple continents and cloud swirls (colour-aware tokens)
export const earthItems = (r: number): InkItem[] => {
  const items: InkItem[] = [];
  const disc = ellipseP(0, 0, r, r, 64);
  items.push(F(polyD(disc), "earth", 1));
  const rr = rng("earth");
  const land: string[] = [];
  for (let i = 0; i < 5; i++) {
    const cx = (rr() - 0.5) * r * 1.2;
    const cy = (rr() - 0.5) * r * 1.2;
    const pts: Pt[] = Array.from({ length: 12 }, (_, k) => {
      const a = (k / 12) * TAU;
      const rad = r * (0.12 + rr() * 0.22);
      return [cx + Math.cos(a) * rad, cy + Math.sin(a) * rad * 0.8] as Pt;
    }).filter(([x, y]) => x * x + y * y < r * r * 0.92);
    if (pts.length > 4) land.push(smoothD(pts, true));
  }
  items.push(F(land.join(""), "foliage", 0.85));
  const clouds: string[] = [];
  for (let i = 0; i < 9; i++) {
    const cy = (rr() - 0.5) * r * 1.6;
    const w = Math.sqrt(Math.max(0, r * r - cy * cy));
    clouds.push(smoothD([[-w * 0.8, cy], [-w * 0.3, cy - 6 - rr() * 10], [w * 0.2, cy + 4], [w * 0.7, cy - 4]]));
  }
  items.push(L(clouds.join(""), 4, { color: "foam", op: 0.9 }));
  items.push(HT(hatch([disc], { angle: 20, spacing: 3, tone: (x, y) => (x + y * 0.3) / r + 0.35, threshold: 0.55, seed: "eshade" }), 1.2, 0.8));
  items.push(L(polyD(disc), 2.2));
  return items;
};
