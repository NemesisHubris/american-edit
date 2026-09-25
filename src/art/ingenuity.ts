// 2D drawings for American Ingenuity: golden spike & maul, Edison lamp,
// Model T, Hoover Dam, Golden Gate tower, Empire State Building.
import type { InkItem } from "../components/InkDraw";
import { ellipseP, engrave, hatch, Pt, polyD, rectP, smoothD, tones } from "../lib/engrave";
import { TAU } from "../lib/math";
import { rng } from "../lib/random";
import { F, HT, L, solid, wheel } from "./kit";

// ---------- Rail, tie, golden spike, maul ----------
export const railScene = (): InkItem[] => {
  const items: InkItem[] = [];
  // tie in perspective (wide wooden block toward camera)
  const tie: Pt[] = [[-300, 700], [2220, 700], [2400, 1100], [-480, 1100]];
  items.push(...solid(tie, { fill: "wood", op: 0.95, tone: (_, y) => 0.25 + (y - 700) / 800, angle: 0, spacing: 4, levels: [0.4, 0.65], w: 3, seed: "tie" }));
  const grain: string[] = [];
  const r = rng("tiegrain");
  for (let i = 0; i < 26; i++) {
    const y = 710 + r() * 380;
    grain.push(smoothD([[-400, y], [300, y + 8 * r()], [1000, y - 6 * r()], [1700, y + 5 * r()], [2400, y]]));
  }
  items.push(L(grain.join(""), 1, { op: 0.6 }));
  // rail profile along x: foot, web, head
  const foot: Pt[] = [[-400, 700], [2320, 700], [2320, 668], [-400, 668]];
  const web: Pt[] = [[-400, 668], [2320, 668], [2320, 560], [-400, 560]];
  const head: Pt[] = [[-400, 560], [2320, 560], [2320, 500], [-400, 500]];
  items.push(...solid(foot, { fill: "steel", op: 1, tone: tones.const(0.5), angle: 0, spacing: 3, w: 2.4 }));
  items.push(...solid(web, { fill: "steel", op: 1, tone: tones.linear(0, 560, 0, 668, 0.5, 0.95), angle: 0, spacing: 3.2, levels: [0.55, 0.8], w: 2.4 }));
  items.push(...solid(head, { fill: "metal", op: 1, tone: tones.linear(0, 500, 0, 560, 0.1, 0.6), angle: 0, spacing: 3, levels: [0.35], w: 3 }));
  items.push(L("M-400 508H2320", 1.4, { color: "paper", op: 0.8 }));
  // bolts / fishplate
  for (const bx of [300, 1500]) {
    items.push(...solid(rectP(bx, 580, 240, 70), { fill: "steel", op: 1, tone: tones.const(0.55), angle: 45, spacing: 3, w: 2 }));
    for (const dx of [40, 200]) items.push(...solid(ellipseP(bx + dx, 615, 16, 16, 12), { fill: "metal", op: 1, w: 1.8 }));
  }
  return items;
};

export const spikeItems = (): InkItem[] => {
  // spike top at 0,0; shaft goes down
  const items: InkItem[] = [];
  const shaft: Pt[] = [[-18, 20], [18, 20], [16, 260], [0, 300], [-16, 260]];
  items.push(...solid(shaft, { fill: "gold", op: 1, tone: tones.cylinder(0, 18, -0.5), angle: 90, spacing: 2.8, levels: [0.45, 0.72], w: 2.4, seed: "spk" }));
  const head: Pt[] = [[-46, 0], [30, 0], [70, 12], [60, 30], [-46, 30]];
  items.push(...solid(head, { fill: "gold", op: 1, tone: tones.linear(0, 0, 0, 30, 0.2, 0.8), angle: 0, spacing: 2.6, levels: [0.45], w: 2.6, seed: "spkh" }));
  items.push(L("M-30 60l20 0M-30 90l20 0", 1, { op: 0.6 }));
  return items;
};

