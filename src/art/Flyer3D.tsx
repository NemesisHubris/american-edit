// The 1903 Wright Flyer in 3D: fabric biplane wings with ribs, struts and
// bracing wires, canard, twin rudders, pusher props, prone pilot.
import { usePalette } from "../lib/palette";
import { polyD } from "../lib/engrave";
import { add, Cam, DEFAULT_CAM, mul, path3, poly3, pose, Pose, V3 } from "../lib/three";

export const Flyer3D: React.FC<{ at: Pose; prop: number; cam?: Cam }> = ({ at, prop, cam = DEFAULT_CAM }) => {
  const pal = usePalette();
  const W = (p: V3) => pose(p, at);
  const P = (pts: V3[]) => poly3(pts.map(W), cam);
  const D = (pts: V3[]) => path3(pts.map(W), cam);
  const nodes: React.ReactNode[] = [];
  let k = 0;
  const face = (pts: V3[], fill: string, sw = 2.2) => {
    const q = P(pts);
    if (q.length > 2) nodes.push(<path key={k++} d={polyD(q)} fill={fill} stroke={pal.ink} strokeWidth={sw} strokeLinejoin="round" />);
  };
  const lines = (segs: V3[][], sw = 1.4, op = 1, stroke = pal.ink) =>
    nodes.push(<path key={k++} d={segs.map((s) => D(s)).join("")} fill="none" stroke={stroke} strokeWidth={sw} opacity={op} strokeLinecap="round" />);
  const S = 6.1;
  const wing = (y: number, span = S, z0 = -0.9, z1 = 0.9, xOff = 0) => {
    const camber = 0.08;
    face([[-span + xOff, y, z0], [span + xOff, y, z0], [span + xOff, y + camber, (z0 + z1) / 2], [span + xOff, y, z1], [-span + xOff, y, z1], [-span + xOff, y + camber, (z0 + z1) / 2]], pal.flagWhite, 2.4);
    const ribs: V3[][] = [];
    for (let x = -span; x <= span + 1e-6; x += span / 12) ribs.push([[x + xOff, y, z0], [x + xOff, y + camber, (z0 + z1) / 2], [x + xOff, y, z1]]);
    lines(ribs, 1.1, 0.7);
    lines([[[-span + xOff, y, z0 + 0.12], [span + xOff, y, z0 + 0.12]]], 1.6, 0.9);
  };
  // lower wing, then struts & wires, then upper wing (painter's order from below-front)
  wing(0.1);
  const struts: V3[][] = [];
  const wires: V3[][] = [];
  const xs = [-6, -4.7, -3.4, -2.1, -0.8, 0.8, 2.1, 3.4, 4.7, 6];
  for (const x of xs) for (const z of [-0.8, 0.8]) struts.push([[x, 0.1, z], [x, 1.9, z]]);
  for (let i = 0; i < xs.length - 1; i++) {
    wires.push([[xs[i], 0.1, -0.8], [xs[i + 1], 1.9, -0.8]], [[xs[i], 1.9, -0.8], [xs[i + 1], 0.1, -0.8]]);
  }
  lines(wires, 0.8, 0.6);
  lines(struts, 2.2);
  // canard with outrigger booms
  lines([[[-0.6, 0.1, -0.9], [-0.6, 0.45, -2.7]], [[0.6, 0.1, -0.9], [0.6, 0.45, -2.7]], [[-0.6, 1.9, -0.9], [-0.6, 1.2, -2.7]], [[0.6, 1.9, -0.9], [0.6, 1.2, -2.7]]], 1.8);
  wing(0.45, 2.2, -3.3, -2.5);
  wing(1.2, 2.2, -3.3, -2.5);
  lines([[[-2, 0.45, -2.9], [-2, 1.2, -2.9]], [[2, 0.45, -2.9], [2, 1.2, -2.9]], [[0, 0.45, -2.9], [0, 1.2, -2.9]]], 1.8);
  // pilot lying prone, engine block
  face([[-0.6, 0.12, -0.5], [-0.1, 0.12, -0.5], [-0.1, 0.35, 0.6], [-0.6, 0.35, 0.6]], pal.ink, 1.5);
  face([[0.2, 0.12, -0.2], [0.8, 0.12, -0.2], [0.8, 0.6, 0.3], [0.2, 0.6, 0.3]], pal.metal, 1.6);
  wing(1.9);
  // rudders on booms
  lines([[[-0.6, 0.1, 0.9], [-0.35, 0.3, 2.6]], [[0.6, 0.1, 0.9], [0.35, 0.3, 2.6]], [[-0.6, 1.9, 0.9], [-0.35, 1.9, 2.6]], [[0.6, 1.9, 0.9], [0.35, 1.9, 2.6]]], 1.6);
  for (const x of [-0.35, 0.35]) face([[x, 0.3, 2.6], [x, 1.9, 2.6], [x, 1.9, 3.3], [x, 0.3, 3.3]], pal.flagWhite, 2);
  // pusher propellers: blurred disc + blades
  for (const [px, dir] of [
    [-1.7, 1],
    [1.7, -1],
  ] as [number, number][]) {
    const c: V3 = [px, 1.0, 1.25];
    const disc: V3[] = [];
    for (let i = 0; i <= 28; i++) {
      const a = (i / 28) * Math.PI * 2;
      disc.push(add(c, [Math.cos(a) * 1.3, Math.sin(a) * 1.3, 0]));
    }
    const q = P(disc);
    if (q.length > 2) nodes.push(<path key={k++} d={polyD(q)} fill={pal.inkSoft} opacity={0.15} stroke={pal.ink} strokeWidth={0.8} />);
    const a = prop * dir;
    const blade: V3[][] = [];
    for (const off of [0, Math.PI]) {
      const aa = a + off;
      blade.push([c, add(c, mul([Math.cos(aa), Math.sin(aa), 0], 1.3))]);
    }
    lines(blade, 5, 0.9);
  }
  // skids
  lines([[[-0.6, -0.3, -1.6], [-0.6, -0.3, 0.8]], [[0.6, -0.3, -1.6], [0.6, -0.3, 0.8]], [[-0.6, -0.3, -1.6], [-0.6, 0.1, -0.8]], [[0.6, -0.3, -1.6], [0.6, 0.1, -0.8]]], 1.8);
  return <g>{nodes}</g>;
};
