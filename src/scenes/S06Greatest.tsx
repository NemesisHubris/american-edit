// 6. THE GREATEST GENERATION — "1944". Landing craft ramps slam down in rough
// surf with spray on the lens; steel hedgehogs on the beach as smoke drifts;
// a helmet in the sand as the waves wash over it; fighters roar past in
// formation over the ocean; the flag raised as a silhouette against the sky.
import * as THREE from "three";
import { YearSlam } from "../components/YearSlam";
import { Quote } from "../components/WordPop";
import { QUOTES } from "../quotes";
import { sceneClock } from "../timeline";
import { hash, rng } from "../lib/random";
import { GLShot, GL, driveCamera } from "../gl/GLShot";
import { makeSky } from "../gl/sky";
import { higginsGeo, hedgehogGeo, helmetGeo, mustangGeo, propBladesGeo } from "../gl/models/ww2";
import { makeGround, makeWater } from "../gl/env";
import { makeFigure, Pose } from "../gl/figure";
import { makeFlag } from "../gl/models/flag";
import { terrain } from "../gl/geo";
import { fbm2 } from "../gl/noise";
import { emit, Glows, Puff, Puffs, Smoke } from "../gl/particles";
import type { SceneDef } from "./types";

const c = sceneClock("greatest");
const RAMPS = [c(0.5) + 6, 36, 51];

const overcast = (g: GL, o: { dark?: number } = {}) => {
  const sh = g.shared;
  sh.uSunDir.value.set(0.3, 0.4, -0.85).normalize();
  sh.uSunCol.value.set(0.9, 0.85, 0.78);
  sh.uSky.value.set(0.55, 0.56, 0.6);
  sh.uGround.value.set(0.28, 0.27, 0.25);
  g.camera.far = 3000;
  const sky = makeSky(sh, { top: "#6a7684", horizon: "#c8c4b8", bottom: "#7a7a74", glow: 0.4, sunSize: 0.05, rays: 0.4, lines: 0.75, lineSpacing: 4, clouds: 0.6, cloudSpeed: 0.08, cloudScale: 1.2, cloudHeight: 0.15, cloudCol: "#e6e4de", cloudShade: "#5c5c60", paper: 0.1 + (o.dark ?? 0) });
  g.scene.add(sky.mesh);
  return sky;
};

