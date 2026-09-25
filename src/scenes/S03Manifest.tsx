// 3. MANIFEST DESTINY — 1805. The map draws itself; Louisiana floods in;
// Lewis & Clark's canoe travels to the Pacific; waves crash; the Alamo inset;
// wagons roll west; states fill to the Pacific.
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { Camera, Layer } from "../components/Camera";
import { InkDraw, Trail } from "../components/InkDraw";
import { Dust } from "../components/Particles";
import { Canoe, MapBase, MapCues, MapWagon, Ship } from "../components/MapScene";
import * as THREE from "three";
import { GLShot, GL, driveCamera, drawIn } from "../gl/GLShot";
import { makeSky } from "../gl/sky";
import { makeGround, makeReeds, makeWater, makeBirds } from "../gl/env";
import { makeFigure } from "../gl/figure";
import { terrain } from "../gl/geo";
import { fbm2, ridged2 } from "../gl/noise";
import { emit, Glows, Puff, Puffs, Smoke } from "../gl/particles";
import { makeTree } from "../gl/models/civilwar";
import { makeAlamo, makeOx, seaStackGeo, wagonGeo } from "../gl/models/west";
import { YearSlam } from "../components/YearSlam";
import { Quote } from "../components/WordPop";
import { QUOTES } from "../quotes";
import { F, L } from "../art/kit";
import { polyD, rectP, smoothD, ellipseP } from "../lib/engrave";
import { clamp, easeInOut, lerp, memo, ramp, TAU } from "../lib/math";
import { usePalette } from "../lib/palette";
import { hash } from "../lib/random";
import { useUid } from "../lib/uid";
import { along, getUSMap, LEWIS_CLARK, OREGON_TRAIL, PLACES } from "../lib/usmap";
import { DISPLAY_FAMILY, ITALIC_FAMILY } from "../fonts";
import { sceneClock } from "../timeline";
import type { SceneDef } from "./types";

const c = sceneClock("manifest");

const CUES: MapCues = {
  border: 0,
  sea: 0,
  compass: 2,
  land: 6,
  original: c(1.2),
  labels: c(1.8),
  rivers: c(2.0),
  louisiana: c(2.6),
  westStart: c(15.1),
  westDur: 44,
};
const TRAIL0 = c(2.9);
const TRAIL1 = c(6.8);
const OREGON0 = c(15);
const OREGON1 = c(16.6);

const PACIFIC_COAST: [number, number][] = [
  [-124.6, 48.2], [-124.2, 46.8], [-124.0, 45.2], [-124.2, 43.6], [-124.4, 42.2], [-124.1, 40.6], [-123.6, 39.0], [-122.8, 37.9], [-122.1, 36.8], [-121.2, 35.6], [-120.3, 34.6], [-118.9, 34.0], [-117.6, 33.2],
];

type Cam = { x: number; y: number; z: number };

