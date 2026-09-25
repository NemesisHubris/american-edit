// The Greatest Generation: 3D Higgins boat (LCVP) with a falling ramp,
// 3D P-51 fighter, and 2D hedgehog / helmet / flag-raising silhouettes.
import type { InkItem } from "../components/InkDraw";
import { usePalette } from "../lib/palette";
import { ellipseP, hatch, Pt, polyD, rectP, smoothD, tones } from "../lib/engrave";
import { add, Cam, DEFAULT_CAM, mul, path3, poly3, pose, Pose, ring3, V3 } from "../lib/three";
import { F, HT, L, solid } from "./kit";

// ---------- Higgins boat, bow toward the camera (-z), ramp angle in radians ----------
export const Higgins3D: React.FC<{ at: Pose; ramp: number; cam?: Cam; troops?: number }> = ({ at, ramp, cam = DEFAULT_CAM, troops = 1 }) => {
  const pal = usePalette();
  const W = (p: V3) => pose(p, at);
  const P = (pts: V3[]) => poly3(pts.map(W), cam);
  const D = (pts: V3[]) => path3(pts.map(W), cam);
  const nodes: React.ReactNode[] = [];
  let k = 0;
  const face = (pts: V3[], fill: string, sw = 2.4, op = 1) => {
    const q = P(pts);
    if (q.length > 2) nodes.push(<path key={k++} d={polyD(q)} fill={fill} stroke={pal.ink} strokeWidth={sw} strokeLinejoin="round" opacity={op} />);
  };
  const lines = (segs: V3[][], sw = 1.4, op = 0.8) => nodes.push(<path key={k++} d={segs.map((s) => D(s)).join("")} fill="none" stroke={pal.ink} strokeWidth={sw} opacity={op} />);
  // hull: width 3.2, length 11, sides slope outward
  const hw = 1.6;
  // interior (seen once the ramp drops): floor + troops
  face([[-hw + 0.2, 0.2, 0], [hw - 0.2, 0.2, 0], [hw - 0.2, 0.2, 8], [-hw + 0.2, 0.2, 8]], pal.ink, 1, 0.9);
  if (troops > 0)
    for (let r = 0; r < 5; r++)
      for (let cI = -1; cI <= 1; cI++) {
        const z = 1.6 + r * 1.2;
        const x = cI * 0.9;
        const head = P(ring3([x, 1.55, z], [1, 0, 0], [0, 1, 0], 0.22, 14));
        const helmet = P(ring3([x, 1.62, z], [1, 0, 0], [0, 1, 0], 0.3, 14, 0, Math.PI));
        const body = P([[x - 0.35, 0.3, z], [x + 0.35, 0.3, z], [x + 0.3, 1.4, z], [x - 0.3, 1.4, z]]);
        nodes.push(
          <g key={k++} fill={pal.ink} opacity={troops}>
            {body.length > 2 && <path d={polyD(body)} />}
            {head.length > 2 && <path d={polyD(head)} />}
            {helmet.length > 2 && <path d={polyD(helmet)} fill={pal.inkSoft} stroke={pal.ink} strokeWidth={1.5} />}
          </g>,
        );
      }
  // side walls (outer faces toward camera-left/right) and gunwales
  for (const s of [-1, 1]) {
    face([[s * hw, -0.4, 0], [s * (hw + 0.1), 2.0, 0], [s * (hw + 0.1), 2.0, 11], [s * hw, -0.4, 11]], pal.steel, 2.6);
    const ribs: V3[][] = [];
    for (let z = 0.6; z < 11; z += 0.8) ribs.push([[s * (hw + 0.05), -0.3, z], [s * (hw + 0.1), 1.9, z]]);
    lines(ribs, 1.1, 0.6);
    lines([[[s * (hw + 0.1), 2.0, 0], [s * (hw + 0.1), 2.0, 11]]], 3, 1);
  }
  // ramp hinged at the bow bottom (y=-0.2, z=0), swings toward camera
  const h = 2.3;
  const top = (x: number): V3 => [x, -0.2 + Math.cos(ramp) * h, -Math.sin(ramp) * h];
  const hinge = (x: number): V3 => [x, -0.2, 0];
  face([hinge(-hw), hinge(hw), top(hw), top(-hw)], pal.metal, 3);
  const rr: V3[][] = [];
  for (let i = 1; i < 6; i++) {
    const t = i / 6;
    rr.push([add(mul(hinge(-hw), 1 - t), mul(top(-hw), t)), add(mul(hinge(hw), 1 - t), mul(top(hw), t))]);
  }
  for (let i = 1; i < 5; i++) {
    const x = -hw + (2 * hw * i) / 5;
    rr.push([hinge(x), top(x)]);
  }
  lines(rr, 1.6, 0.8);
  // chains from gunwale to ramp top
  lines([[[-hw, 2.0, 0.2], top(-hw + 0.1)], [[hw, 2.0, 0.2], top(hw - 0.1)]], 1.4, 0.9);
  return <g strokeLinejoin="round">{nodes}</g>;
};

