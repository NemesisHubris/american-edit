// 5. AMERICAN INGENUITY — "1869". The locomotive charges at camera; the golden
// spike is hammered home; a filament glows to a flare; the Wright Flyer lifts
// off the dunes and banks past; a Model T rolls down the line; water thunders
// through Hoover Dam; the Golden Gate emerges as fog rolls away; the Empire
// State Building rises floor by floor. Inventions morph blueprint -> engraving.
import * as THREE from "three";
import { YearSlam } from "../components/YearSlam";
import { Quote } from "../components/WordPop";
import { QUOTES } from "../quotes";
import { sceneClock } from "../timeline";
import { hash, rng } from "../lib/random";
import { GLShot, GL, driveCamera, drawIn } from "../gl/GLShot";
import { makeSky } from "../gl/sky";
import { makeLoco, makeTrack, makePoles, spikeGeo, bulbGeo, flyerGeo, propGeo, modelTGeo, damGeo, ggTowerGeo, esbLevels } from "../gl/models/industry";
import { makeGround, makeWater, makeReeds } from "../gl/env";
import { makeFigure } from "../gl/figure";
import { box, cyl, merge, terrain, tube } from "../gl/geo";
import { fbm2, ridged2 } from "../gl/noise";
import { emit, glassMaterial, Glows, Puff, Puffs, Smoke } from "../gl/particles";
import type { SceneDef } from "./types";

const c = sceneClock("ingenuity");
const SPIKE_HITS = [c(2.5) - c(2), c(3) - c(2)];

const blueprint = (g: GL, f: number, a: number, b: number) => {
  const u = g.post.uniforms;
  const p = Math.min(1, Math.max(0, (f - a) / (b - a)));
  u.uBlue.value = p < 1 ? 1 : 0;
  u.uBlueSweep.value = p;
};

// A. The locomotive charges at the camera
const locoSetup = (g: GL) => {
  const sh = g.shared;
  sh.uSunDir.value.set(-0.6, 0.35, 0.7).normalize();
  sh.uSunCol.value.set(1.15, 0.95, 0.72);
  sh.uSky.value.set(0.5, 0.52, 0.58);
  sh.uGround.value.set(0.32, 0.28, 0.22);
  g.camera.far = 3000;
  const sky = makeSky(sh, { top: "#6f86a8", horizon: "#ecd6b0", bottom: "#a8987a", glow: 0.7, rays: 0.5, lines: 0.7, lineSpacing: 4, clouds: 0.35, cloudSpeed: 0.04, cloudCol: "#fbf1dc", cloudShade: "#948a80", paper: 0.25 });
  g.scene.add(sky.mesh);
  g.setPost({ fog: [120, 1500, 0.55], fogCol: "#e6d6b6" });
  const prairie = makeGround(g, { size: 4000, res: 200, y: 0, amp: 30, freq: 0.002, color: "#a09060", flat: (x) => Math.min(1, Math.abs(x) / 80), mat: { mode: "stipple", hatch: 0.8 } });
  g.scene.add(prairie.mesh);
  const mesas = makeGround(g, { size: 6000, res: 120, y: -40, amp: 260, freq: 0.0012, color: "#b08a64", flat: (x, z) => (z < -1200 ? 1 : 0) });
  g.scene.add(mesas.mesh);
  const track = makeTrack(g, 900);
  g.scene.add(track.group);
  const poles = makePoles(g, 50, 18, 6);
  g.scene.add(poles.group);
  const loco = makeLoco(g);
  g.scene.add(loco.group);
  const smoke = new Smoke(g, 400, { color: "#7a746e", heatCol: "#ff9a3c", hatch: 1, inkDark: 0.15 });
  g.scene.add(smoke.mesh);
  const steam = new Puffs(sh, 200, { lit: "#ffffff", shade: "#c8c4bc", outline: 0.2, hatch: 0.3, lineSpacing: 4, soft: 0.4, rough: 0.35 });
  g.scene.add(steam.mesh);
  const lamp = new Glows(sh, 3, "#ffe7a8", 1.4);
  g.scene.add(lamp.mesh);
  g.enableShadows(2048, 30, 80);
  return (f: number, t: number) => {
    const speed = 26;
    const z = -52 + t * speed;
    loco.group.position.z = z;
    loco.update(z);
    if (g.shadow) g.shadow.center.set(0, 2, z);
    // low camera beside the rails; the engine rushes toward and past
    driveCamera(g, [{ f: 0, pos: [3.4, 1.0, 8], look: [0, 2.6, -30], fov: 48 }, { f: 60, pos: [4.2, 0.9, 7], look: [-0.5, 2.4, -2], fov: 56 }], f, 0.02, 51);
    const sm: Puff[] = [];
    // chimney smoke streams backward from the moving stack
    for (let i = 0; i < 80; i++) {
      const age = (i / 80) * 3;
      const bz = z + 4.2 - age * speed * 0.7;
      sm.push({ x: Math.sin(i * 1.7) * 0.4 * age + age * 1.5, y: 4.4 + age * 2.8 + Math.sin(i) * 0.3, z: bz, size: 0.7 + age * 1.6, alpha: Math.max(0, 1 - age / 3), seed: i * 0.37 });
    }
    smoke.set(sm);
    const st: Puff[] = [];
    emit({ at: [1.1, 1.3, z + 3.6], rate: 30, life: 1, vel: [4, 0.5, -3], spread: 1, size: [0.3, 1.6], drag: 1.2, alpha: 0.8, seed: 5, prewarm: 1 }, t, st);
    emit({ at: [-1.1, 1.3, z + 3.6], rate: 30, life: 1, vel: [-4, 0.5, -3], spread: 1, size: [0.3, 1.6], drag: 1.2, alpha: 0.8, seed: 6, prewarm: 1 }, t, st);
    steam.set(st, g.camera);
    const hl = loco.group.localToWorld(loco.headlamp.clone());
    lamp.set([{ x: hl.x, y: hl.y, z: hl.z + 0.2, size: 1.2, alpha: 0.9 }, { x: hl.x, y: hl.y, z: hl.z + 0.3, size: 4, alpha: 0.25 }], g.camera);
  };
};