// A. Higgins boats pitching in rough surf; ramps slam down; troops; spray on the lens
const landingSetup = (g: GL) => {
  overcast(g);
  g.setPost({ fog: [80, 900, 0.45], fogCol: "#c8c6bc" });
  const sea = makeWater(g, { w: 400, d: 400, res: 300, y: 0, color: "#34403f", sky: "#6e7a78", amp: 1.1, freq: 0.32, speed: 1.4, lineSpacing: 3.5, glitter: 0.3 });
  g.scene.add(sea.mesh);
  const beach = makeGround(g, { size: 3000, res: 120, y: -2, amp: 30, freq: 0.003, color: "#a89a7a", flat: (x, z) => (z < -300 ? 1 : 0) });
  g.scene.add(beach.mesh);
  const bluffs = new THREE.Mesh(terrain(3000, 400, 200, 60, (x, z) => (z < 0 ? 0 : 1) * 0 + Math.max(0, 1 - Math.abs(z) / 200) * (40 + fbm2(x * 0.01, z * 0.02, 4, 3) * 50)), g.ink({ color: "#8a8a6a", mode: "screen", angle: 60, scale: 3.5, cross: 0.6 }));
  bluffs.position.set(0, -10, -520);
  g.scene.add(bluffs);
  const H = higginsGeo();
  const hullM = g.ink({ color: "#5d6650", mode: "screen", angle: 70, scale: 3.5, cross: 0.6, rim: 0.4, side: THREE.DoubleSide });
  const boats = [
    { x: 0, z: 0, ph: 0, ramp: RAMPS[0] },
    { x: -14, z: -22, ph: 1.3, ramp: RAMPS[1] },
    { x: 15, z: -30, ph: 2.1, ramp: RAMPS[2] },
    { x: -30, z: -60, ph: 0.7, ramp: 999 },
    { x: 32, z: -70, ph: 2.9, ramp: 999 },
  ].map((b, bi) => {
    const grp = new THREE.Group();
    grp.add(new THREE.Mesh(H.hull, hullM));
    const rampPivot = new THREE.Group();
    rampPivot.position.set(0, 0.2, 4.0);
    rampPivot.add(new THREE.Mesh(H.ramp, hullM));
    grp.add(rampPivot);
    // troops packed inside, helmets and packs
    const troops: ReturnType<typeof makeFigure>[] = [];
    if (bi < 3)
      for (let k = 0; k < 12; k++) {
        const f = makeFigure(g, "gi");
        f.root.position.set(-1.0 + (k % 3) * 1.0, 0.15, 2.8 - Math.floor(k / 3) * 1.6);
        f.pose({ bend: 0.25, lSh: [0.9, 0.2, 0], rSh: [1.1, 0.3, 0], lEl: 1.4, rEl: 1.2, crouch: 0.15, lKn: 0.3, rKn: 0.3, lHip: [0.3, 0.1], rHip: [0.3, 0.1] });
        grp.add(f.root);
        troops.push(f);
      }
    grp.rotation.y = 0.05 * (bi - 2);
    g.scene.add(grp);
    return { ...b, grp, rampPivot, troops };
  });
  const foam = new Puffs(g.shared, 700, { lit: "#ffffff", shade: "#b8c0c0", outline: 0.25, hatch: 0.3, lineSpacing: 4, soft: 0.45, rough: 0.45 });
  g.scene.add(foam.mesh);
  const drops = new Glows(g.shared, 60, "#d8e4e8", 0.6);
  g.scene.add(drops.mesh);
  const smoke = new Smoke(g, 120, { color: "#6e6a64", hatch: 1, inkDark: 0.15 });
  g.scene.add(smoke.mesh);
  return (f: number, t: number) => {
    const fl: Puff[] = [];
    boats.forEach((b, bi) => {
      const bob = Math.sin(t * 1.6 + b.ph) * 0.5;
      const pitch = Math.sin(t * 1.3 + b.ph) * 0.1;
      const surge = Math.min(1, t / 3) * 6;
      b.grp.position.set(b.x, bob, b.z + surge);
      b.grp.rotation.x = pitch;
      b.grp.rotation.z = Math.sin(t * 1.1 + b.ph * 2) * 0.05;
      // ramp: up, then slams down with a bounce
      const a = (f - b.ramp) / 30;
      let ang = 0;
      if (a > 0) ang = Math.min(1.35, a * a * 18) - (a > 0.28 ? Math.exp(-(a - 0.28) * 10) * Math.sin((a - 0.28) * 40) * 0.1 : 0);
      b.rampPivot.rotation.x = ang;
      if (a > 0.25 && a < 1.0) {
        const age = a - 0.25;
        for (let i = 0; i < 70; i++) {
          const ang2 = (hash(i, bi) - 0.5) * 2.6;
          const v = 3 + hash(i, bi, 2) * 6;
          fl.push({ x: b.x + Math.sin(ang2) * v * age * 1.3, y: 0.3 + (2 + hash(i, bi, 3) * 5) * age - 4.9 * age * age, z: b.grp.position.z + 6 + Math.cos(ang2) * v * age, size: 0.4 + age * 1.6, alpha: 1 - age / 0.75, seed: hash(i, bi, 4) * 9 });
        }
      }
      // bow wave + wake
      for (let i = 0; i < 16; i++) {
        const u = hash(i, bi, 7);
        fl.push({ x: b.x + (u - 0.5) * 4, y: 0.2 + Math.abs(bob) * 0.3, z: b.grp.position.z + 4.5 + hash(i, bi, 8), size: 0.5 + hash(i, bi, 9) * 0.8, alpha: 0.7, seed: i + t });
      }
      // troops surge forward once the ramp is down
      b.troops.forEach((tr, k) => {
        const go = Math.max(0, a - 0.35 - k * 0.04);
        tr.root.position.z = 2.8 - Math.floor(k / 3) * 1.6 + go * 5;
        tr.pose(go > 0 ? { bend: 0.4, lHip: [Math.sin(t * 9 + k) * 0.6, 0.1], rHip: [-Math.sin(t * 9 + k) * 0.6, 0.1], lKn: 0.6, rKn: 0.6, lSh: [1.0, 0.3, 0], rSh: [1.2, 0.3, 0], lEl: 1.4, rEl: 1.2 } : { bend: 0.25, lSh: [0.9, 0.2, 0], rSh: [1.1, 0.3, 0], lEl: 1.4, rEl: 1.2, crouch: 0.15, lKn: 0.3, rKn: 0.3, lHip: [0.3, 0.1], rHip: [0.3, 0.1] });
      });
    });
    // whitecaps scattered on the chop around the boats
    for (let i = 0; i < 160; i++) {
      const x = (hash(i, 60) - 0.5) * 80;
      const z = (hash(i, 61) - 0.5) * 80;
      const ph = (t * 0.8 + hash(i, 62)) % 1;
      fl.push({ x, y: 0.4 + Math.sin(ph * Math.PI) * 0.4, z, size: 0.5 + hash(i, 63) * 1.2, alpha: Math.sin(ph * Math.PI) * 0.8, seed: i });
    }
    // breaking surf ahead
    for (let i = 0; i < 180; i++) {
      const x = (hash(i, 50) - 0.5) * 200;
      const ph = (t * 0.6 + hash(i, 51)) % 1;
      fl.push({ x, y: 0.5 + Math.sin(ph * Math.PI) * 1.8, z: 40 + ph * 16 + hash(i, 52) * 5, size: 1 + hash(i, 53) * 2, alpha: Math.sin(ph * Math.PI) * 0.8, seed: i });
    }
    foam.set(fl, g.camera);
    const sm: Puff[] = [];
    emit({ at: [-80, 10, -400], rate: 10, life: 8, vel: [3, 3, 0], spread: 2, size: [10, 40], drag: 0.3, alpha: 0.8, seed: 3, prewarm: 8, jitter: [100, 5, 40] }, t, sm);
    smoke.set(sm);
    // spray on the lens after the first ramp
    const la = (f - RAMPS[0]) / 30;
    const dr: Puff[] = [];
    if (la > 0.2) {
      const cp = g.camera.position;
      const fw = new THREE.Vector3();
      g.camera.getWorldDirection(fw);
      const right = new THREE.Vector3().crossVectors(fw, g.camera.up).normalize();
      const up = new THREE.Vector3().crossVectors(right, fw);
      for (let i = 0; i < 40; i++) {
        const age = la - 0.2 - hash(i, 90) * 0.3;
        if (age < 0) continue;
        const p = cp.clone().addScaledVector(fw, 0.6).addScaledVector(right, (hash(i, 91) - 0.5) * 1.1).addScaledVector(up, (hash(i, 92) - 0.5) * 0.6 - age * 0.05);
        dr.push({ x: p.x, y: p.y, z: p.z, size: 0.008 + hash(i, 93) * 0.02, alpha: Math.max(0, 0.7 - age * 0.5) });
      }
    }
    drops.set(dr, g.camera);
    const lb = boats[0].grp.position;
    driveCamera(g, [{ f: 0, pos: [lb.x + 5, 1.1, lb.z + 11], look: [lb.x - 0.5, 1.4, lb.z + 1], fov: 52 }, { f: 75, pos: [lb.x + 4, 0.9, lb.z + 10], look: [lb.x - 0.5, 1.2, lb.z + 2], fov: 54 }], f, 0.04, 61);
  };
};