// ---------- P-51 style fighter, nose toward -z ----------
export const Fighter3D: React.FC<{ at: Pose; prop: number; cam?: Cam }> = ({ at, prop, cam = DEFAULT_CAM }) => {
  const pal = usePalette();
  const W = (p: V3) => pose(p, at);
  const P = (pts: V3[]) => poly3(pts.map(W), cam);
  const D = (pts: V3[]) => path3(pts.map(W), cam);
  const nodes: React.ReactNode[] = [];
  let k = 0;
  const face = (pts: V3[], fill: string, sw = 2) => {
    const q = P(pts);
    if (q.length > 2) nodes.push(<path key={k++} d={polyD(q)} fill={fill} stroke={pal.ink} strokeWidth={sw} strokeLinejoin="round" />);
  };
  // wings (low), tailplane, fin
  face([[-5.6, -0.35, 0.6], [5.6, -0.35, 0.6], [5.4, -0.2, 1.8], [1.0, -0.3, 3.2], [-1.0, -0.3, 3.2], [-5.4, -0.2, 1.8]], pal.metal, 2.2);
  const wl: V3[][] = [];
  for (const x of [-4, -2.5, 2.5, 4]) wl.push([[x, -0.33, 0.7], [x, -0.28, 2.4]]);
  nodes.push(<path key={k++} d={wl.map((s) => D(s)).join("")} fill="none" stroke={pal.ink} strokeWidth={1} opacity={0.6} />);
  face([[-2.1, 0.2, 8.2], [2.1, 0.2, 8.2], [1.8, 0.25, 9.2], [-1.8, 0.25, 9.2]], pal.metal);
  face([[0, 0.3, 7.6], [0, 2.1, 8.8], [0, 2.1, 9.4], [0, 0.3, 9.5]], pal.metal);
  // fuselage as loft of rings
  const sections: [number, number, number][] = [
    [-0.3, 0.55, 0.62],
    [0.8, 0.6, 0.72],
    [2.5, 0.62, 0.78],
    [4.5, 0.5, 0.62],
    [6.8, 0.32, 0.42],
    [9.4, 0.12, 0.18],
  ];
  const rings = sections.map(([z, rx, ry]) => {
    const pts: V3[] = [];
    for (let i = 0; i <= 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      pts.push([Math.cos(a) * rx, Math.sin(a) * ry, z]);
    }
    return pts;
  });
  const all: Pt[] = rings.flatMap((r) => P(r));
  if (all.length > 3) {
    // convex hull outline of the loft
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
    const h = [...lo.slice(0, -1), ...up.slice(0, -1)];
    nodes.push(<path key={k++} d={polyD(h)} fill={pal.steel} stroke={pal.ink} strokeWidth={2.4} />);
  }
  const lon: V3[][] = [];
  for (const i of [3, 5, 7, 13, 15, 17]) lon.push(rings.map((r) => r[i]));
  nodes.push(<path key={k++} d={lon.map((l) => D(l)).join("")} fill="none" stroke={pal.ink} strokeWidth={1} opacity={0.6} />);
  // canopy bubble
  face([[-0.35, 0.65, 2.2], [0.35, 0.65, 2.2], [0.3, 1.25, 3.0], [0.2, 0.9, 4.2], [-0.2, 0.9, 4.2], [-0.3, 1.25, 3.0]], pal.sky, 1.8);
  // belly scoop
  face([[-0.3, -0.7, 3.8], [0.3, -0.7, 3.8], [0.25, -0.95, 5.2], [-0.25, -0.95, 5.2]], pal.metal, 1.6);
  // spinner + prop disc + blades
  const disc = P(ring3([0, 0, -0.5], [1, 0, 0], [0, 1, 0], 1.7, 28));
  if (disc.length > 2) nodes.push(<path key={k++} d={polyD(disc)} fill={pal.inkSoft} opacity={0.12} stroke={pal.ink} strokeWidth={0.8} />);
  const blades: V3[][] = [];
  for (let i = 0; i < 4; i++) {
    const a = prop + (i * Math.PI) / 2;
    blades.push([[0, 0, -0.5], [Math.cos(a) * 1.7, Math.sin(a) * 1.7, -0.5]]);
  }
  nodes.push(<path key={k++} d={blades.map((b) => D(b)).join("")} fill="none" stroke={pal.ink} strokeWidth={4} opacity={0.35} />);
  face([[0, 0, -1.1], ...ring3([0, 0, -0.3], [1, 0, 0], [0, 1, 0], 0.4, 10).slice(0, 10)], pal.gold, 1.5);
  // star insignia on the wing (disc + star)
  const ins = P(ring3([3.6, -0.36, 1.3], [1, 0, 0], [0, 0, 1], 0.5, 16));
  if (ins.length > 2) nodes.push(<path key={k++} d={polyD(ins)} fill={pal.flagBlue} stroke={pal.ink} strokeWidth={1} />);
  return <g>{nodes}</g>;
};

