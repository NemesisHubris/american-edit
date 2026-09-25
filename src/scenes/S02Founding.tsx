// 2. THE FOUNDING — candle flame flickering over a desk; the quill dips and
// writes the Declaration in real time; Independence Hall inks itself at dawn;
// the Liberty Bell swings as its crack draws in; muskets against a stone wall
// in rolling fog; boats crossing an icy river at night.
import * as THREE from "three";
import { Quote } from "../components/WordPop";
import { QUOTES } from "../quotes";
import { ITALIC_FAMILY, DISPLAY_FAMILY } from "../fonts";
import { sceneClock } from "../timeline";
import { hash, rng } from "../lib/random";
import { GLShot, GL, driveCamera, drawIn } from "../gl/GLShot";
import { makeSky } from "../gl/sky";
import { makeBell, makeDesk, makeHall, makeStoneWall, musketGeo, boatGeo, oarGeo, floeGeo } from "../gl/models/colonial";
import { canvasTex } from "../gl/models/modern";
import { makeBirds, makeBushes, makeGround, makeReeds, makeWater } from "../gl/env";
import { makeFlag } from "../gl/models/flag";
import { makeFigure, Pose } from "../gl/figure";
import { box, smoothIco } from "../gl/geo";
import { emit, Glows, Puff, Puffs } from "../gl/particles";
import type { SceneDef } from "./types";

const c = sceneClock("founding");

// ---------------------------------------------------------------- candle flame
const flameMaterial = (g: GL) => {
  const m = new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    transparent: true,
    depthWrite: false,
    uniforms: { uTime: g.shared.uTime, uNoiseTex: g.shared.uNoiseTex },
    vertexShader: /* glsl */ `
      precision highp float;
      in vec3 position; in vec2 uv;
      uniform mat4 modelMatrix; uniform mat4 viewMatrix; uniform mat4 projectionMatrix; uniform float uTime;
      out vec2 vUv;
      void main() {
        vUv = uv;
        vec3 p = position;
        float h = clamp(p.y / 0.06, 0.0, 1.0);
        p.x += sin(uTime * 13.0 + p.y * 60.0) * 0.003 * h * h + sin(uTime * 5.3) * 0.004 * h * h;
        p.z += cos(uTime * 11.0 + p.y * 50.0) * 0.002 * h * h;
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      in vec2 vUv;
      layout(location = 0) out vec4 gColor;
      layout(location = 1) out vec4 gData;
      void main() {
        float y = vUv.y;
        vec3 core = vec3(1.5, 1.35, 1.0);
        vec3 outer = vec3(1.3, 0.55, 0.12);
        vec3 blue = vec3(0.35, 0.45, 1.0);
        vec3 c = mix(outer, core, smoothstep(0.1, 0.45, y) * (1.0 - smoothstep(0.7, 1.0, y)));
        c = mix(blue, c, smoothstep(0.0, 0.12, y));
        gColor = vec4(c, 0.0);
        gData = vec4(0.0);
      }
    `,
  });
  m.blending = THREE.CustomBlending;
  m.blendSrc = THREE.OneFactor;
  m.blendDst = THREE.OneFactor;
  m.blendSrcAlpha = THREE.ZeroFactor;
  m.blendDstAlpha = THREE.OneFactor;
  const geo = new THREE.LatheGeometry(
    [
      [0, 0],
      [0.006, 0.004],
      [0.009, 0.015],
      [0.008, 0.03],
      [0.005, 0.045],
      [0.0, 0.065],
    ].map(([r, y]) => new THREE.Vector2(r, y)),
    24,
  );
  return new THREE.Mesh(geo, m);
};

// ---------------------------------------------------------------- the Declaration
const LINES = [
  { text: "IN CONGRESS, July 4, 1776.", font: `700 64px ${DISPLAY_FAMILY}, serif`, y: 130 },
  { text: "The unanimous Declaration of the thirteen united States of America,", font: `700 48px ${ITALIC_FAMILY}, serif`, y: 230 },
  { text: "When in the Course of human events, it becomes necessary for one people", font: `400 40px ${ITALIC_FAMILY}, serif`, y: 330 },
  { text: "to dissolve the political bands which have connected them with another,", font: `400 40px ${ITALIC_FAMILY}, serif`, y: 410 },
  { text: "and to assume among the powers of the earth, the separate and equal", font: `400 40px ${ITALIC_FAMILY}, serif`, y: 490 },
];
const SHEET_W = 1600;
const SHEET_H = 1100;
// R = ink, G = line index (1..), B = x within the line (0..1)
const declarationTex = () =>
  canvasTex("declaration", SHEET_W, SHEET_H, (ctx) => {
    ctx.fillStyle = "rgb(0,0,0)";
    ctx.fillRect(0, 0, SHEET_W, SHEET_H);
    LINES.forEach((l, i) => {
      ctx.font = l.font;
      const w = Math.min(1440, ctx.measureText(l.text).width);
      const x0 = (SHEET_W - w) / 2;
      // draw ink into R via a temporary canvas, then write G/B
      const tmp = document.createElement("canvas");
      tmp.width = SHEET_W;
      tmp.height = 110;
      const tc = tmp.getContext("2d")!;
      tc.font = l.font;
      tc.fillStyle = "#fff";
      tc.textBaseline = "alphabetic";
      tc.fillText(l.text, x0, 80, 1440);
      const img = tc.getImageData(0, 0, SHEET_W, 110);
      const out = ctx.getImageData(0, l.y - 80, SHEET_W, 110);
      for (let y = 0; y < 110; y++)
        for (let x = 0; x < SHEET_W; x++) {
          const k = (y * SHEET_W + x) * 4;
          const a = img.data[k];
          if (a > 0) {
            out.data[k] = Math.max(out.data[k], a);
            out.data[k + 1] = (i + 1) * 40;
            out.data[k + 2] = Math.max(0, Math.min(255, ((x - x0) / w) * 255));
          }
        }
      ctx.putImageData(out, 0, l.y - 80);
    });
  });
