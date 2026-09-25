// Drawings for A Nation Tested: Napoleon field gun, split-rail fence,
// Lincoln silhouette, Lincoln Memorial colonnade.
import type { InkItem } from "../components/InkDraw";
import { ellipseP, hatch, hatchParam, Pt, polyD, rectP, smoothD, tones } from "../lib/engrave";
import { rng } from "../lib/random";
import { column, F, HT, L, solid, wheel } from "./kit";

// Napoleon 12-pounder facing left; origin at the ground under the axle
export const cannonParts = () => {
  // barrel: muzzle at left, breech/cascabel at right; pivot (trunnion) at 0,-150
  const barrel: InkItem[] = [];
  const top: Pt[] = [];
  const bot: Pt[] = [];
  const len = 360;
  const rOf = (t: number) => (t < 0.06 ? 30 : 22 + t * 18 + (t > 0.9 ? 6 : 0));
  for (let i = 0; i <= 30; i++) {
    const t = i / 30;
    const x = -len * 0.62 + t * len;
    top.push([x, -rOf(t)]);
    bot.push([x, rOf(t)]);
  }
  const body = [...top, ...bot.slice().reverse()];
  barrel.push(F(polyD(body), "gold", 0.9));
  barrel.push(HT(hatchParam((u, v) => [-len * 0.62 + u * len, (v * 2 - 1) * rOf(u)], { lines: 26, samples: 30, tone: (_, v) => 0.2 + v * 0.9, threshold: 0.5, seed: "brl" }), 1, 0.9));
  barrel.push(L(polyD(body), 2.6));
  barrel.push(L(`M${-len * 0.62 + len * 0.06} -30V30M${-len * 0.62 + len * 0.9} -40V40`, 2));
  barrel.push(...solid(ellipseP(-len * 0.62 + len + 18, 0, 16, 16, 20), { fill: "gold", op: 1, w: 2.2 }));
  barrel.push(...solid(ellipseP(0, 0, 14, 14, 16), { fill: "steel", op: 1, w: 2 }));
  barrel.push(F(polyD(ellipseP(-len * 0.62, 0, 8, 26, 16)), "ink", 1));
  // carriage: cheeks + trail sloping to the ground at the right
  const carriage: InkItem[] = [];
  const trail: Pt[] = [[-40, -170], [60, -175], [420, -40], [440, 0], [400, 6], [40, -110], [-50, -120]];
  carriage.push(...solid(trail, { fill: "wood", op: 0.95, tone: (x, y) => 0.3 + (y + 175) / 250 + x / 1200, angle: 20, spacing: 3.4, levels: [0.4, 0.7], w: 2.6, seed: "trail" }));
  carriage.push(L("M-30 -150L400 -20M100 -160l0 40M220 -110l0 40", 1.4));
  carriage.push(...solid(rectP(330, -46, 60, 20), { fill: "steel", op: 1, w: 1.6 }));
  // crew (silhouettes) and ramrod
  const crew: InkItem[] = [];
  const person = (x: number, s: number, lean: number): string =>
    [
      `M${x - 16 * s} 0L${x - 12 * s + lean} ${-90 * s}L${x + 12 * s + lean} ${-90 * s}L${x + 16 * s} 0Z`,
      polyD(ellipseP(x + lean * 1.1, -106 * s, 13 * s, 14 * s, 14)),
      `M${x + lean * 1.1 - 16 * s} ${-114 * s}h${30 * s}l${-4 * s} ${-12 * s}h${-22 * s}Z`,
      `M${x - 12 * s + lean} ${-84 * s}L${x - 40 * s + lean} ${-40 * s}`,
    ].join("");
  crew.push(F(person(-220, 1.5, -8) + person(300, 1.45, 10), "ink", 0.95));
  crew.push(L("M-250 -120L-420 -230", 5));
  return { barrel, carriage, crew, wheel: wheel(118, 14), muzzle: [-len * 0.62, 0] as Pt };
};