// B. The golden spike hammered home on the beats, sparks flying
const spikeSetup = (g: GL) => {
  const sh = g.shared;
  sh.uSunDir.value.set(0.5, 0.6, 0.5).normalize();
  sh.uSunCol.value.set(1.2, 1.0, 0.8);
  sh.uSky.value.set(0.45, 0.45, 0.5);
  sh.uGround.value.set(0.3, 0.26, 0.2);
  g.camera.near = 0.02;
  g.camera.far = 200;
  const sky = makeSky(sh, { top: "#8a9ab0", horizon: "#eadcc0", bottom: "#a8987a", glow: 0.5, lines: 0.6, lineSpacing: 4, paper: 0.3 });
  g.scene.add(sky.mesh);
  g.setPost({ fog: [6, 60, 0.6], fogCol: "#e2d4b8" });
  const S = spikeGeo();
  const iron = g.ink({ color: "#6a6660", mode: "screen", angle: 20, scale: 3.5, spec: 0.8, gloss: 30 });
  const gold = g.ink({ color: "#e0b040", mode: "screen", angle: 60, scale: 3.5, spec: 2, gloss: 60, rim: 1, rimCol: "#fff0b0" });
  const tieM = g.ink({ color: "#6a5238", mode: "screen", angle: 5, scale: 3.5, cross: 0.6, frag: "extraInk += step(0.7, tvn(vec2(vWorld.x * 2.0, vWorld.z * 30.0))) * 0.4;" });
  g.scene.add(new THREE.Mesh(S.tie, tieM));
  const railL = new THREE.Mesh(S.rail, iron);
  railL.position.x = -0.72;
  const railR = new THREE.Mesh(S.rail, iron);
  railR.position.x = 0.72;
  g.scene.add(railL, railR, new THREE.Mesh(S.plate, iron));
  const spike = new THREE.Mesh(S.spike, gold);
  spike.position.set(0.95, 0, 0);
  g.scene.add(spike);
  const ground = makeGround(g, { size: 300, res: 60, y: -0.2, amp: 0.3, freq: 0.1, color: "#9a8a6a", mat: { mode: "stipple", hatch: 0.8 } });
  g.scene.add(ground.mesh);
  // the man swinging the maul
  const man = makeFigure(g, "frock", { color: { coat: "#3a3028", hat: "#1e1a16" } });
  man.root.position.set(1.05, -0.2, -0.75);
  man.root.rotation.y = -0.25;
  g.scene.add(man.root);
  const maul = new THREE.Mesh(S.maul, iron);
  man.j.rHand.add(maul);
  maul.position.set(0, -0.08, 0);
  // crowd of onlookers behind, a second locomotive's pilot in the back
  const r = rng("spikecrowd");
  for (let i = 0; i < 8; i++) {
    const f2 = makeFigure(g, i % 3 ? "frock" : "worker", { color: { coat: ["#2e2a26", "#3a3a44", "#4a3c30"][i % 3] } });
    f2.root.position.set(-2 + r() * 5, -0.2, -3.5 - r() * 3);
    f2.root.rotation.y = r() * 0.8 - 0.4;
    f2.pose({ lSh: [0.1, 0.15, 0], rSh: [i % 2 ? 2.6 : 0.1, 0.2, 0], rEl: 0.2 });
    g.scene.add(f2.root);
  }
  const sparks = new Glows(sh, 300, "#ffd070", 1.4);
  g.scene.add(sparks.mesh);
  const flash = new Glows(sh, 4, "#fff0c0", 1);
  g.scene.add(flash.mesh);
  return (f: number, t: number) => {
    // swing cycle keyed to the hits
    let sink = 0;
    let swing = 0;
    let lastHit = -1;
    SPIKE_HITS.forEach((h, i) => {
      if (f >= h) {
        sink = (i + 1) * 0.05;
        lastHit = h;
      }
      const d = (f - (h - 12)) / 12;
      if (d >= 0 && d <= 1) swing = d;
    });
    const up = swing > 0 ? Math.sin(swing * Math.PI * 0.5) : 0;
    const raise = swing > 0 ? 1 - up : 0.7 + Math.sin(t * 3) * 0.05;
    man.pose({ bend: 0.3 + (1 - raise) * 0.3, rSh: [0.4 + raise * 2.6, 0.2, 0], lSh: [0.4 + raise * 2.4, 0.25, 0], rEl: 0.2, lEl: 0.3, lHip: [0.2, 0.15], rHip: [-0.1, 0.1], lKn: 0.25, rKn: 0.15 });
    maul.rotation.x = -0.6 + raise * 0.4;
    spike.position.y = 0.12 - sink;
    const a = lastHit >= 0 ? (f - lastHit) / 30 : -1;
    const sp: Puff[] = [];
    if (a >= 0 && a < 0.6)
      for (let i = 0; i < 120; i++) {
        const age = a - hash(i, lastHit) * 0.04;
        if (age < 0) continue;
        const ang = hash(i, lastHit, 2) * Math.PI * 2;
        const v = 1.5 + hash(i, lastHit, 3) * 3;
        sp.push({ x: 0.95 + Math.cos(ang) * v * age, y: 0.3 + (1.5 + hash(i, lastHit, 4) * 3) * age - 4.9 * age * age, z: Math.sin(ang) * v * age, size: 0.012, alpha: 1 - age / 0.6, stretch: 5 });
      }
    sparks.set(sp, g.camera);
    flash.set(a >= 0 && a < 0.12 ? [{ x: 0.95, y: 0.35, z: 0, size: 0.8 * (1 - a / 0.12), alpha: 1 }] : [], g.camera);
    driveCamera(g, [{ f: 0, pos: [-0.4, 0.5, 2.8], look: [0.9, 0.8, -0.4], fov: 42 }, { f: 45, pos: [-0.1, 0.45, 2.4], look: [0.95, 0.7, -0.4], fov: 40 }], f, 0.004, 52);
  };
};

