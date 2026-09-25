// A tiny perspective projector for engraved "3D" subjects (locomotive, Wright
// Flyer, fighters, smartphone). World units are metres; camera looks down +Z.
import { Pt } from "./engrave";

export type V3 = [number, number, number];

export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
export const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

export const rotX = (p: V3, a: number): V3 => {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c];
};
export const rotY = (p: V3, a: number): V3 => {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c];
};
export const rotZ = (p: V3, a: number): V3 => {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2]];
};

// Rigid transform: roll (Z), pitch (X), yaw (Y), then translate
export type Pose = { pos: V3; yaw?: number; pitch?: number; roll?: number };
export const pose = (p: V3, o: Pose): V3 => {
  let q = p;
  if (o.roll) q = rotZ(q, o.roll);
  if (o.pitch) q = rotX(q, o.pitch);
  if (o.yaw) q = rotY(q, o.yaw);
  return add(q, o.pos);
};

export type Cam = { focal: number; cx: number; cy: number; near?: number };
export const DEFAULT_CAM: Cam = { focal: 1100, cx: 960, cy: 540, near: 0.2 };

export const project = (p: V3, cam: Cam = DEFAULT_CAM): Pt | null => {
  if (p[2] < (cam.near ?? 0.2)) return null;
  return [cam.cx + (cam.focal * p[0]) / p[2], cam.cy - (cam.focal * p[1]) / p[2]];
};

const f1 = (v: number) => Math.round(v * 10) / 10;

// Project a 3D polyline (skips segments behind the camera)
export const path3 = (pts: V3[], cam: Cam = DEFAULT_CAM, close = false): string => {
  let d = "";
  let pen = false;
  const all = close ? [...pts, pts[0]] : pts;
  for (const p of all) {
    const q = project(p, cam);
    if (!q) {
      pen = false;
      continue;
    }
    d += `${pen ? "L" : "M"}${f1(q[0])} ${f1(q[1])}`;
    pen = true;
  }
  return d;
};

export const poly3 = (pts: V3[], cam: Cam = DEFAULT_CAM): Pt[] => pts.map((p) => project(p, cam)).filter((q): q is Pt => q !== null);

// Circle of radius r around centre c in the plane spanned by unit vectors u, v
export const ring3 = (c: V3, u: V3, v: V3, r: number, n = 32, a0 = 0, a1 = Math.PI * 2): V3[] => {
  const out: V3[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    out.push(add(c, add(mul(u, Math.cos(a) * r), mul(v, Math.sin(a) * r))));
  }
  return out;
};
