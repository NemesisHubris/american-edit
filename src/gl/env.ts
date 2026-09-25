// Environment kit: engraved water, swaying reeds/grass, 3D cloud banks, ground.
import * as THREE from "three";
import { rng } from "../lib/random";
import { col, ColorIn, InkOpts } from "./materials";
import { fbm2 } from "./noise";
import { merge, smoothIco, terrain } from "./geo";
import type { GL } from "./GLShot";

// Water: gerstner-ish vertex waves, fresnel sky tint, sun/moon glitter, engraved
// horizontal lines (the classic engraving treatment of water).
export const makeWater = (
  g: GL,
  o: {
    w?: number;
    d?: number;
    res?: number;
    y?: number;
    color?: ColorIn;
    sky?: ColorIn;
    amp?: number;
    freq?: number;
    speed?: number;
    glitter?: number;
    glitterDir?: THREE.Vector3;
    hatch?: number;
    lineSpacing?: number;
  } = {},
) => {
  const w = o.w ?? 800;
  const d = o.d ?? 800;
  const geo = new THREE.PlaneGeometry(w, d, o.res ?? 200, o.res ?? 200);
  geo.rotateX(-Math.PI / 2);
  const mat = g.ink({
    color: o.color ?? "#6f7f86",
    mode: "screen",
    angle: 0,
    scale: o.lineSpacing ?? 5,
    hatch: o.hatch ?? 0.9,
    shade: 0.8,
    cross: 0.1,
    spec: 0,
    uniforms: {
      uAmp: { value: o.amp ?? 0.4 },
      uFreq: { value: o.freq ?? 0.25 },
      uSpeed: { value: o.speed ?? 1 },
      uSkyW: { value: col(o.sky ?? "#d9dfe4") },
      uGlit: { value: o.glitter ?? 1 },
      uGlitDir: { value: o.glitterDir ?? g.shared.uSunDir.value },
    },
    vertexDecl: /* glsl */ `
      uniform float uAmp; uniform float uFreq; uniform float uSpeed;
      vec3 wave(vec2 xz, float t) {
        vec3 o = vec3(0.0);
        vec2 dirs[5] = vec2[5](vec2(1.0, 0.2), vec2(0.7, 0.7), vec2(-0.3, 1.0), vec2(0.9, -0.4), vec2(0.2, 0.95));
        float amps[5] = float[5](1.0, 0.55, 0.35, 0.25, 0.15);
        float fr[5] = float[5](1.0, 1.7, 2.9, 4.3, 7.1);
        for (int i = 0; i < 5; i++) {
          vec2 dd = normalize(dirs[i]);
          float k = uFreq * fr[i];
          float ph = dot(dd, xz) * k + t * uSpeed * sqrt(9.8 * k) ;
          float a = uAmp * amps[i] / fr[i];
          o.y += a * sin(ph);
          o.xz -= dd * a * 0.6 * cos(ph);
        }
        return o;
      }
    `,
    vertex: /* glsl */ `
      vec3 wv = wave(p.xz, uTime);
      float e = 0.5;
      vec3 wx = wave(p.xz + vec2(e, 0.0), uTime);
      vec3 wz = wave(p.xz + vec2(0.0, e), uTime);
      n = normalize(cross(vec3(0.0, wz.y - wv.y, e), vec3(e, wx.y - wv.y, 0.0)));
      p += wv;
    `,
    fragDecl: /* glsl */ `uniform vec3 uSkyW; uniform float uGlit; uniform vec3 uGlitDir;`,
    frag: /* glsl */ `
      vec3 Vv = normalize(cameraPosition - vWorld);
      float fres = pow(1.0 - max(dot(N, Vv), 0.0), 3.0);
      albedo = mix(albedo, uSkyW, clamp(fres * 1.2 + 0.1, 0.0, 1.0));
      vec3 R = reflect(-Vv, N);
      float gl = pow(max(dot(R, normalize(uGlitDir)), 0.0), 180.0);
      emis += vec3(1.0, 0.95, 0.85) * gl * 2.0 * uGlit;
      hatchMul = 1.0 - clamp(gl * 3.0, 0.0, 1.0);
    `,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = o.y ?? 0;
  return { mesh, mat };
};

// Instanced grass / reeds that sway in the wind
export const makeReeds = (
  g: GL,
  o: { count: number; x: [number, number]; z: [number, number]; y?: number | ((x: number, z: number) => number); h: [number, number]; w?: number; color?: ColorIn; seed?: string; sway?: number; wind?: number },
) => {
  // one tapered, bent blade
  const blade = new THREE.BufferGeometry();
  const segs = 5;
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const w = (1 - t) * 0.5;
    const bend = t * t * 0.35;
    pos.push(-w, t, bend, w, t, bend);
    uv.push(0, t, 1, t);
    if (i < segs) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  blade.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  blade.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  blade.setIndex(idx);
  blade.computeVertexNormals();
  const mat = g.ink({
    color: o.color ?? "#6d6a3c",
    mode: "screen",
    angle: 75,
    scale: 4,
    instanced: true,
    side: THREE.DoubleSide,
    shade: 0.8,
    castShadow: false,
    uniforms: { uSway: { value: o.sway ?? 0.25 }, uWind: { value: o.wind ?? 1.3 } },
    vertexDecl: "uniform float uSway; uniform float uWind;",
    vertex: /* glsl */ `
      vec3 ip = vec3(instanceMatrix[3]);
      float ph = uTime * uWind + ip.x * 0.23 + ip.z * 0.17;
      float s = (sin(ph) + 0.5 * sin(ph * 2.3 + 1.0) + 0.6 * (vnoise(vec3(ip.xz * 0.05, uTime * 0.6)) - 0.5)) * uSway;
      p.x += s * p.y * p.y;
      p.z += s * 0.4 * p.y * p.y;
    `,
  });
  const r = rng(o.seed ?? "reeds");
  const mats: THREE.Matrix4[] = [];
  for (let i = 0; i < o.count; i++) {
    const x = o.x[0] + r() * (o.x[1] - o.x[0]);
    const z = o.z[0] + r() * (o.z[1] - o.z[0]);
    const y = typeof o.y === "function" ? o.y(x, z) : o.y ?? 0;
    const h = o.h[0] + r() * (o.h[1] - o.h[0]);
    const w = (o.w ?? 0.08) * (0.6 + r() * 0.8);
    mats.push(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler((r() - 0.5) * 0.3, r() * 6.28, (r() - 0.5) * 0.3)), new THREE.Vector3(w, h, w)));
  }
  const mesh = new THREE.InstancedMesh(blade, mat, mats.length);
  mats.forEach((m, i) => mesh.setMatrixAt(i, m));
  mesh.frustumCulled = false;
  return { mesh, mat };
};

