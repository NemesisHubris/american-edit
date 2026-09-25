// 8. THE DROP — engines ignite on the beat; the colour floods out from the
// engines; the rocket clears the tower; the LM descends with dust blasting
// outward; a boot presses into lunar dust in slow motion; the flag on the Moon.
import * as THREE from "three";
import { Quote } from "../components/WordPop";
import { QUOTES } from "../quotes";
import { sceneClock } from "../timeline";
import { GLShot, GL, driveCamera, drawIn } from "../gl/GLShot";
import { dawnSet } from "../gl/sets/cape";
import { lunarSet, makeBoot, printPatch } from "../gl/sets/moon";
import { makeLM, plumeMaterial } from "../gl/models/space";
import { makeFlag } from "../gl/models/flag";
import { makeFigure } from "../gl/figure";
import { emit, Glows, Puff, Puffs, Smoke } from "../gl/particles";
import { hash } from "../lib/random";
import type { SceneDef } from "./types";

const c = sceneClock("drop");

// five F-1 plumes under the rocket (top of each cone at the nozzle)
const f1Plumes = (g: GL, len: number, str = 1) => {
  const mat = plumeMaterial(g, { core: "#fff8dc", edge: "#ff7a1c", str, diamonds: 4 });
  const group = new THREE.Group();
  const geo = new THREE.CylinderGeometry(1.8, 5.5, len, 28, 1, true);
  geo.translate(0, -len / 2, 0);
  for (const [x, z] of [
    [0, 0],
    [3.3, 3.3],
    [-3.3, 3.3],
    [3.3, -3.3],
    [-3.3, -3.3],
  ]) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, 0.2, z);
    group.add(m);
  }
  // a wide outer glow
  const outer = new THREE.Mesh(new THREE.CylinderGeometry(6, 16, len * 1.1, 28, 1, true).translate(0, (-len * 1.1) / 2, 0), plumeMaterial(g, { core: "#ffd28a", edge: "#ff5a10", str: str * 0.5 }));
  group.add(outer);
  return { group, mat };
};

// A. Ignition on the beat: fire bursts out of the flame trench on both sides,
// smoke boils up lit orange from inside, the whole pad glows
const ignitionSetup = (g: GL) => {
  const set = dawnSet(g);
  const plumes = f1Plumes(g, 34, 1.4);
  g.scene.add(plumes.group);
  const smoke = new Smoke(g, 420, { color: "#f4eee6", heatCol: "#ff9b40" });
  g.scene.add(smoke.mesh);
  const fire = new Smoke(g, 260, { color: "#ffcf7a", fire: true, hatch: 0.25 });
  g.scene.add(fire.mesh);
  const sparks = new Glows(g.shared, 200, "#ffc070", 1.6);
  g.scene.add(sparks.mesh);
  const bloom = new Glows(g.shared, 24, "#ff8a2a", 0.4);
  g.scene.add(bloom.mesh);
  g.shared.uPL0.value.set(0, -6, 0, 170);
  return (f: number, t: number) => {
    driveCamera(
      g,
      [
        { f: 0, pos: [22, 2, 118], look: [2, 26, 0], fov: 46 },
        { f: 30, pos: [19, 0, 104], look: [2, 30, 0], fov: 44 },
      ],
      f,
      0.01,
      8,
    );
    const ign = Math.min(1, f / 5);
    plumes.group.scale.set(1, 0.2 + ign * 0.8, 1);
    plumes.mat.uniforms.uStr.value = 1.4 * ign;
    const flick = 0.85 + 0.15 * Math.sin(t * 40);
    g.shared.uPLc0.value.setRGB(3.4 * ign * flick, 2.0 * ign * flick, 0.8 * ign * flick);
    // flame-trench exits either side of the mobile launcher
    const fl: Puff[] = [];
    const sm: Puff[] = [];
    for (const side of [-1, 1]) {
      emit({ at: [side * 22, -12, 0], rate: 70, life: 0.75, vel: [side * 62, 3, 0], spread: 6, size: [3, 8], drag: 1.6, heat: 1, heatFade: 5, start: 0.03, seed: side > 0 ? 13 : 14, jitter: [1, 1, 7] }, t, fl);
      emit({ at: [side * 40, -12, 0], rate: 34, life: 3, vel: [side * 34, 7, 0], spread: 8, size: [4, 17], wind: [0, 3, 0], drag: 0.9, heat: 1, heatFade: 1.4, start: 0.12, seed: side > 0 ? 3 : 4, jitter: [3, 2, 10] }, t, sm);
    }
    // fire under the deck + smoke rolling up around the launcher
    emit({ at: [0, -9, 0], rate: 30, life: 0.8, vel: [0, -2, 0], spread: 14, size: [3, 7], drag: 1.5, heat: 1, heatFade: 5, start: 0.02, seed: 9, jitter: [14, 1, 14] }, t, fl);
    emit({ at: [0, -8, -18], rate: 14, life: 3, vel: [0, 9, -6], spread: 6, size: [5, 16], drag: 0.8, heat: 1, heatFade: 1.2, start: 0.25, seed: 10, jitter: [20, 2, 4] }, t, sm);
    fire.set(fl);
    smoke.set(sm);
    set.puffs.set(set.vapour(t + 3, false), g.camera);
    set.cloudPuffs.set(set.banks(t), g.camera);
    const bl: Puff[] = [];
    for (const side of [-1, 1])
      for (let i = 0; i < 6; i++) bl.push({ x: side * (24 + i * 9), y: -10 + hash(i, side + 5) * 6, z: (hash(i, side + 9) - 0.5) * 10, size: (16 + hash(i, 54) * 14) * ign, alpha: 0.4 * flick });
    bloom.set(bl, g.camera);
    const sp: Puff[] = [];
    for (let i = 0; i < 180; i++) {
      const born = hash(i, 7) * 0.9;
      const age = t - born;
      if (age < 0 || age > 0.8) continue;
      const side = i % 2 ? 1 : -1;
      const v = 40 + hash(i, 9) * 50;
      sp.push({ x: side * (22 + v * age), y: -12 + (6 + hash(i, 10) * 26) * age - 9 * age * age, z: (hash(i, 8) - 0.5) * 16, size: 0.5, alpha: 1 - age / 0.8, stretch: 3 });
    }
    sparks.set(sp, g.camera);
    drawIn(set.inks, f, -60, 10);
  };
};

