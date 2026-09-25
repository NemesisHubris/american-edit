// 4. A NATION TESTED — "1863". Napoleon guns fire with recoil and smoke on a
// foggy field; fog rolls across a split-rail fence at Gettysburg at dawn; a
// lone tall figure in a stovepipe hat against fast clouds; the camera tilts up
// the Lincoln Memorial columns as they draw themselves.
import * as THREE from "three";
import { YearSlam } from "../components/YearSlam";
import { Quote } from "../components/WordPop";
import { QUOTES } from "../quotes";
import { sceneClock } from "../timeline";
import { hash } from "../lib/random";
import { GLShot, GL, driveCamera, drawIn } from "../gl/GLShot";
import { makeSky } from "../gl/sky";
import { makeCannon, makeFence, makeMemorial, makeTree } from "../gl/models/civilwar";
import { makeBirds, makeGround, makeReeds } from "../gl/env";
import { makeFigure } from "../gl/figure";
import { emit, Glows, Puff, Puffs, Smoke } from "../gl/particles";
import type { SceneDef } from "./types";

const c = sceneClock("tested");
const FIRE_A = [c(0.5), c(2)];
const FIRE_B = [c(1.5)];

// A. Napoleon guns fire on the beats: recoil, rolling wheels, muzzle flash, smoke
const cannonSetup = (g: GL) => {
  const sh = g.shared;
  sh.uSunDir.value.set(0.55, 0.35, -0.75).normalize();
  sh.uSunCol.value.set(1.15, 0.95, 0.72);
  sh.uSky.value.set(0.5, 0.5, 0.52);
  sh.uGround.value.set(0.3, 0.27, 0.22);
  g.camera.far = 2000;
  const sky = makeSky(sh, { top: "#8a9098", horizon: "#e6d8bd", bottom: "#a0937a", glow: 0.8, sunSize: 0.05, rays: 0.6, lines: 0.7, lineSpacing: 4, clouds: 0.4, cloudSpeed: 0.05, cloudCol: "#f2ead8", cloudShade: "#8c8478", paper: 0.25 });
  g.scene.add(sky.mesh);
  g.setPost({ fog: [30, 400, 0.6], fogCol: "#e3d9c4", fogNoise: 0.8, fogTop: 0.3 });
  const ground = makeGround(g, { size: 1500, res: 200, y: 0, amp: 5, freq: 0.01, color: "#8a8a5a", flat: (x, z) => Math.min(1, Math.hypot(x, z) / 40), mat: { mode: "stipple", hatch: 0.8 } });
  g.scene.add(ground.mesh);
  const grass = makeReeds(g, { count: 1800, x: [-14, 14], z: [-10, 3], y: 0, h: [0.06, 0.18], w: 0.01, color: "#9a9868", seed: "cgrass", sway: 0.25, wind: 1.8, edges: 0 });
  g.scene.add(grass.mesh);
  const guns = [
    { gun: makeCannon(g), pos: [0, 0, 0], yaw: -0.5, fires: FIRE_A },
    { gun: makeCannon(g), pos: [-9, 0, -9], yaw: -0.45, fires: FIRE_B },
    { gun: makeCannon(g), pos: [-18, 0, -19], yaw: -0.4, fires: [c(1)] },
  ];
  guns.forEach((q) => {
    q.gun.root.position.set(q.pos[0], q.pos[1], q.pos[2]);
    q.gun.root.rotation.y = q.yaw;
    g.scene.add(q.gun.root);
  });
  // gunners by each piece
  const crews: { fig: ReturnType<typeof makeFigure>; gun: number; ph: number }[] = [];
  guns.forEach((q, gi) => {
    for (let k = 0; k < 2; k++) {
      const fig = makeFigure(g, "frock", { color: { coat: "#2b3550", pants: "#5a6a80", hat: "#2b3550" } });
      const side = k ? 1 : -1;
      fig.root.position.set(q.pos[0] + side * 1.6 * Math.cos(q.yaw), 0, q.pos[2] - side * 1.6 * Math.sin(q.yaw) - 1.2);
      fig.root.rotation.y = q.yaw + (side > 0 ? -0.6 : 0.6);
      g.scene.add(fig.root);
      crews.push({ fig, gun: gi, ph: k * 1.3 + gi });
    }
  });
  const treeL = makeTree(g, "ct1", 14, 7);
  treeL.group.position.set(-60, 0, -80);
  const treeR = makeTree(g, "ct2", 12, 6);
  treeR.group.position.set(40, 0, -110);
  g.scene.add(treeL.group, treeR.group);
  const smoke = new Smoke(g, 500, { color: "#f1ece2", heatCol: "#ffb060" });
  g.scene.add(smoke.mesh);
  const flashes = new Glows(sh, 20, "#ffd48a", 1.5);
  g.scene.add(flashes.mesh);
  const sparks = new Glows(sh, 200, "#ffc070", 1.2);
  g.scene.add(sparks.mesh);
  g.enableShadows(2048, 30, 80);
  return (f: number, t: number) => {
    driveCamera(g, [{ f: 0, pos: [4.5, 1.2, 4.2], look: [-2, 0.9, -3], fov: 46 }, { f: 75, pos: [3.4, 1.3, 3.2], look: [-3, 1.0, -4], fov: 44 }], f, 0.01, 41);
    const sm: Puff[] = [];
    const fl: Puff[] = [];
    const sp: Puff[] = [];
    guns.forEach((q, gi) => {
      let recoil = 0;
      const fwd = new THREE.Vector3(Math.sin(q.yaw), 0, Math.cos(q.yaw));
      const muzzle = new THREE.Vector3(q.pos[0], 1.05, q.pos[2]).addScaledVector(fwd, 1.3);
      for (const fr of q.fires) {
        const a = (f - fr) / 30;
        if (a < 0) continue;
        recoil += Math.min(1, a * 8) * Math.exp(-a * 2.2) * 1.2;
        if (a < 0.12) fl.push({ x: muzzle.x + fwd.x * 0.6, y: muzzle.y, z: muzzle.z + fwd.z * 0.6, size: 2.8 * (1 - a / 0.12), alpha: 1 });
        const seed = gi * 10 + fr;
        emit({ at: [muzzle.x, muzzle.y, muzzle.z], rate: 90, life: 4, vel: [fwd.x * 14, 1.5, fwd.z * 14], spread: 2.5, size: [0.4, 3.6], wind: [0.6, 0.35, 0.1], drag: 1.6, heat: 1, heatFade: 0.25, start: fr / 30, stop: fr / 30 + 0.2, seed }, t, sm);
        for (let i = 0; i < 40; i++) {
          const age = a - hash(i, seed) * 0.05;
          if (age < 0 || age > 0.5) continue;
          const v = 10 + hash(i, seed, 2) * 16;
          sp.push({ x: muzzle.x + (fwd.x * v + (hash(i, seed, 3) - 0.5) * 6) * age, y: muzzle.y + (hash(i, seed, 4) * 4) * age - 4.9 * age * age, z: muzzle.z + (fwd.z * v + (hash(i, seed, 5) - 0.5) * 6) * age, size: 0.06, alpha: 1 - age / 0.5, stretch: 3 });
        }
      }
      q.gun.root.position.set(q.pos[0] - fwd.x * recoil, 0, q.pos[2] - fwd.z * recoil);
      q.gun.wheels.forEach((w) => (w.rotation.x = recoil / 0.7));
      q.gun.carriage.rotation.x = -recoil * 0.06;
    });
    smoke.set(sm);
    flashes.set(fl, g.camera);
    sparks.set(sp, g.camera);
    crews.forEach(({ fig, ph }) => {
      const s = Math.sin(t * 2 + ph);
      fig.pose({ bend: 0.25 + s * 0.05, lSh: [0.6 + s * 0.2, 0.2, 0], rSh: [0.9, 0.3, 0], lEl: 0.8, rEl: 1.1, lHip: [0.3, 0.1], rHip: [-0.1, 0.08], lKn: 0.4, crouch: 0.08 });
    });
  };
};

