// 1. COLD OPEN — three half-second flashes (boot in lunar dust, flag on a
// windswept ridge, rocket engines igniting), hard cut to black, "1776".
import * as THREE from "three";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Dust, Embers, Sparks } from "../components/Particles";
import { YearSlam } from "../components/YearSlam";
import { polyD, Pt } from "../lib/engrave";
import { clamp, easeOut, TAU } from "../lib/math";
import { hash } from "../lib/random";
import { sceneClock } from "../timeline";
import { GLShot, GL, driveCamera } from "../gl/GLShot";
import { lunarSet, makeBoot, printPatch } from "../gl/sets/moon";
import { makeSky } from "../gl/sky";
import { makeFlag } from "../gl/models/flag";
import { makeSaturn } from "../gl/models/saturn";
import { plumeMaterial } from "../gl/models/space";
import { makeGround, makeReeds } from "../gl/env";
import { terrain } from "../gl/geo";
import { ridged2 } from "../gl/noise";
import { emit, Glows, Puff, Puffs, Smoke } from "../gl/particles";
import type { SceneDef } from "./types";

const c = sceneClock("coldOpen");

// 3D flashes ------------------------------------------------------------------

// Boot pressing into lunar dust, grains arcing out in low gravity
const bootSetup = (g: GL) => {
  const moon = lunarSet(g, { sun: [0.75, 0.3, -0.3], earth: [140, 70, -420], earthR: 18, flatAt: [0, 0, 1.4], seed: "cold", shadows: 3 });
  const y0 = moon.hf(0, 0);
  const patch = printPatch(g);
  patch.mesh.position.set(0, y0 + 0.002, 0);
  g.scene.add(patch.mesh);
  const boot = makeBoot(g);
  g.scene.add(boot.group);
  const dust = new Puffs(g.shared, 300, { lit: "#ece6d9", shade: "#9a9284", outline: 0.3, hatch: 0.4, lineSpacing: 3.5, soft: 0.2, rough: 0.45 });
  g.scene.add(dust.mesh);
  if (g.shadow) g.shadow.center.set(0, y0, 0);
  return (f: number) => {
    const T = f / 40;
    const touch = 0.12;
    const e = 1 - Math.pow(1 - Math.min(1, T / touch), 2);
    boot.group.position.set(0, y0 + 0.35 * (1 - e) - 0.028 * Math.min(1, Math.max(0, (T - touch) / 0.08)), 0);
    boot.group.rotation.set(0.25 * (1 - e), -0.5, 0);
    patch.mat.uniforms.uPress.value = Math.min(1, Math.max(0, (T - touch + 0.02) / 0.08));
    driveCamera(g, [{ f: 0, pos: [-0.55, y0 + 0.14, 0.72], look: [0, y0 + 0.1, 0], fov: 44 }, { f: 15, pos: [-0.5, y0 + 0.12, 0.64], look: [0, y0 + 0.08, 0], fov: 42 }], f, 0.004, 2);
    const list: Puff[] = [];
    const age0 = T - touch;
    if (age0 > 0)
      for (let i = 0; i < 160; i++) {
        const a = hash(i, 41) * 6.28;
        const sp = 0.3 + hash(i, 42) * 0.6;
        const up = 0.3 + hash(i, 43) * 0.6;
        const age = age0 - hash(i, 44) * 0.05;
        if (age < 0) continue;
        const y = y0 + 0.01 + up * age - 0.81 * age * age;
        list.push({ x: Math.cos(a) * (0.08 + sp * age), y, z: Math.sin(a) * (0.17 + sp * age), size: 0.006 + age * 0.035, alpha: 0.8, seed: hash(i, 45) * 9 });
      }
    dust.set(list, g.camera);
  };
};