// B. The rocket clears the tower; the camera tracks it up
const clearSetup = (g: GL) => {
  const set = dawnSet(g);
  const plumes = f1Plumes(g, 70, 1.3);
  set.rocket.group.add(plumes.group);
  const trail = new Smoke(g, 500, { color: "#f6f1ea", heatCol: "#ffa24a" });
  g.scene.add(trail.mesh);
  return (f: number, t: number) => {
    const rise = 92 + f * 1.25 + f * f * 0.012;
    set.rocket.group.position.y = rise;
    const camY = 128 + f * 0.9;
    driveCamera(g, [{ f: 0, pos: [70, camY, 150], look: [-6, camY + 8, 0], fov: 38 }], f, 0.012, 9);
    const list: Puff[] = [];
    emit({ at: [0, rise - 60, 0], rate: 50, life: 3, vel: [0, -6, 0], spread: 5, size: [6, 26], wind: [2, 1, 0], drag: 0.8, heat: 0.8, heatFade: 0.5, seed: 21, prewarm: 1.5, jitter: [4, 10, 4] }, t, list);
    // billowing cloud around the pad far below
    emit({ at: [0, 0, 0], rate: 30, life: 5, vel: [0, 4, 0], spread: 14, size: [20, 60], drag: 0.5, alpha: 0.9, seed: 22, prewarm: 5, jitter: [40, 4, 40] }, t, list);
    trail.set(list);
    set.puffs.set(set.vapour(t + 5).slice(0, 0), g.camera);
    set.cloudPuffs.set(set.banks(t), g.camera);
    set.birds.update(t);
  };
};

// C. The LM descends; dust blasts out radially
const lmSetup = (g: GL) => {
  const moon = lunarSet(g, { sun: [0.7, 0.28, 0.3], earth: [-420, 300, -560], earthR: 34, flatAt: [0, 0, 8], seed: "tranq", shadows: 30 });
  const lm = makeLM(g);
  g.scene.add(lm.group);
  const glow = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 2.2, 5, 20, 1, true).translate(0, -2.5, 0), plumeMaterial(g, { core: "#e8f0ff", edge: "#9fb4ff", str: 0.5 }));
  lm.group.add(glow);
  const dust = new Puffs(g.shared, 600, { lit: "#efe8da", shade: "#9a9284", outline: 0.15, hatch: 0.25, lineSpacing: 4, soft: 0.3, rough: 0.3 });
  g.scene.add(dust.mesh);
  const baseH = moon.hf(0, 0);
  return (f: number, t: number) => {
    const alt = 6.5 - f * 0.12;
    lm.group.position.set(0, baseH + alt, 0);
    lm.group.rotation.set(Math.sin(t * 1.3) * 0.02, 0.5, Math.sin(t * 1.1) * 0.025);
    driveCamera(
      g,
      [
        { f: 0, pos: [15, baseH + 4.5, 20], look: [0, baseH + 4.2, 0], fov: 42 },
        { f: 30, pos: [12.5, baseH + 3.6, 17], look: [0, baseH + 3.2, 0], fov: 42 },
      ],
      f,
      0.015,
      11,
    );
    const list: Puff[] = [];
    for (let i = 0; i < 360; i++) {
      const born = hash(i, 31) * 1.4 - 0.4;
      const age = t - born;
      if (age < 0 || age > 0.9) continue;
      const a = hash(i, 32) * 6.28;
      const v = 14 + hash(i, 33) * 22;
      const r = 1.5 + v * age;
      list.push({ x: Math.cos(a) * r, y: baseH + 0.15 + hash(i, 34) * 0.6 + age * 0.4, z: Math.sin(a) * r, size: 0.35 + age * 1.6, alpha: (1 - age / 0.9) * 0.75, stretch: 3, seed: hash(i, 35) * 9 });
    }
    dust.set(list, g.camera);
    drawIn(lm.mats, f, -60, 10);
  };
};