const MapShot: React.FC<{ at: number; cam: (sf: number, canoe: { x: number; y: number }) => Cam; oregon?: boolean; waves?: boolean }> = ({ at, cam, oregon, waves }) => {
  const f = useCurrentFrame();
  const pal = usePalette();
  const uid = useUid("md");
  const sf = f + at;
  const m = getUSMap();
  const lc = memo("md:lc", () => along(m.pts(LEWIS_CLARK)));
  const ot = memo("md:ot", () => along(m.pts(OREGON_TRAIL)));
  const coast = memo("md:pc", () => m.pts(PACIFIC_COAST));
  const trailP = ramp(sf, TRAIL0, TRAIL1, easeInOut);
  const canoe = lc.at(trailP);
  const cm = cam(sf, canoe);
  const oP = ramp(sf, OREGON0, OREGON1, easeInOut);
  const tilt = 16 + Math.sin(sf / 90) * 4;
  return (
    <AbsoluteFill style={{ perspective: 1500, perspectiveOrigin: "50% 30%", backgroundColor: pal.paperDark, overflow: "hidden" }}>
    <AbsoluteFill style={{ transform: `rotateX(${tilt}deg) scale(1.28) translateY(-40px)`, transformOrigin: "50% 60%" }}>
    <Camera keys={[{ f: 0, x: cm.x, y: cm.y, z: cm.z }]} handheld={3} seed={30 + at}>
      <Layer depth={1}>
        <Sequence from={-at} layout="none">
          <MapBase cues={CUES} />
        </Sequence>
        <Ship x={180} y={540} seed={2} speed={0.3} />
        <Ship x={1700} y={640} seed={4} dir={-1} speed={0.25} />
        <Ship x={1250} y={930} seed={6} speed={0.2} s={0.8} />
        {trailP > 0 && <Trail d={lc.d} progress={trailP} w={3.5} dash="0.1 9" id={`${uid}lc`} color="brick" />}
        {trailP > 0 && trailP < 1 && <Canoe x={canoe.x} y={canoe.y - 6} angle={canoe.angle} s={1.15} />}
        {trailP >= 1 && (
          <g>
            <circle cx={canoe.x} cy={canoe.y} r={10 + Math.sin(sf / 4) * 2} fill="none" stroke={pal.brick} strokeWidth={2.5} />
            <text x={canoe.x + 14} y={canoe.y - 12} fontFamily={ITALIC_FAMILY} fontSize={12} fill={pal.ink}>
              Fort Clatsop
            </text>
          </g>
        )}
        {oregon && oP > 0 && <Trail d={ot.d} progress={oP} w={3} dash="0.1 8" id={`${uid}ot`} color="ink" />}
        {oregon &&
          [0, 1, 2, 3].map((k) => {
            const p = oP - k * 0.07;
            if (p <= 0) return null;
            const q = ot.at(p);
            return <MapWagon key={k} x={q.x} y={q.y - 6} angle={q.angle} s={0.45} roll={-sf * 12} />;
          })}
        {waves &&
          coast.map(([x, y], i) =>
            [0, 1, 2].map((k) => {
              const t = (((sf / 30 + i * 0.37 + k / 3) % 1) + 1) % 1;
              const px = x - 70 + t * 55;
              return (
                <path
                  key={`${i}-${k}`}
                  d={`M${px - 12} ${y + k * 6}q12 -10 24 0`}
                  fill="none"
                  stroke={pal.ink}
                  strokeWidth={1.8}
                  opacity={Math.sin(t * Math.PI) * 0.8}
                />
              );
            }),
          )}
      </Layer>
      <Layer depth={1.35}>
        <Dust count={36} speed={0.4} color="inkSoft" size={2.2} seed={`md${at}`} opacity={0.5} />
      </Layer>
    </Camera>
    </AbsoluteFill>
    <AbsoluteFill style={{ background: `linear-gradient(to bottom, ${pal.paperDark} 0%, rgba(0,0,0,0) 22%)` }} />
    </AbsoluteFill>
  );
};

const centerOn = (p: { x: number; y: number }, z: number): Cam => ({ x: p.x - 960, y: p.y - 540, z });