export const maulItems = (): InkItem[] => {
  // pivot at 0,0 (hands), handle toward -x, head at the end
  const items: InkItem[] = [];
  const handle: Pt[] = [[0, -14], [-620, -10], [-620, 10], [0, 14]];
  items.push(...solid(handle, { fill: "wood", op: 1, tone: tones.linear(0, -14, 0, 14, 0.2, 0.9), angle: 0, spacing: 3, levels: [0.5], w: 2.4, seed: "hdl" }));
  const headP: Pt[] = [[-700, -60], [-560, -60], [-560, 60], [-700, 60]];
  items.push(...solid(headP, { fill: "steel", op: 1, tone: tones.linear(-700, 0, -560, 0, 0.3, 0.9), angle: 90, spacing: 3, levels: [0.45, 0.72], w: 3, seed: "mh" }));
  items.push(L("M-690 -60V60M-570 -60V60", 1.4));
  return items;
};

// ---------- Edison lamp (centre 0,0 = middle of the globe) ----------
export const bulbGeo = () => {
  const items: InkItem[] = [];
  const glob: Pt[] = [];
  for (let i = 0; i <= 60; i++) {
    const a = -Math.PI / 2 + (i / 60) * TAU;
    const r = 200 * (1 + 0.12 * Math.sin(a));
    glob.push([Math.cos(a) * r * 0.92, Math.sin(a) * r - (Math.sin(a) > 0.7 ? (Math.sin(a) - 0.7) * 120 : 0)]);
  }
  const neck: Pt[] = [[-70, 190], [70, 190], [62, 250], [-62, 250]];
  items.push(F(polyD(glob), "paper", 0.25));
  items.push(HT(hatch([glob], { angle: 60, spacing: 5, tone: (x, y) => 0.3 + Math.hypot(x - 60, y + 40) / 260, threshold: 0.7, seed: "glass" }), 1, 0.35));
  items.push(L(smoothD(glob, true), 3));
  items.push(L(smoothD([[-120, -110], [-150, -40], [-140, 40]]), 3, { color: "paper" }));
  items.push(L("M-8 -228L0 -250L8 -228", 2.4));
  items.push(...solid(neck, { fill: "gold", op: 0.9, w: 2.2 }));
  // screw base with threads
  const base: Pt[] = [[-62, 250], [62, 250], [60, 400], [-60, 400]];
  items.push(...solid(base, { fill: "metal", op: 1, tone: tones.cylinder(0, 62, -0.5), angle: 90, spacing: 3, levels: [0.4, 0.7], w: 2.6, seed: "base" }));
  const threads: string[] = [];
  for (let y = 262; y < 392; y += 18) threads.push(`M-62 ${y}Q0 ${y + 12} 62 ${y + 8}`);
  items.push(L(threads.join(""), 2));
  items.push(...solid([[-40, 400], [40, 400], [22, 440], [-22, 440]], { fill: "ink", op: 0.9, w: 2 }));
  // glass stem and lead-in wires
  items.push(...solid([[-26, 250], [26, 250], [18, 110], [-18, 110]], { fill: "paper", op: 0.4, w: 1.8 }));
  items.push(L("M-10 250L-40 40M10 250L40 40", 2));
  const filament = smoothD([[-40, 40], [-60, -60], [-40, -140], [0, -165], [40, -140], [60, -60], [40, 40]]);
  return { items, filament };
};

