// 9. THE HYPE — fastest cuts, one shot per beat, all in full colour: Earthrise,
// the Wall falls, circuits, computers, the network map, the smartphone, jets,
// Mount Rushmore, the Grand Canyon, fireworks over the city.
import * as THREE from "three";
import { Quote } from "../components/WordPop";
import { QUOTES } from "../quotes";
import { sceneClock } from "../timeline";
import { hash, rng } from "../lib/random";
import { PLACES, getUSMap } from "../lib/usmap";
import { GLShot, GL, driveCamera } from "../gl/GLShot";
import { makeSky } from "../gl/sky";
import { lunarSet } from "../gl/sets/moon";
import { makeEarth } from "../gl/models/space";
import { makeCRT, makeJet, makePCB, makePhone, wallMaterial, wallSegmentGeo } from "../gl/models/modern";
import { makeCanyon, makePines, makeRushmore, makeSkyline, makeUSMap, riverX, rushmoreHeight } from "../gl/models/landmarks";
import { makeFigure, Pose } from "../gl/figure";
import { box } from "../gl/geo";
import { emit, Glows, Puff, Puffs, Smoke } from "../gl/particles";
import type { SceneDef } from "./types";

const c = sceneClock("hype");
const T = (f: number) => f / 30;

// 1. Earth rising over the lunar horizon, the camera skimming the surface
const earthriseSetup = (g: GL) => {
  lunarSet(g, { sun: [0.55, 0.22, 0.6], seed: "earthrise" });
  const earth = makeEarth(g, 70);
  (earth.mat.uniforms.uSunDir as THREE.IUniform) = { value: new THREE.Vector3(-0.8, 0.3, 0.5).normalize() };
  earth.mesh.rotation.set(0.3, 1.3, 0);
  g.scene.add(earth.mesh);
  return (f: number) => {
    driveCamera(g, [{ f: 0, pos: [0, 3.2, 90], look: [0, 14, -200], fov: 34 }, { f: 30, pos: [0, 2.8, 50], look: [0, 18, -200], fov: 32 }], f, 0.004, 1);
    earth.mesh.position.set(40, -40 + f * 2.4, -800);
    earth.mesh.rotation.y = 1.3 + f * 0.004;
  };
};