// B. Steel hedgehogs on the beach, smoke banks drifting, a distant blast
const beachSetup = (g: GL) => {
  overcast(g, { dark: 0.05 });
  g.setPost({ fog: [30, 600, 0.5], fogCol: "#c4bcae", fogNoise: 0.6, fogTop: 0.3 });
  const sand = new THREE.Mesh(terrain(800, 800, 240, 240, (x, z) => (fbm2(x * 0.02, z * 0.02, 4, 7) - 0.5) * 1.2 + z * 0.01 + Math.sin(x * 0.3 + z * 0.1) * 0.05), g.ink({ color: "#c2b08a", mode: "stipple", hatch: 0.9 }));
  g.scene.add(sand);
  const sea = makeWater(g, { w: 1200, d: 600, res: 160, y: -0.6, color: "#34403f", sky: "#6e7a78", amp: 0.6, freq: 0.15, lineSpacing: 4 });
  sea.mesh.position.z = 345;
  g.scene.add(sea.mesh);
  const hhM = g.ink({ color: "#4a4642", mode: "screen", angle: 20, scale: 3.5, spec: 0.6, rim: 0.5, instanced: true, frag: "albedo *= 0.8 + tvn(vWorld.xy * 5.0) * 0.4;" });
  const hh = new THREE.InstancedMesh(hedgehogGeo(), hhM, 60);
  const r = rng("hh");
  for (let i = 0; i < 60; i++) {
    const near = i < 14;
    const x = near ? -9 + (i % 5) * 4.5 + r() * 2 : (r() - 0.5) * 160;
    const z = near ? 31 - Math.floor(i / 5) * 6 + r() * 2 : -30 + r() * 50;
    hh.setMatrixAt(i, new THREE.Matrix4().compose(new THREE.Vector3(x, 0.6, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(r() * 0.3, r() * 6, r() * 0.3)), new THREE.Vector3(1, 1, 1)));
  }
  hh.frustumCulled = false;
  g.scene.add(hh);
  // barbed-wire coils, stakes and wreckage in the foreground
  const wireM = g.ink({ color: "#3a3632", hatch: 0.3, instanced: true });
  const coil = new THREE.TorusKnotGeometry(0.35, 0.012, 200, 5, 1, 12);
  const coils = new THREE.InstancedMesh(coil, wireM, 16);
  for (let i = 0; i < 16; i++) coils.setMatrixAt(i, new THREE.Matrix4().compose(new THREE.Vector3(-14 + i * 1.4 + r() * 0.3, 0.3, 31.5 + Math.sin(i) * 0.4), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0)), new THREE.Vector3(1, 1, 1.6)));
  coils.frustumCulled = false;
  g.scene.add(coils);
  const stakeM = g.ink({ color: "#5a4a38", mode: "screen", angle: 80, scale: 3.5, instanced: true });
  const stakes = new THREE.InstancedMesh(new THREE.BoxGeometry(0.08, 1.4, 0.08), stakeM, 24);
  for (let i = 0; i < 24; i++) stakes.setMatrixAt(i, new THREE.Matrix4().compose(new THREE.Vector3(-18 + i * 1.6, 0.5, 30 - (i % 3) * 5 + r()), new THREE.Quaternion().setFromEuler(new THREE.Euler((r() - 0.5) * 0.5, 0, (r() - 0.5) * 0.5)), new THREE.Vector3(1, 1, 1)));
  stakes.frustumCulled = false;
  g.scene.add(stakes);
  const debrisM = g.ink({ color: "#6a6456", mode: "screen", angle: 30, scale: 3.5, instanced: true });
  const debris = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), debrisM, 30);
  for (let i = 0; i < 30; i++) debris.setMatrixAt(i, new THREE.Matrix4().compose(new THREE.Vector3(-12 + r() * 24, 0.05, 20 + r() * 15), new THREE.Quaternion().setFromEuler(new THREE.Euler(r() * 0.5, r() * 6, r() * 0.5)), new THREE.Vector3(0.2 + r() * 0.8, 0.1 + r() * 0.3, 0.2 + r() * 0.6)));
  debris.frustumCulled = false;
  g.scene.add(debris);
  const smoke = new Smoke(g, 300, { color: "#6a6660", hatch: 1, inkDark: 0.15 });
  g.scene.add(smoke.mesh);
  const embers = new Glows(g.shared, 120, "#ffb060", 1);
  g.scene.add(embers.mesh);
  const flash = new Glows(g.shared, 4, "#ffd9a0", 1.2);
  g.scene.add(flash.mesh);
  return (f: number, t: number) => {
    const sm: Puff[] = [];
    emit({ at: [-60, 1, -20], rate: 20, life: 8, vel: [6, 2.2, 1], spread: 1.5, size: [2, 10], drag: 0.3, alpha: 0.85, seed: 4, prewarm: 8, jitter: [10, 1, 30] }, t, sm);
    emit({ at: [-30, 0.5, 20], rate: 8, life: 6, vel: [4, 1.2, 0], spread: 1, size: [1, 5], drag: 0.3, alpha: 0.8, seed: 8, prewarm: 6, jitter: [5, 0.5, 6] }, t, sm);
    const blastT = (c(3) - c(2.5)) / 30;
    emit({ at: [30, 1, -60], rate: 60, life: 3, vel: [0, 8, 0], spread: 5, size: [2, 12], drag: 0.8, heat: 1, heatFade: 0.5, alpha: 1, start: blastT, stop: blastT + 0.3, seed: 5 }, t, sm);
    smoke.set(sm);
    const a = t - blastT;
    flash.set(a > 0 && a < 0.3 ? [{ x: 30, y: 4, z: -60, size: 30 * (1 - a / 0.3), alpha: 1 }] : [], g.camera);
    const em: Puff[] = [];
    for (let i = 0; i < 100; i++) {
      const u = (hash(i, 1) + t * 0.2) % 1;
      em.push({ x: -40 + hash(i, 2) * 80 + Math.sin(t + i) * 2, y: u * 12, z: -20 + hash(i, 3) * 40, size: 0.08, alpha: Math.sin(u * Math.PI) });
    }
    embers.set(em, g.camera);
    driveCamera(g, [{ f: 0, pos: [-7, 0.6, 34.5], look: [2, 1.1, 10], fov: 50 }, { f: 45, pos: [-4, 0.55, 33.5], look: [4, 1.2, 8], fov: 50 }], f, 0.012, 62);
  };
};

