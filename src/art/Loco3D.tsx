// An 1869-style 4-4-0 locomotive built in 3D and projected every frame, so it
// can charge at the camera with true perspective: balloon stack, headlamp,
// cowcatcher, spoked drivers with pumping rods.
import { usePalette } from "../lib/palette";
import { Pt, polyD } from "../lib/engrave";
import { add, Cam, DEFAULT_CAM, dot, mul, norm, path3, poly3, pose, Pose, project, ring3, sub, V3 } from "../lib/three";
import { useUid } from "../lib/uid";

const hull = (pts: Pt[]): Pt[] => {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const cr = (o: Pt, a: Pt, b: Pt) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: Pt[] = [];
  for (const q of p) {
    while (lower.length >= 2 && cr(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop();
    lower.push(q);
  }
  const upper: Pt[] = [];
  for (const q of p.slice().reverse()) {
    while (upper.length >= 2 && cr(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop();
    upper.push(q);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
};

const X: V3 = [1, 0, 0];
const Y: V3 = [0, 1, 0];
const Z: V3 = [0, 0, 1];
const LIGHT = norm([-0.5, 0.8, -0.4]);

export const Loco3D: React.FC<{ at: Pose; wheelAngle: number; cam?: Cam; lamp?: number }> = ({ at, wheelAngle, cam = DEFAULT_CAM, lamp = 1 }) => {
  const pal = usePalette();
  const uid = useUid("loco");
  const W = (p: V3) => pose(p, at);
  const P = (pts: V3[]) => poly3(pts.map(W), cam);
  const D = (pts: V3[], close = false) => path3(pts.map(W), cam, close);
  const camPos: V3 = [0, 0, 0];
  const nodes: React.ReactNode[] = [];
  let k = 0;
  const fillPoly = (pts: V3[], fill: string, stroke = pal.ink, sw = 2.2, op = 1) => {
    const q = P(pts);
    if (q.length < 3) return;
    nodes.push(<path key={k++} d={polyD(q)} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" opacity={op} />);
  };
  const line = (pts: V3[], sw = 1.6, stroke = pal.ink, op = 1) => nodes.push(<path key={k++} d={D(pts)} fill="none" stroke={stroke} strokeWidth={sw} opacity={op} strokeLinecap="round" />);
  // cylinder along an axis with engraved shading lines on its shadow side
  const cylinder = (c0: V3, c1: V3, r: number, u: V3, v: V3, fill: string, bands: number[] = [], shade = true) => {
    const n = 36;
    const a = ring3(c0, u, v, r, n);
    const b = ring3(c1, u, v, r, n);
    const h = hull([...P(a), ...P(b)]);
    if (h.length > 2) nodes.push(<path key={k++} d={polyD(h)} fill={fill} stroke={pal.ink} strokeWidth={2.4} strokeLinejoin="round" />);
    const axis = norm(sub(c1, c0));
    const lines: string[] = [];
    for (let i = 0; i < n; i++) {
      const th = (i / n) * Math.PI * 2;
      const nrm = add(mul(u, Math.cos(th)), mul(v, Math.sin(th)));
      const pw = W(a[i]);
      const nw = norm(sub(W(add(a[i], nrm)), pw));
      const toCam = sub(camPos, pw);
      if (dot(nw, toCam) <= 0) continue;
      const lit = dot(nw, LIGHT);
      if (!shade) continue;
      const step = lit < -0.2 ? 1 : lit < 0.25 ? 2 : lit < 0.55 ? 4 : 99;
      if (i % step === 0) lines.push(D([a[i], b[i]]));
    }
    nodes.push(<path key={k++} d={lines.join("")} fill="none" stroke={pal.ink} strokeWidth={1.1} opacity={0.75} />);
    for (const t of bands) {
      const ring = ring3(add(c0, mul(axis, t * Math.hypot(...(sub(c1, c0) as [number, number, number])))), u, v, r * 1.01, n);
      const vis = ring.filter((p, i) => {
        const th = (i / n) * Math.PI * 2;
        const nrm = add(mul(u, Math.cos(th)), mul(v, Math.sin(th)));
        const pw = W(p);
        return dot(norm(sub(W(add(p, nrm)), pw)), sub(camPos, pw)) > 0;
      });
      if (vis.length > 1) line(vis, 2.4);
    }
  };
  const disk = (c: V3, r: number, u: V3, v: V3, fill: string, sw = 2.4) => fillPoly(ring3(c, u, v, r, 40).slice(0, 40), fill, pal.ink, sw);
  const wheel = (c: V3, r: number, side: number, spokes = 12) => {
    disk(c, r, Z, Y, pal.wood, 2.6);
    disk(c, r * 0.88, Z, Y, pal.metal, 1.2);
    const sp: string[] = [];
    for (let i = 0; i < spokes; i++) {
      const a = wheelAngle + (i / spokes) * Math.PI * 2;
      sp.push(D([add(c, add(mul(Z, Math.cos(a) * r * 0.15), mul(Y, Math.sin(a) * r * 0.15))), add(c, add(mul(Z, Math.cos(a) * r * 0.86), mul(Y, Math.sin(a) * r * 0.86)))]));
    }
    nodes.push(<path key={k++} d={sp.join("")} fill="none" stroke={pal.ink} strokeWidth={3} strokeLinecap="round" />);
    disk(add(c, [side * 0.02, 0, 0]), r * 0.18, Z, Y, pal.steel, 2);
    // counterweight
    const cwA = wheelAngle + Math.PI;
    const cw = ring3(c, Z, Y, r * 0.8, 10, cwA - 0.5, cwA + 0.5);
    fillPoly([...cw, ...ring3(c, Z, Y, r * 0.5, 10, cwA + 0.5, cwA - 0.5)], pal.ink, pal.ink, 1);
  };
  const box = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, fill: string, fillSide = fill) => {
    // faces visible from a camera in front-right: front (z0), right (x1), top (y1)
    fillPoly([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], fill);
    fillPoly([[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], fillSide);
    fillPoly([[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], fill);
  };

  // far-side drivers (mostly hidden)
  for (const z of [3.4, 5.1]) wheel([-1.02, 0.87, z], 0.87, -1);
  // cab
  box(-1.3, 1.3, 1.5, 4.1, 6.1, 7.9, pal.wood, pal.brick);
  fillPoly([[-1.45, 4.1, 5.95], [1.45, 4.1, 5.95], [1.45, 4.35, 8.1], [-1.45, 4.35, 8.1]], pal.ink);
  for (const wx of [-0.9, 0.3]) fillPoly([[wx, 2.9, 6.09], [wx + 0.6, 2.9, 6.09], [wx + 0.6, 3.7, 6.09], [wx, 3.7, 6.09]], pal.glow, pal.ink, 1.8);
  fillPoly([[1.31, 2.9, 6.5], [1.31, 3.7, 6.5], [1.31, 3.7, 7.5], [1.31, 2.9, 7.5]], pal.ink, pal.ink, 1.8);
  // frame / running board
  fillPoly([[1.15, 1.45, -0.1], [1.15, 1.6, -0.1], [1.15, 1.6, 6.2], [1.15, 1.45, 6.2]], pal.wood);
  // boiler
  cylinder([0, 2.25, 0.2], [0, 2.25, 6.05], 0.72, X, Y, pal.metal, [0.22, 0.45, 0.68, 0.9]);
  // domes and bell
  cylinder([0, 2.85, 3.3], [0, 3.55, 3.3], 0.36, X, Z, pal.gold, [], true);
  disk([0, 3.58, 3.3], 0.4, X, Z, pal.gold);
  cylinder([0, 2.85, 4.6], [0, 3.35, 4.6], 0.3, X, Z, pal.metal, [], true);
  disk([0, 3.38, 4.6], 0.33, X, Z, pal.metal);
  const bell = [...ring3([0, 3.2, 2.2], X, Z, 0.2, 16), ...ring3([0, 3.55, 2.2], X, Z, 0.1, 16)];
  const bq = hull(P(bell));
  if (bq.length > 2) nodes.push(<path key={k++} d={polyD(bq)} fill={pal.gold} stroke={pal.ink} strokeWidth={2} />);
  // balloon stack
  const stackRings: [number, number][] = [
    [2.9, 0.26],
    [3.3, 0.3],
    [3.8, 0.48],
    [4.25, 0.72],
    [4.5, 0.72],
    [4.62, 0.6],
  ];
  const stackPts: Pt[] = [];
  stackRings.forEach(([y, r]) => stackPts.push(...P(ring3([0, y, 0.9], X, Z, r, 24))));
  const sh = hull(stackPts);
  nodes.push(<path key={k++} d={polyD(sh)} fill={pal.ink} stroke={pal.ink} strokeWidth={2.4} />);
  stackRings.forEach(([y, r]) => line(ring3([0, y, 0.9], X, Z, r, 24), 1.4, pal.inkSoft));
  // smokebox front + door
  disk([0, 2.25, 0.18], 0.74, X, Y, pal.steel, 2.8);
  disk([0, 2.25, 0.14], 0.55, X, Y, pal.ink, 2);
  line([[-0.5, 2.45, 0.12], [0.5, 2.45, 0.12]], 2.6, pal.metal);
  line([[-0.5, 2.05, 0.12], [0.5, 2.05, 0.12]], 2.6, pal.metal);
  // headlamp: box with a glowing lens and a roof
  box(-0.42, 0.42, 2.95, 3.72, -0.05, 0.62, pal.wood, pal.brick);
  const lens = P(ring3([0, 3.33, -0.06], X, Y, 0.3, 24));
  const lc = project(W([0, 3.33, -0.06]), cam);
  if (lc && lens.length > 2) {
    const r = Math.hypot(lens[0][0] - lc[0], lens[0][1] - lc[1]);
    nodes.push(
      <g key={k++}>
        <defs>
          <radialGradient id={`${uid}g`}>
            <stop offset="0" stopColor="#fffdf0" stopOpacity={lamp} />
            <stop offset="0.25" stopColor={pal.glow} stopOpacity={0.8 * lamp} />
            <stop offset="1" stopColor={pal.flame} stopOpacity={0} />
          </radialGradient>
        </defs>
        <circle cx={lc[0]} cy={lc[1]} r={r * 7} fill={`url(#${uid}g)`} />
        <path d={polyD(lens)} fill="#fffbe8" stroke={pal.ink} strokeWidth={2} />
      </g>,
    );
  }
  fillPoly([[-0.5, 3.72, -0.12], [0.5, 3.72, -0.12], [0.5, 3.72, 0.7], [-0.5, 3.72, 0.7]], pal.ink);
  fillPoly([[-0.5, 3.72, -0.12], [0.5, 3.72, -0.12], [0, 3.98, 0.3]], pal.metal);
  // near cylinder, leading truck and drivers
  cylinder([1.0, 1.35, 0.55], [1.0, 1.35, 1.65], 0.34, Y, X, pal.steel, [0.1, 0.9]);
  for (const z of [0.6, 1.6]) wheel([0.92, 0.45, z], 0.45, 1, 10);
  for (const z of [3.4, 5.1]) wheel([1.03, 0.87, z], 0.87, 1);
  // rods: side rod between crank pins, main rod to the crosshead
  const pin = (z: number): V3 => [1.14, 0.87 + Math.sin(wheelAngle) * 0.4, z + Math.cos(wheelAngle) * 0.4];
  const p1 = pin(3.4);
  const p2 = pin(5.1);
  const cross: V3 = [1.14, 1.35, 2.05 + Math.cos(wheelAngle) * 0.4];
  line([p1, p2], 7, pal.ink);
  line([p1, p2], 3, pal.steel);
  line([cross, p1], 8, pal.ink);
  line([cross, p1], 3.5, pal.steel);
  line([[1.14, 1.35, 1.65], cross], 5, pal.ink);
  // buffer beam and cowcatcher
  box(-1.2, 1.2, 0.9, 1.25, -0.25, 0.05, pal.brick);
  const tip: V3 = [0, 0.12, -1.35];
  fillPoly([tip, [1.05, 0.12, -0.25], [1.05, 1.0, -0.2], [0, 0.95, -0.45]], pal.wood);
  fillPoly([tip, [-1.05, 0.12, -0.25], [-1.05, 1.0, -0.2], [0, 0.95, -0.45]], pal.wood);
  const slats: V3[][] = [];
  for (let i = 1; i < 7; i++) {
    const t = i / 7;
    slats.push([add(mul(tip, 1 - t), mul([1.05, 0.12, -0.25], t)), add(mul([0, 0.95, -0.45], 1 - t), mul([1.05, 1.0, -0.2], t))]);
    slats.push([add(mul(tip, 1 - t), mul([-1.05, 0.12, -0.25], t)), add(mul([0, 0.95, -0.45], 1 - t), mul([-1.05, 1.0, -0.2], t))]);
  }
  nodes.push(<path key={k++} d={slats.map((s) => D(s)).join("")} fill="none" stroke={pal.ink} strokeWidth={2.2} />);
  return <g strokeLinejoin="round">{nodes}</g>;
};

// Stack top in screen space, for emitting smoke
export const stackTop = (at: Pose, cam: Cam = DEFAULT_CAM) => project(pose([0, 4.7, 0.9], at), cam);