// ---------- 2D art ----------
export const hedgehog = (s = 1, seed = "hh"): InkItem[] => {
  const items: InkItem[] = [];
  const beams: [number, number][] = [
    [-35, 150],
    [35, 150],
    [90, 120],
  ];
  beams.forEach(([deg, len], i) => {
    const a = (deg * Math.PI) / 180;
    const dx = Math.sin(a) * len * s;
    const dy = Math.cos(a) * len * s;
    const w = 14 * s;
    const nx = Math.cos(a) * w;
    const ny = -Math.sin(a) * w;
    const poly: Pt[] = [[-dx - nx, dy - ny - 110 * s], [dx - nx, -dy - ny - 110 * s], [dx + nx, -dy + ny - 110 * s], [-dx + nx, dy + ny - 110 * s]];
    items.push(...solid(poly, { fill: "steel", op: 1, tone: tones.const(i === 2 ? 0.6 : 0.45), angle: deg + 90, spacing: 2.8, levels: [0.4], w: 2.2, seed: `${seed}${i}` }));
    items.push(L(`M${-dx * 0.9} ${dy * 0.9 - 110 * s}L${dx * 0.9} ${-dy * 0.9 - 110 * s}`, 1.2, { op: 0.8 }));
  });
  items.push(...solid(ellipseP(0, -110 * s, 16 * s, 16 * s, 12), { fill: "steel", op: 1, w: 2 }));
  return items;
};

export const helmetItems = (): InkItem[] => {
  const items: InkItem[] = [];
  const dome: Pt[] = [];
  for (let i = 0; i <= 40; i++) {
    const a = Math.PI + (i / 40) * Math.PI;
    dome.push([Math.cos(a) * 230, Math.sin(a) * 190]);
  }
  const brim: Pt[] = [...ellipseP(0, 0, 270, 50, 40, 0, Math.PI)];
  items.push(...solid([...dome, ...brim.slice().reverse().map(([x, y]) => [x, y] as Pt)], { fill: "foliage", op: 0.95, tone: tones.sphere(0, -60, 240, -0.5, -0.6), angle: 30, spacing: 3.6, levels: [0.35, 0.6, 0.82], w: 3, seed: "helm" }));
  // camouflage netting
  const net: string[] = [];
  for (let k = -6; k <= 6; k++) net.push(smoothD([[-230 + k * 10, -10], [k * 28 - 60, -150], [k * 30 + 60, -170]]));
  items.push(L(net.join(""), 1, { op: 0.55 }));
  items.push(L(polyD(ellipseP(0, 0, 270, 50, 40)), 3));
  items.push(L("M-200 10Q-150 90 -60 110M200 10Q170 70 120 96", 3.4));
  return items;
};

// Flag raising: six figures pushing a pole up (silhouette), pole angle in degrees
export const raisingFigures = (angle: number): { d: string; poleTop: Pt; poleBase: Pt } => {
  const base: Pt = [760, 900];
  const len = 820;
  const a = (angle * Math.PI) / 180;
  const top: Pt = [base[0] + Math.cos(a) * len, base[1] - Math.sin(a) * len];
  const along = (t: number): Pt => [base[0] + (top[0] - base[0]) * t, base[1] + (top[1] - base[1]) * t];
  const shapes: string[] = [];
  const specs = [
    { t: 0.08, lean: 0.9, x: -40, h: 1.0 },
    { t: 0.16, lean: 0.8, x: 20, h: 1.05 },
    { t: 0.24, lean: 0.75, x: 70, h: 1.0 },
    { t: 0.32, lean: 0.7, x: 120, h: 1.1 },
    { t: 0.4, lean: 0.65, x: 180, h: 1.05 },
    { t: 0.5, lean: 0.55, x: 250, h: 1.15 },
  ];
  specs.forEach((sp) => {
    const [hx, hy] = along(sp.t + 0.08);
    const fx = base[0] + sp.x - 120;
    const fy = base[1] + 10;
    const hipX = (hx + fx) / 2 - 20;
    const hipY = (hy + fy) / 2 + 40;
    const shoulderX = hx - 40 * sp.lean;
    const shoulderY = hy + 30;
    shapes.push(`M${fx - 16} ${fy}L${hipX - 10} ${hipY}L${shoulderX - 22} ${shoulderY + 10}L${shoulderX + 18} ${shoulderY - 6}L${hipX + 18} ${hipY + 4}L${fx + 22} ${fy}Z`);
    shapes.push(`M${shoulderX - 4} ${shoulderY - 18}a24 20 0 1 0 0.1 0Z`);
    shapes.push(`M${shoulderX - 28} ${shoulderY - 24}q28 -30 58 0Z`);
    shapes.push(`M${shoulderX + 6} ${shoulderY + 4}L${hx} ${hy}L${hx + 6} ${hy + 12}L${shoulderX + 12} ${shoulderY + 20}Z`);
  });
  return { d: shapes.join(""), poleTop: top, poleBase: base };
};

export const rubbleMound = (): InkItem[] => {
  const mound: Pt[] = [[-400, 1300], [-400, 1000], [200, 960], [600, 900], [900, 890], [1300, 930], [1800, 990], [2400, 1040], [2400, 1300]];
  return [F(smoothD(mound, true, 0.4), "ink", 1), HT(hatch([mound], { angle: 25, spacing: 5, seed: "rub" }), 1, 0.4, "inkSoft")];
};

export { rectP };