const lineGeom = () => {
  const cv = document.createElement("canvas").getContext("2d")!;
  return LINES.map((l) => {
    cv.font = l.font;
    const w = Math.min(1440, cv.measureText(l.text).width);
    return { x0: (SHEET_W - w) / 2, w, y: l.y };
  });
};
// line progress by frame (writing speed ~ real time, sped up a little)
const WRITE = [
  [12, 34],
  [34, 58],
  [58, 80],
  [80, 100],
  [100, 118],
];

const writeProgress = (f: number) => WRITE.map(([a, b]) => Math.min(1, Math.max(0, (f - a) / (b - a))));

const parchmentMat = (g: GL, tex: THREE.Texture) => {
  const lg = lineGeom();
  const v4 = (k: "x0" | "w") => new THREE.Vector4(lg[0][k] / SHEET_W, lg[1][k] / SHEET_W, lg[2][k] / SHEET_W, lg[3][k] / SHEET_W);
  return g.ink({
    color: "#efe2c2",
    mode: "screen",
    angle: 5,
    scale: 4,
    hatch: 0.45,
    shade: 0.9,
    uniforms: {
      uDecl: { value: tex },
      uProgA: { value: new THREE.Vector4() },
      uProgB: { value: 0 },
      uX0A: { value: v4("x0") },
      uX0B: { value: lg[4].x0 / SHEET_W },
      uWA: { value: v4("w") },
      uWB: { value: lg[4].w / SHEET_W },
    },
    fragDecl: "uniform sampler2D uDecl; uniform vec4 uProgA; uniform float uProgB; uniform vec4 uX0A; uniform float uX0B; uniform vec4 uWA; uniform float uWB;",
    frag: /* glsl */ `
      float cy = (1.0 - vUv.y) * ${SHEET_H.toFixed(1)};
      int li = cy < 180.0 ? 0 : cy < 280.0 ? 1 : cy < 370.0 ? 2 : cy < 450.0 ? 3 : 4;
      float pr = li == 0 ? uProgA.x : li == 1 ? uProgA.y : li == 2 ? uProgA.z : li == 3 ? uProgA.w : uProgB;
      float x0 = li == 0 ? uX0A.x : li == 1 ? uX0A.y : li == 2 ? uX0A.z : li == 3 ? uX0A.w : uX0B;
      float lw = li == 0 ? uWA.x : li == 1 ? uWA.y : li == 2 ? uWA.z : li == 3 ? uWA.w : uWB;
      float shown = step((vUv.x - x0) / lw, pr);
      float inkP = texture(uDecl, vUv).r * shown;
      albedo = mix(albedo, vec3(0.06, 0.04, 0.03), smoothstep(0.1, 0.6, inkP));
      hatchMul = 1.0 - inkP;
      // age stains and deckle
      albedo *= 0.9 + tfbm(vUv * 6.0) * 0.18;
      float edg = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
      albedo *= mix(0.75, 1.0, smoothstep(0.0, 0.05, edg));
    `,
  });
};

