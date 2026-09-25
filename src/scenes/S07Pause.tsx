// 7. THE PAUSE — near-silent. Saturn V on the pad at dawn, vapor venting,
// the full Moon rising behind it, a slow tilt up the length of the rocket.
import * as THREE from "three";
import { Quote } from "../components/WordPop";
import { QUOTES } from "../quotes";
import { sceneClock } from "../timeline";
import { GLShot, GL, driveCamera, drawIn } from "../gl/GLShot";
import { makeMoon } from "../gl/models/moon";
import { makeReeds } from "../gl/env";
import { dawnSet } from "../gl/sets/cape";
import type { SceneDef } from "./types";

const c = sceneClock("pause");

// A. Wide: the rocket and tower at dawn, moon rising behind, marsh reeds in front
const padSetup = (g: GL) => {
  const set = dawnSet(g);
  const moon = makeMoon(g, 62, { hatch: 0.5, bump: 0.5 });
  moon.mesh.name = "moon";
  moon.mat.uniforms.uSunDir = { value: new THREE.Vector3(0.3, 0.2, 1).normalize() };
  g.scene.add(moon.mesh);
  const reeds = makeReeds(g, { count: 1400, x: [-30, 120], z: [380, 425], y: -13.4, h: [2, 6], w: 0.12, color: "#5a5634", seed: "padreeds", sway: 0.22 });
  g.scene.add(reeds.mesh);
  return (f: number, t: number) => {
    driveCamera(
      g,
      [
        { f: 0, pos: [64, -7, 450], look: [-22, 62, 0], fov: 26 },
        { f: 80, pos: [44, -5, 380], look: [-20, 66, 0], fov: 23 },
      ],
      f,
      0.004,
      3,
    );
    moon.mesh.position.set(-150, 70 + Math.min(1, f / 80) * 90, -560);
    moon.mesh.rotation.y = 0.6;
    set.cloudPuffs.set(set.banks(t), g.camera);
    set.puffs.set(set.vapour(t), g.camera);
    drawIn(set.inks, f, -6, 34, 0.35);
  };
};

// B. Slow tilt up the length of the rocket; the moon behind the escape tower
const tiltSetup = (g: GL) => {
  const set = dawnSet(g);
  const moon = makeMoon(g, 40, { hatch: 0.5, bump: 0.5 });
  moon.mat.uniforms.uSunDir = { value: new THREE.Vector3(-0.3, -0.1, -1).normalize() };
  g.scene.add(moon.mesh);
  return (f: number, t: number) => {
    const k = Math.min(1, Math.max(0, f / 78));
    const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    // camera on the far side: the tower stands behind the rocket
    const pos = new THREE.Vector3(26 - e * 4, 6 + e * 10, -64 + e * 4);
    g.camera.position.copy(pos);
    g.camera.fov = 42 - e * 4;
    g.camera.lookAt(new THREE.Vector3(0, 10 + e * 112, 0));
    g.camera.rotateZ(Math.sin(t * 0.7) * 0.004);
    g.camera.updateProjectionMatrix();
    const dir = new THREE.Vector3(-0.1, 0.95, 0.3).normalize();
    moon.mesh.position.set(0, 0, 0).addScaledVector(dir, 900).add(new THREE.Vector3(18, 0, 0));
    const vap = set.vapour(t + 2).map((p) => ({ ...p, size: p.size * 0.7, alpha: p.alpha * 0.8 }));
    set.puffs.set(vap, g.camera);
    set.cloudPuffs.set(set.banks(t), g.camera);
    set.birds.update(t + 1);
    drawIn(set.inks, f, -30, 20, 0.3);
  };
};

const PadShot: React.FC = () => <GLShot setup={padSetup} />;
const TiltShot: React.FC = () => <GLShot setup={tiltSetup} />;

export const pause: SceneDef = {
  id: "pause",
  seedBase: 70,
  shots: [
    { from: 0, dur: c(2.5), el: <PadShot />, enter: "ink", origin: [1080, 500], name: "pad at dawn" },
    { from: c(2.5), dur: c(5) - c(2.5), el: <TiltShot />, enter: "zoom", name: "tilt up" },
  ],
  Overlay: () => <Quote {...QUOTES.kennedy} start={c(0.5) + 6} end={c(5)} framesPerWord={4} />,
};