// C. Edison's lamp: blueprint -> engraving, filament brightens to a flare
const bulbSetup = (g: GL) => {
  const sh = g.shared;
  sh.uSunDir.value.set(-0.5, 0.6, 0.6).normalize();
  sh.uSunCol.value.set(0.6, 0.55, 0.5);
  sh.uSky.value.set(0.15, 0.14, 0.14);
  sh.uGround.value.set(0.08, 0.07, 0.06);
  g.camera.near = 0.005;
  g.camera.far = 20;
  const sky = makeSky(sh, { top: "#1a1612", horizon: "#241d16", bottom: "#1a1612", glow: 0, lines: 0.5, lineSpacing: 4, paper: 0 });
  g.scene.add(sky.mesh);
  const B = bulbGeo();
  const glassM = glassMaterial(g.shared, "#d8ecff", 1.2);
  const brassM = g.ink({ color: "#b9913e", mode: "screen", angle: 30, scale: 3.5, spec: 1.4, gloss: 40 });
  const filM = g.ink({ color: "#2a2016", hatch: 0.2, uniforms: { uGlow: { value: 0 } }, fragDecl: "uniform float uGlow;", frag: "emis += vec3(1.6, 1.1, 0.5) * uGlow * 2.0; albedo = mix(albedo, vec3(1.0, 0.8, 0.4), uGlow);" });
  const bulb = new THREE.Group();
  bulb.add(new THREE.Mesh(B.glass, glassM), new THREE.Mesh(B.base, brassM), new THREE.Mesh(B.stem, glassM), new THREE.Mesh(B.filament, filM));
  g.scene.add(bulb);
  const bench = new THREE.Mesh(box(1, 0.02, 0.6, 0, -0.01, 0), g.ink({ color: "#5a4030", mode: "screen", angle: 8, scale: 3.5 }));
  g.scene.add(bench);
  const halo = new Glows(sh, 6, "#ffcf7a", 1.2);
  g.scene.add(halo.mesh);
  return (f: number, t: number) => {
    blueprint(g, f, 4, 22);
    const glow = Math.min(1, Math.max(0, (f - 20) / 20)) * (0.9 + 0.1 * Math.sin(t * 40));
    const flare = Math.max(0, (f - 38) / 7);
    (glassM.uniforms.uGlow as THREE.IUniform).value = glow;
    (filM.uniforms.uGlow as THREE.IUniform).value = glow;
    sh.uPL0.value.set(0, 0.12, 0, 0.8);
    sh.uPLc0.value.setRGB(glow * 2, glow * 1.5, glow * 0.8);
    halo.set(glow > 0 ? [{ x: 0, y: 0.12, z: 0, size: 0.05 + glow * 0.06 + flare * 0.3, alpha: 0.6 + flare }, { x: 0, y: 0.12, z: 0, size: 0.25 + flare * 1.5, alpha: 0.25 * glow + flare * 0.8 }] : [], g.camera);
    bulb.rotation.y = t * 0.3;
    driveCamera(g, [{ f: 0, pos: [0.2, 0.14, 0.42], look: [0, 0.09, 0], fov: 36 }, { f: 45, pos: [0.13, 0.12, 0.33], look: [0, 0.095, 0], fov: 36 }], f, 0.0006, 53);
  };
};