// A flag cracking in a hard wind on a rocky ridge, clouds racing past
const flagSetup = (g: GL) => {
  const sh = g.shared;
  sh.uSunDir.value.set(0.5, 0.35, -0.8).normalize();
  sh.uSunCol.value.set(1.2, 1.0, 0.75);
  sh.uSky.value.set(0.5, 0.52, 0.6);
  sh.uGround.value.set(0.3, 0.25, 0.2);
  g.camera.far = 3000;
  const sky = makeSky(sh, { top: "#4d6c95", horizon: "#f1d3a1", bottom: "#7b6a55", glow: 0.8, sunSize: 0.05, rays: 0.9, rayCount: 30, lines: 0.7, lineSpacing: 4, clouds: 0.45, cloudSpeed: 0.35, cloudScale: 1.1, cloudHeight: 0.2, cloudCol: "#fff3de", cloudShade: "#8f8579", paper: 0.2 });
  g.scene.add(sky.mesh);
  g.setPost({ fog: [120, 1600, 0.6], fogCol: "#e8d4b0" });
  // ridge: ridged noise, highest near the flag
  const ridgeH = (x: number, z: number) => 14 * Math.exp(-(x * x) / 900 - (z * z) / 300) + (ridged2(x * 0.03, z * 0.03, 5, 4) - 0.35) * 16 - Math.max(0, -z - 30) * 0.4;
  const rock = g.ink({ color: "#a6957a", mode: "world", dir: [0.8, 0.3, 0.2], scale: 1.2, cross: 0.7, shade: 1 });
  const ridge = new THREE.Mesh(terrain(900, 900, 260, 260, ridgeH), rock);
  g.scene.add(ridge);
  const far = makeGround(g, { size: 5000, res: 160, y: -60, amp: 120, freq: 0.0012, color: "#8c8a72" });
  g.scene.add(far.mesh);
  const top = ridgeH(0, 0);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 7, 12), g.ink({ color: "#d9cfb8", mode: "v", scale: 30, spec: 0.6 }));
  pole.position.set(0, top + 3.3, 0);
  g.scene.add(pole);
  const finial = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12), g.ink({ color: "#c79a3c", spec: 1, gloss: 40 }));
  finial.position.set(0, top + 6.85, 0);
  g.scene.add(finial);
  const flag = makeFlag(g, { w: 4.2, h: 2.2, stars: 50, wind: 0.2, speed: 2.2, droop: 0.02 });
  flag.mesh.position.set(0.05, top + 6.7, 0);
  flag.mesh.rotation.y = -0.35;
  g.scene.add(flag.mesh);
  const grass = makeReeds(g, { count: 2400, x: [-30, 30], z: [-12, 14], y: (x, z) => ridgeH(x, z) - 0.1, h: [0.4, 1.2], w: 0.05, color: "#7b7a44", seed: "rg", sway: 0.5, wind: 3.2 });
  g.scene.add(grass.mesh);
  const dustP = new Glows(sh, 80, "#fff0d0", 0.3);
  g.scene.add(dustP.mesh);
  return (f: number, t: number) => {
    driveCamera(g, [{ f: 0, pos: [-4.5, top + 3.2, 7.4], look: [1.6, top + 5.4, 0], fov: 44 }, { f: 15, pos: [-3.8, top + 3.4, 6.4], look: [1.6, top + 5.6, 0], fov: 42 }], f, 0.02, 4);
    const d: Puff[] = [];
    for (let i = 0; i < 60; i++) {
      const u = (hash(i, 3) + t * (0.8 + hash(i, 4))) % 1;
      d.push({ x: -20 + u * 40, y: top + hash(i, 5) * 8, z: -4 + hash(i, 6) * 10, size: 0.04, alpha: 0.6 * Math.sin(u * Math.PI), stretch: 4 });
    }
    dustP.set(d, g.camera);
  };
};

// Rocket engines igniting: looking up into the F-1 cluster as fire blasts out
const enginesSetup = (g: GL) => {
  const sh = g.shared;
  sh.uSunDir.value.set(-0.3, -0.2, 0.9).normalize();
  sh.uSunCol.value.set(0.4, 0.35, 0.3);
  sh.uSky.value.set(0.25, 0.22, 0.2);
  sh.uGround.value.set(0.15, 0.12, 0.1);
  g.camera.far = 800;
  const sky = makeSky(sh, { top: "#2a2522", horizon: "#57493c", bottom: "#1c1714", glow: 0, rays: 0, lines: 0.6, lineSpacing: 4, paper: 0 });
  g.scene.add(sky.mesh);
  const rocket = makeSaturn(g);
  g.scene.add(rocket.group);
  const plumeMat = plumeMaterial(g, { core: "#fff8dc", edge: "#ff7a1c", str: 1.6, diamonds: 5 });
  const plumes: THREE.Mesh[] = [];
  for (const [x, z] of [
    [0, 0],
    [3.3, 3.3],
    [-3.3, 3.3],
    [3.3, -3.3],
    [-3.3, -3.3],
  ]) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 6, 40, 28, 1, true).translate(0, -20, 0), plumeMat);
    m.position.set(x, 0.2, z);
    rocket.group.add(m);
    plumes.push(m);
  }
  const fire = new Smoke(g, 240, { color: "#ffcf7a", fire: true, hatch: 0.25 });
  g.scene.add(fire.mesh);
  const smoke = new Smoke(g, 200, { color: "#e9e2d8", heatCol: "#ff9b40" });
  g.scene.add(smoke.mesh);
  const sparks = new Glows(sh, 200, "#ffd08a", 1.6);
  g.scene.add(sparks.mesh);
  sh.uPL0.value.set(0, -8, 0, 90);
  return (f: number, t: number) => {
    driveCamera(g, [{ f: 0, pos: [20, -4, 22], look: [0, 1, 0], fov: 50 }, { f: 15, pos: [17, -6, 18], look: [0, 0, 0], fov: 48 }], f, 0.03, 6);
    const ign = Math.min(1, Math.max(0, (f - 3) / 4));
    plumes.forEach((p, i) => p.scale.set(1, Math.max(0.01, Math.min(1, (f - 3 - i) / 3)), 1));
    plumeMat.uniforms.uStr.value = 1.6 * ign;
    sh.uPLc0.value.setRGB(4 * ign, 2.4 * ign, 1 * ign);
    const fl: Puff[] = [];
    const sm: Puff[] = [];
    if (f >= 3) {
      emit({ at: [0, -12, 0], rate: 120, life: 0.5, vel: [0, -30, 0], spread: 22, size: [2, 6], drag: 2, heat: 1, heatFade: 5, start: 0.1, seed: 71, jitter: [6, 2, 6] }, t, fl);
      emit({ at: [0, -24, 0], rate: 40, life: 1.2, vel: [0, -8, 0], spread: 20, size: [4, 12], drag: 1, heat: 1, heatFade: 1.2, start: 0.15, seed: 72, jitter: [12, 3, 12] }, t, sm);
    }
    fire.set(fl);
    smoke.set(sm);
    const sp: Puff[] = [];
    for (let i = 0; i < 160; i++) {
      const born = 0.1 + hash(i, 7) * 0.4;
      const age = t - born;
      if (age < 0 || age > 0.5) continue;
      const a = hash(i, 8) * 6.28;
      const v = 20 + hash(i, 9) * 40;
      sp.push({ x: Math.cos(a) * v * age, y: -4 - 30 * age, z: Math.sin(a) * v * age, size: 0.3, alpha: 1 - age / 0.5, stretch: 3 });
    }
    sparks.set(sp, g.camera);
  };
};

