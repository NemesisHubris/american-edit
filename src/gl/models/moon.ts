// The Moon: a baked equirectangular albedo + height map (maria, hundreds of
// craters with raised rims and bright ray ejecta), lit as a sphere so the
// terminator and crater relief read in 3D.
import * as THREE from "three";
import { memo } from "../../lib/math";
import { rng } from "../../lib/random";
import { fbm2 } from "../noise";
import type { GL } from "../GLShot";

const TW = 1024;
const TH = 512;

export const moonTexture = () =>
  memo("gl:moonTex", () => {
    const h = new Float32Array(TW * TH);
    const alb = new Float32Array(TW * TH);
    const dir = (i: number, j: number) => {
      const u = (i + 0.5) / TW;
      const vt = (j + 0.5) / TH;
      const th = (1 - vt) * Math.PI;
      const ph = u * Math.PI * 2;
      return [-Math.cos(ph) * Math.sin(th), Math.cos(th), Math.sin(ph) * Math.sin(th)];
    };
    for (let j = 0; j < TH; j++)
      for (let i = 0; i < TW; i++) {
        const [x, y, z] = dir(i, j);
        const m = fbm2(x * 1.6 + z * 0.7 + 3, y * 1.6 - z * 0.9 + 7, 5, 11);
        const mare = Math.min(1, Math.max(0, (m - 0.52) / 0.06));
        const k = j * TW + i;
        alb[k] = 0.86 - mare * 0.3 + (fbm2(x * 9 + 1, y * 9 + z * 9, 4, 5) - 0.5) * 0.12;
        h[k] = -mare * 0.004 + (fbm2(x * 6, y * 6 + z * 6, 4, 3) - 0.5) * 0.003;
      }
    const r = rng("moon-craters");
    const N = 1600;
    for (let c = 0; c < N; c++) {
      // uniform on sphere
      const zc = r() * 2 - 1;
      const pc = r() * Math.PI * 2;
      const sc = Math.sqrt(1 - zc * zc);
      const cx = Math.cos(pc) * sc;
      const cy = zc;
      const cz = Math.sin(pc) * sc;
      const rad = 0.005 + Math.pow(r(), 7) * 0.15; // angular radius (mostly small)
      const depth = rad * (0.1 + r() * 0.06);
      const fresh = r() < 0.12;
      // bounding box in texture space
      const th = Math.acos(cy);
      const ph = Math.atan2(cz, -cx);
      const vt = 1 - th / Math.PI;
      const jc = vt * TH;
      const span = (rad * 3.2) / Math.PI;
      const j0 = Math.max(0, Math.floor(jc - span * TH));
      const j1 = Math.min(TH - 1, Math.ceil(jc + span * TH));
      const sinT = Math.max(0.08, Math.sin(th));
      const ic = (((ph / (Math.PI * 2)) % 1) + 1) % 1 * TW;
      const ispan = Math.min(TW / 2, (span * TH) / sinT);
      for (let j = j0; j <= j1; j++)
        for (let ii = Math.floor(ic - ispan); ii <= Math.ceil(ic + ispan); ii++) {
          const i = ((ii % TW) + TW) % TW;
          const [x, y, z] = dir(i, j);
          const d = Math.acos(Math.max(-1, Math.min(1, x * cx + y * cy + z * cz))) / rad;
          if (d > 3.2) continue;
          const k = j * TW + i;
          let dh = 0;
          if (d < 1) dh = -depth * (1 - d * d) + depth * 0.25;
          else dh = depth * 0.25 * Math.exp(-(d - 1) * (d - 1) * 6);
          h[k] += dh;
          if (d < 1.15) alb[k] += (d > 0.8 ? 0.06 : -0.03);
          if (fresh && d < 3.2) {
            const ray = Math.pow(Math.max(0, Math.sin(Math.atan2(y - cy, x - cx + z - cz) * 9 + c)), 8);
            alb[k] += (d < 1.2 ? 0.12 : ray * 0.18 * (1 - d / 3.2));
          }
        }
    }
    const data = new Uint8Array(TW * TH * 4);
    let hmin = Infinity;
    let hmax = -Infinity;
    for (let k = 0; k < h.length; k++) {
      hmin = Math.min(hmin, h[k]);
      hmax = Math.max(hmax, h[k]);
    }
    for (let k = 0; k < h.length; k++) {
      data[k * 4] = Math.max(0, Math.min(255, alb[k] * 255));
      data[k * 4 + 1] = ((h[k] - hmin) / (hmax - hmin)) * 255;
      data[k * 4 + 2] = 0;
      data[k * 4 + 3] = 255;
    }
    return { data, hscale: hmax - hmin };
  });

export const makeMoon = (g: GL, radius: number, opts: { hatch?: number; color?: string; bump?: number } = {}) => {
  const { data, hscale } = moonTexture();
  const tex = new THREE.DataTexture(data, TW, TH, THREE.RGBAFormat);
  tex.wrapS = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  const mat = g.ink({
    color: opts.color ?? "#e9e4d8",
    mode: "screen",
    scale: 4,
    angle: 30,
    hatch: opts.hatch ?? 0.55,
    shade: 0.9,
    emissive: "#3a352c",
    cross: 0.3,
    uniforms: { uMoon: { value: tex }, uBump: { value: (opts.bump ?? 1) * hscale * 25 } },
    fragDecl: /* glsl */ `
      uniform sampler2D uMoon;
      uniform float uBump;
    `,
    frag: /* glsl */ `
      vec2 ts = 1.0 / vec2(textureSize(uMoon, 0));
      vec4 mt = texture(uMoon, vUv);
      float hL = texture(uMoon, vUv - vec2(ts.x, 0.0)).g, hR = texture(uMoon, vUv + vec2(ts.x, 0.0)).g;
      float hD = texture(uMoon, vUv - vec2(0.0, ts.y)).g, hU = texture(uMoon, vUv + vec2(0.0, ts.y)).g;
      float th = (1.0 - vUv.y) * 3.14159265;
      float ph = vUv.x * 6.2831853;
      float sT = max(sin(th), 0.05);
      float gph = (hR - hL) / (2.0 * ts.x * 6.2831853 * sT);
      float gth = (hU - hD) / (-2.0 * ts.y * 3.14159265);
      vec3 E = vec3(sin(ph), 0.0, cos(ph));
      vec3 S = vec3(-cos(ph) * cos(th), -sin(th), sin(ph) * cos(th));
      vec3 dObj = normalize(vObj);
      vec3 pert = normalize(dObj - uBump * (gph * E + gth * S));
      N = normalize(N + (pert - dObj));
      albedo *= mt.r * 1.15;
    `,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 128, 64), mat);
  return { mesh, mat };
};