// D. "Ocian in view!": the party on a headland above the Pacific; sea stacks,
// breakers rolling in, gulls wheeling
const pacificSetup = (g: GL) => {
  const sh = g.shared;
  sh.uSunDir.value.set(-0.7, 0.3, -0.6).normalize();
  sh.uSunCol.value.set(1.2, 1.0, 0.8);
  sh.uSky.value.set(0.5, 0.52, 0.6);
  sh.uGround.value.set(0.3, 0.28, 0.24);
  g.camera.far = 5000;
  const sky = makeSky(sh, { top: "#6d8aae", horizon: "#f0dfc0", bottom: "#8a8a80", glow: 1, sunSize: 0.05, rays: 0.9, rayCount: 28, lines: 0.7, lineSpacing: 4, clouds: 0.35, cloudSpeed: 0.05, cloudCol: "#fff4e0", cloudShade: "#9a9098", paper: 0.25 });
  g.scene.add(sky.mesh);
  g.setPost({ fog: [150, 3000, 0.5], fogCol: "#eadcc2" });
  const sea = makeWater(g, { w: 4000, d: 4000, res: 240, y: 0, color: "#4e6470", sky: "#c8d0d4", amp: 1.4, freq: 0.08, speed: 1.1, lineSpacing: 4 });
  g.scene.add(sea.mesh);
  // headland: grassy bluff dropping to the sea
  const bluffH = (x: number, z: number) => Math.max(-6, 38 - Math.max(0, -z - 20) * 1.4 + (fbm2(x * 0.02, z * 0.02, 5, 3) - 0.5) * 14 - Math.max(0, x - 60) * 0.3);
  const bluff = new THREE.Mesh(terrain(400, 400, 200, 200, bluffH), g.ink({ color: "#8a8458", mode: "screen", angle: 30, scale: 3.4, cross: 0.6, shade: 1, frag: "albedo = mix(albedo, vec3(0.62, 0.55, 0.45), smoothstep(0.75, 0.45, N.y));" }));
  bluff.position.set(0, 0, 140);
  g.scene.add(bluff);
  const stackM = g.ink({ color: "#6e645a", mode: "screen", angle: 70, scale: 3.4, cross: 0.8, shade: 1 });
  [
    [-60, -120, 55, 16],
    [30, -200, 70, 20],
    [-140, -260, 40, 12],
    [90, -320, 48, 14],
    [-20, -420, 30, 10],
  ].forEach(([x, z, h, r], i) => {
    const m = new THREE.Mesh(seaStackGeo(i * 3 + 1, h, r), stackM);
    m.position.set(x, -4, z);
    g.scene.add(m);
  });
  const grass = makeReeds(g, { count: 3000, x: [-12, 12], z: [120, 140], y: (x, z) => bluffH(x, z - 140), h: [0.3, 0.9], w: 0.02, color: "#7a7a48", seed: "pgrass", sway: 0.4, wind: 2.5, edges: 0 });
  g.scene.add(grass.mesh);
  // Clark, Lewis and York on the headland, looking out to sea
  const party = [0, 1, 2].map((i) => {
    const fig = makeFigure(g, i === 1 ? "colonial" : "frock", { color: { coat: ["#4a3a2a", "#3a4050", "#5a4a38"][i], hat: "#2a2018" }, mat: { rim: 1.2, rimCol: "#ffe6c0" } });
    const x = -2 + i * 1.6;
    const z = 128 - i * 0.8;
    fig.root.position.set(x, bluffH(x, z - 140), z);
    fig.root.rotation.y = Math.PI + 0.15 * (i - 1);
    g.scene.add(fig.root);
    return fig;
  });
  const foam = new Puffs(sh, 500, { lit: "#ffffff", shade: "#c0c8cc", outline: 0.25, hatch: 0.3, lineSpacing: 4, soft: 0.45, rough: 0.45 });
  g.scene.add(foam.mesh);
  const birds = makeBirds(g, { count: 8, from: [-80, 50, 60], to: [60, 60, -40], spread: [30, 10, 20], size: 1.4, dur: 3.5, seed: "gulls2" });
  g.scene.add(birds.mesh);
  return (f: number, t: number) => {
    party.forEach((fig, i) => fig.pose(i === 0 ? { rSh: [2.6, 0.5, 0], rEl: 0.3, lSh: [0.1, 0.15, 0], neck: 0.1 } : i === 1 ? { lSh: [0.3, 0.2, 0], rSh: [0.6, 0.2, 0], rEl: 1.2, neck: 0.05 } : { lSh: [0.1, 0.15, 0], rSh: [0.1, 0.15, 0], neck: 0.08, headYaw: -0.2 }));
    const fl: Puff[] = [];
    [[-60, -120, 16], [30, -200, 20], [-140, -260, 12], [90, -320, 14]].forEach(([x, z, r], k) => {
      for (let i = 0; i < 40; i++) {
        const ph = (t * 0.5 + hash(i, k) + k * 0.3) % 1;
        const a = hash(i, k, 2) * Math.PI * 2;
        fl.push({ x: x + Math.cos(a) * (r + ph * 6), y: Math.sin(ph * Math.PI) * 10 * hash(i, k, 3), z: z + Math.sin(a) * (r + ph * 6), size: 2 + ph * 5, alpha: Math.sin(ph * Math.PI) * 0.9, seed: i });
      }
    });
    for (let i = 0; i < 160; i++) {
      const ph = (t * 0.35 + hash(i, 40)) % 1;
      fl.push({ x: (hash(i, 41) - 0.5) * 300, y: 0.8, z: 60 - ph * 40, size: 2 + hash(i, 42) * 3, alpha: Math.sin(ph * Math.PI) * 0.7, seed: i });
    }
    foam.set(fl, g.camera);
    birds.update(t);
    const gy = bluffH(0, -10);
    driveCamera(g, [{ f: 0, pos: [-3.5, gy + 2.2, 134], look: [2, gy - 6, 60], fov: 46 }, { f: 60, pos: [-2.5, gy + 2.0, 132.5], look: [3, gy - 8, 50], fov: 46 }], f, 0.006, 31);
  };
};