// shared desk set: desk, parchment, candle, inkwell, books, quill; warm light
const deskSet = (g: GL) => {
  const sh = g.shared;
  sh.uSunCol.value.set(0.9, 0.62, 0.32);
  sh.uSky.value.set(0.1, 0.08, 0.07);
  sh.uGround.value.set(0.05, 0.04, 0.03);
  g.camera.near = 0.01;
  g.camera.far = 30;
  const sky = makeSky(sh, { top: "#1a120c", horizon: "#241910", bottom: "#140e09", glow: 0, rays: 0, lines: 0.5, lineSpacing: 4, paper: 0 });
  g.scene.add(sky.mesh);
  g.setPost({ fog: [1.5, 6, 0.8], fogCol: "#1d140c", exposure: 1.05 });
  const d = makeDesk(g);
  g.scene.add(d.group);
  d.candleG.position.set(0.42, 0, -0.18);
  d.wellMesh.position.set(0.3, 0, 0.12);
  d.books.position.set(-0.55, 0, -0.22);
  d.books.rotation.y = 0.3;
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.33).rotateX(-Math.PI / 2), parchmentMat(g, declarationTex()));
  sheet.position.set(-0.08, 0.002, 0.05);
  sheet.rotation.y = 0.05;
  g.scene.add(sheet);
  // a rolled document and a sealing-wax stick for detail
  const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.3, 24).rotateZ(Math.PI / 2), g.ink({ color: "#e6d6b0", mode: "u", scale: 80 }));
  roll.position.set(-0.3, 0.018, 0.28);
  roll.rotation.y = -0.4;
  g.scene.add(roll);
  const flame = flameMaterial(g);
  const flamePos = new THREE.Vector3(0.42, 0.285, -0.18);
  flame.position.copy(flamePos);
  g.scene.add(flame);
  const wick = new THREE.Mesh(new THREE.CylinderGeometry(0.0012, 0.0012, 0.012, 6), g.ink({ color: "#111", hatch: 0 }));
  wick.position.set(0.42, 0.281, -0.18);
  g.scene.add(wick);
  const halo = new Glows(sh, 4, "#ffb35a", 0.6);
  g.scene.add(halo.mesh);
  const smoke = new Puffs(sh, 60, { lit: "#8a7a6a", shade: "#3a3028", outline: 0.2, hatch: 0.2, lineSpacing: 3, soft: 0.5, rough: 0.4 });
  g.scene.add(smoke.mesh);
  const motes = new Glows(sh, 80, "#ffcf8a", 0.3);
  g.scene.add(motes.mesh);
  g.enableShadows(2048, 1.2, 3);
  if (g.shadow) g.shadow.center.set(0, 0, 0);
  const lg = lineGeom();
  // sheet uv (0..1) -> world
  const sheetPt = (u: number, v: number) => new THREE.Vector3((u - 0.5) * 0.48, 0.002, (v - 0.5) * 0.33).applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.05).add(new THREE.Vector3(-0.08, 0, 0.05));
  const update = (f: number, t: number) => {
    const fl = 0.8 + 0.12 * Math.sin(t * 17) + 0.08 * Math.sin(t * 29 + 1) + 0.06 * (hash(Math.floor(t * 20), 3) - 0.5);
    // the candle is the key light: shadows sway with the flame
    const sway = new THREE.Vector3(Math.sin(t * 5.3) * 0.004, 0, Math.cos(t * 4.1) * 0.003);
    const lp = flamePos.clone().add(sway);
    sh.uSunDir.value.copy(lp).sub(new THREE.Vector3(0, 0, 0)).normalize();
    sh.uSunCol.value.setRGB(0.95 * fl, 0.62 * fl, 0.3 * fl);
    sh.uPL0.value.set(lp.x, lp.y, lp.z, 0.9);
    sh.uPLc0.value.setRGB(1.3 * fl, 0.8 * fl, 0.35 * fl);
    flame.scale.set(1, 0.9 + fl * 0.2, 1);
    halo.set([{ x: lp.x, y: lp.y + 0.03, z: lp.z, size: 0.09 * fl, alpha: 0.5 }, { x: lp.x, y: lp.y + 0.02, z: lp.z, size: 0.3 * fl, alpha: 0.12 }], g.camera);
    const sm: Puff[] = [];
    emit({ at: [lp.x, lp.y + 0.07, lp.z], rate: 12, life: 3, vel: [0, 0.05, 0], spread: 0.005, size: [0.004, 0.03], wind: [0.004, 0.01, 0], drag: 0.3, alpha: 0.35, seed: 3, prewarm: 3 }, t, sm);
    smoke.set(sm, g.camera);
    const mt: Puff[] = [];
    for (let i = 0; i < 60; i++) mt.push({ x: -0.6 + hash(i, 1) * 1.4 + Math.sin(t * 0.3 + i) * 0.02, y: 0.05 + hash(i, 2) * 0.5 + ((t * 0.01 * (1 + hash(i, 3))) % 0.3), z: -0.4 + hash(i, 4) * 0.8, size: 0.0025, alpha: 0.5 + 0.3 * Math.sin(t * 2 + i) });
    motes.set(mt, g.camera);
  };
  return { d, sheet, flamePos, lg, sheetPt, update };
};

// A. Candlelit desk: slow push past the flame to the parchment
const candleSetup = (g: GL) => {
  const s = deskSet(g);
  s.d.quill.position.set(0.24, 0.08, 0.1);
  s.d.quill.rotation.set(0.5, 0.2, -0.9);
  s.d.group.add(s.d.quill);
  return (f: number, t: number) => {
    s.update(f, t);

    driveCamera(g, [{ f: 0, pos: [0.62, 0.33, 0.14], look: [0.42, 0.26, -0.18], fov: 38 }, { f: 75, pos: [0.5, 0.36, 0.34], look: [0.2, 0.16, -0.1], fov: 40 }], f, 0.0015, 21);
  };
};