// D. The Wright Flyer lifts off the dunes and banks past the camera
const flyerSetup = (g: GL) => {
  const sh = g.shared;
  sh.uSunDir.value.set(0.4, 0.55, 0.6).normalize();
  sh.uSunCol.value.set(1.2, 1.1, 0.95);
  sh.uSky.value.set(0.5, 0.55, 0.65);
  sh.uGround.value.set(0.35, 0.32, 0.26);
  g.camera.far = 3000;
  const sky = makeSky(sh, { top: "#6e8fbd", horizon: "#e6e2d4", bottom: "#b0a488", glow: 0.5, lines: 0.7, lineSpacing: 4, clouds: 0.4, cloudSpeed: 0.08, cloudCol: "#ffffff", cloudShade: "#9ca4ae", paper: 0.25 });
  g.scene.add(sky.mesh);
  g.setPost({ fog: [120, 1500, 0.5], fogCol: "#e8e2d2" });
  const dunes = new THREE.Mesh(terrain(1200, 1200, 220, 220, (x, z) => (fbm2(x * 0.01, z * 0.004, 4, 3) - 0.5) * 18 + Math.max(0, -z - 40) * 0.08 + Math.sin(x * 0.05 + z * 0.01) * 1.5), g.ink({ color: "#d8c49a", mode: "stipple", hatch: 0.9 }));
  g.scene.add(dunes);
  const sea = makeWater(g, { w: 3000, d: 1200, res: 120, y: -6, color: "#6a7c88", sky: "#d8dde2", amp: 0.3, freq: 0.1, lineSpacing: 4 });
  sea.mesh.position.set(0, -6, -900);
  g.scene.add(sea.mesh);
  const grass = makeReeds(g, { count: 3000, x: [-60, 60], z: [-40, 30], y: (x, z) => (fbm2(x * 0.01, z * 0.004, 4, 3) - 0.5) * 18 + Math.max(0, -z - 40) * 0.08 + Math.sin(x * 0.05 + z * 0.01) * 1.5, h: [0.3, 0.9], w: 0.02, color: "#8a8a50", seed: "dune", sway: 0.4, wind: 2.5, edges: 0 });
  g.scene.add(grass.mesh);
  const F = flyerGeo();
  const cloth = g.ink({ color: "#efe6d2", mode: "screen", angle: 5, scale: 3.5, side: THREE.DoubleSide, rim: 0.5, frag: "extraInk += step(0.92, fract(vObj.x * 1.6)) * 0.5;" });
  const woodM = g.ink({ color: "#8a7050", mode: "screen", angle: 70, scale: 3.5 });
  const flyer = new THREE.Group();
  flyer.add(new THREE.Mesh(F.wings, cloth), new THREE.Mesh(F.canard, cloth), new THREE.Mesh(F.rudder, cloth), new THREE.Mesh(F.struts, woodM));
  const props = [1, -1].map((s) => {
    const p = new THREE.Mesh(propGeo(), woodM);
    p.position.set(s * 1.8, 1.8, -1.1);
    flyer.add(p);
    return p;
  });
  const pilot = makeFigure(g, "frock", { scale: 0.95, color: { coat: "#2a2622", hat: "#2a2622" } });
  pilot.root.position.set(-0.3, 0.95, 0);
  pilot.root.rotation.x = -Math.PI / 2;
  pilot.pose({ lSh: [2.8, 0.1, 0], rSh: [2.8, 0.1, 0] });
  flyer.add(pilot.root);
  g.scene.add(flyer);
  // Wilbur running alongside
  const runner = makeFigure(g, "frock", { color: { coat: "#2e2a26" } });
  g.scene.add(runner.root);
  const sand = new Puffs(sh, 120, { lit: "#f0e2c0", shade: "#b8a47c", outline: 0.2, hatch: 0.3, lineSpacing: 4, soft: 0.4, rough: 0.4 });
  g.scene.add(sand.mesh);
  return (f: number, t: number) => {
    blueprint(g, f, 2, 18);
    const T = t;
    const z = -30 + T * 12;
    const lift = Math.max(0, T - 0.6);
    const y = 0.3 + lift * lift * 3.2;
    const bank = Math.min(0.5, lift * 0.35);
    flyer.position.set(-lift * lift * 2.5, y, z);
    flyer.rotation.set(-0.05 - Math.min(0.12, lift * 0.1), -lift * 0.25, bank);
    props.forEach((p, i) => (p.rotation.z = t * 40 * (i ? 1 : -1)));
    runner.root.position.set(4, 0, z - 1 - Math.max(0, T - 0.8) * 3);
    const ph = t * 9;
    runner.pose({ bend: 0.25, lHip: [Math.sin(ph) * 0.7, 0.05], rHip: [-Math.sin(ph) * 0.7, 0.05], lKn: Math.max(0, -Math.sin(ph)) * 1.2, rKn: Math.max(0, Math.sin(ph)) * 1.2, lSh: [-Math.sin(ph) * 0.6, 0.15, 0], rSh: [Math.sin(ph) * 0.6 + 0.4, 0.15, 0], lEl: 1.2, rEl: 1.2 });
    const sd: Puff[] = [];
    emit({ at: [0, 0.2, z - 2], rate: 40, life: 1.2, vel: [0, 0.8, -5], spread: 1.5, size: [0.3, 1.5], drag: 1.5, alpha: 0.7 * Math.max(0, 1 - lift), seed: 7 }, t, sd);
    sand.set(sd, g.camera);
    const fp = flyer.position;
    driveCamera(g, [{ f: 0, pos: [fp.x + 9, fp.y + 1.2, fp.z + 9], look: [fp.x, fp.y + 1.2, fp.z], fov: 46 }, { f: 60, pos: [fp.x + 7, fp.y + 0.2, fp.z + 8], look: [fp.x, fp.y + 1.6, fp.z], fov: 48 }], f, 0.01, 54);
  };
};