// E. A breaker explodes against the rocks right in front of the camera
const crashSetup = (g: GL) => {
  const sh = g.shared;
  sh.uSunDir.value.set(-0.5, 0.4, -0.7).normalize();
  sh.uSunCol.value.set(1.2, 1.0, 0.8);
  sh.uSky.value.set(0.5, 0.52, 0.6);
  sh.uGround.value.set(0.3, 0.3, 0.3);
  g.camera.far = 3000;
  const sky = makeSky(sh, { top: "#6d8aae", horizon: "#f0dfc0", bottom: "#8a8a80", glow: 0.9, rays: 0.8, lines: 0.7, lineSpacing: 4, clouds: 0.4, cloudSpeed: 0.08, cloudCol: "#fff4e0", cloudShade: "#9a9098", paper: 0.25 });
  g.scene.add(sky.mesh);
  g.setPost({ fog: [100, 2000, 0.5], fogCol: "#eadcc2" });
  const sea = makeWater(g, { w: 1000, d: 1000, res: 260, y: 0, color: "#3e5462", sky: "#c0c8cc", amp: 1.2, freq: 0.14, speed: 1.4, lineSpacing: 3.5 });
  g.scene.add(sea.mesh);
  const rockM = g.ink({ color: "#5a524a", mode: "screen", angle: 70, scale: 3.4, cross: 0.8, shade: 1, rim: 0.4 });
  [[0, 0, 13, 3.2], [-8, -5, 10, 2.6], [7, -3, 8, 2.2], [3, 8, 4, 2.4], [-4, 6, 3, 1.8]].forEach(([x, z, h, r], i) => {
    const m = new THREE.Mesh(seaStackGeo(i * 5 + 2, h, r), rockM);
    m.position.set(x, -2, z);
    g.scene.add(m);
  });
  const spray = new Smoke(g, 400, { color: "#fbfcfc", hatch: 0.6, rim: 1, shade: 0.4 });
  g.scene.add(spray.mesh);
  const mist = new Puffs(sh, 300, { lit: "#ffffff", shade: "#c8d0d4", outline: 0.15, hatch: 0.25, lineSpacing: 4, soft: 0.6, rough: 0.4 });
  g.scene.add(mist.mesh);
  const drops = new Glows(sh, 200, "#e8f0f4", 0.8);
  g.scene.add(drops.mesh);
  const HIT = 24 / 30;
  return (f: number, t: number) => {
    const sp: Puff[] = [];
    const ms: Puff[] = [];
    const dr: Puff[] = [];
    const a = t - HIT;
    if (a > 0) {
      for (let i = 0; i < 260; i++) {
        const age = a - hash(i, 1) * 0.12;
        if (age < 0) continue;
        const ang = (hash(i, 2) - 0.5) * 2.4;
        const v = 6 + hash(i, 3) * 12;
        const up = 8 + hash(i, 4) * 16;
        const y = 2 + up * age - 4.9 * age * age;
        if (y < -1) continue;
        const p = { x: Math.sin(ang) * v * age, y, z: 4 + Math.cos(ang) * v * age * 0.6, size: 0.4 + age * 2.2, alpha: Math.max(0, 1 - age / 1.8), seed: hash(i, 5) * 9 };
        if (i < 140) sp.push(p);
        else if (i < 220) ms.push({ ...p, size: p.size * 2.5, alpha: p.alpha * 0.6 });
        else dr.push({ ...p, size: 0.08, alpha: p.alpha, stretch: 2 });
      }
    }
    // the swell rolling in before the hit
    for (let i = 0; i < 120; i++) {
      const x = (hash(i, 9) - 0.5) * 40;
      const k = Math.min(1, t / HIT);
      ms.push({ x, y: 0.8 + k * 2.5, z: 30 - k * 24 + hash(i, 10) * 3, size: 1.5 + hash(i, 11) * 2, alpha: a > 0 ? Math.max(0, 0.8 - a) : 0.8, seed: i });
    }
    spray.set(sp);
    mist.set(ms, g.camera);
    drops.set(dr, g.camera);
    driveCamera(g, [{ f: 0, pos: [6, 6.5, -20], look: [0, 5, 4], fov: 52 }, { f: 45, pos: [5, 7.2, -18], look: [0, 6.5, 4], fov: 54 }], f, 0.02, 32);
  };
};