// C. A helmet in the sand; the wash advances and recedes over it
const helmetSetup = (g: GL) => {
  const sh = g.shared;
  overcast(g);
  sh.uSunDir.value.set(-0.6, 0.22, 0.75).normalize();
  sh.uSunCol.value.set(1.2, 1.0, 0.75);
  g.camera.near = 0.01;
  g.camera.far = 400;
  g.setPost({ fog: [4, 60, 0.6], fogCol: "#c8c2b4" });
  const sand = new THREE.Mesh(terrain(40, 40, 300, 300, (x, z) => (fbm2(x * 0.5, z * 0.5, 4, 7) - 0.5) * 0.04 + z * 0.02 + Math.sin(x * 9 + z * 2 + fbm2(x, z, 2, 1) * 3) * 0.012), g.ink({ color: "#b8a680", mode: "stipple", hatch: 0.9, frag: "albedo *= 0.8 + step(0.0, -vWorld.z) * 0.0 + tvn(vWorld.xz * 20.0) * 0.3;" }));
  g.scene.add(sand);
  const Hm = helmetGeo();
  const helmetM = g.ink({ color: "#5e6248", mode: "screen", angle: 30, scale: 3.5, spec: 0.5, gloss: 20, rim: 0.6, frag: "albedo *= 0.75 + tvn(vObj.xz * 30.0) * 0.4; extraInk += step(0.8, tvn(vObj.xy * 40.0)) * 0.3;" });
  const helmet = new THREE.Group();
  helmet.add(new THREE.Mesh(Hm.shell, helmetM), new THREE.Mesh(Hm.strap, g.ink({ color: "#6a5a40" })));
  helmet.position.set(0, -0.02, 0);
  helmet.rotation.set(0.12, 0.6, 0.18);
  g.scene.add(helmet);
  // the wash: a thin sheet of water that slides up and back
  const wash = makeWater(g, { w: 40, d: 30, res: 160, y: 0, color: "#4a5a5a", sky: "#8a9694", amp: 0.015, freq: 1.5, speed: 1, lineSpacing: 3, glitter: 1 });
  g.scene.add(wash.mesh);
  const foam = new Puffs(sh, 400, { lit: "#ffffff", shade: "#c0c4c0", outline: 0.3, hatch: 0.3, lineSpacing: 3, soft: 0.35, rough: 0.5 });
  g.scene.add(foam.mesh);
  return (f: number, t: number) => {
    const edge = 1.2 - Math.max(0, Math.sin(t * 1.8 - 0.4)) * 2.4; // z of the water's edge (moving toward -z covers)
    wash.mesh.position.set(0, 0.01, edge + 15);
    const fl: Puff[] = [];
    for (let i = 0; i < 360; i++) {
      const x = (hash(i, 1) - 0.5) * 4;
      fl.push({ x, y: 0.012 + hash(i, 2) * 0.006, z: edge + Math.sin(x * 3 + i) * 0.06 + hash(i, 3) * 0.05, size: 0.01 + hash(i, 4) * 0.02, alpha: 0.9, seed: hash(i, 5) * 9 });
    }
    foam.set(fl, g.camera);
    driveCamera(g, [{ f: 0, pos: [0.9, 0.2, -0.9], look: [0, 0.07, 0.25], fov: 40 }, { f: 45, pos: [0.75, 0.17, -0.75], look: [0, 0.07, 0.25], fov: 38 }], f, 0.003, 63);
  };
};