// Cumulus bank: a cluster of lumpy spheres, inked and hatched on the shadow side
export const cloudGeo = (seed: string, n = 14, spread: [number, number, number] = [60, 14, 18], size: [number, number] = [8, 18]) => {
  const r = rng(seed);
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < n; i++) {
    const s = size[0] + r() * (size[1] - size[0]);
    const x = (r() - 0.5) * spread[0];
    const z = (r() - 0.5) * spread[2];
    // bigger lumps in the middle, flat bottom
    const mid = 1 - Math.abs(x) / (spread[0] * 0.6);
    const y = Math.max(0, mid) * spread[1] * (0.4 + r() * 0.6);
    const sg = smoothIco(s * (0.6 + 0.5 * Math.max(0, mid)), 4);
    const p = sg.attributes.position as THREE.BufferAttribute;
    const sd = r() * 100;
    for (let k = 0; k < p.count; k++) {
      const v = new THREE.Vector3().fromBufferAttribute(p, k);
      const nrm = v.clone().normalize();
      const bump = 1 + (fbm2(nrm.x * 2 + sd, nrm.y * 2 + nrm.z * 2, 3) - 0.5) * 0.35;
      v.multiplyScalar(bump);
      if (v.y < -s * 0.2) v.y = -s * 0.2 + (v.y + s * 0.2) * 0.15; // flattened base
      p.setXYZ(k, v.x + x, v.y + y, v.z + z);
    }
    sg.computeVertexNormals();
    parts.push(sg);
  }
  return merge(parts);
};

export const cloudMaterial = (g: GL, o: InkOpts = {}) =>
  g.ink({
    color: "#fbf6ec",
    mode: "screen",
    angle: 12,
    scale: 5,
    shade: 0.55,
    cross: 0.2,
    rim: 0.35,
    rimCol: "#fff4d8",
    castShadow: false,
    receiveShadow: false,
    ...o,
  });

// A simple rolling ground from fbm, large and low-res, for horizons
export const makeGround = (g: GL, o: { size?: number; res?: number; y?: number; amp?: number; freq?: number; color?: ColorIn; flat?: (x: number, z: number) => number; mat?: InkOpts } = {}) => {
  const amp = o.amp ?? 6;
  const freq = o.freq ?? 0.004;
  const flat = o.flat ?? (() => 1);
  const geo = terrain(o.size ?? 3000, o.size ?? 3000, o.res ?? 220, o.res ?? 220, (x, z) => (o.y ?? 0) + (fbm2(x * freq, z * freq, 5, 3) - 0.5) * amp * flat(x, z));
  const mat = g.ink({ color: o.color ?? "#b9a27a", mode: "world", dir: [1, 0, 0.2], scale: 0.6, cross: 0.4, ...o.mat });
  return { mesh: new THREE.Mesh(geo, mat), mat };
};