// F. The Alamo's facade inside an ornate oval frame; smoke drifting past
const alamoSetup = (g: GL) => {
  const sh = g.shared;
  sh.uSunDir.value.set(0.6, 0.4, 0.7).normalize();
  sh.uSunCol.value.set(1.25, 1.0, 0.72);
  sh.uSky.value.set(0.5, 0.5, 0.55);
  sh.uGround.value.set(0.32, 0.28, 0.22);
  g.camera.far = 2000;
  const sky = makeSky(sh, { top: "#7a8aa0", horizon: "#f0d8b0", bottom: "#a08a6a", glow: 0.7, rays: 0.5, lines: 0.7, lineSpacing: 4, clouds: 0.35, cloudSpeed: 0.08, cloudCol: "#fbf0dc", cloudShade: "#9a8a80", paper: 0.25 });
  g.scene.add(sky.mesh);
  g.setPost({ fog: [60, 800, 0.4], fogCol: "#e4d4b4" });
  const ground = makeGround(g, { size: 800, res: 120, y: 0, amp: 1, freq: 0.05, color: "#b8a078", mat: { mode: "stipple", hatch: 0.8 } });
  g.scene.add(ground.mesh);
  const al = makeAlamo(g);
  g.scene.add(al.group);
  const trees = [makeTree(g, "at1", 11, 6), makeTree(g, "at2", 9, 5)];
  trees[0].group.position.set(24, 0, -26);
  trees[1].group.position.set(-44, 0, -24);
  trees.forEach((tr) => g.scene.add(tr.group));
  const smoke = new Smoke(g, 200, { color: "#e8e2d8", hatch: 0.8 });
  g.scene.add(smoke.mesh);
  const embers = new Glows(sh, 80, "#ffb060", 1);
  g.scene.add(embers.mesh);
  g.enableShadows(2048, 30, 80);
  return (f: number, t: number) => {
    drawIn(al.mats, f, -2, 30, 0.3);
    const sm: Puff[] = [];
    emit({ at: [20, 7, -8], rate: 9, life: 8, vel: [-4, 1.3, 0], spread: 0.6, size: [1.2, 4.5], drag: 0.3, alpha: 0.9, seed: 3, prewarm: 8, jitter: [2, 2, 3] }, t, sm);
    smoke.set(sm);
    const em: Puff[] = [];
    for (let i = 0; i < 60; i++) {
      const u = (hash(i, 1) + t * 0.25) % 1;
      em.push({ x: -10 + hash(i, 2) * 30 - u * 6, y: u * 10, z: 4 + hash(i, 3) * 8, size: 0.06, alpha: Math.sin(u * Math.PI) });
    }
    embers.set(em, g.camera);
    driveCamera(g, [{ f: 0, pos: [6, 3, 34], look: [0, 6, 0], fov: 40 }, { f: 75, pos: [3, 2.6, 28], look: [0, 6.5, 0], fov: 40 }], f, 0.005, 33);
  };
};