// 2/3. The Berlin Wall: people on top, cracks spread, then a section bursts apart
const WALL_N = 16;
const crowdPoses: Pose[] = [
  { lSh: [2.6, 0.3, 0], rSh: [2.7, 0.2, 0], lEl: 0.2, rEl: 0.3 },
  { lSh: [2.9, 0.1, 0], rSh: [0.3, 0.2, 0], lEl: 0.1, rEl: 0.4, lean: 0.1 },
  { lSh: [1.2, 1.2, 0], rSh: [1.3, 1.1, 0], lEl: 1.4, rEl: 1.2 },
  { lSh: [2.4, 0.5, 0], rSh: [2.2, 0.6, 0], lEl: 0.5, rEl: 0.6, neck: -0.3 },
];
const wallSetup = (crumble: boolean) => (g: GL) => {
  const sh = g.shared;
  sh.uSunDir.value.set(-0.45, 0.35, 0.85).normalize(); // low warm light raking the painted face
  sh.uSunCol.value.set(1.15, 0.92, 0.7);
  sh.uSky.value.set(0.35, 0.4, 0.55);
  sh.uGround.value.set(0.2, 0.18, 0.18);
  g.camera.far = 1500;
  const sky = makeSky(sh, { top: "#1d2c52", horizon: "#f09a5a", bottom: "#2a2322", glow: 1.1, sunSize: 0.07, rays: 1, rayCount: 30, lines: 0.5, lineSpacing: 4, paper: 0.05, stars: 0.3, sunDir: new THREE.Vector3(0.3, 0.06, -1).normalize() });
  g.scene.add(sky.mesh);
  g.setPost({ fog: [60, 500, 0.4], fogCol: "#d39a74" });
  const seg = wallSegmentGeo();
  const mat = wallMaterial(g, "wall1");
  const group = new THREE.Group();
  g.scene.add(group);
  const x0 = -(WALL_N * 1.2) / 2;
  const breakIdx = [7, 8, 9];
  const chunks: { mesh: THREE.Mesh; v: THREE.Vector3; w: THREE.Vector3; t0: number; p0: THREE.Vector3 }[] = [];
  for (let i = 0; i < WALL_N; i++) {
    const x = x0 + i * 1.2 + 0.6;
    if (crumble && breakIdx.includes(i)) {
      // pre-fractured slab: 3 x 6 jagged pieces
      for (let a = 0; a < 3; a++)
        for (let b = 0; b < 6; b++) {
          const w = 0.4;
          const h = 0.6;
          const geo = box(w * (0.9 + hash(i, a, b) * 0.2), h * (0.9 + hash(b, a, i) * 0.2), 0.22);
          const p = geo.attributes.position as THREE.BufferAttribute;
          for (let k = 0; k < p.count; k++) p.setXYZ(k, p.getX(k) + (hash(k, a, b + i) - 0.5) * 0.08, p.getY(k) + (hash(k, b, a + i) - 0.5) * 0.08, p.getZ(k));
          geo.computeVertexNormals();
          const m = new THREE.Mesh(geo, mat);
          const pos = new THREE.Vector3(x - 0.4 + a * 0.4, 0.3 + b * 0.6, 0);
          m.position.copy(pos);
          group.add(m);
          const t0 = 0.15 + (5 - b) * 0.03 + hash(a, b, i) * 0.1;
          chunks.push({ mesh: m, p0: pos, t0, v: new THREE.Vector3((hash(a, b, 1) - 0.5) * 3, 1 + hash(a, b, 2) * 2, 3 + hash(a, b, 3) * 5), w: new THREE.Vector3(hash(a, b, 4) * 6 - 3, hash(a, b, 5) * 6 - 3, hash(a, b, 6) * 6 - 3) });
        }
      continue;
    }
    for (const gg of [seg.slab, seg.foot, seg.pipe]) {
      const m = new THREE.Mesh(gg, mat);
      m.position.x = x;
      group.add(m);
    }
  }
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400).rotateX(-Math.PI / 2), g.ink({ color: "#6b6560", mode: "stipple", hatch: 0.8 }));
  g.scene.add(ground);
  // crowd on top of the wall and in front
  const figs: { fig: ReturnType<typeof makeFigure>; base: Pose; ph: number }[] = [];
  const r = rng("crowd");
  for (let i = 0; i < 9; i++) {
    const fig = makeFigure(g, "civilian", { color: { coat: ["#3a3f55", "#5a2e2a", "#2e4a3a", "#4a4035", "#23252c"][i % 5] } });
    const onTop = i < 6;
    const x = onTop ? x0 + 1 + r() * (WALL_N * 1.2 - 2) : -6 + r() * 12;
    if (onTop && x > -2.4 && x < 2.4 && crumble) continue;
    fig.root.position.set(x, onTop ? 4.05 : 0, onTop ? 0 : 3 + r() * 3);
    fig.root.rotation.y = onTop ? (r() - 0.5) * 0.8 : Math.PI + (r() - 0.5) * 0.6;
    g.scene.add(fig.root);
    figs.push({ fig, base: crowdPoses[i % crowdPoses.length], ph: r() * 6 });
  }
  const dust = new Smoke(g, 160, { color: "#d8cfc0" });
  g.scene.add(dust.mesh);
  const sparks = new Glows(sh, 80, "#ffe0a0", 0.8);
  g.scene.add(sparks.mesh);
  return (f: number, t: number) => {
    if (crumble) driveCamera(g, [{ f: 0, pos: [3.5, 1.4, 9], look: [0, 2.2, 0], fov: 50 }, { f: 30, pos: [2.2, 1.2, 7.6], look: [0, 2.0, 0], fov: 50 }], f, 0.02, 3);
    else driveCamera(g, [{ f: 0, pos: [-9, 1.7, 7.5], look: [-1, 3, 0], fov: 46 }, { f: 15, pos: [-7.6, 1.8, 6.8], look: [-1, 3.1, 0], fov: 45 }], f, 0.02, 2);
    (mat.uniforms.uCrack as THREE.IUniform).value = crumble ? 1 : Math.min(1, 0.2 + t * 1.8);
    for (const ch of chunks) {
      const a = t - ch.t0;
      if (a <= 0) {
        ch.mesh.position.copy(ch.p0).add(new THREE.Vector3(Math.sin(t * 60 + ch.t0 * 50) * 0.01, 0, 0));
        continue;
      }
      ch.mesh.position.set(ch.p0.x + ch.v.x * a, Math.max(0.12, ch.p0.y + ch.v.y * a - 4.9 * a * a), ch.p0.z + ch.v.z * a);
      ch.mesh.rotation.set(ch.w.x * a, ch.w.y * a, ch.w.z * a);
    }
    figs.forEach(({ fig, base, ph }) => {
      const b = Math.sin(t * 9 + ph);
      fig.pose({ ...base, lSh: [base.lSh![0] + b * 0.15, base.lSh![1], 0], rSh: [base.rSh![0] - b * 0.15, base.rSh![1], 0], crouch: Math.max(0, b) * 0.04 });
    });
    const d: Puff[] = [];
    if (crumble) emit({ at: [0, 1.5, 0.3], rate: 80, life: 1.2, vel: [0, 0.6, 2.5], spread: 1.4, size: [0.2, 0.9], drag: 1.5, alpha: 0.9, start: 0.15, seed: 5, jitter: [1.2, 1.5, 0.1] }, t, d);
    dust.set(d);
    const sp: Puff[] = [];
    if (!crumble)
      for (let i = 0; i < 40; i++) {
        const born = hash(i, 3) * 0.5;
        const age = t - born;
        if (age < 0 || age > 0.3) continue;
        sp.push({ x: -1 + hash(i, 4) * 2, y: 1 + hash(i, 5) * 2 + age * 3 - 4.9 * age * age, z: 0.2 + age * 4, size: 0.04, alpha: 1 - age / 0.3, stretch: 2 });
      }
    sparks.set(sp, g.camera);
  };
};

