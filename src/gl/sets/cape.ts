// The Kennedy Space Center pad at dawn: Saturn V on the mobile launcher, the
// umbilical tower, marsh, lagoon, the VAB on the horizon, cumulus banks,
// venting vapour, searchlights and gulls. Shared by the pause, drop and cold open.
import * as THREE from "three";
import type { GL } from "../GLShot";
import { makeSky } from "../sky";
import { makeLaunchTower, makeSaturn } from "../models/saturn";
import { makeBirds, makeGround, makeReeds, makeWater } from "../env";
import { beamMaterial, cumulus, emit, Puff, Smoke } from "../particles";

// shared dawn set: lights, sky, pad, rocket, tower, marsh, clouds, vapour
export const dawnSet = (g: GL) => {
  const sh = g.shared;
  sh.uSunDir.value.set(-0.5, 0.1, -0.86).normalize();
  sh.uSunCol.value.set(1.15, 0.85, 0.55);
  sh.uSky.value.set(0.55, 0.58, 0.68);
  sh.uGround.value.set(0.32, 0.26, 0.2);
  g.camera.far = 2400;
  const sky = makeSky(sh, { top: "#2f4f80", horizon: "#f4b877", bottom: "#6d5b4c", horizonY: 0.0, glow: 0.9, sunSize: 0.06, sunDir: new THREE.Vector3(-0.5, 0.02, -0.86).normalize(), rays: 0.8, rayCount: 26, lines: 0.75, lineSpacing: 4, stars: 0.5, paper: 0.22 });
  g.scene.add(sky.mesh);
  g.setPost({ fog: [500, 2600, 0.5], fogCol: "#ecd2ad", edgeW: 1.1 });

  const rocket = makeSaturn(g);
  rocket.group.traverse((o) => (o.name = o.name || "rocket"));
  g.scene.add(rocket.group);
  const tower = makeLaunchTower(g);
  tower.group.children.forEach((o, i) => (o.name = `tower${i}`));
  g.scene.add(tower.group);

  // pad hardstand + surrounding land
  const pad = g.ink({ color: "#a39a8a", mode: "world", dir: [1, 0, 0.3], scale: 0.8 });
  const padMesh = new THREE.Mesh(new THREE.CylinderGeometry(120, 135, 4, 64), pad);
  padMesh.position.y = -15.6;
  padMesh.name = "pad";
  g.scene.add(padMesh);
  const land = makeGround(g, { size: 3400, res: 200, y: -14, amp: 10, freq: 0.003, color: "#7d7456", flat: (x, z) => Math.min(1, Math.max(0, (Math.hypot(x, z) - 160) / 300)) });
  land.mesh.name = "land";
  g.scene.add(land.mesh);
  const water = makeWater(g, { w: 1400, d: 520, res: 180, y: -13.2, color: "#5d6a70", sky: "#e6c9a4", amp: 0.25, freq: 0.3, speed: 0.6, lineSpacing: 4.5 });
  water.mesh.position.z = 420;
  g.scene.add(water.mesh);

  // the Vehicle Assembly Building on the horizon, scrub along the shore
  const vab = g.ink({
    color: "#dcd6c8",
    mode: "world",
    dir: [1, 0, 0.05],
    scale: 0.22,
    cross: 0.5,
    frag: `
      float door = step(abs(vObj.x), 24.0) * step(vObj.y, 62.0) * step(78.0, vObj.z);
      albedo = mix(albedo, albedo * 0.7, door);
      extraInk += door * 0.15 + step(76.0, vObj.y) * 0.1;
    `,
  });
  const vabMesh = new THREE.Mesh(new THREE.BoxGeometry(218, 160, 158), vab);
  vabMesh.position.set(-1250, 66, -2000);
  vabMesh.rotation.y = 0.35;
  vabMesh.name = "vab";
  g.scene.add(vabMesh);
  const annex = new THREE.Mesh(new THREE.BoxGeometry(120, 60, 130), vab);
  annex.position.set(-1080, 16, -1930);
  annex.rotation.y = 0.35;
  g.scene.add(annex);
  const marsh = makeReeds(g, { count: 5000, x: [-500, 500], z: [120, 200], y: -13.6, h: [2, 5], w: 0.35, color: "#6a6640", seed: "marsh", sway: 0.12 });
  g.scene.add(marsh.mesh);
  const birds = makeBirds(g, { count: 9, from: [260, 95, 170], to: [-240, 110, 150], spread: [30, 14, 20], size: 2.2, dur: 3.2, seed: "gulls" });
  g.scene.add(birds.mesh);

  // distant cumulus banks catching the dawn
  const cloudPuffs = new Smoke(g, 400, { color: "#fff4e4", shade: 0.45, rim: 1.2, hatch: 0.8 });
  g.scene.add(cloudPuffs.mesh);
  const bankList = [
    cumulus(-620, 40, -1700, 240, 90, "b1", 34),
    cumulus(-250, 30, -1850, 300, 80, "b2", 36),
    cumulus(420, 36, -1750, 260, 100, "b3", 30),
    cumulus(900, 50, -1600, 220, 80, "b4", 28),
    cumulus(-1100, 60, -1500, 200, 70, "b5", 24),
    cumulus(150, 420, -1900, 360, 40, "b6", 26),
  ].flat();
  const banks = (t: number) => bankList.map((p) => ({ ...p, x: p.x + t * 6 }));
  // vapour from the vents + ground steam
  const puffs = new Smoke(g, 700, { color: "#f7f3ec" });
  g.scene.add(puffs.mesh);
  const vapour = (t: number, ground = true) => {
    const list: Puff[] = [];
    rocket.vents.forEach((v, i) =>
      emit({ at: v, rate: 9, life: 4.5, vel: [v[0] > 0 ? 3 : -3, -1.2, v[2] * 0.3], spread: 0.8, size: [1.0, 5.5], wind: [1.2, -0.4, 0.3], drag: 0.8, alpha: 0.85, seed: 10 + i, prewarm: 5 }, t, list),
    );
    if (ground)
    for (let k = 0; k < 4; k++)
      emit({ at: [-30 + k * 22, -9, 18 - k * 6], rate: 3, life: 8, vel: [2.5, 1.2, 0.8], spread: 1.2, size: [5, 16], wind: [0.8, 0.15, 0.2], alpha: 0.7, seed: 40 + k, prewarm: 8, jitter: [8, 0, 8] }, t, list);
    return list;
  };

  // searchlights raking the rocket
  const beams: THREE.Mesh[] = [];
  const bm = beamMaterial("#ffe2b0", 0.22);
  for (const [x, z, tx, ty] of [
    [70, 60, 0, 70],
    [-60, 80, -2, 95],
    [40, -70, 0, 50],
  ] as [number, number, number, number][]) {
    const from = new THREE.Vector3(x, -12, z);
    const to = new THREE.Vector3(tx, ty, 0);
    const len = from.distanceTo(to) * 1.25;
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(9, 0.6, len, 24, 1, true), bm);
    cone.geometry.translate(0, len / 2, 0);
    cone.position.copy(from);
    cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize());
    cone.name = "beam";
    g.scene.add(cone);
    beams.push(cone);
  }
  return { rocket, tower, puffs, vapour, banks, cloudPuffs, beams, birds, inks: [...rocket.mats, ...tower.mats] };
};