const AlamoShot: React.FC = () => {
  const f = useCurrentFrame();
  const pal = usePalette();
  const frame = memo("md:alframe", () => {
    const outer = ellipseP(960, 520, 690, 430, 90);
    const inner = ellipseP(960, 520, 660, 405, 90);
    const beads: string[] = [];
    for (let k = 0; k < 72; k++) {
      const a = (k / 72) * TAU;
      beads.push(polyD(ellipseP(960 + Math.cos(a) * 676, 520 + Math.sin(a) * 418, 5, 5, 8)));
    }
    return [
      L(polyD(outer), 5),
      L(polyD(inner), 2.2),
      L(beads.join(""), 1.4),
      L(polyD(ellipseP(960, 520, 710, 448, 90)), 1.4),
      ...[-1, 1].map((sd) => L(smoothD([[960 + sd * 600, 860], [960 + sd * 720, 900], [960 + sd * 760, 820], [960 + sd * 700, 790], [960 + sd * 680, 840]]), 2.4)),
      F(polyD(rectP(730, 60, 460, 70)), "paper", 1),
      L(polyD(rectP(730, 60, 460, 70)), 3),
      L(polyD(rectP(740, 70, 440, 50)), 1.2),
    ];
  });
  const clip = `path('${polyD(ellipseP(960, 520, 662, 407, 90))}')`;
  return (
    <AbsoluteFill>
      <Camera keys={[{ f: 0, z: 0.98 }, { f: 75, z: 1.06, y: -10 }]} handheld={2} seed={35}>
        <Layer depth={0.5}>
          <g transform="translate(960 540) scale(3.2) translate(-760 -760)">
            <MapBase cues={{ border: -999, sea: -999, land: -999, original: -999, louisiana: -999, rivers: -999, labels: -999, allFilled: false }} showCartouche={false} />
          </g>
          <rect x={-400} y={-400} width={2720} height={1900} fill={pal.paper} opacity={0.55} />
        </Layer>
      </Camera>
      <AbsoluteFill style={{ clipPath: clip }}>
        <GLShot setup={alamoSetup} />
      </AbsoluteFill>
      <Camera keys={[{ f: 0, z: 1 }]} seed={36}>
        <Layer depth={1}>
          <InkDraw items={frame} start={0} dur={20} />
          <text x={960} y={107} textAnchor="middle" fontFamily={DISPLAY_FAMILY} fontWeight={800} fontSize={32} letterSpacing={7} fill={pal.ink} opacity={ramp(f, 14, 26)}>
            THE ALAMO · MDCCCXXXVI
          </text>
        </Layer>
      </Camera>
    </AbsoluteFill>
  );
};