// D. P-51s roar past in formation over the ocean
const fighterSetup = (g: GL) => {
  const sh = g.shared;
  sh.uSunDir.value.set(0.4, 0.55, 0.7).normalize();
  sh.uSunCol.value.set(1.15, 1.05, 0.9);
  sh.uSky.value.set(0.5, 0.55, 0.62);
  sh.uGround.value.set(0.3, 0.3, 0.3);
  g.camera.far = 5000;
  const sky = makeSky(sh, { top: "#5f7a98", horizon: "#d8dcd8", bottom: "#6a7680", glow: 0.6, rays: 0.4, lines: 0.75, lineSpacing: 4, clouds: 0.4, cloudSpeed: 0.12, cloudScale: 1.2, cloudCol: "#ffffff", cloudShade: "#8c96a0", paper: 0.15 });
  g.scene.add(sky.mesh);
  g.setPost({ fog: [300, 3000, 0.55], fogCol: "#d0d4d2" });
  const sea = makeWater(g, { w: 6000, d: 6000, res: 200, y: 0, color: "#3e5260", sky: "#c0c8cc", amp: 1.2, freq: 0.05, lineSpacing: 4 });
  g.scene.add(sea.mesh);
  const M = mustangGeo();
  const alu = g.ink({ color: "#b8bcc0", mode: "screen", angle: 20, scale: 3.5, spec: 1.3, gloss: 40, rim: 0.7, frag: "extraInk += step(0.96, fract(vObj.z * 1.2)) * 0.3; if (vObj.z > 4.2) albedo = vec3(0.8, 0.2, 0.15);" });
  const glass = g.ink({ color: "#3a4a58", spec: 2, gloss: 80, hatch: 0.3, rim: 1 });
  const planes = [0, 1, 2, 3].map(() => {
    const grp = new THREE.Group();
    grp.add(new THREE.Mesh(M.body, alu), new THREE.Mesh(M.canopy, glass), new THREE.Mesh(M.spinner, alu));
    const prop = new THREE.Mesh(propBladesGeo(), g.ink({ color: "#2a2a2a", hatch: 0.2 }));
    prop.position.z = 5.05;
    grp.add(prop);
    g.scene.add(grp);
    return { grp, prop };
  });
  const streaks = new Glows(sh, 200, "#ffffff", 0.2);
  g.scene.add(streaks.mesh);
  const form: [number, number, number][] = [
    [0, 0, 0],
    [-12, -2, -10],
    [12, -2, -10],
    [-24, -4, -20],
  ];
  return (f: number, t: number) => {
    const z0 = -110 + t * 120;
    planes.forEach((p, i) => {
      const [ox, oy, oz] = form[i];
      p.grp.position.set(ox + Math.sin(t * 2 + i) * 0.6, 40 + oy + Math.sin(t * 1.7 + i) * 0.5, z0 + oz);
      p.grp.rotation.set(-0.02, 0, 0.15 + Math.sin(t * 1.5 + i) * 0.05);
      p.prop.rotation.z = t * 60;
    });
    const st: Puff[] = [];
    for (let i = 0; i < 80; i++) {
      const u = (hash(i, 1) + t * 3) % 1;
      st.push({ x: (hash(i, 2) - 0.5) * 60, y: 30 + hash(i, 3) * 25, z: z0 + 40 - u * 120, size: 0.15, alpha: 0.5, stretch: 30 });
    }
    streaks.set(st, g.camera);
    // camera: low over the waves, the formation roars over and past
    g.camera.position.set(14, 33, 30);
    g.camera.lookAt(new THREE.Vector3(-2, 39, Math.min(z0 + 6, 45)));
    g.camera.fov = 50;
    g.camera.rotateZ(Math.sin(t * 20) * 0.004 * Math.max(0, 1 - Math.abs(z0 - 40) / 60));
    g.camera.updateProjectionMatrix();
  };
};

