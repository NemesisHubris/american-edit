// Deterministic CPU noise for geometry (matches the spirit of the GLSL noise).
import { hash } from "../lib/random";

const fade = (t: number) => t * t * (3 - 2 * t);
const h2 = (x: number, y: number, s: number) => hash(x, y, s);

export const vnoise2 = (x: number, y: number, seed = 0) => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = fade(x - xi);
  const yf = fade(y - yi);
  const a = h2(xi, yi, seed);
  const b = h2(xi + 1, yi, seed);
  const c = h2(xi, yi + 1, seed);
  const d = h2(xi + 1, yi + 1, seed);
  return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
};

export const fbm2 = (x: number, y: number, oct = 5, seed = 0) => {
  let a = 0.5;
  let s = 0;
  for (let i = 0; i < oct; i++) {
    s += a * vnoise2(x, y, seed + i * 17);
    x = x * 2.03 + 17.1;
    y = y * 2.03 + 11.7;
    a *= 0.5;
  }
  return s;
};

// ridged noise (sharp crests) for mountains / rock
export const ridged2 = (x: number, y: number, oct = 5, seed = 0) => {
  let a = 0.5;
  let s = 0;
  for (let i = 0; i < oct; i++) {
    const n = 1 - Math.abs(vnoise2(x, y, seed + i * 17) * 2 - 1);
    s += a * n * n;
    x = x * 2.03 + 17.1;
    y = y * 2.03 + 11.7;
    a *= 0.5;
  }
  return s;
};