// Flock of birds (gull silhouettes) with flapping wings, flying a straight path
export const makeBirds = (g: GL, o: { count: number; from: [number, number, number]; to: [number, number, number]; spread: [number, number, number]; size?: number; dur?: number; seed?: string; color?: ColorIn }) => {
  const geo = new THREE.BufferGeometry();
  // body + two wings (each two segments so they can bend)
  const pos = [
    // left wing inner, outer
    0, 0, 0.3, -0.5, 0.05, 0, 0, 0, -0.2,
    -0.5, 0.05, 0, -1.1, 0, -0.15, 0, 0, -0.2,
    // right wing
    0, 0, 0.3, 0.5, 0.05, 0, 0, 0, -0.2,
    0.5, 0.05, 0, 1.1, 0, -0.15, 0, 0, -0.2,
    // body
    0, 0.04, 0.5, 0.08, 0, -0.1, -0.08, 0, -0.1, 0, 0.04, 0.5, 0, 0.02, -0.45, 0.08, 0, -0.1,
  ];
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(new Array((pos.length / 3) * 2).fill(0), 2));
  geo.computeVertexNormals();
  const mat = g.ink({
    color: o.color ?? "#2e2820",
    hatch: 0,
    instanced: true,
    side: THREE.DoubleSide,
    shade: 0.2,
    castShadow: false,
    vertex: /* glsl */ `
      vec3 ip = vec3(instanceMatrix[3]);
      float ph = uTime * 9.0 + ip.x * 0.37 + ip.y * 0.21;
      float flap = sin(ph);
      float ax = abs(p.x);
      p.y += flap * ax * 0.55 + sin(ph - 0.8) * max(ax - 0.5, 0.0) * 0.5;
    `,
  });
  const r = rng(o.seed ?? "birds");
  const offs = Array.from({ length: o.count }, () => [(r() - 0.5) * o.spread[0], (r() - 0.5) * o.spread[1], (r() - 0.5) * o.spread[2], r()]);
  const mesh = new THREE.InstancedMesh(geo, mat, o.count);
  mesh.frustumCulled = false;
  const dir = new THREE.Vector3(o.to[0] - o.from[0], o.to[1] - o.from[1], o.to[2] - o.from[2]);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir.clone().normalize());
  const m4 = new THREE.Matrix4();
  const update = (t: number) => {
    const u = t / (o.dur ?? 6);
    offs.forEach(([x, y, z, ph], i) => {
      const k = u + ph * 0.08;
      const p = new THREE.Vector3(o.from[0] + dir.x * k + x, o.from[1] + dir.y * k + y + Math.sin(t * 1.3 + ph * 6) * 0.6, o.from[2] + dir.z * k + z);
      m4.compose(p, q, new THREE.Vector3(1, 1, 1).multiplyScalar(o.size ?? 1));
      mesh.setMatrixAt(i, m4);
    });
    mesh.instanceMatrix.needsUpdate = true;
  };
  update(0);
  return { mesh, mat, update };
};

// Scrub / bushes: instanced lumpy blobs along the ground
export const makeBushes = (g: GL, o: { count: number; x: [number, number]; z: [number, number]; y?: number | ((x: number, z: number) => number); size: [number, number]; color?: ColorIn; seed?: string; flat?: number }) => {
  const base = smoothIco(1, 3);
  const p = base.attributes.position as THREE.BufferAttribute;
  for (let k = 0; k < p.count; k++) {
    const v = new THREE.Vector3().fromBufferAttribute(p, k);
    const b = 1 + (fbm2(v.x * 2.5 + 3, v.y * 2.5 + v.z * 2.5, 3) - 0.5) * 0.6;
    v.multiplyScalar(b);
    if (v.y < 0) v.y *= 0.3;
    p.setXYZ(k, v.x, v.y, v.z);
  }
  base.computeVertexNormals();
  const mat = g.ink({ color: o.color ?? "#5f6a3e", mode: "screen", angle: 35, scale: 4, instanced: true, cross: 0.6, shade: 0.8 });
  const r = rng(o.seed ?? "bush");
  const mesh = new THREE.InstancedMesh(base, mat, o.count);
  for (let i = 0; i < o.count; i++) {
    const x = o.x[0] + r() * (o.x[1] - o.x[0]);
    const z = o.z[0] + r() * (o.z[1] - o.z[0]);
    const y = typeof o.y === "function" ? o.y(x, z) : o.y ?? 0;
    const s = o.size[0] + r() * (o.size[1] - o.size[0]);
    mesh.setMatrixAt(i, new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, r() * 6.28, 0)), new THREE.Vector3(s * (1 + r() * 0.6), s * (o.flat ?? 0.7), s)));
  }
  mesh.frustumCulled = false;
  return { mesh, mat };
};