// B. The quill dips into the inkwell, then writes across the parchment
const quillSetup = (g: GL) => {
  const s = deskSet(g);
  const q = s.d.quill;
  s.d.group.add(q);
  const mat = s.sheet.material as THREE.RawShaderMaterial;
  const wellTop = new THREE.Vector3(0.3, 0.075, 0.12);
  return (f: number, t: number) => {
    s.update(f, t);
    const prog = writeProgress(f);
    mat.uniforms.uProgA.value.set(prog[0], prog[1], prog[2], prog[3]);
    mat.uniforms.uProgB.value = prog[4];
    // pen tip position
    let tip: THREE.Vector3;
    const li = prog.findIndex((p) => p < 1);
    if (f < 12) {
      const k = f / 12;
      const dip = Math.sin(k * Math.PI);
      const start = s.sheetPt(s.lg[0].x0 / SHEET_W, s.lg[0].y / SHEET_H);
      tip = wellTop.clone().lerp(start, Math.max(0, (k - 0.5) * 2)).add(new THREE.Vector3(0, 0.04 - dip * 0.05, 0));
    } else {
      const L = li < 0 ? s.lg.length - 1 : li;
      const p = li < 0 ? 1 : prog[L];
      const u = (s.lg[L].x0 + s.lg[L].w * p) / SHEET_W;
      const v = s.lg[L].y / SHEET_H;
      tip = s.sheetPt(u, v - 0.012);
      // letter strokes: small loops + lifts
      tip.x += Math.sin(t * 38) * 0.0025;
      tip.z += Math.cos(t * 31) * 0.003;
      tip.y += Math.max(0, Math.sin(t * 19)) * 0.004;
    }
    q.position.copy(tip);
    q.rotation.set(-0.55 + Math.sin(t * 19) * 0.03, 0.4, 0.45 + Math.sin(t * 7) * 0.04);
    const look = tip.clone().add(new THREE.Vector3(0.02, 0, 0.02));
    driveCamera(g, [{ f: 0, pos: [look.x + 0.02, 0.26, look.z + 0.28], look: [look.x, look.y, look.z], fov: 34 }], f, 0.001, 22);
    g.camera.position.x = look.x + 0.05;
    g.camera.lookAt(look);
    g.camera.updateProjectionMatrix();
  };
};

// C. Independence Hall inks itself at dawn; sunlight rays sweep; birds cross
const hallSetup = (g: GL) => {
  const sh = g.shared;
  sh.uSunDir.value.set(0.75, 0.22, 0.6).normalize();
  sh.uSunCol.value.set(1.25, 0.95, 0.65);
  sh.uSky.value.set(0.5, 0.52, 0.62);
  sh.uGround.value.set(0.3, 0.26, 0.2);
  g.camera.far = 3000;
  const sky = makeSky(sh, { top: "#56759f", horizon: "#f3c48e", bottom: "#8a7a62", glow: 1, sunSize: 0.06, rays: 1, rayCount: 30, lines: 0.65, lineSpacing: 4, clouds: 0.35, cloudScale: 1.3, cloudHeight: 0.2, cloudSpeed: 0.05, cloudCol: "#fff0d8", cloudShade: "#a08e86", paper: 0.2 });
  g.scene.add(sky.mesh);
  g.setPost({ fog: [150, 900, 0.35], fogCol: "#ecd3ad" });
  const hall = makeHall(g);
  g.scene.add(hall.group);
  const lawn = makeGround(g, { size: 1200, res: 120, y: -0.05, amp: 0.6, freq: 0.02, color: "#7c8250" });
  g.scene.add(lawn.mesh);
  const path = new THREE.Mesh(box(6, 0.05, 60, 0, 0, 45), g.ink({ color: "#b8a88a", mode: "stipple", hatch: 0.8 }));
  g.scene.add(path);
  const hedges = makeBushes(g, { count: 60, x: [-45, 45], z: [18, 24], y: 0, size: [1.2, 2.2], color: "#4f6a36", seed: "hedge" });
  g.scene.add(hedges.mesh);
  // elms: trunk + lumpy crown
  const trees = new THREE.Group();
  const trunkM = g.ink({ color: "#5a4632", mode: "v", scale: 20 });
  const crownM = g.ink({ color: "#56703c", mode: "screen", angle: 40, scale: 3.5, cross: 0.8, rim: 0.4, instanced: true });
  const r = rng("elms");
  const clump = smoothIco(1, 2);
  for (const [x, z] of [
    [-52, 28],
    [36, 34],
    [52, 44],
    [-62, 12],
    [64, 16],
    [-44, 4],
  ]) {
    const tg = new THREE.Group();
    tg.add(new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.7, 10, 10).translate(0, 5, 0), trunkM));
    // limbs
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 + r();
      const limb = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.3, 6, 6).translate(0, 3, 0), trunkM);
      limb.position.set(0, 7, 0);
      limb.rotation.set(Math.cos(a) * 0.7, 0, Math.sin(a) * 0.7);
      tg.add(limb);
    }
    const im = new THREE.InstancedMesh(clump, crownM, 40);
    for (let k = 0; k < 40; k++) {
      const th = r() * Math.PI * 2;
      const rr = Math.sqrt(r()) * 6;
      const y = 10 + r() * 7 - (rr / 6) * 2;
      const sc = 1.3 + r() * 1.4;
      im.setMatrixAt(k, new THREE.Matrix4().compose(new THREE.Vector3(Math.cos(th) * rr, y, Math.sin(th) * rr), new THREE.Quaternion(), new THREE.Vector3(sc, sc * 0.85, sc)));
    }
    im.frustumCulled = false;
    tg.add(im);
    tg.position.set(x, 0, z);
    trees.add(tg);
  }
  g.scene.add(trees);
  const birds = makeBirds(g, { count: 12, from: [-120, 40, 20], to: [140, 55, -10], spread: [30, 10, 20], size: 0.9, dur: 3, seed: "hallbirds" });
  g.scene.add(birds.mesh);
  g.enableShadows(2048, 70, 200);
  if (g.shadow) g.shadow.center.set(0, 10, 10);
  return (f: number, t: number) => {
    // camera: low on the lawn, dolly in and tilt up toward the steeple
    driveCamera(
      g,
      [
        { f: 0, pos: [-34, 3, 70], look: [0, 14, 8], fov: 40 },
        { f: 90, pos: [-16, 2.4, 44], look: [0, 26, 10], fov: 42 },
      ],
      f,
      0.004,
      23,
    );
    drawIn(hall.mats, f, -2, 38, 0.3);
    // sun rising a little
    sh.uSunDir.value.set(0.75, 0.16 + t * 0.03, 0.6).normalize();
    birds.update(t);
    trees.children.forEach((tg, i) => (tg.rotation.z = Math.sin(t * 1.2 + i) * 0.01));
  };
};

