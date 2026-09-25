// Space-age drawings shared by the cold open and the drop: the Apollo boot,
// lunar ground, F-1 engine bells.
import type { InkItem } from "../components/InkDraw";
import { engrave, ellipseP, hatch, hatchParam, Pt, polyD, rectP, smoothD, stipple, Tone, tones } from "../lib/engrave";
import { noise2, rng } from "../lib/random";
import { F, HT, L } from "./kit";

// Apollo overshoe in profile, toe to the right, sole bottom at y=0
export const bootItems = (): InkItem[] => {
  const items: InkItem[] = [];
  const upper: Pt[] = [
    [-205, -40], [-214, -120], [-200, -250], [-186, -420], [-176, -760], [30, -760], [18, -420], [0, -330], [40, -250], [120, -170],
    [205, -118], [240, -80], [246, -48],
  ];
  items.push(F(smoothD(upper, true, 0.45), "moon", 0.95));
  // leg: contour lines wrapping the cylinder, dark on the right
  const legX = (y: number): [number, number] => {
    const t = (y + 760) / 460;
    return [-176 - t * 10, 30 - t * 12];
  };
  const leg = (u: number, v: number): Pt => {
    const y = -760 + v * 440;
    const [xl, xr] = legX(y);
    return [xl + u * (xr - xl), y + Math.sin(u * Math.PI) * 12];
  };
  items.push(HT(hatchParam(leg, { lines: 96, samples: 30, tone: (u, v) => 0.12 + u * 0.75 + Math.sin(v * 40) * 0.05, threshold: 0.45, seed: "legc" }), 1, 0.9));
  items.push(HT(hatchParam((u, v) => leg(v, u), { lines: 26, samples: 30, u0: 0, u1: 1, v0: 0.72, v1: 1, seed: "legv" }), 1, 0.75));
  // foot: angled hatching, cross-hatch toward the toe shadow and heel
  const footTone: Tone = (x, y) => 0.1 + Math.max(0, (x + 40) / 300) * 0.5 + Math.max(0, (y + 150) / 150) * 0.45 + (x < -170 ? 0.4 : 0);
  const foot: Pt[] = [[-205, -40], [-214, -120], [-200, -250], [-192, -330], [0, -330], [40, -250], [120, -170], [205, -118], [240, -80], [246, -48]];
  engrave([foot], footTone, { angle: 64, spacing: 4.2, levels: [0.3, 0.52, 0.72, 0.9], angles: [64, 154, 20, 110], seed: "foot" }).forEach((l) => items.push(HT(l.d, l.w)));
  items.push(L(smoothD(upper, false, 0.45), 3.4));
  // quilted seams with stitching
  const seams: string[] = [];
  const stitch: string[] = [];
  for (let y = -700; y <= -360; y += 58) {
    const pts = Array.from({ length: 9 }, (_, k) => leg(k / 8, (y + 760) / 440));
    seams.push(smoothD(pts));
    stitch.push(smoothD(pts.map(([x, yy]) => [x, yy + 7] as Pt)));
  }
  items.push(L(seams.join(""), 2));
  items.push(L(stitch.join(""), 1, { dash: "5 6", op: 0.8 }));
  // sole with tread
  const sole: Pt[] = [[-212, -44], [-222, -20], [-205, 0], [210, 0], [248, -14], [252, -46], [230, -58], [-200, -58]];
  items.push(F(smoothD(sole, true, 0.3), "skyDeep", 0.9));
  items.push(HT(hatch([sole], { angle: 0, spacing: 3, seed: "sole" }), 1, 0.7));
  const ridges: string[] = [];
  for (let x = -196; x < 232; x += 11) ridges.push(`M${x} -48V-4`);
  items.push(HT(ridges.join(""), 2.4, 0.95, "ink"));
  items.push(L(smoothD(sole, true, 0.3), 3.2));
  items.push(L("M-214 -30H246", 1.6));
  // toe cap and heel counter
  items.push(L(smoothD([[60, -64], [120, -120], [200, -112], [242, -70]]), 2));
  items.push(L(smoothD([[-206, -64], [-160, -96], [-150, -170], [-196, -230]]), 2));
  // strap and buckle across the instep
  const strap: Pt[] = [[-60, -318], [60, -226], [82, -250], [-38, -344]];
  items.push(F(polyD(strap), "steel", 0.95));
  items.push(HT(hatch([strap], { angle: 128, spacing: 3.5, seed: "strap" }), 1, 0.8));
  items.push(L(polyD(strap), 2.4));
  items.push(L(polyD(rectP(-14, -306, 34, 26)), 2.4));
  items.push(F(polyD(rectP(-14, -306, 34, 26)), "gold", 0.95));
  items.push(L("M-6 -300H12M-6 -290H12", 1.4));
  // label patch
  items.push(L(polyD(rectP(-150, -610, 70, 40)), 1.8));
  items.push(L("M-142 -596H-88M-142 -586H-100", 1.2));
  return items;
};