// ---------- Model T (facing right; ground at 0, centre x=0) ----------
export const modelTBody = (): InkItem[] => {
  const items: InkItem[] = [];
  const body: Pt[] = [[-300, -120], [-300, -250], [-120, -250], [-110, -200], [120, -200], [130, -240], [250, -240], [260, -120]];
  items.push(...solid(body, { fill: "ink", op: 0.85, tone: tones.linear(0, -250, 0, -120, 0.4, 0.9), angle: 0, spacing: 3.4, levels: [0.6], w: 2.6, seed: "mtb" }));
  // hood with louvres
  const hood: Pt[] = [[130, -240], [330, -225], [340, -130], [130, -130]];
  items.push(...solid(hood, { fill: "ink", op: 0.85, w: 2.6 }));
  const louv: string[] = [];
  for (let x = 180; x < 320; x += 14) louv.push(`M${x} -205v50`);
  items.push(L(louv.join(""), 1.4, { color: "paper", op: 0.8 }));
  // brass radiator
  items.push(...solid([[330, -250], [372, -250], [372, -120], [334, -120]], { fill: "gold", op: 1, tone: tones.const(0.45), angle: 90, spacing: 3, w: 2.4 }));
  // windshield frame and top
  items.push(L("M120 -240L110 -400M120 -240L150 -400M110 -400H150", 3));
  items.push(F(polyD([[114, -392], [146, -392], [128, -250]]), "sky", 0.4));
  items.push(...solid([[-300, -420], [120, -420], [110, -405], [-310, -400]], { fill: "ink", op: 0.9, w: 2.4 }));
  items.push(L("M-290 -402L-300 -250M-100 -410L-110 -250M100 -408L110 -250", 2.2));
  // fenders and running board
  items.push(...solid([[-420, -120], [-400, -170], [-300, -200], [-180, -170], [-160, -120]], { fill: "ink", op: 0.9, w: 2.4, smooth: true }));
  items.push(...solid([[140, -120], [160, -170], [260, -200], [380, -170], [400, -120]], { fill: "ink", op: 0.9, w: 2.4, smooth: true }));
  items.push(...solid(rectP(-180, -130, 330, 16), { fill: "wood", op: 1, w: 2 }));
  // headlamp and seat
  items.push(...solid(ellipseP(360, -290, 22, 26, 16), { fill: "gold", op: 1, w: 2 }));
  items.push(L("M360 -264V-240", 2.4));
  items.push(...solid([[-290, -330], [-150, -330], [-140, -250], [-290, -250]], { fill: "wood", op: 0.9, w: 2 }));
  return items;
};
export const modelTWheel = () => wheel(96, 12, { hub: 18, rim: 12 });