// E. A Model T rolls down the assembly line; welding sparks, hoists
const modelTSetup = (g: GL) => {
  const sh = g.shared;
  sh.uSunDir.value.set(-0.3, 0.8, 0.4).normalize();
  sh.uSunCol.value.set(1.0, 0.95, 0.85);
  sh.uSky.value.set(0.35, 0.34, 0.33);
  sh.uGround.value.set(0.2, 0.18, 0.16);
  g.camera.far = 400;
  const sky = makeSky(sh, { top: "#2a2622", horizon: "#3a342c", bottom: "#2a2622", glow: 0, lines: 0.5, lineSpacing: 4, paper: 0 });
  g.scene.add(sky.mesh);
  g.setPost({ fog: [15, 90, 0.6], fogCol: "#b8ab94" });
  // factory: floor, sawtooth roof trusses, columns, skylight beams
  const steel = g.ink({ color: "#5a5a5c", mode: "screen", angle: 70, scale: 3.5, instanced: true });
  const floor = new THREE.Mesh(box(60, 0.2, 200, 0, -0.1, -60), g.ink({ color: "#7a7266", mode: "stipple", hatch: 0.8 }));
  g.scene.add(floor);
  const colG = merge([box(0.4, 9, 0.4, 0, 4.5, 0), box(0.8, 0.3, 0.8, 0, 0.15, 0)]);
  const cols = new THREE.InstancedMesh(colG, steel, 40);
  for (let i = 0; i < 20; i++) {
    cols.setMatrixAt(i * 2, new THREE.Matrix4().makeTranslation(-8, 0, 10 - i * 8));
    cols.setMatrixAt(i * 2 + 1, new THREE.Matrix4().makeTranslation(8, 0, 10 - i * 8));
  }
  cols.frustumCulled = false;
  g.scene.add(cols);
  const truss = merge([box(17, 0.4, 0.3, 0, 9, 0), tube([new THREE.Vector3(-8, 9, 0), new THREE.Vector3(0, 12, 0), new THREE.Vector3(8, 9, 0)], 0.15, 8, 5)]);
  const trusses = new THREE.InstancedMesh(truss, steel, 20);
  for (let i = 0; i < 20; i++) trusses.setMatrixAt(i, new THREE.Matrix4().makeTranslation(0, 0, 10 - i * 8));
  trusses.frustumCulled = false;
  g.scene.add(trusses);
  // conveyor line
  const lineM = g.ink({ color: "#4a4238", mode: "screen", angle: 0, scale: 3.5, frag: "extraInk += step(0.9, fract(vWorld.z * 2.0 - uTime * 1.2)) * 0.5;" });
  g.scene.add(new THREE.Mesh(box(2.4, 0.5, 200, 0, 0.25, -60), lineM));
  // cars in stages of assembly
  const T = modelTGeo();
  const black = g.ink({ color: "#1c1c1e", mode: "screen", angle: 30, scale: 3.5, spec: 1.2, gloss: 40, rim: 0.7 });
  const brassM = g.ink({ color: "#c8973c", mode: "screen", angle: 40, scale: 3.5, spec: 1.5, gloss: 50 });
  const wheelM = g.ink({ color: "#3a2e22", mode: "screen", angle: 60, scale: 3.5 });
  const cars: THREE.Group[] = [];
  for (let i = 0; i < 7; i++) {
    const car = new THREE.Group();
    car.add(new THREE.Mesh(T.body, black), new THREE.Mesh(T.brass, brassM));
    for (const [x, z] of [
      [0.75, 1.3],
      [-0.75, 1.3],
      [0.75, -0.9],
      [-0.75, -0.9],
    ]) {
      const w = new THREE.Mesh(T.wheel, wheelM);
      w.position.set(x, 0.45, z);
      w.scale.setScalar(0.9);
      car.add(w);
    }
    car.position.set(0, 0.5, -i * 7);
    g.scene.add(car);
    cars.push(car);
  }
  // workers
  const workers: { fig: ReturnType<typeof makeFigure>; ph: number }[] = [];
  for (let i = 0; i < 8; i++) {
    const fig = makeFigure(g, "worker", { color: { coat: "#3e4a5a", pants: "#2e3440" } });
    const s = i % 2 ? 1 : -1;
    fig.root.position.set(s * 2.2, 0, -2 - Math.floor(i / 2) * 7);
    fig.root.rotation.y = s > 0 ? -Math.PI / 2 : Math.PI / 2;
    g.scene.add(fig.root);
    workers.push({ fig, ph: i * 0.9 });
  }
  const sparks = new Glows(sh, 300, "#ffd080", 1.4);
  g.scene.add(sparks.mesh);
  const beams = new Glows(sh, 10, "#fff2d8", 0.1);
  g.scene.add(beams.mesh);
  const haze = new Puffs(sh, 80, { lit: "#e8e0d0", shade: "#a8a090", outline: 0.1, hatch: 0.2, lineSpacing: 4, soft: 0.6, rough: 0.3 });
  g.scene.add(haze.mesh);
  return (f: number, t: number) => {
    blueprint(g, f, 2, 16);
    cars.forEach((car, i) => (car.position.z = -i * 7 + t * 1.6));
    workers.forEach(({ fig, ph }) => {
      const s = Math.sin(t * 5 + ph);
      fig.pose({ bend: 0.45 + s * 0.08, lSh: [1.2 + s * 0.2, 0.2, 0], rSh: [1.4 - s * 0.3, 0.25, 0], lEl: 1.0, rEl: 0.8 + s * 0.3, lHip: [0.35, 0.12], rHip: [0.2, 0.12], lKn: 0.4, rKn: 0.3, crouch: 0.1 });
    });
    const sp: Puff[] = [];
    for (let k = 0; k < 3; k++) {
      const ox = k % 2 ? 1.3 : -1.3;
      const oz = -2 - k * 7 + 0.6;
      for (let i = 0; i < 50; i++) {
        const born = (Math.floor(t * 12) - (i % 12)) / 12;
        const age = t - born - hash(i, k) * 0.05;
        if (age < 0 || age > 0.5) continue;
        const a = hash(i, k, Math.floor(born * 12)) * Math.PI * 2;
        const v = 1 + hash(i, k, 3) * 2.5;
        sp.push({ x: ox + Math.cos(a) * v * age, y: 1.1 + v * 0.6 * age - 4.9 * age * age, z: oz + Math.sin(a) * v * age, size: 0.02, alpha: 1 - age / 0.5, stretch: 3 });
      }
    }
    sparks.set(sp, g.camera);
    const hz: Puff[] = [];
    for (let i = 0; i < 60; i++) hz.push({ x: (hash(i, 1) - 0.5) * 14, y: 4 + hash(i, 2) * 5, z: 10 - hash(i, 3) * 80 + ((t * 0.5) % 4), size: 2 + hash(i, 4) * 3, alpha: 0.15, seed: i });
    haze.set(hz, g.camera);
    driveCamera(g, [{ f: 0, pos: [3.4, 2.4, 6], look: [0, 1.2, -6], fov: 46 }, { f: 45, pos: [2.8, 2.0, 4.6], look: [0, 1.1, -4], fov: 46 }], f, 0.006, 55);
  };
};