// Lunar ground in perspective: horizon at h, foreground to bottom, craters
export const lunarGround = (h: number, seed = "lunar"): { items: InkItem[]; horizon: string } => {
  const r = rng(seed);
  const items: InkItem[] = [];
  const horizonPts: Pt[] = [];
  for (let x = -400; x <= 2320; x += 40) horizonPts.push([x, h + Math.sin(x / 260) * 14 + Math.sin(x / 90) * 5 + r() * 4]);
  const groundPoly: Pt[] = [...horizonPts, [2320, 1500], [-400, 1500]];
  items.push(F(polyD(groundPoly), "moon", 0.9));
  const tone: Tone = (_, y) => 0.15 + ((y - h) / (1500 - h)) * 0.35;
  const brokenTone: Tone = (x, y) => tone(x, y) + noise2(x / 120, y / 18, 7) * 0.35;
  items.push(HT(hatch([groundPoly], { angle: 0, spacing: 7, tone: brokenTone, threshold: 0.28, seed, trim: 14, wobble: 1.4, step: 10 }), 1.1, 0.6));
  // rocks with cast shadows
  const rocks: string[] = [];
  const rockShade: string[] = [];
  for (let i = 0; i < 40; i++) {
    const cy = h + 20 + Math.pow(r(), 1.3) * (1500 - h);
    const k = (cy - h) / (1500 - h);
    const rs = 4 + r() * 22 * (0.4 + k * 1.5);
    const cx = -300 + r() * 2500;
    const pts: Pt[] = Array.from({ length: 9 }, (_, j) => {
      const a = Math.PI + (j / 8) * Math.PI;
      return [cx + Math.cos(a) * rs * (0.8 + r() * 0.4), cy + Math.sin(a) * rs * (0.5 + r() * 0.3)] as Pt;
    });
    rocks.push(smoothD(pts) + `L${(cx - rs).toFixed(1)} ${cy.toFixed(1)}`);
    rockShade.push(hatch([[...pts, [cx + rs * 2.2, cy + rs * 0.25], [cx - rs * 0.6, cy + rs * 0.3]]], { angle: 20, spacing: 2.6, seed: `rk${i}` }));
  }
  items.push(HT(rockShade.join(""), 1, 0.8));
  items.push(L(rocks.join(""), 1.5));
  // craters in perspective
  const craters: string[] = [];
  const shades: string[] = [];
  for (let i = 0; i < 16; i++) {
    const cy = h + 30 + Math.pow(r(), 1.6) * (1500 - h - 60);
    const k = (cy - h) / (1500 - h);
    const rx = 30 + r() * 140 * (0.3 + k);
    const ry = rx * (0.12 + k * 0.28);
    const cx = -300 + r() * 2500;
    craters.push(polyD(ellipseP(cx, cy, rx, ry, 40)));
    const inner = ellipseP(cx, cy, rx * 0.95, ry * 0.9, 32);
    shades.push(hatch([inner], { angle: 20, spacing: 3.2, tone: (x) => 0.3 + ((cx - x) / rx) * 0.8, threshold: 0.4, seed: seed + i }));
    craters.push(smoothD([[cx - rx, cy + 2], [cx - rx * 0.4, cy + ry * 1.25], [cx + rx * 0.5, cy + ry * 1.2], [cx + rx, cy]]));
  }
  items.push(HT(shades.join(""), 1, 0.8));
  items.push(L(craters.join(""), 1.6));
  items.push(HT(stipple([groundPoly], { count: 6000, seed: seed + "st", tone: (_, y) => 0.25 + (y - h) / 1300 }), 2.2, 0.6));
  items.push(L(smoothD(horizonPts), 2.4));
  return { items, horizon: smoothD(horizonPts) };
};

