// Tileable noise texture shared by all shaders (see TNOISE in glsl.ts).
import * as THREE from "three";
import { hash } from "../lib/random";

const N = 256;
const CELLS = 8;

const tileNoise = (x: number, y: number, period: number, seed: number) => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = x - xi;
  const fy = y - yi;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const m = (v: number) => ((v % period) + period) % period;
  const a = hash(m(xi), m(yi), seed);
  const b = hash(m(xi + 1), m(yi), seed);
  const c = hash(m(xi), m(yi + 1), seed);
  const d = hash(m(xi + 1), m(yi + 1), seed);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
};

const tileFbm = (u: number, v: number, seed: number, base: number, oct: number) => {
  let a = 0.5;
  let s = 0;
  let f = base;
  for (let i = 0; i < oct; i++) {
    s += a * tileNoise(u * f, v * f, f, seed + i * 31);
    f *= 2;
    a *= 0.5;
  }
  return s;
};

let tex: THREE.DataTexture | null = null;
export const noiseTexture = () => {
  if (tex) return tex;
  const d = new Uint8Array(N * N * 4);
  for (let j = 0; j < N; j++)
    for (let i = 0; i < N; i++) {
      const u = i / N;
      const v = j / N;
      const k = (j * N + i) * 4;
      d[k] = Math.round(tileFbm(u, v, 11, CELLS, 5) * 255);
      d[k + 1] = Math.round(tileFbm(u, v, 57, CELLS, 5) * 255);
      d[k + 2] = Math.round(tileNoise(u * CELLS, v * CELLS, CELLS, 91) * 255);
      d[k + 3] = Math.round(tileFbm(u, v, 133, CELLS * 4, 3) * 255);
    }
  tex = new THREE.DataTexture(d, N, N, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
};