// G. The wagon train rolls west: turning wheels, plodding oxen, dust, the Rockies
const wagonSetup = (g: GL) => {
  const sh = g.shared;
  sh.uSunDir.value.set(-0.8, 0.3, -0.5).normalize();
  sh.uSunCol.value.set(1.3, 1.0, 0.7);
  sh.uSky.value.set(0.5, 0.5, 0.58);
  sh.uGround.value.set(0.34, 0.28, 0.2);
  g.camera.far = 8000;
  const sky = makeSky(sh, { top: "#6a86ae", horizon: "#f2d6a8", bottom: "#a08a68", glow: 1, sunSize: 0.05, rays: 0.8, rayCount: 26, lines: 0.7, lineSpacing: 4, clouds: 0.35, cloudSpeed: 0.05, cloudCol: "#fff0d8", cloudShade: "#9a8a86", paper: 0.25 });
  g.scene.add(sky.mesh);
  g.setPost({ fog: [300, 6000, 0.55], fogCol: "#eadcc0" });
  const plain = makeGround(g, { size: 4000, res: 160, y: 0, amp: 8, freq: 0.004, color: "#b0a070", mat: { mode: "stipple", hatch: 0.8 } });
  g.scene.add(plain.mesh);
  const rockies = new THREE.Mesh(
    terrain(9000, 2000, 300, 100, (x, z) => Math.max(0, ridged2(x * 0.0012, z * 0.0015, 6, 7) * 1500 - 350) * Math.min(1, (1000 - Math.abs(z)) / 600)),
    g.ink({ color: "#8a8a9a", mode: "screen", angle: 40, scale: 3.4, cross: 0.7, shade: 1, frag: "albedo = mix(albedo, vec3(0.97, 0.97, 1.0), smoothstep(700.0, 900.0, vWorld.y) * smoothstep(0.3, 0.7, N.y));" }),
  );
  rockies.position.set(0, -20, -3200);
  g.scene.add(rockies);
  const W = wagonGeo();
  const woodM = g.ink({ color: "#6a4e34", mode: "screen", angle: 70, scale: 3.4, rim: 0.5 });
  const canvasM = g.ink({ color: "#efe6d0", mode: "screen", angle: 80, scale: 3.4, cross: 0.4, rim: 0.7, side: THREE.DoubleSide, frag: "extraInk += smoothstep(0.42, 0.5, abs(fract(vUv.y * 5.0) - 0.5)) * 0.4;" });
  const wheelM = g.ink({ color: "#5a4230", mode: "screen", angle: 60, scale: 3.4 });
  const train = [0, 1, 2, 3].map((i) => {
    const wg = new THREE.Group();
    wg.add(new THREE.Mesh(W.wood, woodM), new THREE.Mesh(W.canvas, canvasM));
    const wheels: THREE.Mesh[] = [];
    for (const [x, z, big] of [
      [0.75, 1.2, 0],
      [-0.75, 1.2, 0],
      [0.75, -1.3, 1],
      [-0.75, -1.3, 1],
    ] as [number, number, number][]) {
      const w = new THREE.Mesh(big ? W.bigWheel : W.wheel, wheelM);
      w.position.set(x, big ? 0.75 : 0.6, z);
      wg.add(w);
      wheels.push(w);
    }
    const oxen = [0, 1, 2, 3].map((k) => {
      const ox = makeOx(g, k % 2 ? "#6a4e34" : "#7a6048");
      ox.root.position.set(k % 2 ? 0.6 : -0.6, 0, 4.2 + Math.floor(k / 2) * 2.6);
      ox.root.scale.setScalar(0.85);
      wg.add(ox.root);
      return ox;
    });
    const walker = makeFigure(g, "frock", { color: { coat: "#4a3a2a" } });
    walker.root.position.set(1.5, 0, 5);
    wg.add(walker.root);
    wg.rotation.y = -Math.PI / 2 + 0.25;
    g.scene.add(wg);
    return { wg, wheels, oxen, walker, off: i * 16 };
  });
  const dust = new Puffs(sh, 400, { lit: "#f0dcb4", shade: "#b09a78", outline: 0.15, hatch: 0.3, lineSpacing: 4, soft: 0.6, rough: 0.4 });
  g.scene.add(dust.mesh);
  return (f: number, t: number) => {
    const speed = 1.5;
    const ds: Puff[] = [];
    train.forEach((w, i) => {
      const d = t * speed - w.off;
      const dir = new THREE.Vector3(Math.cos(0.25), 0, -Math.sin(0.25));
      w.wg.position.set(-d * dir.x * -1 * -1, 0, -d * dir.z);
      w.wg.position.set(-(t * speed) * 1 + i * -15, 0, i * 4);
      w.wheels.forEach((wh, k) => (wh.rotation.x = (t * speed) / (k >= 2 ? 0.75 : 0.6)));
      w.oxen.forEach((ox, k) => ox.walk(t * 3.2 + k * 0.7));
      const ph = t * 4 + i;
      w.walker.pose({ lHip: [Math.sin(ph) * 0.4, 0.05], rHip: [-Math.sin(ph) * 0.4, 0.05], lKn: Math.max(0, -Math.sin(ph)) * 0.6, rKn: Math.max(0, Math.sin(ph)) * 0.6, lSh: [-Math.sin(ph) * 0.3, 0.1, 0], rSh: [Math.sin(ph) * 0.3, 0.1, 0] });
      const p = w.wg.position;
      emit({ at: [p.x + 2, 0.3, p.z], rate: 12, life: 2.5, vel: [1.5, 0.5, 0.3], spread: 0.6, size: [0.4, 2.4], drag: 0.6, alpha: 0.4, seed: 10 + i, prewarm: 3, jitter: [1.5, 0.2, 1.5] }, t, ds);
    });
    dust.set(ds, g.camera);
    driveCamera(g, [{ f: 0, pos: [2, 2.4, 22], look: [-16, 2.2, 2], fov: 44 }, { f: 60, pos: [-2, 2.6, 21], look: [-20, 2.4, 2], fov: 44 }], f, 0.01, 34);
  };
};