// E. Raising the flag: six silhouettes push the pole up against a moving sky
const raisePoses = (k: number): Pose[] => [
  { bend: 0.5 - k * 0.2, lSh: [1.6 + k * 0.6, 0.2, 0], rSh: [1.5 + k * 0.6, 0.2, 0], lEl: 0.3, rEl: 0.3, lHip: [0.6, 0.1], rHip: [-0.3, 0.1], lKn: 0.6, rKn: 0.2 },
  { bend: 0.6 - k * 0.2, lSh: [1.4 + k * 0.7, 0.3, 0], rSh: [1.7 + k * 0.6, 0.2, 0], lEl: 0.4, rEl: 0.2, lHip: [-0.2, 0.1], rHip: [0.7, 0.1], lKn: 0.2, rKn: 0.7, crouch: 0.1 },
  { bend: 0.7 - k * 0.3, lSh: [1.2 + k * 0.8, 0.2, 0], rSh: [1.3 + k * 0.8, 0.2, 0], lEl: 0.5, rEl: 0.5, lHip: [0.8, 0.1], rHip: [0.1, 0.1], lKn: 0.9, rKn: 0.4, crouch: 0.2 },
];
const raisingSetup = (g: GL) => {
  const sh = g.shared;
  sh.uSunDir.value.set(0.15, 0.3, -1).normalize();
  sh.uSunCol.value.set(1.2, 1.0, 0.75);
  sh.uSky.value.set(0.3, 0.3, 0.34);
  sh.uGround.value.set(0.12, 0.11, 0.1);
  g.camera.far = 3000;
  const sky = makeSky(sh, { top: "#4e5e78", horizon: "#f0d4a8", bottom: "#4a4038", glow: 1.2, sunSize: 0.07, rays: 1.2, rayCount: 24, lines: 0.75, lineSpacing: 4, clouds: 0.55, cloudSpeed: 0.3, cloudScale: 1.3, cloudHeight: 0.15, cloudCol: "#fff2d8", cloudShade: "#6a625c", paper: 0.1 });
  g.scene.add(sky.mesh);
  const summit = new THREE.Mesh(terrain(80, 80, 120, 120, (x, z) => -Math.pow(Math.hypot(x, z) / 30, 2) * 6 + (fbm2(x * 0.2, z * 0.2, 4, 3) - 0.5) * 1.6), g.ink({ color: "#3a3430", mode: "screen", angle: 30, scale: 3.5, cross: 0.8 }));
  g.scene.add(summit);
  const dark = { coat: "#141210", pants: "#141210", hat: "#141210", skin: "#1a1614" };
  const pivot = new THREE.Group();
  pivot.position.set(0, -0.2, 0);
  g.scene.add(pivot);
  const poleM = g.ink({ color: "#1a1612", hatch: 0.4, rim: 1.4, rimCol: "#ffd9a0" });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 6.4, 10).translate(0, 3.2, 0), poleM);
  pivot.add(pole);
  const flag = makeFlag(g, { w: 1.8, h: 1.0, stars: 48, wind: 0.22, speed: 2.4 });
  flag.mesh.position.set(0.02, 6.35, 0);
  pivot.add(flag.mesh);
  const men: { fig: ReturnType<typeof makeFigure>; pose: number; at: number }[] = [];
  const spots: [number, number][] = [
    [0.1, 0.6],
    [-0.5, 1.4],
    [-1.1, 2.0],
    [-0.3, -0.4],
    [-1.4, 1.0],
    [0.5, 1.5],
  ];
  spots.forEach(([x, z], i) => {
    const fig = makeFigure(g, "marine", { color: dark, mat: { rim: 1.6, rimCol: "#ffd9a0", hatch: 0.5 } });
    fig.root.position.set(x, -0.2, z * 0.4);
    fig.root.rotation.y = Math.PI / 2 - 0.3;
    g.scene.add(fig.root);
    men.push({ fig, pose: i % 3, at: 0.6 + i * 0.35 });
  });
  const dust = new Puffs(sh, 80, { lit: "#d8c8b0", shade: "#6a5a4a", outline: 0.1, hatch: 0.3, lineSpacing: 4, soft: 0.6, rough: 0.4 });
  g.scene.add(dust.mesh);
  return (f: number, t: number) => {
    const k = Math.min(1, f / 75);
    const e = k * k * (3 - 2 * k);
    const ang = 0.6 + e * 0.5; // from 34 deg to 63 deg above horizontal
    pivot.rotation.z = -(Math.PI / 2 - ang);
    men.forEach(({ fig, pose }, i) => {
      const P = raisePoses(e)[pose];
      fig.pose({ ...P, lSh: [P.lSh![0] + Math.sin(t * 2 + i) * 0.05, P.lSh![1], 0] });
    });
    const d: Puff[] = [];
    emit({ at: [-1, -0.1, 0.5], rate: 8, life: 3, vel: [2, 0.4, 0], spread: 0.5, size: [0.3, 1.8], drag: 0.5, alpha: 0.4, seed: 3, prewarm: 3, jitter: [2, 0, 1] }, t, d);
    dust.set(d, g.camera);
    driveCamera(g, [{ f: 0, pos: [-1, 0.2, 9.5], look: [-0.5, 2.6, 0], fov: 42 }, { f: 75, pos: [-0.4, 0.1, 8.6], look: [-0.3, 2.8, 0], fov: 42 }], f, 0.005, 64);
  };
};

