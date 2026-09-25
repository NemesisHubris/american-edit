// Engraved particle puffs (smoke, steam, vapour, dust, fog banks) and additive
// glows (sparks, embers, flares, beams). Instanced camera-facing quads whose
// state is computed analytically from time, so renders are deterministic.
import * as THREE from "three";
import { HATCH, TNOISE } from "./glsl";
import { col, ColorIn, Shared } from "./materials";
import { hash } from "../lib/random";

export type Puff = {
  x: number;
  y: number;
  z: number;
  size: number;
  alpha: number;
  rot?: number;
  seed?: number;
  heat?: number; // 0..1 fire-lit from inside
  stretch?: number; // >1 elongates along the screen x axis (motion streaks)
};

const PUFF_VERT = /* glsl */ `
precision highp float;
in vec3 position;
in vec2 uv;
in vec4 iPos;   // xyz, size
in vec4 iData;  // alpha, rot, seed, heat
in float iStretch;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
out vec2 vUv;
out vec4 vData;
out float vViewZ;
out vec3 vCenterView;
out float vSize;
void main() {
  vUv = uv;
  vData = iData;
  vec4 cv = viewMatrix * vec4(iPos.xyz, 1.0);
  float c = cos(iData.y), s = sin(iData.y);
  vec2 q = (uv * 2.0 - 1.0);
  q = vec2(q.x * c - q.y * s, q.x * s + q.y * c);
  q.x *= iStretch;
  vec4 v = cv + vec4(q * iPos.w, 0.0, 0.0);
  vViewZ = -v.z;
  vCenterView = cv.xyz;
  vSize = iPos.w;
  gl_Position = projectionMatrix * v;
}
`;

const PUFF_FRAG = /* glsl */ `
precision highp float;
in vec2 vUv;
in vec4 vData;
in float vViewZ;
in vec3 vCenterView;
in float vSize;
uniform mat4 viewMatrix;
uniform vec3 uSunDir;
uniform vec3 uLit;
uniform vec3 uShade;
uniform vec3 uHeatCol;
uniform vec3 uInk;
uniform float uOutline;
uniform float uHatch;
uniform float uLineSpacing;
uniform float uSoft;
uniform float uRough;
uniform float uTime;
uniform float uSS;
layout(location = 0) out vec4 gColor;
layout(location = 1) out vec4 gData;
${TNOISE}
${HATCH}
void main() {
  vec2 q = vUv * 2.0 - 1.0;
  float r = length(q);
  float seed = vData.z;
  // lumpy cauliflower rim
  float a = atan(q.y, q.x);
  float rim = tfbm(vec2(a * 1.6 + seed * 13.0, seed * 7.0 + uTime * 0.15)) - 0.5;
  float rr = r * (1.0 + rim * uRough) + (tfbm(q * 3.0 + seed * 5.0) - 0.5) * 0.18 * uRough;
  if (rr > 1.0) discard;
  // fake sphere normal in view space -> world
  vec3 nv = normalize(vec3(q, sqrt(max(0.0, 1.0 - min(r, 1.0) * min(r, 1.0))) + 0.25));
  nv = normalize(nv + vec3((tfbm(q * 4.0 + seed) - 0.5) * 0.8, (tfbm(q * 4.0 + seed + 9.0) - 0.5) * 0.8, 0.0));
  vec3 nw = normalize(transpose(mat3(viewMatrix)) * nv);
  float diff = clamp(dot(nw, uSunDir) * 0.6 + 0.45, 0.0, 1.0);
  // backlit: translucent glow + silver lining on the rim
  vec3 viewDir = normalize(transpose(mat3(viewMatrix)) * normalize(vCenterView));
  float back = max(0.0, dot(viewDir, uSunDir));
  diff = mix(diff, 0.35 + 0.25 * diff, back * 0.6);
  vec3 c = mix(uShade, uLit, diff);
  float silver = smoothstep(0.7, 0.98, rr) * smoothstep(-0.2, 0.8, q.y) * pow(back, 2.0) * 0.35;
  c = mix(c, uLit * 1.1, silver);
  float heat = vData.w * smoothstep(0.1, -0.8, nw.y * 0.5 + q.y * 0.5);
  c = mix(c, uHeatCol, clamp(vData.w * 0.6 + heat, 0.0, 1.0));
  float dark = (1.0 - diff) * (1.0 - silver);
  float s = gl_FragCoord.y / (uLineSpacing * uSS) + (tfbm(q * 2.0 + seed) - 0.5) * 1.5;
  float ink = engraveLine(s, smoothstep(0.35, 1.0, dark) * 0.7) * uHatch * (1.0 - vData.w);
  c = mix(c, c * 0.3, ink);
  // inked contour just inside the rim
  float line = smoothstep(0.86, 0.93, rr) * (1.0 - smoothstep(0.97, 1.0, rr));
  c = mix(c, uInk, line * uOutline * (1.0 - vData.w * 0.8));
  float alpha = (1.0 - smoothstep(1.0 - uSoft, 1.0, rr)) * vData.x;
  gColor = vec4(c, alpha);
  gData = vec4(0.0);
}
`;