// F. Water thundering through Hoover Dam; spray and mist
const damSetup = (g: GL) => {
  const sh = g.shared;
  sh.uSunDir.value.set(0.5, 0.55, 0.65).normalize();
  sh.uSunCol.value.set(1.2, 1.05, 0.85);
  sh.uSky.value.set(0.5, 0.55, 0.65);
  sh.uGround.value.set(0.35, 0.3, 0.25);
  g.camera.far = 5000;
  const sky = makeSky(sh, { top: "#5d82b8", horizon: "#e6dcc6", bottom: "#a88a6a", glow: 0.6, lines: 0.7, lineSpacing: 4, clouds: 0.25, cloudSpeed: 0.04, cloudCol: "#fffaf0", cloudShade: "#a0a0a8", paper: 0.2 });
  g.scene.add(sky.mesh);
  g.setPost({ fog: [400, 3500, 0.5], fogCol: "#e6dcc8" });
  const D = damGeo();
  const conc = g.ink({ color: "#d9d2c2", mode: "screen", angle: 80, scale: 3.5, cross: 0.6, side: THREE.DoubleSide, shade: 1, frag: "float hj = 1.0 - smoothstep(0.0, 0.06, abs(fract(vWorld.y / 5.0) - 0.5) * 2.0 - 0.9); float vj = 1.0 - smoothstep(0.0, 0.05, abs(fract(atan(vWorld.x, vWorld.z + 180.0) * 60.0) - 0.5) * 2.0 - 0.92); extraInk += max(hj, vj) * 0.45 + 0.12; albedo *= 0.82 + tvn(vWorld.xy * vec2(0.08, 0.02)) * 0.3; albedo *= 1.0 - smoothstep(0.55, 0.9, tvn(vec2(vWorld.x * 0.1, vWorld.y * 0.01))) * 0.25;" });
  const dam = new THREE.Group();
  dam.add(new THREE.Mesh(D.face, conc), new THREE.Mesh(D.extra, conc));
  g.scene.add(dam);
  // Black Canyon walls
  const rock = g.ink({ color: "#9a6a4a", mode: "screen", angle: 70, scale: 3.5, cross: 0.7, shade: 1 });
  for (const s of [-1, 1]) {
    const wall = new THREE.Mesh(
      terrain(700, 1600, 160, 300, (x, z) => ridged2(x * 0.01, z * 0.006, 5, s > 0 ? 3 : 4) * 90 + (fbm2(x * 0.03, z * 0.03, 3, 5) - 0.5) * 20 + Math.max(0, x * s * -1 + 0) * 0),
      rock,
    );
    wall.rotation.z = (s * Math.PI) / 2;
    wall.position.set(s * 250, 120, 300);
    g.scene.add(wall);
  }
  const river = makeWater(g, { w: 400, d: 2000, res: 160, y: 2, color: "#3a6a70", sky: "#c8d8dc", amp: 0.8, freq: 0.08, speed: 2, lineSpacing: 4 });
  river.mesh.position.set(0, 2, 900);
  g.scene.add(river.mesh);
  // spillway jets: water arcs from the outlet works + roaring mist
  const water = new Puffs(sh, 700, { lit: "#ffffff", shade: "#b8c8cc", outline: 0.15, hatch: 0.25, lineSpacing: 4, soft: 0.55, rough: 0.45 });
  g.scene.add(water.mesh);
  const mist = new Puffs(sh, 200, { lit: "#ffffff", shade: "#c8d0d0", outline: 0.1, hatch: 0.25, lineSpacing: 4, soft: 0.7, rough: 0.35 });
  g.scene.add(mist.mesh);
  return (f: number, t: number) => {
    const wl: Puff[] = [];
    for (const s of [-1, 1])
      for (let j = 0; j < 4; j++) {
        const ox = s * (150 + j * 14);
        for (let i = 0; i < 80; i++) {
          const u = ((i / 80 + t * 0.9) % 1) * 1.6;
          wl.push({ x: ox - s * u * 30, y: 50 + j * 4 + u * 30 - 42 * u * u, z: 250 + u * 60, size: 5 + u * 9, alpha: 0.95 - u * 0.4, seed: i * 0.3 + j });
        }
      }
    water.set(wl, g.camera);
    const ms: Puff[] = [];
    emit({ at: [0, 4, 320], rate: 24, life: 4, vel: [0, 5, 10], spread: 5, size: [5, 18], drag: 0.6, alpha: 0.8, seed: 3, prewarm: 4, jitter: [120, 3, 20] }, t, ms);
    mist.set(ms, g.camera);
    driveCamera(g, [{ f: 0, pos: [-80, 50, 720], look: [0, 100, 100], fov: 50 }, { f: 60, pos: [-40, 70, 640], look: [0, 110, 100], fov: 50 }], f, 0.01, 56);
    drawIn([conc], f, -10, 20, 0.3);
  };
};