const BootShot: React.FC = () => <GLShot setup={bootSetup} />;
const FlagShot: React.FC = () => <GLShot setup={flagSetup} />;
const EnginesShot: React.FC = () => <GLShot setup={enginesSetup} />;

// Black card for the year: a faint ring of thirteen stars turning, embers,
// and a shockwave + sparks on the slam
const YearCard: React.FC<{ impact: number }> = ({ impact }) => {
  const f = useCurrentFrame();
  const a = f - impact;
  const ring = (r0: number, n: number, rot: number, op: number, size: number) =>
    Array.from({ length: n }, (_, i) => {
      const ang = (i / n) * TAU + rot;
      const cx = 960 + Math.cos(ang) * r0;
      const cy = 540 + Math.sin(ang) * r0;
      const pts: Pt[] = [];
      for (let k = 0; k < 10; k++) {
        const aa = -Math.PI / 2 + (k * Math.PI) / 5;
        const rr = k % 2 === 0 ? size : size * 0.4;
        pts.push([cx + Math.cos(aa) * rr, cy + Math.sin(aa) * rr]);
      }
      return <path key={i} d={polyD(pts)} fill="#d8b26a" opacity={op} />;
    });
  const pulse = a >= 0 ? Math.exp(-a / 10) : 0;
  return (
    <AbsoluteFill style={{ backgroundColor: "#0b0704" }}>
      <svg width={1920} height={1080}>
        <g transform={`translate(960 540) scale(${1 + (f - 45) * 0.004 + pulse * 0.05}) translate(-960 -540)`}>
        <g opacity={0.35 + pulse * 0.6}>{ring(360, 13, f * 0.025, 1, 22)}</g>
        <circle cx={960} cy={540} r={420} fill="none" stroke="#d8b26a" strokeWidth={1.5} opacity={0.18 + pulse * 0.4} />
        <circle cx={960} cy={540} r={300} fill="none" stroke="#d8b26a" strokeWidth={1} opacity={0.12 + pulse * 0.3} />
        {a >= 0 &&
          [0, 5].map((d) => {
            const t = clamp((a - d) / 22);
            return t > 0 && t < 1 ? <ellipse key={d} cx={960} cy={540} rx={200 + easeOut(t) * 900} ry={120 + easeOut(t) * 520} fill="none" stroke="#f0d9a8" strokeWidth={6 * (1 - t)} opacity={1 - t} /> : null;
          })}
        </g>
        <Embers x={960} y={1120} w={2000} count={110} rise={6} life={60} seed="yc" size={2.6} />
        <Sparks x={960} y={540} t0={impact} count={80} speed={40} angle={0} spread={TAU} gravity={0.5} life={24} seed="ycs" />
        <Dust count={40} color="#8a6a40" seed="ycd" speed={0.8} />
      </svg>
    </AbsoluteFill>
  );
};

const SLAM = c(1.5) + 10; // year starts falling; impact lands on the 2.0s beat

export const coldOpen: SceneDef = {
  id: "coldOpen",
  seedBase: 0,
  shots: [
    { from: 0, dur: c(0.5), el: <BootShot />, name: "boot" },
    { from: c(0.5), dur: c(1) - c(0.5), el: <FlagShot />, enter: "flash", name: "flag ridge" },
    { from: c(1), dur: c(1.5) - c(1), el: <EnginesShot />, enter: "flash", name: "engines" },
    { from: c(1.5), dur: c(3) - c(1.5), el: <YearCard impact={c(2)} />, name: "1776 card", overlay: { texture: 0.25, vignette: 0.8 } },
  ],
  hits: [
    { f: 5, amp: 10, dur: 10 },
    { f: c(0.5), amp: 8, dur: 8 },
    { f: c(1) + 3, amp: 22, dur: 14, punch: 0.03 },
    { f: c(2), amp: 24, dur: 16, punch: 0.04 },
  ],
  Overlay: () => <YearSlam text="1776" startFrame={SLAM} fontSize={330} display exitAt={c(3) - 8} />,
};