export type PuffStyle = {
  lit?: ColorIn;
  shade?: ColorIn;
  heat?: ColorIn;
  ink?: ColorIn;
  outline?: number;
  hatch?: number;
  lineSpacing?: number;
  soft?: number;
  rough?: number;
};

export class Puffs {
  mesh: THREE.Mesh;
  geo: THREE.InstancedBufferGeometry;
  pos: THREE.InstancedBufferAttribute;
  data: THREE.InstancedBufferAttribute;
  str: THREE.InstancedBufferAttribute;
  max: number;
  mat: THREE.RawShaderMaterial;
  constructor(shared: Shared, max: number, st: PuffStyle = {}) {
    this.max = max;
    const base = new THREE.PlaneGeometry(1, 1);
    this.geo = new THREE.InstancedBufferGeometry();
    this.geo.index = base.index;
    this.geo.setAttribute("position", base.attributes.position);
    this.geo.setAttribute("uv", base.attributes.uv);
    this.pos = new THREE.InstancedBufferAttribute(new Float32Array(max * 4), 4);
    this.data = new THREE.InstancedBufferAttribute(new Float32Array(max * 4), 4);
    this.str = new THREE.InstancedBufferAttribute(new Float32Array(max), 1);
    this.pos.setUsage(THREE.DynamicDrawUsage);
    this.data.setUsage(THREE.DynamicDrawUsage);
    this.geo.setAttribute("iPos", this.pos);
    this.geo.setAttribute("iData", this.data);
    this.geo.setAttribute("iStretch", this.str);
    this.geo.instanceCount = 0;
    this.mat = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: PUFF_VERT,
      fragmentShader: PUFF_FRAG,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uSunDir: shared.uSunDir,
        uTime: shared.uTime,
        uSS: shared.uSS,
        uNoiseTex: shared.uNoiseTex,
        uLit: { value: col(st.lit ?? "#f7efe0") },
        uShade: { value: col(st.shade ?? "#9c8f80") },
        uHeatCol: { value: col(st.heat ?? "#ffb25a") },
        uInk: { value: col(st.ink ?? "#3a2a1c") },
        uOutline: { value: st.outline ?? 0.55 },
        uHatch: { value: st.hatch ?? 0.8 },
        uLineSpacing: { value: st.lineSpacing ?? 5 },
        uSoft: { value: st.soft ?? 0.18 },
        uRough: { value: st.rough ?? 0.35 },
      },
    });
    this.mesh = new THREE.Mesh(this.geo, this.mat);
    this.mesh.frustumCulled = false;
  }
  set(puffs: Puff[], cam: THREE.Camera) {
    const cp = cam.position;
    const list = puffs
      .filter((p) => p.alpha > 0.003 && p.size > 0)
      .map((p) => ({ p, d: (p.x - cp.x) ** 2 + (p.y - cp.y) ** 2 + (p.z - cp.z) ** 2 }))
      .sort((a, b) => b.d - a.d)
      .slice(-this.max);
    list.forEach(({ p }, i) => {
      this.pos.setXYZW(i, p.x, p.y, p.z, p.size);
      this.data.setXYZW(i, p.alpha, p.rot ?? 0, p.seed ?? i * 0.137, p.heat ?? 0);
      this.str.setX(i, p.stretch ?? 1);
    });
    this.geo.instanceCount = list.length;
    this.pos.needsUpdate = true;
    this.data.needsUpdate = true;
    this.str.needsUpdate = true;
  }
}