// D. The Liberty Bell swings; the crack draws in
const bellSetup = (g: GL) => {
  const sh = g.shared;
  sh.uSunDir.value.set(-0.6, 0.55, 0.6).normalize();
  sh.uSunCol.value.set(1.2, 0.95, 0.7);
  sh.uSky.value.set(0.18, 0.17, 0.18);
  sh.uGround.value.set(0.1, 0.08, 0.07);
  g.camera.near = 0.05;
  g.camera.far = 60;
  const sky = makeSky(sh, { top: "#1c1612", horizon: "#2c2219", bottom: "#1c1612", glow: 0, rays: 0, lines: 0.5, lineSpacing: 4, paper: 0 });
  g.scene.add(sky.mesh);
  g.setPost({ fog: [4, 14, 0.6], fogCol: "#2a2018" });
  const B = makeBell(g);
  const pivot = new THREE.Group();
  pivot.position.set(0, 2.1, 0);
  B.yoke.rotation.y = Math.PI / 2;
  pivot.add(B.yoke);
  B.bell.position.y = 0.16;
  pivot.add(B.bell);
  g.scene.add(pivot);
  // timber frame + brick wall behind, window casting a light shaft
  const timber = g.ink({ color: "#5c3f26", mode: "world", dir: [0, 1, 0], scale: 30, cross: 0.6 });
  const frame = new THREE.Group();
  frame.add(new THREE.Mesh(box(0.25, 2.8, 0.25, 0.9, 1.4, 0), timber), new THREE.Mesh(box(0.25, 2.8, 0.25, -0.9, 1.4, 0), timber), new THREE.Mesh(box(2.1, 0.3, 0.3, 0, 2.55, 0), timber));
  g.scene.add(frame);
  const wall = new THREE.Mesh(box(12, 6, 0.3, 0, 3, -3), g.ink({ color: "#8a4a32", mode: "world", dir: [0, 1, 0], scale: 5, cross: 0.6, frag: "float row = floor(vWorld.y / 0.08); float m = max(step(0.85, fract(vWorld.y / 0.08)), step(0.9, fract(vWorld.x / 0.2 + mod(row, 2.0) * 0.5))); albedo = mix(albedo, vec3(0.7, 0.62, 0.52), m * 0.6);" }));
  g.scene.add(wall);
  const floor = new THREE.Mesh(box(14, 0.1, 10, 0, -0.05, 0), g.ink({ color: "#6d5a44", mode: "world", dir: [1, 0, 0], scale: 8, frag: "extraInk += step(0.95, fract(vWorld.x / 0.25)) * 0.6;" }));
  g.scene.add(floor);
  const motes = new Glows(sh, 120, "#ffd79a", 0.3);
  g.scene.add(motes.mesh);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 1.4, 7, 4, 1, true).translate(0, -3.5, 0), (() => {
    const m = new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: {}, vertexShader: `precision highp float; in vec3 position; in vec2 uv; uniform mat4 modelMatrix; uniform mat4 viewMatrix; uniform mat4 projectionMatrix; out vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position,1.0);}`, fragmentShader: `precision highp float; in vec2 vUv; layout(location=0) out vec4 o; layout(location=1) out vec4 d; void main(){ o = vec4(vec3(1.0, 0.85, 0.6) * 0.09 * (1.0 - vUv.y * 0.2), 0.0); d = vec4(0.0);} ` });
    m.blending = THREE.CustomBlending;
    m.blendSrc = THREE.OneFactor;
    m.blendDst = THREE.OneFactor;
    m.blendSrcAlpha = THREE.ZeroFactor;
    m.blendDstAlpha = THREE.OneFactor;
    return m;
  })());
  beam.position.set(-3.5, 5, 3);
  beam.rotation.set(0.5, 0, 0.6);
  g.scene.add(beam);
  g.enableShadows(2048, 5, 12);
  if (g.shadow) g.shadow.center.set(0, 1.5, 0);
  return (f: number, t: number) => {
    pivot.rotation.x = Math.sin(t * 2.1) * 0.12 * Math.min(1, f / 10);
    B.bronze.uniforms.uCrack.value = Math.min(1, Math.max(0, (f - 12) / 26));
    driveCamera(g, [{ f: 0, pos: [0.9, 1.1, 2.4], look: [0, 1.55, 0], fov: 38 }, { f: 60, pos: [0.4, 1.2, 2.0], look: [0, 1.6, 0], fov: 36 }], f, 0.003, 24);
    const mt: Puff[] = [];
    for (let i = 0; i < 100; i++) mt.push({ x: -2 + hash(i, 1) * 3 + Math.sin(t * 0.4 + i) * 0.05, y: 0.5 + hash(i, 2) * 3 + Math.sin(t * 0.3 + i * 2) * 0.05, z: -1 + hash(i, 3) * 3, size: 0.008, alpha: 0.4 + 0.3 * Math.sin(t * 2 + i) });
    motes.set(mt, g.camera);
  };
};