// 4/5. Circuit board: light racing along traces; macro glide over a chip
const circuitSetup = (macro: boolean) => (g: GL) => {
  const sh = g.shared;
  sh.uSunDir.value.set(0.3, 0.8, 0.4).normalize();
  sh.uSunCol.value.set(0.8, 0.85, 0.9);
  sh.uSky.value.set(0.2, 0.25, 0.3);
  sh.uGround.value.set(0.05, 0.08, 0.06);
  g.camera.far = 300;
  g.camera.near = 0.05;
  const sky = makeSky(sh, { top: "#05070a", horizon: "#0a1614", bottom: "#05070a", glow: 0, rays: 0, lines: 0, paper: 0 });
  g.scene.add(sky.mesh);
  g.setPost({ fog: [20, 60, 0.9], fogCol: "#061210" });
  const pcb = makePCB(g, 40);
  g.scene.add(pcb.group);
  return (f: number) => {
    if (macro) driveCamera(g, [{ f: 0, pos: [-6, 1.2, 4], look: [2, 0, -2], fov: 50 }, { f: 15, pos: [-3.5, 0.9, 2.6], look: [4, 0, -3], fov: 50 }], f, 0.005, 4);
    else driveCamera(g, [{ f: 0, pos: [-12, 3.5, 10], look: [0, 0, -4], fov: 55 }, { f: 15, pos: [-4, 2.4, 6], look: [8, 0, -6], fov: 55 }], f, 0.005, 5);
    pcb.board.uniforms.uPulse.value = T(f) * 1.6 + (macro ? 0.4 : 0);
  };
};

// 6. Vintage computers flicker on to READY.
const computersSetup = (g: GL) => {
  const sh = g.shared;
  sh.uSunDir.value.set(-0.5, 0.6, 0.6).normalize();
  sh.uSunCol.value.set(0.9, 0.85, 0.75);
  sh.uSky.value.set(0.3, 0.3, 0.35);
  sh.uGround.value.set(0.2, 0.17, 0.15);
  g.camera.far = 100;
  g.camera.near = 0.05;
  const sky = makeSky(sh, { top: "#1a1714", horizon: "#2b241e", bottom: "#1a1714", glow: 0, rays: 0, lines: 0.4, lineSpacing: 4, paper: 0 });
  g.scene.add(sky.mesh);
  const desk = new THREE.Mesh(box(6, 0.08, 1.6, 0, -0.04, 0.2), g.ink({ color: "#7a5a3a", mode: "world", dir: [1, 0, 0.1], scale: 20, cross: 0.6 }));
  g.scene.add(desk);
  const wallM = g.ink({ color: "#a7967a", mode: "world", dir: [0, 1, 0], scale: 8 });
  g.scene.add(new THREE.Mesh(box(12, 5, 0.1, 0, 1.5, -0.8), wallM));
  const comps = [
    makeCRT(g, ["**** COMMODORE 64 BASIC V2 ****", "64K RAM SYSTEM  38911 BASIC BYTES FREE", "", "READY."], "crt1", "#8fb8ff"),
    makeCRT(g, ["]RUN", "HELLO, WORLD", "", "READY."], "crt2", "#7dff9a"),
    makeCRT(g, ["C:\\>DIR", "AUTOEXEC BAT", "COMMAND  COM", "C:\\>_"], "crt3", "#ffb84a"),
  ];
  comps.forEach((cmp, i) => {
    cmp.group.position.set(-1.7 + i * 1.7, 0, i === 1 ? 0.15 : 0);
    cmp.group.rotation.y = (1 - i) * 0.25;
    g.scene.add(cmp.group);
  });
  sh.uPL0.value.set(0, 0.8, 1.2, 4);
  return (f: number, t: number) => {
    driveCamera(g, [{ f: 0, pos: [0.8, 1.0, 3.6], look: [0, 0.55, 0], fov: 42 }, { f: 30, pos: [-0.4, 0.9, 2.9], look: [0, 0.55, 0], fov: 42 }], f, 0.004, 6);
    comps.forEach((cmp, i) => {
      const on = t - (0.1 + i * 0.12);
      const flick = on < 0 ? 0 : on < 0.15 ? (hash(Math.floor(t * 30), i) > 0.4 ? 1 : 0.2) : 1;
      cmp.screenM.uniforms.uOn.value = flick;
    });
    sh.uPLc0.value.setRGB(0.3, 0.5, 0.45);
  };
};