// B. Worm fence at dawn with fog rolling through at three depths
const fenceSetup = (g: GL) => {
  const sh = g.shared;
  sh.uSunDir.value.set(-0.7, 0.12, -0.7).normalize();
  sh.uSunCol.value.set(1.3, 0.95, 0.6);
  sh.uSky.value.set(0.48, 0.48, 0.55);
  sh.uGround.value.set(0.3, 0.26, 0.2);
  g.camera.far = 2000;
  const sky = makeSky(sh, { top: "#6b7fa0", horizon: "#f2c58a", bottom: "#9a8a70", glow: 1.2, sunSize: 0.06, rays: 1, rayCount: 30, lines: 0.7, lineSpacing: 4, paper: 0.25, clouds: 0.25, cloudSpeed: 0.04, cloudCol: "#ffe8c8", cloudShade: "#9a8a86" });
  g.scene.add(sky.mesh);
  g.setPost({ fog: [15, 300, 0.75], fogCol: "#eedcbc", fogNoise: 1, fogTop: 0.6 });
  const ground = makeGround(g, { size: 1500, res: 220, y: 0, amp: 8, freq: 0.006, color: "#8a8a58", flat: (x, z) => Math.min(1, Math.abs(z) / 60), mat: { mode: "stipple", hatch: 0.8 } });
  g.scene.add(ground.mesh);
  const fence = makeFence(g, 30);
  fence.mesh.position.set(-45, 0, 0);
  g.scene.add(fence.mesh);
  const grass = makeReeds(g, { count: 2500, x: [-25, 25], z: [-6, 4], y: 0, h: [0.08, 0.28], w: 0.01, color: "#9a9868", seed: "fgrass", sway: 0.3, wind: 1.5, edges: 0 });
  g.scene.add(grass.mesh);
  const trees = [makeTree(g, "ft1", 13, 7), makeTree(g, "ft2", 10, 5), makeTree(g, "ft3", 15, 8)];
  trees[0].group.position.set(-30, 0, -40);
  trees[1].group.position.set(12, 0, -60);
  trees[2].group.position.set(45, 0, -90);
  trees.forEach((tr) => g.scene.add(tr.group));
  const fog = new Puffs(sh, 240, { lit: "#fff4e2", shade: "#c8b9a2", outline: 0.12, hatch: 0.25, lineSpacing: 4, soft: 0.6, rough: 0.35 });
  g.scene.add(fog.mesh);
  const birds = makeBirds(g, { count: 7, from: [-60, 18, -50], to: [80, 26, -70], spread: [16, 6, 10], size: 0.6, dur: 3, seed: "fb" });
  g.scene.add(birds.mesh);
  return (f: number, t: number) => {
    driveCamera(g, [{ f: 0, pos: [-3, 1.5, 7.5], look: [2, 0.8, 0], fov: 42 }, { f: 60, pos: [0, 1.6, 7], look: [5, 0.8, 0], fov: 42 }], f, 0.006, 42);
    const fl: Puff[] = [];
    for (let i = 0; i < 200; i++) {
      const depth = i % 3;
      const sp = [2.2, 1.3, 0.7][depth];
      const x = ((hash(i, 1) * 120 + t * sp) % 120) - 60;
      const z = [3 + hash(i, 2) * 4, -4 - hash(i, 2) * 10, -20 - hash(i, 2) * 30][depth];
      fl.push({ x, y: 0.3 + hash(i, 3) * 2.2, z, size: [1.4, 3, 6][depth] * (0.7 + hash(i, 4) * 0.6), alpha: 0.4 * Math.sin(((x + 60) / 120) * Math.PI), seed: hash(i, 5) * 9 });
    }
    fog.set(fl, g.camera);
    birds.update(t);
  };
};