// Worm (zig-zag) split-rail fence receding toward a vanishing point
export const railFence = (): InkItem[] => {
  const items: InkItem[] = [];
  const r = rng("fence");
  const panels = 9;
  const pts: { x: number; y: number; s: number }[] = [];
  for (let i = 0; i <= panels; i++) {
    const t = i / panels;
    const k = Math.pow(t, 0.6);
    const s = 1.5 - k * 1.32;
    pts.push({ x: -260 + k * 1650 + (i % 2 ? 130 : -90) * s, y: 1080 - k * 500 + (i % 2 ? -70 : 50) * s, s });
  }
  const rails: string[] = [];
  const shade: string[] = [];
  const fills: string[] = [];
  for (let i = 0; i < panels; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    for (let k = 0; k < 5; k++) {
      const ha = (50 + k * 52) * a.s;
      const hb = (50 + k * 52) * b.s;
      const th = 22 * (a.s + b.s) * 0.5;
      const sag = 6 * a.s * (r() - 0.3);
      const poly: Pt[] = [
        [a.x - 20 * a.s, a.y - ha],
        [(a.x + b.x) / 2, (a.y - ha + b.y - hb) / 2 + sag],
        [b.x + 20 * b.s, b.y - hb],
        [b.x + 20 * b.s, b.y - hb + th],
        [(a.x + b.x) / 2, (a.y - ha + b.y - hb) / 2 + sag + th],
        [a.x - 20 * a.s, a.y - ha + th],
      ];
      fills.push(polyD(poly));
      rails.push(smoothD(poly.slice(0, 3)) + smoothD(poly.slice(3)));
      shade.push(hatch([poly], { angle: 80, spacing: 3.2, seed: `r${i}${k}` }));
      rails.push(smoothD([[a.x - 10 * a.s, a.y - ha + th * 0.45], [(a.x + b.x) / 2, (a.y - ha + b.y - hb) / 2 + sag + th * 0.5], [b.x + 10 * b.s, b.y - hb + th * 0.45]]));
    }
  }
  items.push(F(fills.join(""), "wood", 0.9));
  items.push(HT(shade.join(""), 1, 0.6));
  items.push(L(rails.join(""), 1.8));
  // crossing stakes at each joint
  const stakes: string[] = [];
  for (const p of pts) stakes.push(`M${p.x - 18 * p.s} ${p.y + 6}L${p.x + 12 * p.s} ${p.y - 330 * p.s}M${p.x + 18 * p.s} ${p.y + 6}L${p.x - 12 * p.s} ${p.y - 330 * p.s}`);
  items.push(L(stakes.join(""), 3.4));
  return items;
};