// 7. Glowing lines across the U.S. map (extruded states, arcs lifting between cities)
const netSetup = (g: GL) => {
  const sh = g.shared;
  sh.uSunDir.value.set(-0.3, 0.8, 0.5).normalize();
  sh.uSunCol.value.set(0.5, 0.6, 0.8);
  sh.uSky.value.set(0.15, 0.2, 0.35);
  sh.uGround.value.set(0.05, 0.05, 0.1);
  g.camera.far = 800;
  const sky = makeSky(sh, { top: "#040815", horizon: "#0d1a38", bottom: "#040815", glow: 0, rays: 0, lines: 0.3, lineSpacing: 4, paper: 0, stars: 0.6 });
  g.scene.add(sky.mesh);
  const k = 0.1;
  const mapMat = g.ink({ color: "#1d3b6e", mode: "screen", angle: 30, scale: 4, hatch: 0.6, rim: 0.6, rimCol: "#6aa8ff", emissive: "#0a1d44", emissiveAmt: 0.6 });
  const states = new THREE.Mesh(makeUSMap(g, k, 1.6, 1.2), mapMat);
  g.scene.add(states);
  const map = getUSMap();
  const hubs = ["newYork", "chicago", "sanFrancisco", "losAngeles", "seattle", "houston", "atlanta", "miami", "denver", "dallas", "washington", "boston", "phoenix", "minneapolis", "detroit", "nashville", "saltLake", "kansasCity"];
  const P = (n: string) => {
    const [x, y] = map.proj(PLACES[n]);
    return new THREE.Vector3((x - 960) * k, 1.7, (y - 560) * k);
  };
  const arcMat = new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    transparent: true,
    depthWrite: false,
    uniforms: { uT: { value: 0 } },
    vertexShader: `precision highp float; in vec3 position; in vec2 uv; uniform mat4 modelMatrix; uniform mat4 viewMatrix; uniform mat4 projectionMatrix; out vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position,1.0);} `,
    fragmentShader: `precision highp float; in vec2 vUv; uniform float uT; layout(location=0) out vec4 o; layout(location=1) out vec4 d;
      void main(){ float head = uT; float a = vUv.x; if (a > head) discard; float tail = smoothstep(head - 0.5, head, a); float spark = smoothstep(head - 0.04, head, a);
        o = vec4(vec3(0.35, 0.8, 1.0) * (0.5 + tail) + vec3(1.0) * spark * 1.5, 0.0); d = vec4(0.0); }`,
  });
  arcMat.blending = THREE.CustomBlending;
  arcMat.blendSrc = THREE.OneFactor;
  arcMat.blendDst = THREE.OneFactor;
  arcMat.blendSrcAlpha = THREE.ZeroFactor;
  arcMat.blendDstAlpha = THREE.OneFactor;
  const arcs: { mat: THREE.RawShaderMaterial; t0: number }[] = [];
  const r = rng("arcs");
  for (let i = 0; i < 26; i++) {
    const a = hubs[Math.floor(r() * hubs.length)];
    let b = hubs[Math.floor(r() * hubs.length)];
    if (a === b) b = hubs[(hubs.indexOf(a) + 3) % hubs.length];
    const A = P(a);
    const B = P(b);
    const mid = A.clone().add(B).multiplyScalar(0.5);
    mid.y += A.distanceTo(B) * 0.35;
    const curve = new THREE.QuadraticBezierCurve3(A, mid, B);
    const m = arcMat.clone();
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 60, 0.22, 6), m);
    g.scene.add(mesh);
    arcs.push({ mat: m, t0: r() * 0.6 });
  }
  const nodes = new Glows(sh, 40, "#bfe8ff", 1.5);
  g.scene.add(nodes.mesh);
  return (f: number, t: number) => {
    driveCamera(g, [{ f: 0, pos: [-40, 55, 95], look: [10, 0, 0], fov: 45 }, { f: 30, pos: [10, 45, 85], look: [20, 0, -5], fov: 45 }], f, 0.004, 7);
    arcs.forEach((a) => (a.mat.uniforms.uT.value = Math.min(1.5, Math.max(0, (t - a.t0) * 2.2))));
    nodes.set(
      hubs.map((h, i) => {
        const p = P(h);
        return { x: p.x, y: p.y + 0.3, z: p.z, size: 1.6 + Math.sin(t * 8 + i) * 0.4, alpha: 0.9 };
      }),
      g.camera,
    );
  };
};