// E. Muskets stacked against a fieldstone wall, fog rolling past at dawn
const musketSetup = (g: GL) => {
  const sh = g.shared;
  sh.uSunDir.value.set(0.7, 0.25, 0.4).normalize();
  sh.uSunCol.value.set(1.1, 0.9, 0.7);
  sh.uSky.value.set(0.55, 0.55, 0.6);
  sh.uGround.value.set(0.3, 0.28, 0.24);
  g.camera.near = 0.05;
  g.camera.far = 400;
  const sky = makeSky(sh, { top: "#9aa6b0", horizon: "#e8dcc6", bottom: "#b0a590", glow: 0.6, rays: 0.3, lines: 0.6, lineSpacing: 4, paper: 0.3 });
  g.scene.add(sky.mesh);
  g.setPost({ fog: [3, 40, 0.8], fogCol: "#e2dccd", fogNoise: 1, fogTop: 0.5 });
  const wall = makeStoneWall(g, 14, 0.95, "mwall");
  g.scene.add(wall.mesh);
  const M = musketGeo();
  const woodM = g.ink({ color: "#6e4426", mode: "screen", angle: 75, scale: 3.5, spec: 0.6, gloss: 30, rim: 0.5 });
  const metalM = g.ink({ color: "#8a8a88", mode: "screen", angle: 75, scale: 3.5, spec: 1.3, gloss: 50, rim: 0.5 });
  const muskets = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const m = new THREE.Group();
    m.add(new THREE.Mesh(M.wood, woodM), new THREE.Mesh(M.metal, metalM));
    m.position.set(-0.9 + i * 0.33, 0, 0.42);
    m.rotation.set(-0.3, (i % 2 ? 1 : -1) * 0.25 + (i - 3) * 0.05, (i - 2.5) * 0.04);
    muskets.add(m);
  }
  g.scene.add(muskets);
  // powder horn, tricorn and a cartridge box resting on the wall
  const hatM = g.ink({ color: "#1f1c1a", mode: "screen", angle: 30, scale: 3 });
  const hat = new THREE.Group();
  hat.add(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.02, 3), hatM), new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.1, 16).translate(0, 0.05, 0), hatM));
  hat.position.set(1.3, wall.top + 0.02, 0.05);
  hat.rotation.set(0.1, 0.5, 0.05);
  g.scene.add(hat);
  const ground = makeGround(g, { size: 400, res: 120, y: 0, amp: 0.5, freq: 0.05, color: "#7c7a52" });
  g.scene.add(ground.mesh);
  const grass = makeReeds(g, { count: 6000, x: [-8, 8], z: [0.6, 4], y: 0, h: [0.12, 0.35], w: 0.012, color: "#6e7040", seed: "mgrass", sway: 0.3, wind: 2 });
  g.scene.add(grass.mesh);
  const fog = new Puffs(sh, 200, { lit: "#f1ece0", shade: "#b8b2a4", outline: 0.15, hatch: 0.25, lineSpacing: 4, soft: 0.6, rough: 0.35 });
  g.scene.add(fog.mesh);
  const trees = makeBushes(g, { count: 40, x: [-80, 80], z: [-60, -30], y: 0, size: [4, 9], color: "#5d6a4a", seed: "mtree", flat: 1.6 });
  g.scene.add(trees.mesh);
  g.enableShadows(2048, 6, 20);
  return (f: number, t: number) => {
    driveCamera(g, [{ f: 0, pos: [-1.9, 0.75, 1.7], look: [0.1, 0.8, 0.3], fov: 40 }, { f: 60, pos: [-1.2, 0.85, 1.55], look: [0.5, 0.85, 0.3], fov: 38 }], f, 0.003, 25);
    const fl: Puff[] = [];
    for (let i = 0; i < 140; i++) {
      const sp = 0.5 + hash(i, 1) * 0.6;
      const x = ((hash(i, 2) * 30 + t * sp) % 30) - 15;
      fl.push({ x, y: 0.2 + hash(i, 3) * 1.6, z: -6 + hash(i, 4) * 7, size: 0.8 + hash(i, 5) * 1.4, alpha: 0.28 * Math.sin(((x + 15) / 30) * Math.PI), seed: hash(i, 6) * 9 });
    }
    fog.set(fl, g.camera);
  };
};

