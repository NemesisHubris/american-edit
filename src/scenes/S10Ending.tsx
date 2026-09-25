// 10. ENDING — silence. The flag ripples in slow motion at sunrise, sun rays
// sweeping across it; title card "AMERICA" / "EST. 1776"; hold; cut to black.
import * as THREE from "three";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { DISPLAY_FAMILY } from "../fonts";
import { clamp, easeOut, ramp } from "../lib/math";
import { hash, rng } from "../lib/random";
import { sceneClock } from "../timeline";
import { GLShot, GL, driveCamera } from "../gl/GLShot";
import { makeSky } from "../gl/sky";
import { makeFlag } from "../gl/models/flag";
import { makeBirds, makeGround, makeReeds } from "../gl/env";
import { makeTree } from "../gl/models/civilwar";
import { Glows, Puff } from "../gl/particles";
import type { SceneDef } from "./types";

const c = sceneClock("ending");

// Sunrise over rolling hills; the flag on a tall pole ripples in slow motion,
// sun rays sweep across it; dust motes drift through the light.
const sunriseSetup = (wide: boolean, t0: number) => (g: GL) => {
  const sh = g.shared;
  sh.uSunDir.value.set(0.75, 0.12, -0.65).normalize();
  sh.uSunCol.value.set(1.4, 1.0, 0.62);
  sh.uSky.value.set(0.45, 0.45, 0.58);
  sh.uGround.value.set(0.3, 0.22, 0.18);
  g.camera.far = 4000;
  const sky = makeSky(sh, { top: "#27477e", horizon: "#ffc27a", bottom: "#6a4a3a", glow: 1.4, sunSize: 0.07, sunCol: "#fff0c0", rays: 1.3, rayCount: 30, lines: 0.6, lineSpacing: 4, clouds: 0.3, cloudSpeed: 0.02, cloudScale: 1.2, cloudHeight: 0.18, cloudCol: "#ffd8b0", cloudShade: "#7a5a6a", paper: 0.05 });
  g.scene.add(sky.mesh);
  g.setPost({ fog: [200, 2500, 0.55], fogCol: "#f0c090", sat: 1.1 });
  const hills = makeGround(g, { size: 5000, res: 220, y: -6, amp: 90, freq: 0.0022, color: "#5a6a3a", flat: (x, z) => Math.min(1, Math.hypot(x, z) / 160), mat: { mode: "stipple", hatch: 0.8 } });
  const r = rng("etrees");
  for (let i = 0; i < 14; i++) {
    const tr = makeTree(g, `et${i}`, 12 + r() * 10, 6 + r() * 4, 40);
    tr.group.position.set(-260 + i * 40 + r() * 20, -3, -180 - r() * 160);
    g.scene.add(tr.group);
  }
  g.scene.add(hills.mesh);
  const grass = makeReeds(g, { count: 4000, x: [-14, 14], z: [-10, 6], y: -0.1, h: [0.2, 0.7], w: 0.02, color: "#6a7a40", seed: "egrass", sway: 0.15, wind: 0.6, edges: 0 });
  g.scene.add(grass.mesh);
  const poleM = g.ink({ color: "#e8e2d4", mode: "screen", angle: 80, scale: 3.2, spec: 1.2, gloss: 50, rim: 0.8 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 14, 16).translate(0, 7, 0), poleM);
  g.scene.add(pole);
  const goldM = g.ink({ color: "#d9a640", spec: 2, gloss: 60, rim: 1, rimCol: "#fff0b0", mode: "screen", angle: 40, scale: 3.5 });
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 16), goldM);
  ball.position.y = 14.15;
  g.scene.add(ball);
  const flag = makeFlag(g, { w: 6, h: 3.16, stars: 50, wind: 0.2, speed: 0.4, droop: 0.04, wrinkle: 0.6 });
  flag.mesh.position.set(0.09, 13.9, 0);
  flag.mesh.rotation.y = -0.2;
  g.scene.add(flag.mesh);
  const motes = new Glows(sh, 160, "#ffe4b0", 0.3);
  g.scene.add(motes.mesh);
  const birds = makeBirds(g, { count: 5, from: [-120, 30, -140], to: [120, 42, -160], spread: [20, 6, 10], size: 1.2, dur: 5, seed: "eb" });
  g.scene.add(birds.mesh);
  return (f: number) => {
    const T = (f + t0) / 30;
    // the light band sweeping across the cloth
    const sweep = ((T * 0.35) % 1.4) - 0.2;
    sh.uPL0.value.set(-2 + sweep * 12, 14, 4, 5);
    sh.uPLc0.value.setRGB(0.9, 0.7, 0.4);
    sh.uSunDir.value.set(0.75, 0.12 + T * 0.01, -0.65).normalize();
    birds.update(T);
    const m: Puff[] = [];
    for (let i = 0; i < 140; i++) m.push({ x: -6 + hash(i, 1) * 14 + Math.sin(T * 0.4 + i) * 0.3, y: 8 + hash(i, 2) * 8 + Math.sin(T * 0.3 + i * 2) * 0.3, z: -3 + hash(i, 3) * 8, size: 0.03, alpha: 0.5 + 0.4 * Math.sin(T * 2 + i) });
    motes.set(m, g.camera);
    if (wide) driveCamera(g, [{ f: 0, pos: [-6, 8.5, 30], look: [-3, 11.5, 0], fov: 38 }, { f: 108, pos: [-6.5, 8.8, 27], look: [-3, 11.8, 0], fov: 38 }], f, 0.002, 102);
    else driveCamera(g, [{ f: 0, pos: [8, 12.2, 7.5], look: [2.6, 12.4, 0], fov: 40 }, { f: 120, pos: [5.2, 12.6, 8.8], look: [2.8, 12.2, 0], fov: 40 }], f, 0.002, 101);
  };
};