// ---------- Hoover Dam (downstream view) ----------
export const damItems = (): InkItem[] => {
  const items: InkItem[] = [];
  // canyon walls
  const wallL: Pt[] = [[-500, 1300], [-500, -200], [200, -150], [420, 100], [520, 500], [560, 900], [520, 1300]];
  const wallR: Pt[] = [[2420, 1300], [2420, -220], [1700, -150], [1500, 120], [1400, 500], [1360, 900], [1400, 1300]];
  for (const [w, sd] of [
    [wallL, "L"],
    [wallR, "R"],
  ] as [Pt[], string][]) {
    items.push(F(polyD(w), "stone", 0.9));
    engrave([w], (x, y) => 0.3 + (sd === "L" ? (x + 500) / 2000 : (2420 - x) / 2000) * 0.6 + (y + 200) / 3000, { angle: sd === "L" ? 70 : 110, spacing: 4.2, levels: [0.35, 0.6, 0.82], seed: `cw${sd}` }).forEach((l) => items.push(HT(l.d, l.w)));
    const r = rng(`strata${sd}`);
    const strata: string[] = [];
    for (let i = 0; i < 18; i++) {
      const y = -150 + i * 80 + r() * 30;
      strata.push(sd === "L" ? smoothD([[-500, y], [100, y + 20], [500, y + 60]]) : smoothD([[2420, y], [1800, y + 20], [1400, y + 60]]));
    }
    items.push(L(strata.join(""), 1.2, { op: 0.7 }));
    items.push(L(smoothD(w.slice(1, -1)), 3));
  }
  // concave dam face between the walls
  const crestY = 120;
  const face: Pt[] = [];
  for (let i = 0; i <= 30; i++) {
    const t = i / 30;
    face.push([430 + t * 1060, crestY + Math.sin(t * Math.PI) * 60]);
  }
  const baseY = 800;
  const faceBot: Pt[] = [];
  for (let i = 30; i >= 0; i--) {
    const t = i / 30;
    faceBot.push([560 + t * 800, baseY + Math.sin(t * Math.PI) * 30]);
  }
  const dam = [...face, ...faceBot];
  items.push(F(polyD(dam), "flagWhite", 0.9));
  const lifts: string[] = [];
  for (let k = 1; k < 14; k++) {
    const kk = k / 14;
    const pts: Pt[] = [];
    for (let i = 0; i <= 30; i++) {
      const t = i / 30;
      const xa = 430 + t * 1060;
      const xb = 560 + t * 800;
      pts.push([xa + (xb - xa) * kk, crestY + Math.sin(t * Math.PI) * 60 + (baseY - crestY) * kk]);
    }
    lifts.push(smoothD(pts));
  }
  items.push(L(lifts.join(""), 1.2, { op: 0.7 }));
  items.push(HT(hatch([dam], { angle: 95, spacing: 5, tone: (x) => 0.2 + Math.abs(x - 960) / 800, threshold: 0.45, seed: "damh" }), 1, 0.6));
  items.push(L(smoothD(face), 3.2));
  // crest parapet and the four intake towers peeking above
  items.push(...solid([[420, crestY - 26], [1500, crestY - 26], [1500, crestY], [420, crestY]], { fill: "stone", op: 1, w: 2.2 }));
  for (const tx of [620, 760, 1160, 1300]) {
    const tw: Pt[] = [[tx - 26, crestY - 26], [tx - 22, crestY - 170], [tx + 22, crestY - 170], [tx + 26, crestY - 26]];
    items.push(...solid(tw, { fill: "flagWhite", op: 1, tone: tones.cylinder(tx, 24, -0.5), angle: 90, spacing: 3, levels: [0.5], w: 2.2, seed: `it${tx}` }));
    items.push(...solid([[tx - 30, crestY - 170], [tx + 30, crestY - 170], [tx + 20, crestY - 196], [tx - 20, crestY - 196]], { fill: "stone", op: 1, w: 2 }));
  }
  // powerhouse wings at the base
  for (const [x0, x1] of [
    [540, 900],
    [1020, 1380],
  ]) {
    items.push(...solid([[x0, baseY - 10], [x1, baseY - 10], [x1, baseY + 130], [x0, baseY + 130]], { fill: "stone", op: 1, tone: tones.const(0.35), angle: 0, spacing: 5, w: 2.4 }));
    const wins: string[] = [];
    for (let x = x0 + 20; x < x1 - 20; x += 36) wins.push(polyD(rectP(x, baseY + 20, 18, 70)));
    items.push(F(wins.join(""), "ink", 0.8));
  }
  return items;
};

// ---------- Golden Gate tower (base centre x, deck y, top y) ----------
export const ggTower = (x: number, base: number, top: number, s = 1): InkItem[] => {
  const items: InkItem[] = [];
  const h = base - top;
  const legW = 46 * s;
  const gap = 150 * s;
  for (const side of [-1, 1]) {
    const lx = x + side * (gap / 2 + legW / 2);
    const leg: Pt[] = [[lx - legW / 2, base], [lx - legW / 2 + 6 * s * side * -1, top + 40 * s], [lx + legW / 2 - 6 * s * side, top + 40 * s], [lx + legW / 2, base]];
    items.push(...solid(leg, { fill: "flagRed", op: 0.9, tone: tones.cylinder(lx, legW / 2, -0.5, 0.2), angle: 90, spacing: 3, levels: [0.45, 0.72], w: 2.6, seed: `gl${side}${x}` }));
    // stepped vertical recesses
    items.push(L(`M${lx - legW * 0.2} ${base}V${top + 60 * s}M${lx + legW * 0.2} ${base}V${top + 60 * s}`, 1.2, { op: 0.8 }));
  }
  // portal struts
  const struts = [0.02, 0.28, 0.52, 0.74];
  for (const t of struts) {
    const y = top + t * h;
    const th = (t === 0.02 ? 70 : 44) * s;
    const strut = rectP(x - gap / 2 - 4, y, gap + 8, th);
    items.push(...solid(strut, { fill: "flagRed", op: 0.9, tone: tones.const(0.45), angle: 0, spacing: 3, w: 2.4 }));
    items.push(L(`M${x - gap / 2 + 10} ${y + th * 0.5}H${x + gap / 2 - 10}`, 1, { op: 0.7 }));
  }
  items.push(...solid([[x - gap / 2 - legW, top + 40 * s], [x + gap / 2 + legW, top + 40 * s], [x + gap / 2 + legW - 10 * s, top], [x - gap / 2 - legW + 10 * s, top]], { fill: "flagRed", op: 0.9, w: 2.6 }));
  return items;
};