// C. A lone tall figure in a stovepipe hat, backlit, clouds racing
const lincolnSetup = (g: GL) => {
  const sh = g.shared;
  sh.uSunDir.value.set(0.1, 0.18, -1).normalize();
  sh.uSunCol.value.set(1.2, 0.9, 0.6);
  sh.uSky.value.set(0.3, 0.3, 0.34);
  sh.uGround.value.set(0.15, 0.13, 0.11);
  g.camera.far = 3000;
  const sky = makeSky(sh, { top: "#50607a", horizon: "#f5c88f", bottom: "#6a5a48", glow: 1.4, sunSize: 0.08, rays: 1.2, rayCount: 26, lines: 0.7, lineSpacing: 4, clouds: 0.55, cloudSpeed: 0.35, cloudScale: 1.3, cloudHeight: 0.15, cloudCol: "#fff0d6", cloudShade: "#6a6060", paper: 0.15 });
  g.scene.add(sky.mesh);
  g.setPost({ fog: [100, 900, 0.4], fogCol: "#e8c8a0" });
  const hill = makeGround(g, { size: 3000, res: 200, y: -1, amp: 4, freq: 0.004, color: "#5e5a3e", flat: () => 1 });
  g.scene.add(hill.mesh);
  const lincoln = makeFigure(g, "frock", { scale: 1.08, color: { coat: "#141210", pants: "#141210", hat: "#0e0c0b", skin: "#3a2e28" }, mat: { rim: 1.6, rimPow: 2, rimCol: "#ffd9a0", hatch: 0.6 } });
  g.scene.add(lincoln.root);
  const grass = makeReeds(g, { count: 3000, x: [-6, 6], z: [-3, 3], y: -0.02, h: [0.15, 0.45], w: 0.015, color: "#3f3d28", seed: "lg", sway: 0.5, wind: 3, edges: 0 });
  g.scene.add(grass.mesh);
  const tree = makeTree(g, "lt", 9, 5, 40);
  tree.group.position.set(-9, -0.5, -6);
  g.scene.add(tree.group);
  return (f: number, t: number) => {
    lincoln.pose({ yaw: 0.25, lSh: [0.05, 0.12, 0], rSh: [0.1, 0.1, 0], lEl: 0.15, rEl: 0.2, lHip: [0.05, 0.05], rHip: [-0.03, 0.05], neck: 0.08 + Math.sin(t * 0.8) * 0.02, headYaw: 0.1 });
    driveCamera(g, [{ f: 0, pos: [1.2, 0.4, 5.2], look: [0, 1.5, 0], fov: 38 }, { f: 75, pos: [0.4, 0.3, 4.3], look: [0, 1.6, 0], fov: 38 }], f, 0.004, 43);
  };
};