const flagSetup = sunriseSetup(false, 0);
const titleSetup = sunriseSetup(true, 120);

// A. Close on the flag at sunrise, slow motion
const FlagShot: React.FC = () => <GLShot setup={flagSetup} color />;

// B. Title card over the flag: AMERICA / EST. 1776, then hold
const TitleShot: React.FC = () => {
  const f = useCurrentFrame();
  const letters = "AMERICA".split("");
  const shine = -30 + ((f - 30) / 50) * 140;
  const est = ramp(f, 24, 40, easeOut);
  return (
    <AbsoluteFill>
      <GLShot setup={titleSetup} color />
      <AbsoluteFill>
        <AbsoluteFill style={{ background: "radial-gradient(ellipse 70% 55% at 50% 52%, rgba(6,10,28,0.72), rgba(6,10,28,0.25) 70%, rgba(6,10,28,0) 100%)" }} />
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column" }}>
          <div style={{ display: "flex", fontFamily: DISPLAY_FAMILY, fontWeight: 900, fontSize: 230, letterSpacing: 26, lineHeight: 1 }}>
            {letters.map((ch, i) => {
              const p = easeOut(clamp((f - 2 - i * 3) / 14));
              return (
                <span
                  key={i}
                  style={{
                    display: "inline-block",
                    opacity: p,
                    transform: `translateY(${(1 - p) * 60}px) scale(${1.25 - 0.25 * p})`,
                    filter: `blur(${(1 - p) * 12}px)`,
                    backgroundImage: `linear-gradient(100deg, #b8862a 0%, #f7dc8a ${Math.max(0, shine - 12)}%, #fffbe8 ${shine}%, #f7dc8a ${shine + 12}%, #b8862a 100%)`,
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                    WebkitTextStroke: "2px rgba(40,24,6,0.9)",
                    textShadow: "0 10px 40px rgba(0,0,0,0.5)",
                  }}
                >
                  {ch}
                </span>
              );
            })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 30, marginTop: 30, opacity: est, transform: `translateY(${(1 - est) * 20}px)` }}>
            <div style={{ width: 220 * est, height: 3, background: "linear-gradient(90deg, rgba(247,220,138,0), #f7dc8a)" }} />
            <span style={{ color: "#f7dc8a", fontSize: 40 }}>★</span>
            <span style={{ fontFamily: DISPLAY_FAMILY, fontWeight: 700, fontSize: 64, letterSpacing: 18, color: "#fbf1d4", textShadow: "0 4px 18px rgba(0,0,0,0.7)" }}>EST. 1776</span>
            <span style={{ color: "#f7dc8a", fontSize: 40 }}>★</span>
            <div style={{ width: 220 * est, height: 3, background: "linear-gradient(90deg, #f7dc8a, rgba(247,220,138,0))" }} />
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Black: React.FC = () => <AbsoluteFill style={{ backgroundColor: "#000" }} />;

export const ending: SceneDef = {
  id: "ending",
  seedBase: 100,
  shots: [
    { from: 0, dur: c(4), el: <FlagShot />, enter: "ink", origin: [960, 500], palette: "color", name: "flag at sunrise" },
    { from: c(4), dur: c(7.5) - c(4), el: <TitleShot />, enter: "morph", palette: "color", name: "title card" },
    { from: c(7.5), dur: c(8) - c(7.5), el: <Black />, enter: "cut", palette: "color", overlay: { texture: 0, vignette: 0, grain: 0 }, name: "cut to black" },
  ],
};