// ---------- Empire State Building: geometry in a tall space ----------
export const ESB = { ground: 1000, floor: 34, cx: 960 };
export const empireItems = (): { items: InkItem[]; topY: number } => {
  const items: InkItem[] = [];
  const { ground, floor, cx } = ESB;
  const y = (n: number) => ground - n * floor;
  const block = (n0: number, n1: number, w: number, seed: string) => {
    const poly = rectP(cx - w / 2, y(n1), w, (n1 - n0) * floor);
    items.push(F(polyD(poly), "stone", 0.9));
    const piers: string[] = [];
    const spacing = 22;
    for (let x = cx - w / 2 + spacing; x < cx + w / 2 - 4; x += spacing) piers.push(`M${x} ${y(n1)}V${y(n0)}`);
    items.push(L(piers.join(""), 1.1, { op: 0.75 }));
    const floors: string[] = [];
    for (let n = n0 + 1; n < n1; n++) floors.push(`M${cx - w / 2} ${y(n)}H${cx + w / 2}`);
    items.push(HT(floors.join(""), 0.9, 0.5));
    items.push(HT(hatch([poly], { angle: 90, spacing: 3.6, tone: (px) => 0.15 + ((px - (cx - w / 2)) / w) * 0.9, threshold: 0.6, seed }), 1, 0.8));
    items.push(L(polyD(poly), 2.6));
  };
  block(0, 5, 900, "esb0");
  block(5, 30, 700, "esb1");
  block(30, 72, 560, "esb2");
  block(72, 81, 420, "esb3");
  block(81, 86, 300, "esb4");
  // mast with rings and antenna
  const m0 = y(86);
  const mast: Pt[] = [[cx - 70, m0], [cx + 70, m0], [cx + 34, m0 - 300], [cx - 34, m0 - 300]];
  items.push(...solid(mast, { fill: "metal", op: 1, tone: tones.cylinder(cx, 70, -0.5), angle: 90, spacing: 3, levels: [0.4, 0.68], w: 2.6, seed: "mast" }));
  const rings: string[] = [];
  for (let k = 1; k < 8; k++) {
    const yy = m0 - k * 38;
    const w = 90 - k * 5;
    rings.push(`M${cx - w} ${yy}H${cx + w}`);
  }
  items.push(L(rings.join(""), 1.6));
  items.push(...solid([[cx - 34, m0 - 300], [cx + 34, m0 - 300], [cx + 14, m0 - 470], [cx - 14, m0 - 470]], { fill: "flagWhite", op: 1, tone: tones.cylinder(cx, 24, -0.5), angle: 90, spacing: 3, w: 2.2, seed: "mast2" }));
  items.push(...solid([[cx - 12, m0 - 470], [cx + 12, m0 - 470], [cx + 4, m0 - 560], [cx - 4, m0 - 560]], { fill: "metal", op: 1, w: 2 }));
  items.push(L(`M${cx} ${m0 - 560}V${m0 - 760}`, 4));
  // setback wings and window strips on the main shaft
  const strips: string[] = [];
  for (let x = cx - 270; x < cx + 270; x += 22) strips.push(`M${x + 7} ${y(71)}V${y(31)}`);
  items.push(L(strips.join(""), 5, { color: "inkSoft", op: 0.35 }));
  return { items, topY: m0 - 760 };
};
