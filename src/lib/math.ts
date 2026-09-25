import { Easing, interpolate } from "remotion";

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const TAU = Math.PI * 2;

export const easeInOut = Easing.inOut(Easing.cubic);
export const easeOut = Easing.out(Easing.cubic);
export const easeIn = Easing.in(Easing.cubic);
export const easeOutQuint = Easing.out(Easing.poly(5));
export const easeInOutSine = Easing.inOut(Easing.sin);

// 0..1 progress of frame f between a and b, eased and clamped
export const ramp = (f: number, a: number, b: number, easing: (t: number) => number = easeInOut) =>
  b <= a
    ? f >= a
      ? 1
      : 0
    : interpolate(f, [a, b], [0, 1], {
        easing,
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });

// Eased interpolation over multiple keyframes: keys = [[frame, value], ...]
export const keys = (
  f: number,
  pts: [number, number][],
  easing: (t: number) => number = easeInOut,
): number => {
  if (f <= pts[0][0]) return pts[0][1];
  for (let i = 0; i < pts.length - 1; i++) {
    const [f0, v0] = pts[i];
    const [f1, v1] = pts[i + 1];
    if (f <= f1) return lerp(v0, v1, easing(clamp((f - f0) / Math.max(1e-6, f1 - f0))));
  }
  return pts[pts.length - 1][1];
};

// Module-level cache so heavy geometry is built once per browser tab
const cache = new Map<string, unknown>();
export function memo<T>(key: string, build: () => T): T {
  if (!cache.has(key)) cache.set(key, build());
  return cache.get(key) as T;
}