// --- emitters (stateless: particle i is born at i / rate) -------------------

export type Emitter = {
  at: [number, number, number];
  rate: number; // per second
  life: number; // seconds
  vel: [number, number, number];
  spread: number; // random velocity magnitude
  size: [number, number]; // start, end
  wind?: [number, number, number]; // acceleration
  drag?: number;
  alpha?: number;
  fadeIn?: number;
  heat?: number;
  heatFade?: number;
  seed?: number;
  start?: number; // emission start time
  stop?: number; // emission end time
  jitter?: [number, number, number]; // spawn box
  prewarm?: number; // seconds of history before t=0
};

export const emit = (e: Emitter, t: number, out: Puff[] = []) => {
  const seed = e.seed ?? 1;
  const t0 = (e.start ?? 0) - (e.prewarm ?? 0);
  const first = Math.max(0, Math.floor((t - e.life - t0) * e.rate));
  const last = Math.floor((Math.min(t, e.stop ?? Infinity) - t0) * e.rate);
  const drag = e.drag ?? 0.6;
  for (let i = first; i <= last; i++) {
    const born = t0 + i / e.rate;
    const age = t - born;
    if (age < 0 || age > e.life) continue;
    const r = (k: number) => hash(i, seed, k) * 2 - 1;
    const vx = e.vel[0] + r(1) * e.spread;
    const vy = e.vel[1] + r(2) * e.spread;
    const vz = e.vel[2] + r(3) * e.spread;
    // velocity decays with drag: distance = v * (1 - e^-dt)/d
    const k = drag > 0 ? (1 - Math.exp(-drag * age)) / drag : age;
    const w = e.wind ?? [0, 0, 0];
    const j = e.jitter ?? [0, 0, 0];
    const u = age / e.life;
    const fin = Math.min(1, age / (e.fadeIn ?? 0.15 * e.life));
    const fout = 1 - Math.pow(u, 2.2);
    out.push({
      x: e.at[0] + r(4) * j[0] + vx * k + 0.5 * w[0] * age * age,
      y: e.at[1] + r(5) * j[1] + vy * k + 0.5 * w[1] * age * age,
      z: e.at[2] + r(6) * j[2] + vz * k + 0.5 * w[2] * age * age,
      size: (e.size[0] + (e.size[1] - e.size[0]) * Math.sqrt(u)) * (0.75 + 0.5 * hash(i, seed, 7)),
      alpha: (e.alpha ?? 1) * fin * fout,
      rot: hash(i, seed, 8) * 6.28 + age * r(9) * 0.3,
      seed: hash(i, seed, 10) * 10,
      heat: (e.heat ?? 0) * Math.max(0, 1 - age / (e.heatFade ?? 0.4)),
    });
  }
  return out;
};


// rgb += src, alpha / G-buffer data untouched
export const addBlend = (m: THREE.Material) => {
  m.blending = THREE.CustomBlending;
  m.blendEquation = THREE.AddEquation;
  m.blendSrc = THREE.OneFactor;
  m.blendDst = THREE.OneFactor;
  m.blendSrcAlpha = THREE.ZeroFactor;
  m.blendDstAlpha = THREE.OneFactor;
  return m;
};

// --- additive glow sprites -----------------------------------------------------

const GLOW_FRAG = /* glsl */ `
precision highp float;
in vec2 vUv;
in vec4 vData;
uniform vec3 uCol;
uniform float uCore;
layout(location = 0) out vec4 gColor;
layout(location = 1) out vec4 gData;
void main() {
  vec2 q = vUv * 2.0 - 1.0;
  float r = length(q);
  if (r > 1.0) discard;
  float g = exp(-r * r * 4.0) * 0.8 + exp(-r * r * 40.0) * uCore;
  gColor = vec4(uCol * g * vData.x, 0.0);
  gData = vec4(0.0);
}
`;