const shot = (setup: (g: GL) => (f: number, t: number) => void) => {
  const C: React.FC = () => <GLShot setup={setup} />;
  return <C />;
};

export const greatest: SceneDef = {
  id: "greatest",
  seedBase: 60,
  shots: [
    { from: 0, dur: c(2.5), el: shot(landingSetup), enter: "whip", name: "landing craft" },
    { from: c(2.5), dur: c(4) - c(2.5), el: shot(beachSetup), enter: "burn", origin: [1600, 900], name: "hedgehogs" },
    { from: c(4), dur: c(5.5) - c(4), el: shot(helmetSetup), enter: "ink", origin: [1000, 700], name: "helmet" },
    { from: c(5.5), dur: c(7.5) - c(5.5), el: shot(fighterSetup), enter: "whip", name: "fighters" },
    { from: c(7.5), dur: c(10) - c(7.5), el: shot(raisingSetup), enter: "morph", name: "flag raising" },
  ],
  hits: [
    { f: c(0.5) + 6, amp: 30, dur: 18, punch: 0.04 },
    { f: 36, amp: 14, dur: 10 },
    { f: 51, amp: 14, dur: 10 },
    { f: c(3), amp: 20, dur: 14, punch: 0.02 },
    { f: c(5.5) + 44, amp: 26, dur: 16, punch: 0.03 },
    { f: c(7.5), amp: 12, dur: 12 },
  ],
  flashes: [{ f: c(3), dur: 8, color: "#ffd9a0", peak: 0.6 }],
  Overlay: () => (
    <>
      <YearSlam text="1944" startFrame={c(0.5) + 1} fontSize={300} display scrim={0.75} exitAt={c(1.3)} />
      <Quote {...QUOTES.eisenhower} start={c(4) + 3} end={c(7.5) + 8} framesPerWord={3} />
    </>
  ),
};