// Lincoln Memorial front: colonnade, entablature w/ frieze, attic, steps.
// Drawn tall (y up to -1500) for a tilt; keystoned for a low camera.
export const memorialItems = (): { items: InkItem[]; frieze: { x: number; y: number; t: string }[] } => {
  const items: InkItem[] = [];
  const cx = 960;
  const ground = 1000;
  const colBot = 760;
  const colTop = -700;
  const key = (x: number, y: number): Pt => [cx + (x - cx) * (0.8 + 0.2 * ((y - -1500) / 2500)), y];
  // steps
  for (let k = 0; k < 8; k++) {
    const y = colBot + 30 + k * 30;
    items.push(L(polyD([key(-300 - k * 30, y), key(2220 + k * 30, y)], false), 2));
  }
  items.push(F(polyD([key(-500, colBot + 30), key(2420, colBot + 30), key(2420, ground + 200), key(-500, ground + 200)]), "stone", 0.6));
  items.push(HT(hatch([[key(-500, colBot + 30), key(2420, colBot + 30), key(2420, ground + 200), key(-500, ground + 200)]], { angle: 0, spacing: 5, tone: (_, y) => 0.4 + (y - colBot) / 800, threshold: 0.5, seed: "steps" }), 1, 0.5));
  // interior shadow between columns + seated statue silhouette
  const inner: Pt[] = [key(-100, colTop + 60), key(2020, colTop + 60), key(2020, colBot), key(-100, colBot)];
  items.push(F(polyD(inner), "ink", 0.6));
  items.push(HT(hatch([inner], { angle: 90, spacing: 4, seed: "inner" }), 1, 0.6));
  items.push(F(`M880 ${colBot}L880 380Q880 300 930 290L930 210Q960 180 990 210L990 290Q1040 300 1040 380L1040 ${colBot}Z`, "stone", 0.55));
  // columns
  const xs = [-60, 190, 440, 700, 1220, 1480, 1730, 1980];
  xs.forEach((x, i) => {
    const [tx] = key(x, colTop);
    const [bx] = key(x, colBot);
    const col = column(bx, colTop, colBot, 58, { doric: true, flutes: 9, seed: `mc${i}` });
    // keystone: skew each column's top toward centre
    items.push(...col.map((it, k) => ({ ...it, order: 0.08 + (i / xs.length) * 0.1 + (k / col.length) * 0.4 })));
    void tx;
  });
  // entablature
  const e0 = colTop - 60;
  const arch: Pt[] = [key(-240, e0 - 150), key(2160, e0 - 150), key(2160, e0), key(-240, e0)];
  items.push(...solid(arch, { fill: "stone", op: 0.95, tone: tones.linear(0, e0 - 150, 0, e0, 0.2, 0.7), angle: 0, spacing: 4, levels: [0.45, 0.7], w: 3, seed: "ent" }));
  items.push(L(polyD([key(-240, e0 - 60), key(2160, e0 - 60)], false), 2));
  items.push(L(polyD([key(-240, e0 - 80), key(2160, e0 - 80)], false), 1.4));
  // wreaths in the frieze
  const wreaths: string[] = [];
  const frieze: { x: number; y: number; t: string }[] = [];
  const names = ["DELAWARE", "PENNSYLVANIA", "NEW JERSEY", "GEORGIA", "CONNECTICUT", "MASSACHUSETTS", "MARYLAND", "VIRGINIA", "NEW YORK", "OHIO", "ILLINOIS"];
  for (let k = 0; k < 11; k++) {
    const x = -140 + k * 220;
    const [wx] = key(x, e0 - 110);
    wreaths.push(polyD(ellipseP(wx, e0 - 118, 20, 20, 20)));
    frieze.push({ x: key(x, e0 - 30)[0], y: e0 - 26, t: names[k] });
  }
  items.push(L(wreaths.join(""), 2));
  // attic storey with festoons
  const at0 = e0 - 150;
  const attic: Pt[] = [key(-120, at0 - 360), key(2040, at0 - 360), key(2040, at0), key(-120, at0)];
  items.push(...solid(attic, { fill: "stone", op: 0.95, tone: tones.linear(0, at0 - 360, 0, at0, 0.25, 0.55), angle: 0, spacing: 4.5, levels: [0.45], w: 3, seed: "attic" }));
  const fest: string[] = [];
  for (let k = 0; k < 9; k++) {
    const x0 = key(-60 + k * 230, at0 - 200)[0];
    const x1 = key(-60 + (k + 1) * 230, at0 - 200)[0];
    fest.push(`M${x0} ${at0 - 250}Q${(x0 + x1) / 2} ${at0 - 150} ${x1} ${at0 - 250}`);
    fest.push(polyD(ellipseP(x0, at0 - 256, 12, 12, 12)));
  }
  items.push(L(fest.join(""), 2.2));
  items.push(L(polyD([key(-140, at0 - 380), key(2060, at0 - 380), key(2060, at0 - 360), key(-140, at0 - 360)]), 2.4));
  return { items, frieze };
};