// D. Slow motion: the boot presses into the dust
const bootSetup = (g: GL) => {
  const moon = lunarSet(g, { sun: [-0.7, 0.35, 0.25], earth: [-160, 90, -500], earthR: 22, flatAt: [0, 0, 1.4], seed: "step", shadows: 3 });
  const y0 = moon.hf(0, 0);
  const patch = printPatch(g);
  patch.mesh.position.set(0, y0 + 0.002, 0);
  g.scene.add(patch.mesh);
  const boot = makeBoot(g);
  g.scene.add(boot.group);
  const dust = new Puffs(g.shared, 400, { lit: "#ece6d9", shade: "#9a9284", outline: 0.3, hatch: 0.4, lineSpacing: 3.5, soft: 0.2, rough: 0.45 });
  g.scene.add(dust.mesh);
  const grains = new Glows(g.shared, 300, "#a59f92", 0.2);
  g.scene.add(grains.mesh);
  if (g.shadow) g.shadow.center.set(0, y0, 0);
  return (f: number) => {
    // slow motion: 1 frame = 1/90 s
    const T = f / 90;
    const touch = 0.2;
    const down = Math.min(1, T / touch);
    const e = 1 - Math.pow(1 - down, 2);
    boot.group.position.set(0, y0 + 0.42 * (1 - e) - 0.028 * Math.min(1, Math.max(0, (T - touch) / 0.1)), 0.02);
    boot.group.rotation.set(0.22 * (1 - e), 0.15, 0);
    patch.mat.uniforms.uPress.value = Math.min(1, Math.max(0, (T - touch + 0.02) / 0.1));
    driveCamera(
      g,
      [
        { f: 0, pos: [0.75, y0 + 0.2, 0.95], look: [0, y0 + 0.12, 0], fov: 40 },
        { f: 45, pos: [0.62, y0 + 0.16, 0.8], look: [0, y0 + 0.08, 0], fov: 38 },
      ],
      f,
      0.004,
      12,
    );
    // dust kicked from the sole rim, arcing slowly in 1/6 g
    const list: Puff[] = [];
    const gr: Puff[] = [];
    const age0 = T - touch;
    if (age0 > 0)
      for (let i = 0; i < 220; i++) {
        const a = hash(i, 41) * 6.28;
        const sp = 0.25 + hash(i, 42) * 0.55;
        const up = 0.25 + hash(i, 43) * 0.6;
        const age = age0 - hash(i, 44) * 0.08;
        if (age < 0) continue;
        const x = Math.cos(a) * (0.08 + sp * age);
        const z = Math.sin(a) * (0.17 + sp * age);
        const y = y0 + 0.01 + up * age - 0.81 * age * age;
        if (y < y0 - 0.01) continue;
        if (i < 120) list.push({ x, y, z, size: 0.012 + age * 0.05, alpha: 0.7 * Math.max(0, 1 - age / 0.6), seed: hash(i, 45) * 9 });
        else gr.push({ x, y, z, size: 0.004, alpha: 0.9 });
      }
    dust.set(list, g.camera);
    grains.set(gr, g.camera);
  };
};