// 8/9. The smartphone lights up and turns in slow motion
const phoneSetup = (second: boolean) => (g: GL) => {
  const sh = g.shared;
  sh.uSunDir.value.set(0.6, 0.5, 0.6).normalize();
  sh.uSunCol.value.set(1, 1, 1.05);
  sh.uSky.value.set(0.2, 0.22, 0.3);
  sh.uGround.value.set(0.05, 0.05, 0.08);
  g.camera.far = 50;
  g.camera.near = 0.01;
  const sky = makeSky(sh, { top: "#0a0c16", horizon: "#1b1f36", bottom: "#07080d", glow: 0, rays: 0, lines: 0.25, lineSpacing: 4, paper: 0 });
  g.scene.add(sky.mesh);
  const phone = makePhone(g);
  g.scene.add(phone.group);
  const bokeh = new Glows(sh, 40, "#8fa8ff", 0.2);
  g.scene.add(bokeh.mesh);
  const bokeh2 = new Glows(sh, 30, "#ff9a7a", 0.2);
  g.scene.add(bokeh2.mesh);
  return (f: number, t: number) => {
    const tt = T(f) + (second ? 1 : 0);
    phone.group.rotation.set(0.12 + Math.sin(tt * 0.8) * 0.05, -0.9 + tt * 0.55, 0.05);
    phone.screenM.uniforms.uOn.value = Math.min(1, Math.max(0, (tt - 0.15) / 0.25));
    if (second) driveCamera(g, [{ f: 0, pos: [0.05, 0.03, 0.14], look: [0, 0.01, 0], fov: 40 }, { f: 30, pos: [0.04, 0.025, 0.12], look: [0, 0.01, 0], fov: 40 }], f, 0.0005, 8);
    else driveCamera(g, [{ f: 0, pos: [0, 0.01, 0.32], look: [0, 0, 0], fov: 38 }, { f: 30, pos: [0, 0.005, 0.27], look: [0, 0, 0], fov: 38 }], f, 0.0005, 9);
    const b1: Puff[] = [];
    const b2: Puff[] = [];
    for (let i = 0; i < 30; i++) {
      const p = { x: (hash(i, 1) - 0.5) * 1.4 + t * 0.02, y: (hash(i, 2) - 0.5) * 0.8, z: -0.6 - hash(i, 3) * 0.6, size: 0.03 + hash(i, 4) * 0.05, alpha: 0.25 + 0.15 * Math.sin(t * 2 + i) };
      (i % 2 ? b1 : b2).push(p);
    }
    bokeh.set(b1, g.camera);
    bokeh2.set(b2, g.camera);
  };
};

// 10/11. Fighter jets streaking overhead with vapour trails
const jetsSetup = (second: boolean) => (g: GL) => {
  const sh = g.shared;
  sh.uSunDir.value.set(0.3, 0.7, -0.5).normalize();
  sh.uSunCol.value.set(1.15, 1.05, 0.9);
  sh.uSky.value.set(0.45, 0.55, 0.75);
  sh.uGround.value.set(0.3, 0.28, 0.25);
  g.camera.far = 5000;
  const sky = makeSky(sh, { top: "#2d5fa8", horizon: "#b9d3ec", bottom: "#8aa0b0", glow: 0.7, sunSize: 0.04, rays: 0.6, lines: 0.6, lineSpacing: 4, clouds: 0.35, cloudScale: 1.2, cloudHeight: 0.25, cloudCol: "#ffffff", cloudShade: "#9fb0c4", paper: 0.1 });
  g.scene.add(sky.mesh);
  const jets = [0, 1, 2, 3].map(() => makeJet(g));
  jets.forEach((j) => g.scene.add(j.group));
  const trails = new Puffs(sh, 900, { lit: "#ffffff", shade: "#c2cfdf", outline: 0.08, hatch: 0.2, lineSpacing: 4, soft: 0.6, rough: 0.15 });
  g.scene.add(trails.mesh);
  const form: [number, number, number][] = [
    [0, 0, 0],
    [-14, -3, -12],
    [14, -3, -12],
    [0, -5, -24],
  ];
  return (f: number, t: number) => {
    const tt = T(f);
    const speed = 260;
    // first: from behind the camera, streaking overhead and away; second: side pass, banking
    const lead = second ? -160 + tt * speed : 60 - tt * speed;
    const list: Puff[] = [];
    jets.forEach((j, i) => {
      const [ox, oy, oz] = form[i];
      if (second) {
        const x = lead + oz;
        j.group.position.set(x, 60 + oy * 0.6, ox * 0.8);
        j.group.rotation.set(0, Math.PI / 2, 0.35 + Math.sin(tt * 2 + i) * 0.04);
        for (let k = 0; k < 100; k++) {
          const back = 4 + k * 1.8;
          const age = back / speed;
          for (const s2 of [-4.6, 4.6]) list.push({ x: x - back, y: 60 + oy * 0.6 + age * 3 + s2 * Math.sin(0.35), z: ox * 0.8 + s2 * Math.cos(0.35), size: 0.35 + age * 5, alpha: 0.9 * Math.max(0, 1 - age / 0.9), seed: k * 0.3 + i });
        }
      } else {
        const z = lead - oz;
        j.group.position.set(ox * 0.9, 34 + oy, z);
        j.group.rotation.set(0, Math.PI, Math.sin(tt * 1.5 + i) * 0.05);
        for (let k = 0; k < 80; k++) {
          const back = 6 + k * 2;
          const age = back / speed;
          list.push({ x: ox * 0.9, y: 34 + oy + age * 2, z: z + back, size: 0.6 + age * 7, alpha: 0.85 * Math.max(0, 1 - age / 0.7), seed: k * 0.3 + i });
        }
      }
    });
    trails.set(list, g.camera);
    if (second) {
      g.camera.position.set(-40 + tt * 60, 52, 75);
      g.camera.lookAt(new THREE.Vector3(lead - 30, 60, 0));
      g.camera.fov = 42;
    } else {
      g.camera.position.set(0, 2, 40);
      g.camera.lookAt(new THREE.Vector3(0, 60, -60));
      g.camera.fov = 70;
    }
    g.camera.updateProjectionMatrix();
  };
};