export class Glows {
  p: Puffs;
  constructor(shared: Shared, max: number, color: ColorIn = "#ffd08a", core = 1.2) {
    this.p = new Puffs(shared, max);
    this.p.mat = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: PUFF_VERT,
      fragmentShader: GLOW_FRAG,
      transparent: true,
      depthWrite: false,
      uniforms: { uCol: { value: col(color) }, uCore: { value: core } },
    });
    addBlend(this.p.mat);
    this.p.mesh.material = this.p.mat;
  }
  get mesh() {
    return this.p.mesh;
  }
  set(list: Puff[], cam: THREE.Camera) {
    this.p.set(list, cam);
  }
}

// Additive volumetric-looking cone (searchlights, god rays, engine glow)
export const beamMaterial = (color: ColorIn, strength = 0.35) =>
  addBlend(new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: { uCol: { value: col(color) }, uStr: { value: strength } },
    vertexShader: /* glsl */ `
      precision highp float;
      in vec3 position; in vec3 normal; in vec2 uv;
      uniform mat4 modelMatrix; uniform mat4 viewMatrix; uniform mat4 projectionMatrix;
      out vec2 vUv; out float vFacing;
      void main() {
        vUv = uv;
        vec4 w = modelMatrix * vec4(position, 1.0);
        vec3 n = normalize(mat3(modelMatrix) * normal);
        vec3 v = normalize(cameraPositionFix - w.xyz);
        vFacing = abs(dot(n, v));
        gl_Position = projectionMatrix * viewMatrix * w;
      }
    `.replace("cameraPositionFix", "vec3(inverse(viewMatrix)[3])"),
    fragmentShader: /* glsl */ `
      precision highp float;
      in vec2 vUv; in float vFacing;
      uniform vec3 uCol; uniform float uStr;
      layout(location = 0) out vec4 gColor;
      layout(location = 1) out vec4 gData;
      void main() {
        float a = pow(vFacing, 2.0) * (1.0 - vUv.y) * uStr;
        gColor = vec4(uCol * a, 0.0);
        gData = vec4(0.0);
      }
    `,
  }) as THREE.RawShaderMaterial) as THREE.RawShaderMaterial;

// A cumulus bank built from puffs: flat base, domed top, bigger lumps inside.
export const cumulus = (cx: number, cy: number, cz: number, w: number, h: number, seedStr: string, n = 40): Puff[] => {
  const out: Puff[] = [];
  let s = 0;
  for (let i = 0; i < seedStr.length; i++) s = (s * 31 + seedStr.charCodeAt(i)) >>> 0;
  for (let i = 0; i < n; i++) {
    const u = hash(i, s, 1) * 2 - 1;
    const dome = 1 - u * u;
    const y = Math.pow(hash(i, s, 2), 0.7) * dome * h;
    const size = (0.18 + 0.22 * dome) * w * (0.5 + 0.6 * hash(i, s, 3)) * (1 - (y / h) * 0.35);
    out.push({
      x: cx + u * w * 0.5,
      y: cy + y + size * 0.3,
      z: cz + (hash(i, s, 4) - 0.5) * w * 0.25,
      size,
      alpha: 1,
      seed: hash(i, s, 5) * 10,
      rot: hash(i, s, 6) * 6.28,
    });
  }
  return out;
};

// --- 3D engraved smoke ----------------------------------------------------------
// Billows as instanced lumpy spheres drawn with the ink material: real contours,
// hatched shadow sides, fire-lit undersides; they dissolve (noise holes) as they
// fade. Takes the same Puff lists as the sprite system.
import type { GL } from "./GLShot";
import { smoothIco } from "./geo";
import { InkOpts } from "./materials";