// F-1 engine bell hanging from y (throat) to y + len (exit), centred at x
export const engineBell = (x: number, y: number, s: number, seed = "f1"): InkItem[] => {
  const items: InkItem[] = [];
  const len = 300 * s;
  const rt = 52 * s;
  const re = 150 * s;
  const e = 0.34;
  const profile = (t: number) => rt + (re - rt) * Math.pow(t, 0.75);
  const left: Pt[] = [];
  const right: Pt[] = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    left.push([x - profile(t), y + t * len]);
    right.push([x + profile(t), y + t * len]);
  }
  const exitFront = ellipseP(x, y + len, re, re * e, 48, 0, Math.PI);
  const body: Pt[] = [...left, ...exitFront.slice().reverse().map((p) => p), ...right.slice().reverse()];
  items.push(F(polyD(body), "metal", 0.95));
  const tone: Tone = (px) => tones.cylinder(x, profile(0.6), -0.4, 0.1)(px, 0);
  engrave([body], tone, { angle: 90, spacing: 4, levels: [0.35, 0.65, 0.88], angles: [90, 20, 160], seed }).forEach((l) => items.push(HT(l.d, l.w)));
  // regenerative cooling tubes
  const tubes: string[] = [];
  for (let k = -9; k <= 9; k++) {
    const u = k / 10;
    const pts: Pt[] = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      pts.push([x + u * profile(t), y + t * len + Math.sqrt(1 - u * u) * profile(t) * e * t]);
    }
    tubes.push(polyD(pts, false));
  }
  items.push(L(tubes.join(""), 0.9, { op: 0.7 }));
  // stiffener hoops
  for (const t of [0.35, 0.62, 0.86]) items.push(L(polyD(ellipseP(x, y + t * len, profile(t), profile(t) * e, 40, 0, Math.PI), false), 2.2));
  // exit rim and dark interior
  items.push(F(polyD(ellipseP(x, y + len, re, re * e, 48)), "ink", 0.85));
  items.push(L(polyD(ellipseP(x, y + len, re, re * e, 48)), 3));
  items.push(L(polyD(ellipseP(x, y + len, re * 0.93, re * e * 0.88, 48)), 1.2));
  items.push(L(smoothD(left), 2.8));
  items.push(L(smoothD(right), 2.8));
  // turbopump plumbing
  items.push(L(`M${x - rt * 1.2} ${y + len * 0.08}C${x - rt * 2} ${y - 20 * s} ${x - rt * 1.6} ${y - 70 * s} ${x - rt * 0.4} ${y - 80 * s}`, 5 * s));
  items.push(L(polyD(rectP(x + rt * 0.8, y - 70 * s, rt * 0.9, 60 * s)), 2));
  items.push(F(polyD(rectP(x + rt * 0.8, y - 70 * s, rt * 0.9, 60 * s)), "steel", 0.9));
  return items;
};

// Saturn V first-stage base seen low from the side: ribbed skirt, fins,
// engine fairings and four visible F-1 bells. Returns items + bell exits.
export const saturnBase = (): { items: InkItem[]; bells: { x: number; y: number; r: number; s: number }[] } => {
  const items: InkItem[] = [];
  const cx = 960;
  const R = 540;
  const top = -400;
  const skirt = 330;
  const body: Pt[] = [[cx - R, top], [cx + R, top], [cx + R, skirt], ...ellipseP(cx, skirt, R, 60, 40, 0, Math.PI).slice(1, -1), [cx - R, skirt]];
  items.push(F(polyD(body), "flagWhite", 0.95));
  engrave([body], tones.cylinder(cx, R, -0.5, 0.05), { angle: 90, spacing: 5, levels: [0.4, 0.66, 0.86], angles: [90, 10, 170], seed: "sat" }).forEach((l) => items.push(HT(l.d, l.w)));
  const ribs: string[] = [];
  for (let k = -26; k <= 26; k++) {
    const u = k / 27;
    const x = cx + u * R;
    ribs.push(`M${x.toFixed(1)} 120V${(skirt + Math.sqrt(1 - u * u) * 60).toFixed(1)}`);
  }
  items.push(L(ribs.join(""), 1.2, { op: 0.8 }));
  for (const yy of [-240, -60, 120]) items.push(L(polyD(ellipseP(cx, yy, R, 60, 40, 0, Math.PI), false), 2.4));
  // black roll pattern band
  const band: Pt[] = [[cx - R, -240], [cx - R * 0.35, -240], ...ellipseP(cx, -60, R, 60, 20, Math.PI * 0.62, Math.PI).slice(1).map(([x, y]) => [x, y] as Pt)];
  items.push(F(polyD(band), "ink", 0.7));
  items.push(L(polyD(body), 3.2));
  // fins
  for (const sd of [-1, 1]) {
    const fin: Pt[] = [[cx + sd * (R - 8), 150], [cx + sd * (R + 150), 470], [cx + sd * (R + 160), 560], [cx + sd * (R - 40), 400]];
    items.push(...[F(polyD(fin), "metal", 0.95), HT(hatch([fin], { angle: sd > 0 ? 70 : 110, spacing: 4, seed: `fin${sd}` }), 1, 0.8), L(polyD(fin), 3)]);
  }
  const bells = [
    { x: 800, y: 385, r: 0, s: 0.82 },
    { x: 1120, y: 385, r: 0, s: 0.82 },
    { x: 560, y: 405, r: 0, s: 0.98 },
    { x: 1360, y: 405, r: 0, s: 0.98 },
  ];
  bells.forEach((b, i) => {
    // conical fairing
    const fw = 120 * b.s;
    const fair: Pt[] = [[b.x - fw * 0.8, skirt + 30], [b.x + fw * 0.8, skirt + 30], [b.x + fw * 0.55, b.y + 4], [b.x - fw * 0.55, b.y + 4]];
    items.push(F(polyD(fair), "steel", 0.95), HT(hatch([fair], { angle: 90, spacing: 4, tone: tones.cylinder(b.x, fw * 0.7, -0.5), threshold: 0.4, seed: `fair${i}` }), 1, 0.85), L(polyD(fair), 2.6));
    items.push(...engineBell(b.x, b.y, b.s * 0.75, `sb${i}`));
    b.r = 150 * b.s * 0.75;
    b.y = b.y + 300 * b.s * 0.75;
  });
  return { items, bells };
};