// 12/13. Flying past Mount Rushmore
const rushmoreSetup = (close: boolean) => (g: GL) => {
  const sh = g.shared;
  sh.uSunDir.value.set(-0.55, 0.5, 0.65).normalize();
  sh.uSunCol.value.set(1.25, 1.1, 0.92);
  sh.uSky.value.set(0.45, 0.52, 0.65);
  sh.uGround.value.set(0.35, 0.3, 0.25);
  g.camera.far = 3000;
  const sky = makeSky(sh, { top: "#3f6fb5", horizon: "#d7e3ee", bottom: "#8c8a7a", glow: 0.5, rays: 0.3, lines: 0.6, lineSpacing: 4, clouds: 0.4, cloudScale: 1.3, cloudHeight: 0.2, cloudCol: "#ffffff", cloudShade: "#a0aab8", paper: 0.1 });
  g.scene.add(sky.mesh);
  g.setPost({ fog: [250, 2000, 0.5], fogCol: "#c9d6e0" });
  const rm = makeRushmore(g);
  g.scene.add(rm.group);
  const spots: [number, number, number, number][] = [];
  const r = rng("pines");
  for (let i = 0; i < 500; i++) {
    const x = (r() - 0.5) * 500;
    const z = 12 + r() * 70;
    spots.push([x, -4 + (r() - 0.5) * 6 + z * 0.2, z, 3 + r() * 4]);
  }
  for (let i = 0; i < 40; i++) {
    const x = (r() - 0.5) * 300;
    const up = 86 + r() * 20;
    spots.push([x, up, -20 + rushmoreHeight(x, up) - 3, 2.5 + r() * 2.5]);
  }
  const pines = makePines(g, spots);
  g.scene.add(pines.mesh);
  if (!close) g.enableShadows(2048, 120, 300);
  if (g.shadow) g.shadow.center.set(0, 40, 0);
  return (f: number) => {
    if (close) driveCamera(g, [{ f: 0, pos: [74, 52, 76], look: [26, 50, 0], fov: 34 }, { f: 15, pos: [60, 50, 70], look: [22, 50, 0], fov: 34 }], f, 0.01, 11);
    else driveCamera(g, [{ f: 0, pos: [-80, 50, 160], look: [-4, 46, 0], fov: 38 }, { f: 30, pos: [36, 48, 150], look: [-2, 46, 0], fov: 38 }], f, 0.006, 12);
  };
};

// 14/15. Grand Canyon fly-over at golden hour
const canyonSetup = (second: boolean) => (g: GL) => {
  const sh = g.shared;
  sh.uSunDir.value.set(-0.75, 0.3, -0.55).normalize();
  sh.uSunCol.value.set(1.3, 0.95, 0.62);
  sh.uSky.value.set(0.42, 0.44, 0.56);
  sh.uGround.value.set(0.35, 0.22, 0.15);
  g.camera.far = 6000;
  const sky = makeSky(sh, { top: "#4a6aa0", horizon: "#f6c087", bottom: "#b07a52", glow: 1.1, sunSize: 0.05, rays: 0.9, rayCount: 28, lines: 0.55, lineSpacing: 4, clouds: 0.3, cloudScale: 1.1, cloudHeight: 0.2, cloudCol: "#ffe2bf", cloudShade: "#9a7f86", paper: 0.1 });
  g.scene.add(sky.mesh);
  g.setPost({ fog: [400, 2600, 0.65], fogCol: "#eab98c" });
  const cy = makeCanyon(g, 3200, 520);
  g.scene.add(cy.mesh, cy.river);
  g.enableShadows(2048, 900, 2000);
  if (g.shadow) g.shadow.center.set(0, -200, second ? -400 : 400);
  return (f: number) => {
    const zz = (second ? 100 : 1000) - f * (second ? 14 : 11);
    const rx = riverX(zz);
    const ahead = zz - 600;
    const ax = riverX(ahead);
    if (second) {
      g.camera.position.set(rx + 520, 60, zz + 200);
      g.camera.lookAt(new THREE.Vector3(ax - 200, -220, ahead - 200));
      g.camera.rotateZ(-0.05);
    } else {
      g.camera.position.set(rx - 120, 140 + Math.sin(f * 0.05) * 4, zz);
      g.camera.lookAt(new THREE.Vector3(ax + 60, -260, ahead));
      g.camera.rotateZ(0.06);
    }
    g.camera.fov = 55;
    g.camera.updateProjectionMatrix();
  };
};