const lumpyGeo = (() => {
  let cache: THREE.BufferGeometry | null = null;
  return () => {
    if (cache) return cache;
    const g = smoothIco(1, 4);
    const p = g.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for (let k = 0; k < p.count; k++) {
      v.fromBufferAttribute(p, k).normalize();
      // a few big lobes + small cauliflower bumps
      let b = 1;
      const lobes: [number, number, number][] = [
        [0.7, 0.5, 0.2],
        [-0.6, 0.6, -0.3],
        [0.1, 0.8, -0.6],
        [-0.2, 0.3, 0.9],
        [0.5, -0.2, -0.8],
        [-0.8, -0.1, 0.4],
      ];
      for (const [x, y, z] of lobes) {
        const d = v.x * x + v.y * y + v.z * z;
        b += Math.max(0, d - 0.55) * 0.55;
      }
      b += (Math.sin(v.x * 11 + v.y * 7) * Math.sin(v.z * 9 - v.y * 5)) * 0.035;
      p.setXYZ(k, v.x * b, v.y * b * 0.9, v.z * b);
    }
    g.computeVertexNormals();
    cache = g;
    return g;
  };
})();

export class Smoke {
  mesh: THREE.InstancedMesh;
  mat: THREE.RawShaderMaterial;
  max: number;
  private m4 = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  private e = new THREE.Euler();
  constructor(g: GL, max: number, o: InkOpts & { heatCol?: ColorIn; fire?: boolean } = {}) {
    this.max = max;
    this.mat = g.ink({
      color: "#f3eee6",
      mode: "screen",
      angle: 35,
      scale: 4.5,
      shade: 0.6,
      cross: 0.35,
      rim: 0.8,
      rimPow: 2,
      instanced: true,
      instColor: true,
      castShadow: false,
      uniforms: { uHeatCol: { value: col(o.heatCol ?? "#ff9a3c") } },
      fragDecl: "uniform vec3 uHeatCol;",
      frag: /* glsl */ `
        // dissolve as the billow fades (vInst.r), fire-lit from below (vInst.g)
        float under = clamp(-N.y * 0.6 + 0.5, 0.0, 1.0);
        float heat = clamp(vInst.g * (0.55 + under * 0.8), 0.0, 1.0);
        albedo = mix(albedo, uHeatCol, heat);
        shadeMul = 1.0 - heat * 0.6;
        emis += uHeatCol * heat * heat * 0.45;
        hatchMul = 1.0 - heat * 0.5;
      ` + (o.fire ? /* glsl */ `
        // fire: white-hot core facing the camera, orange rim, flickering tongues
        float facing = max(dot(N, normalize(cameraPosition - vWorld)), 0.0);
        float fl = tn3(vWorld * 0.35 + vec3(0.0, -uTime * 3.0, 0.0));
        float core = smoothstep(0.35, 0.95, facing * (0.7 + fl * 0.6)) * (1.0 - vInst.r);
        albedo = mix(vec3(0.85, 0.28, 0.05), vec3(1.0, 0.72, 0.25), facing);
        emis = mix(vec3(0.9, 0.3, 0.04), vec3(1.4, 1.2, 0.8), core) * (0.8 + fl * 0.5);
        shadeMul = 0.0;
        hatchMul = 0.25;
      ` : ""),
      ...o,
    });
    this.mesh = new THREE.InstancedMesh(lumpyGeo(), this.mat, max);
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(max * 3), 3);
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
  }
  set(list: Puff[], _cam?: THREE.Camera) {
    const n = Math.min(this.max, list.length);
    for (let i = 0; i < n; i++) {
      const p = list[i];
      const s = p.size * Math.min(1, 0.25 + p.alpha * 1.6);
      this.e.set((p.seed ?? 0) * 1.3, (p.seed ?? 0) * 2.1 + (p.rot ?? 0), (p.seed ?? 0) * 0.7);
      this.q.setFromEuler(this.e);
      this.m4.compose(new THREE.Vector3(p.x, p.y, p.z), this.q, new THREE.Vector3(s, s, s));
      this.mesh.setMatrixAt(i, this.m4);
      this.mesh.instanceColor!.setXYZ(i, 1 - p.alpha, p.heat ?? 0, p.seed ?? 0);
    }
    this.mesh.count = n;
    this.mesh.instanceMatrix.needsUpdate = true;
    this.mesh.instanceColor!.needsUpdate = true;
  }
}