// E. The flag on the Moon: the astronaut salutes; LM behind; Earth above
const flagSetup = (g: GL) => {
  const moon = lunarSet(g, { sun: [0.55, 0.3, 0.6], earth: [-40, 70, -260], earthR: 14, flatAt: [0, 0, 12], seed: "base", shadows: 16 });
  const y0 = moon.hf(0, 0);
  const lm = makeLM(g);
  lm.group.position.set(-11, moon.hf(-11, -9), -9);
  lm.group.rotation.y = 0.6;
  g.scene.add(lm.group);
  const flag = makeFlag(g, { w: 1.5, h: 0.9, stars: 50, wind: 0.04, speed: 0.4, droop: 0.02, rod: true, wrinkle: 1 });
  flag.mesh.position.set(-1.6, y0 + 2.05, -0.6);
  flag.mesh.rotation.y = 0.35;
  g.scene.add(flag.mesh);
  const poleM = g.ink({ color: "#d9d6cf", mode: "v", scale: 20, spec: 0.8 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 2.2, 10), poleM);
  pole.position.set(-1.6, y0 + 1.05, -0.6);
  g.scene.add(pole);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.55, 8), poleM);
  rod.rotation.z = Math.PI / 2;
  rod.position.set(0.55, 0, 0);
  flag.mesh.add(rod);
  const prints = new THREE.InstancedMesh(new THREE.BoxGeometry(0.14, 0.02, 0.32), g.ink({ color: "#6e6a62", hatch: 0.8, instanced: true, edges: 0 }), 40);
  for (let i = 0; i < 40; i++) {
    const t2 = i / 40;
    const px = 1.3 - 9 * t2 + Math.sin(i * 1.3) * 0.25;
    const pz = 0.8 - 12 * t2 + (i % 2 ? 0.18 : -0.18);
    prints.setMatrixAt(i, new THREE.Matrix4().compose(new THREE.Vector3(px, moon.hf(px, pz) + 0.005, pz), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0.6, 0)), new THREE.Vector3(1, 1, 1)));
  }
  prints.frustumCulled = false;
  g.scene.add(prints);
  const astro = makeFigure(g, "apollo");
  astro.root.position.set(1.3, y0, 0.8);
  astro.root.rotation.y = 0.25;
  g.scene.add(astro.root);
  if (g.shadow) g.shadow.center.set(2, y0, -2);
  return (f: number, t: number) => {
    const k = Math.min(1, f / 14);
    astro.pose({
      bend: 0.06,
      rSh: [1.25 * k, 0.55 * k, 0],
      rEl: 0.3 + 1.9 * k,
      lSh: [0.1, 0.18, 0],
      lEl: 0.3,
      lHip: [0.05, 0.08],
      rHip: [-0.05, 0.1],
      lKn: 0.08,
      rKn: 0.1,
      neck: -0.05 + Math.sin(t) * 0.02,
    });
    driveCamera(
      g,
      [
        { f: 0, pos: [3.6, y0 + 1.1, 6.4], look: [-0.8, y0 + 1.6, -2], fov: 46 },
        { f: 45, pos: [4.4, y0 + 1.2, 5.6], look: [-0.8, y0 + 1.7, -2.2], fov: 44 },
      ],
      f,
      0.006,
      13,
    );
  };
};

const IgnitionShot: React.FC = () => <GLShot setup={ignitionSetup} flood={{ at: 1, dur: 16, origin: [940, 860] }} />;
const ClearShot: React.FC = () => <GLShot setup={clearSetup} />;
const LMShot: React.FC = () => <GLShot setup={lmSetup} />;
const BootShot: React.FC = () => <GLShot setup={bootSetup} />;
const FlagShot: React.FC = () => <GLShot setup={flagSetup} />;

export const drop: SceneDef = {
  id: "drop",
  seedBase: 80,
  shots: [
    { from: 0, dur: c(1), el: <IgnitionShot />, enter: "cut", name: "ignition + colour flood" },
    { from: c(1), dur: c(2) - c(1), el: <ClearShot />, enter: "punch", palette: "color", name: "clears the tower" },
    { from: c(2), dur: c(3) - c(2), el: <LMShot />, enter: "whipDown", palette: "color", name: "lunar module" },
    { from: c(3), dur: c(4.5) - c(3), el: <BootShot />, enter: "flash", palette: "color", name: "boot slow motion" },
    { from: c(4.5), dur: c(6) - c(4.5), el: <FlagShot />, enter: "ink", origin: [760, 400], palette: "color", name: "flag on the moon" },
  ],
  hits: [
    { f: 0, amp: 42, dur: 26, punch: 0.07 },
    { f: c(1), amp: 16, dur: 26 },
    { f: c(2), amp: 12, dur: 20 },
    { f: c(3) + 16, amp: 6, dur: 10 },
  ],
  flashes: [{ f: 0, dur: 12, peak: 1 }],
  Overlay: () => <Quote {...QUOTES.armstrong} start={c(2) + 4} end={c(6)} framesPerWord={3} fontSize={64} />,
};