// G. The Golden Gate emerges as the fog rolls away
const bridgeSetup = (g: GL) => {
  const sh = g.shared;
  sh.uSunDir.value.set(-0.6, 0.35, 0.7).normalize();
  sh.uSunCol.value.set(1.25, 1.0, 0.8);
  sh.uSky.value.set(0.5, 0.52, 0.6);
  sh.uGround.value.set(0.3, 0.28, 0.25);
  g.camera.far = 8000;
  const sky = makeSky(sh, { top: "#6d8cb8", horizon: "#f2dcc0", bottom: "#8a8a90", glow: 0.8, rays: 0.6, lines: 0.7, lineSpacing: 4, clouds: 0.2, cloudSpeed: 0.05, cloudCol: "#fff6ea", cloudShade: "#a0a0a8", paper: 0.2 });
  g.scene.add(sky.mesh);
  g.setPost({ fog: [600, 6000, 0.45], fogCol: "#ece2d2" });
  const T = ggTowerGeo();
  const orange = g.ink({ color: "#c0472c", mode: "screen", angle: 80, scale: 3.5, cross: 0.6, rim: 0.4 });
  const towers = [-640, 640].map((x) => {
    const m = new THREE.Mesh(T.tower, orange);
    m.position.set(x, 0, 0);
    g.scene.add(m);
    return m;
  });
  // main cables (catenary) + suspenders + deck
  const cable = (sz: number) => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 80; i++) {
      const x = -1400 + (i / 80) * 2800;
      const inSpan = Math.abs(x) <= 640;
      const y = inSpan ? 70 + ((x / 640) ** 2) * (T.H - 70) : T.H - ((Math.abs(x) - 640) / 760) * (T.H - 20);
      pts.push(new THREE.Vector3(x, y, sz));
    }
    return tube(pts, 1.2, 200, 8);
  };
  const deckG = merge([box(2800, 8, 27, 0, 66, 0), cable(-14), cable(14)]);
  const susp: THREE.BufferGeometry[] = [];
  for (let x = -620; x <= 620; x += 16) {
    const y = 70 + ((x / 640) ** 2) * (T.H - 70);
    for (const sz of [-14, 14]) susp.push(cyl(0.25, 0.25, y - 70, 4, x, (y + 70) / 2, sz));
  }
  g.scene.add(new THREE.Mesh(deckG, orange), new THREE.Mesh(merge(susp), orange));
  // headlands
  const land = g.ink({ color: "#7a7a58", mode: "stipple", hatch: 0.8 });
  for (const s of [-1, 1]) {
    const hl = new THREE.Mesh(terrain(1600, 1600, 120, 120, (x, z) => Math.max(0, 1 - Math.hypot(x, z) / 700) * 260 * (0.6 + fbm2(x * 0.004, z * 0.004, 4, s > 0 ? 3 : 4) * 0.8) - 20), land);
    hl.position.set(s * 1500, 0, 100);
    g.scene.add(hl);
  }
  const bay = makeWater(g, { w: 8000, d: 8000, res: 200, y: 0, color: "#4a6a7a", sky: "#d8dde4", amp: 0.6, freq: 0.05, lineSpacing: 4 });
  g.scene.add(bay.mesh);
  const fog = new Puffs(sh, 300, { lit: "#fdfaf4", shade: "#d8d2c8", outline: 0.12, hatch: 0.3, lineSpacing: 4, soft: 0.7, rough: 0.3 });
  g.scene.add(fog.mesh);
  return (f: number, t: number) => {
    const fl: Puff[] = [];
    for (let i = 0; i < 260; i++) {
      const x = -1500 + hash(i, 1) * 3000 - t * 120;
      const z = -300 + hash(i, 2) * 600 - t * 20;
      const thin = Math.min(1, t / 1.8);
      const y = 10 + hash(i, 3) * 150;
      fl.push({ x, y, z, size: (70 + hash(i, 4) * 80) * (1 - thin * 0.5), alpha: 0.9 * (1 - thin * 0.9), seed: hash(i, 5) * 9 });
    }
    fog.set(fl, g.camera);
    driveCamera(g, [{ f: 0, pos: [-1300, 60, 900], look: [0, 130, 0], fov: 38 }, { f: 60, pos: [-1150, 90, 820], look: [0, 140, 0], fov: 38 }], f, 0.006, 57);
    towers.forEach((m) => void m);
  };
};