// D. Tilt up the Lincoln Memorial as its columns draw themselves
const memorialSetup = (g: GL) => {
  const sh = g.shared;
  sh.uSunDir.value.set(0.6, 0.45, 0.65).normalize();
  sh.uSunCol.value.set(1.2, 1.05, 0.85);
  sh.uSky.value.set(0.5, 0.52, 0.6);
  sh.uGround.value.set(0.3, 0.28, 0.25);
  g.camera.far = 2000;
  const sky = makeSky(sh, { top: "#6a86ad", horizon: "#e8e0cc", bottom: "#a09a8a", glow: 0.6, rays: 0.4, lines: 0.7, lineSpacing: 4, clouds: 0.35, cloudSpeed: 0.06, cloudCol: "#fbf6ea", cloudShade: "#9a9aa0", paper: 0.25 });
  g.scene.add(sky.mesh);
  const mem = makeMemorial(g);
  g.scene.add(mem.group);
  g.enableShadows(2048, 45, 120);
  if (g.shadow) g.shadow.center.set(0, 8, 0);
  return (f: number) => {
    const k = Math.min(1, f / 88);
    const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    g.camera.position.set(-10 + e * 4, 1.2 + e * 5, 42 - e * 6);
    g.camera.fov = 48;
    g.camera.lookAt(new THREE.Vector3(-4, 3 + e * 16, 10));
    g.camera.updateProjectionMatrix();
    drawIn(mem.mats, f, -6, 42, 0.3);
  };
};

const shot = (setup: (g: GL) => (f: number, t: number) => void) => {
  const C: React.FC = () => <GLShot setup={setup} />;
  return <C />;
};

export const tested: SceneDef = {
  id: "tested",
  seedBase: 40,
  shots: [
    { from: 0, dur: c(2.5), el: shot(cannonSetup), enter: "burn", origin: [300, 200], name: "cannons" },
    { from: c(2.5), dur: c(4.5) - c(2.5), el: shot(fenceSetup), enter: "morph", name: "fence" },
    { from: c(4.5), dur: c(7) - c(4.5), el: shot(lincolnSetup), enter: "ink", origin: [1150, 500], name: "lincoln" },
    { from: c(7), dur: c(10) - c(7), el: shot(memorialSetup), enter: "whipUp", name: "memorial" },
  ],
  hits: [
    { f: FIRE_A[0], amp: 22, dur: 14, punch: 0.03 },
    { f: FIRE_B[0], amp: 10, dur: 10 },
    { f: FIRE_A[1], amp: 18, dur: 12, punch: 0.02 },
  ],
  Overlay: () => (
    <>
      <YearSlam text="1863" startFrame={c(0.5) - 5} fontSize={300} display scrim={0.75} exitAt={c(2.2)} />
      <Quote {...QUOTES.lincoln} start={c(4.5) + 3} end={c(10)} framesPerWord={3} fontSize={62} />
    </>
  ),
};


