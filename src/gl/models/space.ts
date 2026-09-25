// Space set: Earth (real coastlines from world-atlas), cratered lunar terrain,
// the Apollo Lunar Module, rocket-engine plumes.
import * as THREE from "three";
import { geoEquirectangular, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import land110 from "world-atlas/land-110m.json";
import { memo } from "../../lib/math";
import { rng } from "../../lib/random";
import { fbm2 } from "../noise";
import { box, cyl, lathe, merge, place, tube } from "../geo";
import { addBlend } from "../particles";
import { TNOISE } from "../glsl";
import type { GL } from "../GLShot";

// ---------------------------------------------------------------- Earth
const earthCanvas = () =>
  memo("gl:earthCanvas", () => {
    const W = 2048;
    const H = 1024;
    const cv = document.createElement("canvas");
    cv.width = W;
    cv.height = H;
    const ctx = cv.getContext("2d")!;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const topo = land110 as any;
    const landGeo = feature(topo, topo.objects.land);
    const proj = geoEquirectangular().scale(W / (2 * Math.PI)).translate([W / 2, H / 2]);
    const path = geoPath(proj, ctx);
    ctx.beginPath();
    path(landGeo);
    ctx.fillStyle = "#fff";
    ctx.fill();
    return cv;
  });

export const makeEarth = (g: GL, radius: number) => {
  const tex = new THREE.CanvasTexture(earthCanvas());
  tex.wrapS = THREE.RepeatWrapping;
  tex.minFilter = THREE.LinearFilter;
  const mat = g.ink({
    color: "#ffffff",
    mode: "screen",
    angle: 25,
    scale: 3.5,
    hatch: 0.55,
    shade: 1,
    rim: 1.4,
    rimCol: "#8fc0ff",
    rimPow: 3,
    spec: 0.5,
    gloss: 40,
    uniforms: { uLand: { value: tex } },
    fragDecl: "uniform sampler2D uLand;",
    frag: /* glsl */ `
      float land = texture(uLand, vUv).r;
      float lat = abs(vUv.y - 0.5) * 2.0;
      float nz = tfbm(vUv * vec2(40.0, 20.0));
      vec3 ocean = mix(vec3(0.07, 0.2, 0.45), vec3(0.1, 0.3, 0.55), nz);
      vec3 green = mix(vec3(0.24, 0.42, 0.2), vec3(0.62, 0.52, 0.32), smoothstep(0.45, 0.62, nz + (0.5 - lat) * 0.2));
      albedo = mix(ocean, green, land);
      albedo = mix(albedo, vec3(0.95), smoothstep(0.78, 0.86, lat + nz * 0.08));
      float cl = smoothstep(0.52, 0.7, tfbm(vUv * vec2(28.0, 14.0) + vec2(uTime * 0.01, 0.0)) * 0.7 + tfbmB(vUv * vec2(60.0, 30.0)) * 0.3);
      albedo = mix(albedo, vec3(1.0), cl * 0.9);
      hatchMul = 1.0 - cl * 0.5;
    `,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 96, 64), mat);
  return { mesh, mat };
};

// ---------------------------------------------------------------- lunar terrain
export type Crater = [number, number, number, number]; // x, z, radius, depth
export const craterField = (seed: string, n: number, area: number, rmin: number, rmax: number) => {
  const r = rng(seed);
  const out: Crater[] = [];
  for (let i = 0; i < n; i++) {
    const rad = rmin + Math.pow(r(), 4) * (rmax - rmin);
    out.push([(r() - 0.5) * area, (r() - 0.5) * area, rad, rad * (0.15 + r() * 0.1)]);
  }
  return out;
};
export const lunarHeight = (craters: Crater[], rough = 1) => (x: number, z: number) => {
  let h = (fbm2(x * 0.02, z * 0.02, 5, 21) - 0.5) * 6 * rough + (fbm2(x * 0.2, z * 0.2, 3, 5) - 0.5) * 0.5 * rough;
  for (const [cx, cz, r, d] of craters) {
    const dx = x - cx;
    const dz = z - cz;
    const q = (dx * dx + dz * dz) / (r * r);
    if (q > 6) continue;
    const t = Math.sqrt(q);
    h += t < 1 ? -d * (1 - q) + d * 0.3 : d * 0.3 * Math.exp(-(t - 1) * (t - 1) * 5);
  }
  return h;
};

export const regolithMat = (g: GL, extra: Record<string, THREE.IUniform> = {}, vertex = "", vertexDecl = "") =>
  g.ink({
    color: "#b9b4aa",
    mode: "stipple",
    hatch: 0.9,
    shade: 1,
    uniforms: extra,
    vertex,
    vertexDecl,
    frag: /* glsl */ `
      float grit = tvn(vWorld.xz * 6.0) * 0.5 + tfbm(vWorld.xz * 0.8) * 0.5;
      albedo *= 0.82 + grit * 0.35;
      extraInk += (tvn(vWorld.xz * 30.0) - 0.5) * 0.25;
    `,
  });

// ---------------------------------------------------------------- Lunar Module
export const lmGeo = () =>
  memo("gl:lm", () => {
    // descent stage: octagonal box (4.2 m across) with foil
    const oct = new THREE.CylinderGeometry(2.1, 2.1, 1.65, 8, 1);
    oct.rotateY(Math.PI / 8);
    const descent = place(oct, [0, 1.9, 0]);
    // legs: primary strut + two secondaries + footpad per corner
    const legs: THREE.BufferGeometry[] = [];
    for (let k = 0; k < 4; k++) {
      const a = (k * Math.PI) / 2 + Math.PI / 4;
      const out = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
      const pad = out.clone().multiplyScalar(4.4).setY(0.15);
      const top = out.clone().multiplyScalar(2.0).setY(2.6);
      const mid = out.clone().multiplyScalar(2.0).setY(1.2);
      legs.push(tube([top, pad], 0.09, 4, 8));
      const side = new THREE.Vector3(-out.z, 0, out.x);
      legs.push(tube([mid.clone().add(side.clone().multiplyScalar(0.8)), pad.clone().setY(0.7)], 0.05, 3, 6));
      legs.push(tube([mid.clone().sub(side.clone().multiplyScalar(0.8)), pad.clone().setY(0.7)], 0.05, 3, 6));
      legs.push(place(cyl(0.45, 0.5, 0.18, 20), [pad.x, 0.1, pad.z]));
      if (k === 0) {
        // ladder on the front leg
        for (let i = 0; i < 9; i++) legs.push(place(box(0.6, 0.05, 0.05), [out.x * (2.2 + i * 0.22), 2.5 - i * 0.27, out.z * (2.2 + i * 0.22)], [0, -a + Math.PI / 2, 0]));
      }
    }
    // ascent stage: faceted cabin
    const cab: THREE.BufferGeometry[] = [];
    const main = new THREE.CylinderGeometry(1.35, 1.5, 2.1, 6, 1);
    main.rotateY(Math.PI / 6);
    cab.push(place(main, [0, 3.85, 0.15]));
    cab.push(place(box(1.6, 1.3, 1.4), [0, 3.6, 1.2], [0.2, 0, 0])); // front face
    cab.push(place(box(0.9, 0.9, 0.9), [0, 3.4, 1.9])); // hatch box
    cab.push(place(cyl(0.5, 0.55, 0.5, 12), [0, 5.0, 0])); // docking tunnel
    cab.push(place(box(2.2, 1.1, 1.0), [0, 3.9, -1.2])); // aft equipment bay
    cab.push(tube([new THREE.Vector3(1.2, 4.6, -0.6), new THREE.Vector3(1.6, 5.4, -0.9)], 0.04, 2, 5)); // antenna mast
    const dish = lathe(
      [
        [0, 0],
        [0.45, 0.12],
        [0.5, 0.16],
      ],
      20,
    );
    cab.push(place(dish, [1.65, 5.45, -0.95], [0.6, 0, -0.5]));
    // RCS thruster quads
    for (const [x, z] of [
      [1.6, 1.6],
      [-1.6, 1.6],
      [1.6, -1.6],
      [-1.6, -1.6],
    ])
      cab.push(place(box(0.35, 0.35, 0.35), [x * 0.95, 4.4, z * 0.95]));
    const bell = lathe(
      [
        [0.75, 0],
        [0.6, 0.5],
        [0.35, 0.9],
      ],
      24,
    );
    return { descent, legs: merge(legs), cabin: merge(cab), bell: place(bell, [0, 0.6, 0]) };
  });

export const makeLM = (g: GL) => {
  const G = lmGeo();
  const foil = g.ink({
    color: "#d8a947",
    mode: "screen",
    angle: 60,
    scale: 3.5,
    spec: 1.4,
    gloss: 50,
    rim: 0.5,
    frag: /* glsl */ `
      // crinkled kapton foil: noisy normals + mottled tone
      vec3 nn = vec3(tvn(vWorld.xy * 5.0 + vWorld.z * 3.0), tvn(vWorld.zy * 5.0 + 11.0), tvn(vWorld.xz * 5.0 + 23.0)) - 0.5;
      N = normalize(N + nn * 0.9);
      albedo *= 0.8 + tfbm(vWorld.xy * 3.0 + vWorld.z) * 0.4;
    `,
  });
  const cabinM = g.ink({ color: "#c8c6bf", mode: "world", dir: [0.2, 1, 0.1], scale: 6, spec: 0.5, gloss: 30, rim: 0.3 });
  const struts = g.ink({ color: "#d4b25c", mode: "screen", angle: 70, scale: 3, spec: 0.8, gloss: 40 });
  const bellM = g.ink({ color: "#4a4540", mode: "v", scale: 40, spec: 0.8 });
  const group = new THREE.Group();
  group.add(new THREE.Mesh(G.descent, foil), new THREE.Mesh(G.legs, struts), new THREE.Mesh(G.cabin, cabinM), new THREE.Mesh(G.bell, bellM));
  return { group, mats: [foil, cabinM, struts, bellM] };
};

// ---------------------------------------------------------------- engine plume
export const plumeMaterial = (g: GL, o: { core?: string; edge?: string; str?: number; diamonds?: number } = {}) =>
  addBlend(
    new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: g.shared.uTime,
        uNoiseTex: g.shared.uNoiseTex,
        uCore: { value: new THREE.Color(o.core ?? "#fff6d0") },
        uEdge: { value: new THREE.Color(o.edge ?? "#ff8a2a") },
        uStr: { value: o.str ?? 1 },
        uDia: { value: o.diamonds ?? 0 },
      },
      vertexShader: /* glsl */ `
        precision highp float;
        in vec3 position; in vec3 normal; in vec2 uv;
        uniform mat4 modelMatrix; uniform mat4 viewMatrix; uniform mat4 projectionMatrix;
        out vec2 vUv; out float vFacing;
        void main() {
          vUv = uv;
          vec4 w = modelMatrix * vec4(position, 1.0);
          vec3 n = normalize(mat3(modelMatrix) * normal);
          vec3 cam = vec3(inverse(viewMatrix)[3]);
          vFacing = abs(dot(n, normalize(cam - w.xyz)));
          gl_Position = projectionMatrix * viewMatrix * w;
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;
        in vec2 vUv; in float vFacing;
        uniform float uTime; uniform vec3 uCore; uniform vec3 uEdge; uniform float uStr; uniform float uDia;
        layout(location = 0) out vec4 gColor;
        layout(location = 1) out vec4 gData;
        ${TNOISE}
        void main() {
          float along = 1.0 - vUv.y; // 0 at the nozzle
          float flick = tfbm(vec2(vUv.x * 6.0, along * 3.0 - uTime * 7.0)) ;
          float core = pow(vFacing, 1.5);
          float fade = pow(1.0 - along, 1.2) * smoothstep(0.0, 0.05, along);
          float dia = uDia > 0.0 ? 0.75 + 0.25 * cos(along * uDia * 6.2831) : 1.0;
          vec3 c = mix(uEdge, uCore, core * (1.0 - along * 0.7)) * (0.6 + flick * 0.8) * dia;
          gColor = vec4(c * fade * uStr * (0.35 + core), 0.0);
          gData = vec4(0.0);
        }
      `,
    }),
  ) as THREE.RawShaderMaterial;