// F. Crossing the icy river at night: oars pull, ice drifts, snow falls
const rowPose = (ph: number): Pose => {
  const s = Math.sin(ph);
  return { bend: 0.35 + s * 0.3, crouch: 0.38, lSh: [1.2 + s * 0.5, 0.15, 0], rSh: [1.2 + s * 0.5, 0.15, 0], lEl: 0.6 - s * 0.4, rEl: 0.6 - s * 0.4, lHip: [1.5, 0.1], rHip: [1.5, 0.1], lKn: 1.6, rKn: 1.6, neck: -0.2 };
};
const crossingSetup = (g: GL) => {
  const sh = g.shared;
  sh.uSunDir.value.set(-0.4, 0.45, -0.8).normalize(); // moon behind, rim-lighting the boats
  sh.uSunCol.value.set(0.55, 0.62, 0.8);
  sh.uSky.value.set(0.15, 0.18, 0.28);
  sh.uGround.value.set(0.06, 0.07, 0.1);
  g.camera.far = 2000;
  const sky = makeSky(sh, { top: "#0c1426", horizon: "#3a4a66", bottom: "#101820", glow: 0.9, sunSize: 0.02, sunCol: "#e8eeff", rays: 0.3, lines: 0.7, lineSpacing: 4, stars: 0.8, clouds: 0.35, cloudScale: 1.2, cloudHeight: 0.2, cloudSpeed: 0.06, cloudCol: "#9fb0cc", cloudShade: "#2a3448", paper: 0 });
  g.scene.add(sky.mesh);
  g.setPost({ fog: [40, 500, 0.5], fogCol: "#3a4660" });
  const water = makeWater(g, { w: 900, d: 900, res: 220, y: 0, color: "#2a3a4c", sky: "#6a7c98", amp: 0.35, freq: 0.35, speed: 0.8, lineSpacing: 4, glitterDir: sh.uSunDir.value });
  g.scene.add(water.mesh);
  const shore = makeGround(g, { size: 2000, res: 120, y: -2, amp: 30, freq: 0.004, color: "#d8dde4", flat: (x, z) => (z < -140 ? 1 : 0) });
  g.scene.add(shore.mesh);
  const pines = makeBushes(g, { count: 160, x: [-400, 400], z: [-260, -180], y: 4, size: [5, 12], color: "#1f2a2a", seed: "npine", flat: 2.2 });
  g.scene.add(pines.mesh);
  const B = boatGeo();
  const hullM = g.ink({ color: "#4a3a2c", mode: "v", scale: 40, cross: 0.6, rim: 0.8, rimCol: "#cfe0ff", side: THREE.DoubleSide });
  const oarM = g.ink({ color: "#8a7456", mode: "v", scale: 30, rim: 0.6, rimCol: "#cfe0ff" });
  const boats: { g: THREE.Group; rowers: { fig: ReturnType<typeof makeFigure>; oar: THREE.Mesh; side: number; ph: number }[]; x: number; z: number; sp: number }[] = [];
  const oarG = oarGeo();
  const places: [number, number, number][] = [
    [0, 0, 1],
    [-26, -30, 0.85],
    [30, -55, 0.8],
  ];
  places.forEach(([x, z, sp], bi) => {
    const bg = new THREE.Group();
    bg.add(new THREE.Mesh(B.hull, hullM), new THREE.Mesh(B.thwarts, hullM));
    const rowers: (typeof boats)[number]["rowers"] = [];
    for (let k = 0; k < 6; k++) {
      const side = k % 2 ? 1 : -1;
      const fig = makeFigure(g, "colonial", { mat: { rim: 1.2, rimCol: "#cfe0ff" } });
      fig.root.position.set(side * 0.35, -0.55, -3.6 + Math.floor(k / 2) * 2.2);
      fig.root.rotation.y = Math.PI;
      bg.add(fig.root);
      const oar = new THREE.Mesh(oarG, oarM);
      bg.add(oar);
      rowers.push({ fig, oar, side, ph: k * 0.1 + bi });
    }
    // standing officer at the bow with a flag (lead boat)
    if (bi === 0) {
      const gen = makeFigure(g, "colonial", { color: { coat: "#26324a" }, mat: { rim: 1.4, rimCol: "#cfe0ff" } });
      gen.root.position.set(0, -0.5, 4.4);
      gen.root.rotation.y = 0.3;
      gen.pose({ lSh: [0.4, 0.2, 0], rSh: [0.8, 0.3, 0], rEl: 0.5, lHip: [0.25, 0.1], lKn: 0.3, rHip: [-0.1, 0.05] });
      bg.add(gen.root);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 4.5, 8), oarM);
      pole.position.set(-0.6, 1.6, 3.6);
      bg.add(pole);
      const fl = makeFlag(g, { w: 1.6, h: 1.0, stars: 13, wind: 0.2, speed: 1.6 });
      fl.mesh.position.set(-0.6, 3.8, 3.6);
      fl.mesh.rotation.y = Math.PI * 0.6;
      bg.add(fl.mesh);
    }
    bg.scale.setScalar(1);
    bg.position.set(x, 0.3, z);
    bg.rotation.y = -0.9;
    g.scene.add(bg);
    boats.push({ g: bg, rowers, x, z, sp });
  });
  // ice floes: irregular slabs drifting (a few shapes, many instances)
  const iceM = g.ink({ color: "#e9eef4", mode: "screen", angle: 10, scale: 3.5, instanced: true, rim: 0.8, rimCol: "#cfe0ff" });
  const iceMeshes = [0, 1, 2, 3].map((k) => {
    const im = new THREE.InstancedMesh(floeGeo(k), iceM, 30);
    im.count = 30;
    im.frustumCulled = false;
    g.scene.add(im);
    return im;
  });
  const r = rng("ice");
  const floes = Array.from({ length: 120 }, () => [(r() - 0.5) * 200, (r() - 0.5) * 160, 0.8 + r() * 3.2, r() * 6] as [number, number, number, number]);
  const snow = new Glows(sh, 500, "#e8eeff", 0.4);
  g.scene.add(snow.mesh);
  const m4 = new THREE.Matrix4();
  return (f: number, t: number) => {
    boats.forEach((b, bi) => {
      const drift = t * 1.6 * b.sp;
      b.g.position.set(b.x - drift * 0.78, 0.3 + Math.sin(t * 1.4 + bi) * 0.12, b.z - drift * 0.62);
      b.g.rotation.set(Math.sin(t * 1.1 + bi) * 0.03, -0.9, Math.sin(t * 1.3 + bi) * 0.04);
      b.rowers.forEach((rw) => {
        const ph = t * 3.2 + rw.ph;
        rw.fig.pose(rowPose(ph));
        const sweep = Math.sin(ph);
        const lift = Math.cos(ph) > 0 ? 0.15 : -0.05;
        rw.oar.position.set(rw.side * 0.9, 0.35, rw.fig.root.position.z + 0.2);
        rw.oar.rotation.set(sweep * 0.5, 0, rw.side * (1.15 + lift));
      });
    });
    const lead = boats[0].g.position;
    driveCamera(g, [{ f: 0, pos: [lead.x + 9, 2.2, lead.z + 11], look: [lead.x - 1, 1.6, lead.z], fov: 42 }, { f: 90, pos: [lead.x + 6, 1.8, lead.z + 8.5], look: [lead.x - 1.5, 1.9, lead.z - 1], fov: 42 }], f, 0.012, 26);
    floes.forEach(([x, z, s, a], i) => {
      m4.compose(new THREE.Vector3(((x - t * 1.2 + 100) % 200) - 100, 0.05 + Math.sin(t * 1.3 + i) * 0.05, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.sin(t + i) * 0.04, a + t * 0.05, 0)), new THREE.Vector3(s, 1, s * 0.8));
      iceMeshes[i % 4].setMatrixAt(Math.floor(i / 4), m4);
    });
    iceMeshes.forEach((im) => (im.instanceMatrix.needsUpdate = true));
    const sn: Puff[] = [];
    for (let i = 0; i < 420; i++) {
      const fall = (hash(i, 1) * 20 + t * (1 + hash(i, 2))) % 20;
      sn.push({ x: -20 + hash(i, 3) * 40 + Math.sin(t + i) * 0.5, y: 18 - fall, z: -20 + hash(i, 4) * 44, size: 0.05 + hash(i, 5) * 0.05, alpha: 0.8 });
    }
    snow.set(sn, g.camera);
  };
};

const shot = (setup: (g: GL) => (f: number, t: number) => void) => {
  const C: React.FC = () => <GLShot setup={setup} />;
  return <C />;
};

export const founding: SceneDef = {
  id: "founding",
  seedBase: 10,
  shots: [
    { from: 0, dur: c(2.5), el: shot(candleSetup), enter: "burn", origin: [960, 1000], name: "candle" },
    { from: c(2.5), dur: c(5) - c(2.5), el: shot(quillSetup), enter: "morph", name: "quill" },
    { from: c(5), dur: c(8) - c(5), el: shot(hallSetup), enter: "whip", name: "independence hall" },
    { from: c(8), dur: c(10) - c(8), el: shot(bellSetup), enter: "ink", origin: [960, 500], name: "liberty bell" },
    { from: c(10), dur: c(12) - c(10), el: shot(musketSetup), enter: "morph", name: "muskets" },
    { from: c(12), dur: c(15) - c(12), el: shot(crossingSetup), enter: "ink", origin: [1400, 300], name: "crossing" },
  ],
  hits: [{ f: c(5), amp: 6, dur: 10 }],
  Overlay: () => <Quote {...QUOTES.declaration} start={c(5.5)} end={c(11)} framesPerWord={4} />,
};