const shot = (setup: (g: GL) => (f: number, t: number) => void) => {
  const C: React.FC = () => <GLShot setup={setup} />;
  return <C />;
};

const m0 = () => getUSMap();
const at = (k: keyof typeof PLACES) => m0().proj(PLACES[k]);

export const manifest: SceneDef = {
  id: "manifest",
  seedBase: 30,
  shots: [
    {
      from: 0,
      dur: c(2.5),
      el: <MapShot at={0} cam={(sf) => ({ x: lerp(30, -10, easeInOut(clamp(sf / 75))), y: 10, z: lerp(0.97, 1.06, easeInOut(clamp(sf / 75))) })} />,
      enter: "burn",
      origin: [1500, 900],
      name: "map wide",
    },
    {
      from: c(2.5),
      dur: c(5) - c(2.5),
      el: (
        <MapShot
          at={c(2.5)}
          cam={(sf, canoe) => {
            const t = easeInOut(clamp((sf - c(2.5)) / 75));
            const stl = at("stLouis");
            const k = clamp(t * 1.6);
            const p = { x: lerp(stl[0] - 60, canoe.x, k), y: lerp(stl[1] + 40, canoe.y, k) };
            return centerOn(p, lerp(1.9, 2.7, t));
          }}
        />
      ),
      enter: "punch",
      name: "louisiana + canoe",
    },
    {
      from: c(5),
      dur: c(7) - c(5),
      el: (
        <MapShot
          at={c(5)}
          waves
          cam={(sf, canoe) => {
            const t = easeInOut(clamp((sf - c(5)) / 60));
            return centerOn({ x: canoe.x + 60, y: canoe.y + 30 }, lerp(2.3, 1.7, t));
          }}
        />
      ),
      enter: "whip",
      name: "fly west",
    },
    { from: c(7), dur: c(9) - c(7), el: shot(pacificSetup), enter: "ink", origin: [300, 700], name: "pacific" },
    { from: c(9), dur: c(10.5) - c(9), el: shot(crashSetup), enter: "punch", name: "crash" },
    { from: c(10.5), dur: c(13) - c(10.5), el: <AlamoShot />, enter: "burn", origin: [1700, 200], name: "alamo" },
    { from: c(13), dur: c(15) - c(13), el: shot(wagonSetup), enter: "morph", name: "wagons" },
    {
      from: c(15),
      dur: c(17) - c(15),
      el: (
        <MapShot
          at={c(15)}
          oregon
          waves
          cam={(sf) => {
            const t = easeInOut(clamp((sf - c(15)) / 60));
            return { x: lerp(420, -420, t), y: lerp(-40, 0, t), z: lerp(1.7, 1.25, t) };
          }}
        />
      ),
      enter: "whip",
      name: "states fill west",
    },
  ],
  hits: [
    { f: c(0.5), amp: 16, dur: 14, punch: 0.03 },
    { f: c(9) + 24, amp: 18, dur: 14 },
  ],
  Overlay: () => (
    <>
      <YearSlam text="1805" startFrame={c(0.5) - 5} fontSize={300} display scrim={0.8} exitAt={c(2.2)} />
      <Quote {...QUOTES.clark} start={c(7)} end={c(10.5)} framesPerWord={3} />
      <Quote {...QUOTES.alamo} start={c(10.5) + 4} end={c(13)} framesPerWord={3} />
      <Quote {...QUOTES.osullivan} start={c(13)} end={c(17)} framesPerWord={3} />
    </>
  ),
};