// 16-20. Fireworks over the city: shells rise, burst, trail and fall
const FW_COLS = ["#ff5a5a", "#ffffff", "#6aa8ff", "#ffd36a", "#7dff9a"];
const fireworksSetup = (variant: number) => (g: GL) => {
  const sh = g.shared;
  sh.uSunDir.value.set(0.2, 0.3, -1).normalize();
  sh.uSunCol.value.set(0.15, 0.18, 0.3);
  sh.uSky.value.set(0.12, 0.14, 0.25);
  sh.uGround.value.set(0.06, 0.05, 0.08);
  g.camera.far = 3000;
  const sky = makeSky(sh, { top: "#050818", horizon: "#1c2350", bottom: "#050818", glow: 0, rays: 0, lines: 0.35, lineSpacing: 4, stars: 0.9, paper: 0 });
  g.scene.add(sky.mesh);
  g.setPost({ fog: [300, 1400, 0.35], fogCol: "#1a2044" });
  const city = makeSkyline(g, { count: 110, x: [-800, 800], z: [-800, -450], seed: "city" + (variant % 2) });
  g.scene.add(city.mesh);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(3000, 300).rotateX(-Math.PI / 2), g.ink({ color: "#0d1430", spec: 1.2, gloss: 30, mode: "screen", angle: 0, scale: 3, emissive: "#0a1030", emissiveAmt: 0.5 }));
  water.position.set(0, -0.5, -20);
  g.scene.add(water);
  const plaza = new THREE.Mesh(new THREE.PlaneGeometry(400, 80).rotateX(-Math.PI / 2), g.ink({ color: "#2a2a33", mode: "stipple" }));
  plaza.position.set(0, 0, 150);
  g.scene.add(plaza);
  // crowd silhouettes in the foreground
  const figs: { fig: ReturnType<typeof makeFigure>; ph: number; up: boolean }[] = [];
  const r = rng("fwcrowd" + variant);
  const nFig = variant === 2 ? 12 : 7;
  for (let i = 0; i < nFig; i++) {
    const fig = makeFigure(g, "civilian", { color: { coat: "#15161c", pants: "#101014", skin: "#2a2224" }, mat: { hatch: 0.3, rim: 1.4, rimCol: "#9fb4ff" } });
    fig.root.position.set(-7 + i * (14 / nFig) + r() * 1.2, 0, 131 - r() * 3);
    fig.root.rotation.y = Math.PI + (r() - 0.5) * 0.6;
    g.scene.add(fig.root);
    figs.push({ fig, ph: r() * 6, up: r() < 0.6 });
  }
  const glows = FW_COLS.map((cc) => new Glows(sh, 900, cc, 1.3));
  glows.forEach((gl) => g.scene.add(gl.mesh));
  const flashLight = new THREE.Color();
  const r2 = rng("fw" + variant);
  const shells = Array.from({ length: variant === 3 ? 14 : 7 }, (_, i) => ({
    x: (r2() - 0.5) * 700,
    y: 260 + r2() * 220,
    z: -280 - r2() * 150,
    t: (variant === 1 ? -0.4 : -0.6) + i * (variant === 3 ? 0.07 : 0.16) + r2() * 0.1,
    col: Math.floor(r2() * FW_COLS.length),
    n: 110 + Math.floor(r2() * 60),
    v: 150 + r2() * 90,
  }));
  return (f: number, t: number) => {
    const cams = [
      [{ f: 0, pos: [0, 1.2, 137], look: [0, 260, -400], fov: 58 }, { f: 30, pos: [0, 1.25, 135], look: [0, 275, -400], fov: 57 }],
      [{ f: 0, pos: [30, 20, 170], look: [-30, 300, -450], fov: 45 }, { f: 15, pos: [26, 18, 160], look: [-30, 310, -450], fov: 44 }],
      [{ f: 0, pos: [-5, 1.1, 137], look: [10, 240, -400], fov: 64 }, { f: 30, pos: [-3, 1.15, 135], look: [10, 255, -400], fov: 64 }],
      [{ f: 0, pos: [0, 40, 300], look: [0, 220, -450], fov: 58 }, { f: 30, pos: [0, 36, 280], look: [0, 240, -450], fov: 58 }],
    ] as const;
    driveCamera(g, cams[variant % 4] as never, f, 0.01, 13 + variant);
    const lists: Puff[][] = FW_COLS.map(() => []);
    let flash = 0;
    for (const s of shells) {
      const a = t - s.t;
      if (a < -0.5) continue;
      if (a < 0) {
        // rising shell with a sparkling tail
        const u = 1 + a / 0.5;
        const y = s.y * (1 - Math.pow(1 - u, 2));
        for (let k = 0; k < 6; k++) lists[3].push({ x: s.x, y: y - k * 6, z: s.z, size: 3 - k * 0.4, alpha: 0.8 - k * 0.12 });
        continue;
      }
      if (a > 2.2) continue;
      flash += Math.max(0, 1 - a / 0.35);
      for (let i = 0; i < s.n; i++) {
        const th = hash(i, s.col, 1) * Math.PI * 2;
        const ph = Math.acos(hash(i, s.col, 2) * 2 - 1);
        const dir = new THREE.Vector3(Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th));
        const drag = 1.6;
        for (let k = 0; k < 5; k++) {
          const at = Math.max(0, a - k * 0.06);
          const dist = (s.v * (1 - Math.exp(-drag * at))) / drag;
          const fall = 12 * at * at;
          lists[s.col].push({ x: s.x + dir.x * dist, y: s.y + dir.y * dist - fall, z: s.z + dir.z * dist, size: (6.5 - k * 1.0) * (1 - a / 2.4), alpha: (1 - a / 2.2) * (1 - k * 0.18) * (0.8 + 0.2 * Math.sin(a * 40 + i)) });
        }
      }
      flashLight.set(FW_COLS[s.col]);
    }
    glows.forEach((gl, i) => gl.set(lists[i], g.camera));
    const fl = Math.min(1, flash);
    (city.mat.uniforms.uFlash.value as THREE.Color).copy(flashLight).multiplyScalar(fl * 0.6);
    sh.uSunCol.value.setRGB(0.15 + fl * flashLight.r * 0.6, 0.18 + fl * flashLight.g * 0.6, 0.3 + fl * flashLight.b * 0.6);
    figs.forEach(({ fig, ph, up }) => {
      const b = Math.sin(t * 6 + ph);
      fig.pose(up ? { lSh: [2.7 + b * 0.1, 0.3, 0], rSh: [2.5 - b * 0.1, 0.4, 0], lEl: 0.2, rEl: 0.3, neck: 0.35 } : { lSh: [0.2, 0.15, 0], rSh: [1.0, 0.3, 0], rEl: 1.6, neck: 0.4 });
    });
  };
};