// H. The Empire State Building rises floor by floor as the camera tilts up
const esbSetup = (g: GL) => {
  const sh = g.shared;
  sh.uSunDir.value.set(-0.5, 0.45, 0.75).normalize();
  sh.uSunCol.value.set(1.2, 1.05, 0.85);
  sh.uSky.value.set(0.5, 0.52, 0.6);
  sh.uGround.value.set(0.3, 0.28, 0.25);
  g.camera.far = 5000;
  const sky = makeSky(sh, { top: "#5f7fae", horizon: "#e8dcc4", bottom: "#8a8478", glow: 0.7, rays: 0.5, lines: 0.7, lineSpacing: 4, clouds: 0.3, cloudSpeed: 0.08, cloudCol: "#fff8ee", cloudShade: "#9c9ca4", paper: 0.2 });
  g.scene.add(sky.mesh);
  g.setPost({ fog: [400, 3000, 0.5], fogCol: "#e2dccc" });
  const stoneM = g.ink({
    color: "#d8d2c4",
    mode: "screen",
    angle: 80,
    scale: 3.5,
    cross: 0.6,
    rim: 0.3,
    uniforms: { uTop: { value: 0 } },
    fragDecl: "uniform float uTop;",
    frag: /* glsl */ `
      if (vWorld.y > uTop) discard;
      // vertical piers + window rows + spandrels
      float wall = 1.0 - step(0.7, abs(N.y));
      vec2 wp = vec2(abs(N.x) > 0.5 ? vWorld.z : vWorld.x, vWorld.y);
      float pier = step(0.78, fract(wp.x / 3.0));
      float win = (1.0 - pier) * step(0.3, fract(wp.y / 3.9)) * step(fract(wp.y / 3.9), 0.85);
      albedo = mix(albedo, vec3(0.25, 0.27, 0.3), win * wall * 0.8);
      extraInk += pier * wall * 0.15;
      // the fresh top floor glows with welding
      float edge = smoothstep(uTop - 4.0, uTop, vWorld.y);
      emis += vec3(1.0, 0.7, 0.3) * edge * 0.3;
    `,
  });
  const L = esbLevels();
  const geos: THREE.BufferGeometry[] = [];
  for (const [y0, y1, w, d] of L) geos.push(box(w, y1 - y0, d, 0, (y0 + y1) / 2, 0));
  // mooring mast + antenna
  geos.push(cyl(8, 10, 40, 16, 0, 400, 0), cyl(5, 7, 20, 12, 0, 430, 0), cyl(0.8, 2, 60, 8, 0, 470, 0));
  const esb = new THREE.Mesh(merge(geos), stoneM);
  g.scene.add(esb);
  // steel skeleton above the stone, derrick at the top
  const steelM = g.ink({ color: "#3a3a3c", mode: "screen", angle: 20, scale: 3.5, instanced: true });
  const beam = new THREE.BoxGeometry(0.6, 1, 0.6);
  const frame = new THREE.InstancedMesh(beam, steelM, 400);
  frame.frustumCulled = false;
  g.scene.add(frame);
  const derrick = new THREE.Group();
  const dm = g.ink({ color: "#2a2a2c", hatch: 0.3 });
  derrick.add(new THREE.Mesh(cyl(0.4, 0.4, 30, 6, 0, 15, 0), dm), new THREE.Mesh(tube([new THREE.Vector3(0, 28, 0), new THREE.Vector3(18, 12, 0)], 0.3, 2, 5), dm));
  g.scene.add(derrick);
  // surrounding city blocks
  const cityM = g.ink({
    color: "#aaa396",
    mode: "screen",
    angle: 70,
    scale: 3.5,
    instanced: true,
    frag: /* glsl */ `
      float wall = 1.0 - step(0.7, abs(N.y));
      vec2 wp = vec2(abs(N.x) > 0.5 ? vWorld.z : vWorld.x, vWorld.y);
      vec2 f2 = fract(wp / vec2(3.4, 3.8));
      float win = step(0.25, f2.x) * step(f2.x, 0.75) * step(0.3, f2.y) * step(f2.y, 0.8);
      albedo = mix(albedo, vec3(0.28, 0.3, 0.33), win * wall * 0.85);
      extraInk += step(0.97, fract(vWorld.y / 3.8)) * wall * 0.3;
      // cornices on the roofline
      albedo *= 1.0 - step(0.7, N.y) * 0.1;
    `,
  });
  const r = rng("esbcity");
  const blocks = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), cityM, 400);
  for (let i = 0; i < 400; i++) {
    const x = (r() - 0.5) * 900;
    const z = (r() - 0.5) * 900;
    if (Math.hypot(x, z) < 90 || Math.hypot(x + 140, z - 260) < 120) continue;
    const h = 25 + Math.pow(r(), 2.2) * 150;
    blocks.setMatrixAt(i, new THREE.Matrix4().compose(new THREE.Vector3(x, h / 2, z), new THREE.Quaternion(), new THREE.Vector3(30 + r() * 30, h, 30 + r() * 30)));
  }
  blocks.frustumCulled = false;
  g.scene.add(blocks);
  const birds = new Glows(sh, 1, "#000", 0);
  void birds;
  const m4 = new THREE.Matrix4();
  return (f: number) => {
    const k = Math.min(1, f / 70);
    const e = 1 - Math.pow(1 - k, 2);
    const top = 30 + e * 460;
    (stoneM.uniforms.uTop as THREE.IUniform).value = top - 12;
    // skeleton: columns and girders for the next 12 m above the stone
    let n = 0;
    const lvl = L.find(([y0, y1]) => top >= y0 && top <= y1) ?? L[L.length - 1];
    const w = lvl[2];
    const d = lvl[3];
    for (let yy = top - 12; yy < top; yy += 4)
      for (let i = 0; i <= 6; i++) {
        const x = -w / 2 + (i / 6) * w;
        for (const z of [-d / 2, d / 2]) {
          if (n >= 400) break;
          m4.compose(new THREE.Vector3(x, yy + 2, z), new THREE.Quaternion(), new THREE.Vector3(1, 4, 1));
          frame.setMatrixAt(n++, m4);
        }
        if (n < 400) {
          m4.compose(new THREE.Vector3(0, yy + 4, -d / 2), new THREE.Quaternion(), new THREE.Vector3(w, 0.6, 0.6));
          frame.setMatrixAt(n++, m4);
        }
      }
    frame.count = n;
    frame.instanceMatrix.needsUpdate = true;
    derrick.position.set(w / 2 - 4, top, 0);
    derrick.rotation.y = f * 0.03;
    // tilt up with the rising top
    g.camera.position.set(-150 + e * 20, 30 + e * 90, 260);
    g.camera.fov = 52;
    g.camera.lookAt(new THREE.Vector3(0, Math.max(80, top - 40), 0));
    g.camera.updateProjectionMatrix();
  };
};

const shot = (setup: (g: GL) => (f: number, t: number) => void) => {
  const C: React.FC = () => <GLShot setup={setup} />;
  return <C />;
};

export const ingenuity: SceneDef = {
  id: "ingenuity",
  seedBase: 50,
  shots: [
    { from: 0, dur: c(2), el: shot(locoSetup), enter: "burn", origin: [1500, 300], name: "locomotive" },
    { from: c(2), dur: c(3.5) - c(2), el: shot(spikeSetup), enter: "whip", name: "golden spike" },
    { from: c(3.5), dur: c(5) - c(3.5), el: shot(bulbSetup), enter: "zoom", name: "light bulb" },
    { from: c(5), dur: c(7) - c(5), el: shot(flyerSetup), enter: "flash", name: "wright flyer" },
    { from: c(7), dur: c(8.5) - c(7), el: shot(modelTSetup), enter: "whip", name: "model t" },
    { from: c(8.5), dur: c(10.5) - c(8.5), el: shot(damSetup), enter: "ink", origin: [960, 600], name: "hoover dam" },
    { from: c(10.5), dur: c(12.5) - c(10.5), el: shot(bridgeSetup), enter: "whip", name: "golden gate" },
    { from: c(12.5), dur: c(15) - c(12.5), el: shot(esbSetup), enter: "whipUp", name: "empire state" },
  ],
  hits: [
    { f: c(0.5), amp: 16, dur: 14, punch: 0.03 },
    { f: c(1.5), amp: 10, dur: 10 },
    { f: c(2.5), amp: 16, dur: 10, punch: 0.02 },
    { f: c(3), amp: 16, dur: 10, punch: 0.02 },
    { f: c(8.5), amp: 8, dur: 60 },
  ],
  Overlay: () => (
    <>
      <YearSlam text="1869" startFrame={c(0.5) - 5} fontSize={300} display scrim={0.75} exitAt={c(1.6)} />
      <Quote {...QUOTES.wright} start={c(5) + 4} end={c(8.5)} framesPerWord={4} />
    </>
  ),
};
