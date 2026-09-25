// US flag as rippling cloth: a vertex-displaced grid (travelling waves that grow
// towards the fly end) with lit folds, engraved shading and procedural stripes
// and stars. `stars`: 13 (1776 circle), 48 or 50.
import * as THREE from "three";
import type { GL } from "../GLShot";

export type FlagOpts = {
  w?: number;
  h?: number;
  stars?: 13 | 48 | 50;
  wind?: number; // amplitude
  speed?: number;
  droop?: number; // gravity sag (0 = taut)
  rod?: boolean; // Apollo-style top rod (reduced sag)
  hatch?: number;
  wrinkle?: number;
};

export const makeFlag = (g: GL, o: FlagOpts = {}) => {
  const w = o.w ?? 3;
  const h = o.h ?? w / 1.9;
  const geo = new THREE.PlaneGeometry(w, h, 96, 48);
  geo.translate(w / 2, -h / 2, 0); // hoist at x = 0, top at y = 0
  const mat = g.ink({
    color: "#ffffff",
    mode: "v",
    scale: 70,
    scale2: 50,
    side: THREE.DoubleSide,
    shade: 0.75,
    cross: 0.5,
    rim: 0.3,
    uniforms: {
      uFW: { value: w },
      uFH: { value: h },
      uWind: { value: o.wind ?? 0.18 },
      uFSpeed: { value: o.speed ?? 1 },
      uDroop: { value: o.droop ?? 0.08 },
      uWrinkle: { value: o.wrinkle ?? 0 },
      uStars: { value: o.stars ?? 50 },
      uRod: { value: o.rod ? 1 : 0 },
    },
    vertexDecl: /* glsl */ `
      uniform float uFW; uniform float uFH; uniform float uWind; uniform float uFSpeed; uniform float uDroop; uniform float uWrinkle; uniform float uRod;
      vec3 cloth(vec2 q, float t) {
        float u = q.x / uFW;              // 0 at hoist, 1 at fly
        float v = -q.y / uFH;             // 0 top, 1 bottom
        float amp = uWind * uFW * (0.15 + 0.85 * u);
        float ph = q.x * 2.4 / uFW * 3.14159 - t * 3.2 * uFSpeed;
        float z = sin(ph + v * 0.9) * amp * 0.55
                + sin(ph * 1.9 - t * 1.3 * uFSpeed + v * 2.1) * amp * 0.25
                + sin(q.x * 9.0 / uFW + q.y * 7.0 / uFH - t * 2.1 * uFSpeed) * amp * 0.1;
        z += (sin(q.x * 23.0 / uFW + q.y * 3.0) * 0.5 + sin(q.x * 11.0 / uFW - q.y * 17.0 / uFH)) * uWrinkle * uFW * 0.012 * u;
        float x = q.x - (1.0 - cos(ph)) * amp * 0.12 * u;
        float sag = uDroop * uFH * u * u * (1.0 - uRod * 0.85) * (0.6 + 0.4 * v);
        return vec3(x, q.y - sag, z);
      }
    `,
    vertex: /* glsl */ `
      vec3 c0 = cloth(p.xy, uTime);
      float e = 0.01 * uFW;
      vec3 cx = cloth(p.xy + vec2(e, 0.0), uTime);
      vec3 cy = cloth(p.xy + vec2(0.0, e), uTime);
      n = normalize(cross(cx - c0, cy - c0));
      p = c0;
    `,
    fragDecl: /* glsl */ `
      uniform float uStars;
      float sdStar5(vec2 p, float r, float rf) {
        const vec2 k1 = vec2(0.809016994375, -0.587785252292);
        const vec2 k2 = vec2(-0.809016994375, -0.587785252292);
        p.x = abs(p.x);
        p -= 2.0 * max(dot(k1, p), 0.0) * k1;
        p -= 2.0 * max(dot(k2, p), 0.0) * k2;
        p.x = abs(p.x);
        p.y -= r;
        vec2 ba = rf * vec2(-k1.y, k1.x) - vec2(0.0, 1.0);
        float h = clamp(dot(p, ba) / dot(ba, ba), 0.0, r);
        return length(p - ba * h) * sign(p.y * ba.x - p.x * ba.y);
      }
      // p: cell coords (y down), r: outer radius
      float star(vec2 p, float r) {
        float d = sdStar5(vec2(p.x, -p.y), r, 0.42);
        float aa = fwidth(d) * 0.8 + 1e-4;
        return 1.0 - smoothstep(-aa, aa, d);
      }
    `,
    frag: /* glsl */ `
      vec2 fu = vec2(vUv.x, 1.0 - vUv.y); // x: hoist->fly, y: top->bottom
      float stripe = floor(fu.y * 13.0);
      vec3 red = vec3(0.72, 0.13, 0.19);
      vec3 wht = vec3(0.95, 0.93, 0.88);
      vec3 blu = vec3(0.17, 0.2, 0.42);
      albedo = mod(stripe, 2.0) < 0.5 ? red : wht;
      if (fu.x < 0.4 && fu.y < 7.0 / 13.0) {
        albedo = blu;
        vec2 c = vec2(fu.x / 0.4, fu.y / (7.0 / 13.0));
        float s = 0.0;
        if (uStars < 20.0) {
          vec2 d = (c - 0.5) * vec2(1.0, 0.75) * 2.0;
          for (int i = 0; i < 13; i++) {
            float a = float(i) / 13.0 * 6.2831853;
            s = max(s, star((d - vec2(sin(a), cos(a)) * 0.62) * vec2(1.0, 1.0), 0.14));
          }
        } else if (uStars < 49.0) {
          vec2 gcell = vec2(c.x * 8.0, c.y * 6.0);
          s = star((fract(gcell) - 0.5) * vec2(1.0, 0.75), 0.36);
        } else {
          // 50 stars: 9 rows alternating 6 and 5
          float row = floor(c.y * 9.0);
          float off = mod(row, 2.0) < 0.5 ? 0.0 : 0.5;
          float cols = mod(row, 2.0) < 0.5 ? 6.0 : 5.0;
          float x = c.x * 6.0 - off;
          if (x > -0.5 && x < cols) {
            vec2 cell = vec2(fract(x), fract(c.y * 9.0)) - 0.5;
            s = star(cell * vec2(1.0, 0.62), 0.34);
          }
        }
        albedo = mix(albedo, wht, s);
        hatchMul = 1.0 - s * 0.7;
      }
      // cloth weave texture, softly
      extraInk += (tvn(vWorld.xy * 60.0) - 0.5) * 0.08;
    `,
  });
  const mesh = new THREE.Mesh(geo, mat);
  return { mesh, mat };
};