const G = (setup: (g: GL) => (f: number, t: number) => void) => {
  const C: React.FC = () => <GLShot setup={setup} color />;
  return <C />;
};

const S = (a: number, b: number, el: React.ReactNode, enter: "cut" | "flash" | "punch" | "whip" | "whipUp" | "zoom" = "cut", name = "") => ({
  from: c(a),
  dur: c(b) - c(a),
  el,
  enter,
  palette: "color" as const,
  name,
});

export const hype: SceneDef = {
  id: "hype",
  seedBase: 90,
  shots: [
    S(0, 1, G(earthriseSetup), "cut", "earthrise"),
    S(1, 1.5, G(wallSetup(false)), "punch", "wall cracks"),
    S(1.5, 2.5, G(wallSetup(true)), "cut", "wall falls"),
    S(2.5, 3, G(circuitSetup(false)), "whip", "circuit"),
    S(3, 3.5, G(circuitSetup(true)), "zoom", "circuit macro"),
    S(3.5, 4.5, G(computersSetup), "punch", "computers"),
    S(4.5, 5.5, G(netSetup), "whip", "network map"),
    S(5.5, 6.5, G(phoneSetup(false)), "zoom", "phone"),
    S(6.5, 7.5, G(phoneSetup(true)), "cut", "phone close"),
    S(7.5, 8, G(jetsSetup(false)), "punch", "jets"),
    S(8, 9, G(jetsSetup(true)), "cut", "vapor trails"),
    S(9, 10, G(rushmoreSetup(false)), "whip", "rushmore"),
    S(10, 10.5, G(rushmoreSetup(true)), "cut", "rushmore close"),
    S(10.5, 11.5, G(canyonSetup(false)), "whipUp", "grand canyon"),
    S(11.5, 12, G(canyonSetup(true)), "cut", "canyon 2"),
    S(12, 13, G(fireworksSetup(0)), "flash", "fireworks"),
    S(13, 13.5, G(fireworksSetup(1)), "cut", "firework burst"),
    S(13.5, 14.5, G(fireworksSetup(2)), "punch", "skyline"),
    S(14.5, 15.5, G(fireworksSetup(3)), "cut", "finale"),
    S(15.5, 16, G(fireworksSetup(1)), "punch", "last burst"),
  ],
  hits: Array.from({ length: 32 }, (_, i) => ({ f: c(i * 0.5), amp: i % 2 === 0 ? 14 : 7, dur: 8, punch: i % 4 === 0 ? 0.03 : 0 })),
  flashes: [{ f: c(15.5), dur: 10, peak: 0.6 }],
  Overlay: () => (
    <>
      <Quote {...QUOTES.reagan} start={c(1) + 2} end={c(4.5)} framesPerWord={3} />
      <Quote {...QUOTES.jobs} start={c(5.5) + 2} end={c(10.5)} framesPerWord={3} fontSize={60} />
    </>
  ),
};
