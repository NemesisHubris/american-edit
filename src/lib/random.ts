// Deterministic hashing, seeded random and smooth noise. Never use Math.random.

const hashString = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

// Integer hash -> [0, 1)
export const hash = (...n: number[]) => {
  let h = 0x9e3779b9;
  for (const v of n) {
    h ^= Math.imul((v | 0) ^ 0x85ebca6b, 0xc2b2ae35);
    h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
    h ^= h >>> 13;
  }
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};

// Seeded PRNG (mulberry32)
export const rng = (seed: string | number) => {
  let a = typeof seed === "string" ? hashString(seed) : seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const seedOf = (s: string) => hashString(s);

const smooth = (t: number) => t * t * (3 - 2 * t);

// Smooth 1D value noise in [-1, 1]
export const noise1 = (x: number, seed = 0) => {
  const i = Math.floor(x);
  const f = x - i;
  const a = hash(i, seed) * 2 - 1;
  const b = hash(i + 1, seed) * 2 - 1;
  return a + (b - a) * smooth(f);
};

// Smooth 2D value noise in [-1, 1]
export const noise2 = (x: number, y: number, seed = 0) => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = smooth(x - xi);
  const yf = smooth(y - yi);
  const a = hash(xi, yi, seed);
  const b = hash(xi + 1, yi, seed);
  const c = hash(xi, yi + 1, seed);
  const d = hash(xi + 1, yi + 1, seed);
  return (a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf) * 2 - 1;
};

export const fbm2 = (x: number, y: number, seed = 0, octaves = 3) => {
  let s = 0;
  let amp = 0.5;
  let fr = 1;
  for (let o = 0; o < octaves; o++) {
    s += amp * noise2(x * fr, y * fr, seed + o * 101);
    fr *= 2;
    amp *= 0.5;
  }
  return s;
};
