// Civil War / Lincoln era: Napoleon 12-pounder on its carriage, a worm
// (zig-zag) split-rail fence, the Lincoln Memorial (Doric colonnade, attic
// frieze, seated statue), a stovepipe-hatted Lincoln silhouette, trees.
import * as THREE from "three";
import { memo } from "../../lib/math";
import { rng } from "../../lib/random";
import { box, cyl, extrude, lathe, merge, place, smoothIco } from "../geo";
import { fbm2 } from "../noise";
import type { GL } from "../GLShot";

// ------------------------------------------------------------ Napoleon cannon
// barrel along +z (muzzle forward), axle at origin, wheels r = 0.7 m
export const cannonGeo = () =>
  memo("gl:cannon", () => {
    const barrel = lathe(
      [
        [0, -0.72],
        [0.07, -0.74],
        [0.11, -0.7],
        [0.14, -0.62],
        [0.2, -0.56],
        [0.22, -0.4],
        [0.2, -0.3],
        [0.18, 0.1],
        [0.16, 0.6],
        [0.14, 1.0],
        [0.15, 1.08],
        [0.16, 1.14],
        [0.1, 1.15],
        [0.07, 1.14],
        [0.07, 0.9],
        [0.0, 0.9],
      ],
      36,
    );
    barrel.rotateX(Math.PI / 2);
    const trunnions = cyl(0.06, 0.06, 0.5, 12).rotateZ(Math.PI / 2);
    // trail: two cheeks joining into a single trail to the ground
    const cheek = extrude(
      [
        [-0.2, 0.25],
        [0.25, 0.25],
        [0.22, 0.05],
        [-1.9, -0.55],
        [-2.0, -0.62],
        [-2.05, -0.5],
      ],
      0.08,
    );
    cheek.rotateY(Math.PI / 2);
    const cheeks = merge([place(cheek, [0.2, 0, 0]), place(cheek, [-0.2, 0, 0]), box(0.5, 0.1, 0.3, 0, -0.5, -1.7), box(0.5, 0.08, 0.12, 0, 0.1, -0.6)]);
    const axle = cyl(0.06, 0.06, 1.5, 10).rotateZ(Math.PI / 2);
    // wheel: rim + 14 spokes + hub
    const wheelParts: THREE.BufferGeometry[] = [];
    const rim = new THREE.TorusGeometry(0.66, 0.05, 8, 48);
    rim.rotateY(Math.PI / 2);
    wheelParts.push(rim);
    const tyre = new THREE.TorusGeometry(0.71, 0.022, 6, 48);
    tyre.rotateY(Math.PI / 2);
    wheelParts.push(tyre);
    for (let k = 0; k < 14; k++) {
      const a = (k / 14) * Math.PI * 2;
      const sp = new THREE.CylinderGeometry(0.025, 0.035, 0.6, 6);
      sp.translate(0, 0.35, 0);
      sp.rotateX(a);
      wheelParts.push(sp);
    }
    wheelParts.push(cyl(0.12, 0.14, 0.26, 16).rotateZ(Math.PI / 2));
    const wheel = merge(wheelParts);
    return { barrel, trunnions, cheeks, axle, wheel };
  });

export const makeCannon = (g: GL) => {
  const G = cannonGeo();
  const bronzeM = g.ink({ color: "#8a6b3a", mode: "u", scale: 60, scale2: 40, spec: 1.1, gloss: 30, rim: 0.6 });
  const woodM = g.ink({ color: "#5b6b4a", mode: "screen", angle: 70, scale: 3.5, cross: 0.6, rim: 0.3 });
  const ironM = g.ink({ color: "#2f2d2a", mode: "screen", angle: 20, scale: 3.5, spec: 0.5 });
  const root = new THREE.Group();
  const carriage = new THREE.Group();
  root.add(carriage);
  const barrel = new THREE.Group();
  barrel.add(new THREE.Mesh(G.barrel, bronzeM), new THREE.Mesh(G.trunnions, bronzeM));
  barrel.position.set(0, 0.28, 0.1);
  barrel.rotation.x = -0.06;
  carriage.add(barrel, new THREE.Mesh(G.cheeks, woodM), new THREE.Mesh(G.axle, ironM));
  const wheels = [-0.7, 0.7].map((x) => {
    const w = new THREE.Mesh(G.wheel, woodM);
    w.position.set(x, 0, 0);
    carriage.add(w);
    return w;
  });
  carriage.position.y = 0.72;
  return { root, carriage, barrel, wheels, mats: [bronzeM, woodM, ironM] };
};

// ------------------------------------------------------------ worm fence
export const makeFence = (g: GL, n = 30, seed = "fence") => {
  const r = rng(seed);
  const rails: THREE.Matrix4[] = [];
  const panel = 3.2;
  const zig = 0.55;
  for (let i = 0; i < n; i++) {
    const x0 = i * panel * 0.95;
    const z0 = i % 2 ? zig : -zig;
    const x1 = (i + 1) * panel * 0.95;
    const z1 = i % 2 ? -zig : zig;
    const len = Math.hypot(x1 - x0, z1 - z0) + 0.5;
    const ang = Math.atan2(z1 - z0, x1 - x0);
    for (let k = 0; k < 6; k++) {
      const y = 0.12 + k * 0.2 + (r() - 0.5) * 0.03;
      rails.push(new THREE.Matrix4().compose(new THREE.Vector3((x0 + x1) / 2, y, (z0 + z1) / 2), new THREE.Quaternion().setFromEuler(new THREE.Euler((r() - 0.5) * 0.05, -ang, (r() - 0.5) * 0.04 + (k % 2 ? 0.02 : -0.02))), new THREE.Vector3(len, 1, 1)));
    }
  }
  // a split rail: triangular-ish section with rough faces
  const rail = new THREE.CylinderGeometry(0.07, 0.08, 1, 3, 8);
  rail.rotateZ(Math.PI / 2);
  const p = rail.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) p.setY(i, p.getY(i) * (1 + Math.sin(p.getX(i) * 20) * 0.1));
  rail.computeVertexNormals();
  const mat = g.ink({ color: "#8a7a62", mode: "screen", angle: 5, scale: 3.5, cross: 0.6, instanced: true, rim: 0.5, frag: "albedo *= 0.75 + tvn(vObj.xy * vec2(3.0, 40.0)) * 0.4; extraInk += step(0.7, tvn(vec2(vObj.x * 6.0, vObj.y * 60.0))) * 0.4;" });
  const mesh = new THREE.InstancedMesh(rail, mat, rails.length);
  rails.forEach((m, i) => mesh.setMatrixAt(i, m));
  mesh.frustumCulled = false;
  return { mesh, mat, length: n * panel * 0.95 };
};

// ------------------------------------------------------------ deciduous tree (instanced crowns)
export const makeTree = (g: GL, seed: string, h = 12, spread = 6, clumps = 50) => {
  const r = rng(seed);
  const group = new THREE.Group();
  const trunkM = g.ink({ color: "#4a3a2c", mode: "screen", angle: 80, scale: 3.5 });
  const crownM = g.ink({ color: "#5a6a3c", mode: "screen", angle: 40, scale: 3.5, cross: 0.8, rim: 0.4, instanced: true });
  group.add(new THREE.Mesh(new THREE.CylinderGeometry(h * 0.03, h * 0.06, h * 0.6, 10).translate(0, h * 0.3, 0), trunkM));
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2 + r();
    const limb = new THREE.Mesh(new THREE.CylinderGeometry(h * 0.01, h * 0.025, h * 0.45, 6).translate(0, h * 0.22, 0), trunkM);
    limb.position.set(0, h * 0.45, 0);
    limb.rotation.set(Math.cos(a) * 0.8, 0, Math.sin(a) * 0.8);
    group.add(limb);
  }
  const clump = smoothIco(1, 3);
  const cp = clump.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < cp.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(cp, i);
    const b = 1 + (fbm2(v.x * 3 + 5, v.y * 3 + v.z * 3, 4, 9) - 0.5) * 0.7;
    cp.setXYZ(i, v.x * b, v.y * b * 0.85, v.z * b);
  }
  clump.computeVertexNormals();
  clumps *= 2;
  const im = new THREE.InstancedMesh(clump, crownM, clumps);
  for (let k = 0; k < clumps; k++) {
    const th = r() * Math.PI * 2;
    const rr = Math.sqrt(r()) * spread;
    const y = h * 0.62 + r() * h * 0.4 - (rr / spread) * h * 0.15;
    const sc = spread * (0.1 + r() * 0.14);
    im.setMatrixAt(k, new THREE.Matrix4().compose(new THREE.Vector3(Math.cos(th) * rr, y, Math.sin(th) * rr), new THREE.Quaternion(), new THREE.Vector3(sc, sc * 0.85, sc)));
  }
  im.frustumCulled = false;
  group.add(im);
  return { group, mats: [trunkM, crownM] };
};

// ------------------------------------------------------------ Lincoln Memorial
// Facade faces +z. 36 fluted Doric columns (12 across the front). Units: m.
export const memorialGeo = () =>
  memo("gl:memorial", () => {
    const colH = 13.4;
    const colR = 1.1;
    // fluted shaft with entasis
    const shaft = lathe(
      Array.from({ length: 16 }, (_, i) => {
        const t = i / 15;
        return [colR * (1 - 0.18 * t) * (1 + 0.02 * Math.sin(t * Math.PI)), t * colH] as [number, number];
      }),
      96,
    );
    const p = shaft.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const z = p.getZ(i);
      const a = Math.atan2(z, x);
      const k = 1 - 0.045 * Math.pow(Math.abs(Math.cos(a * 10)), 0.35);
      p.setX(i, x * k);
      p.setZ(i, z * k);
    }
    shaft.computeVertexNormals();
    const capital = merge([cyl(colR * 1.05, colR * 0.85, 0.5, 32, 0, colH + 0.25, 0), box(colR * 2.5, 0.35, colR * 2.5, 0, colH + 0.68, 0)]);
    const cols: THREE.Matrix4[] = [];
    const W = 58;
    const D = 36;
    // peristyle: 12 across front/back, 8 deep on the sides (36 total)
    for (let i = 0; i < 12; i++) {
      const x = -W / 2 + 2 + (i / 11) * (W - 4);
      cols.push(new THREE.Matrix4().makeTranslation(x, 0, D / 2 - 2), new THREE.Matrix4().makeTranslation(x, 0, -D / 2 + 2));
    }
    for (let i = 1; i < 7; i++) {
      const z = -D / 2 + 2 + (i / 7) * (D - 4);
      cols.push(new THREE.Matrix4().makeTranslation(-W / 2 + 2, 0, z), new THREE.Matrix4().makeTranslation(W / 2 - 2, 0, z));
    }
    // two inner columns flanking the statue chamber entrance
    cols.push(new THREE.Matrix4().makeTranslation(-8, 0, D / 2 - 7), new THREE.Matrix4().makeTranslation(8, 0, D / 2 - 7));
    const top = colH + 0.85;
    const stone: THREE.BufferGeometry[] = [];
    stone.push(box(W + 2, 1.8, D + 2, 0, top + 0.9, 0)); // architrave + frieze
    stone.push(box(W + 3, 0.5, D + 3, 0, top + 2.05, 0)); // cornice
    stone.push(box(W - 6, 4.2, D - 6, 0, top + 4.4, 0)); // attic
    stone.push(box(W - 5, 0.4, D - 5, 0, top + 6.7, 0)); // attic cornice
    // festoons / wreaths on the attic: small bumps
    for (let i = 0; i < 12; i++) stone.push(place(new THREE.TorusGeometry(0.5, 0.15, 8, 16), [-W / 2 + 6 + i * 4.2, top + 4.8, (D - 6) / 2 + 0.1]));
    // cella walls (inside the colonnade)
    stone.push(box(W - 10, colH, 3, 0, colH / 2, -D / 2 + 7));
    stone.push(box(3, colH, D - 12, -W / 2 + 7, colH / 2, -1));
    stone.push(box(3, colH, D - 12, W / 2 - 7, colH / 2, -1));
    // stylobate + steps
    const steps: THREE.BufferGeometry[] = [];
    steps.push(box(W + 6, 1.2, D + 6, 0, -0.6, 0));
    for (let k = 1; k < 12; k++) steps.push(box(20 + 2, 0.35, 1.2, 0, -1.2 - k * 0.35 + 0.175, D / 2 + 3 + k * 1.2 - 0.6));
    steps.push(box(W + 20, 4, 30, 0, -3.2, D / 2 + 22));
    // seated statue inside: block of chair + figure mass
    const statue: THREE.BufferGeometry[] = [];
    statue.push(box(6, 3, 5, 0, 1.5, -D / 2 + 11)); // pedestal
    statue.push(box(5.4, 4.8, 3.6, 0, 5.4, -D / 2 + 11)); // chair
    statue.push(place(smoothIco(1, 3), [0, 7.2, -D / 2 + 11.6], [0, 0, 0], [1.6, 2.2, 1.2])); // torso
    statue.push(place(smoothIco(1, 3), [0, 9.8, -D / 2 + 12], [0, 0, 0], [0.7, 0.85, 0.75])); // head
    statue.push(place(box(1.2, 3.6, 1.1), [-0.9, 3.9, -D / 2 + 13]), place(box(1.2, 3.6, 1.1), [0.9, 3.9, -D / 2 + 13])); // legs
    statue.push(place(box(0.8, 0.6, 2.2), [-1.9, 6.6, -D / 2 + 12.3]), place(box(0.8, 0.6, 2.2), [1.9, 6.6, -D / 2 + 12.3])); // arms on chair
    return { shaft, capital, cols, stone: merge(stone), steps: merge(steps), statue: merge(statue), top, W, D, colH };
  });

export const makeMemorial = (g: GL) => {
  const G = memorialGeo();
  const marbleM = g.ink({
    color: "#efebe2",
    mode: "v",
    scale: 30,
    scale2: 60,
    cross: 0.6,
    rim: 0.4,
    instanced: true,
    drawDir: [0, 1, 0],
    drawRange: [0, 16],
    frag: "albedo *= 0.92 + tvn(vWorld.xy * 2.0) * 0.12;",
  });
  const stoneM = g.ink({
    color: "#ebe6db",
    mode: "screen",
    angle: 15,
    scale: 3.5,
    cross: 0.6,
    rim: 0.3,
    drawDir: [0, 1, 0],
    drawRange: [0, 25],
    uniforms: { uFrieze: { value: 0 } },
    frag: /* glsl */ `
      albedo *= 0.92 + tvn(vWorld.xy * 1.5) * 0.12;
      // incised state names on the frieze + blocks in the attic
      float fr = step(15.8, vWorld.y) * step(vWorld.y, 16.6) * step(0.5, N.z);
      float letters = step(0.5, tvn(vec2(vWorld.x * 7.0, floor(vWorld.y * 3.0)))) * step(0.3, fract(vWorld.x / 4.6)) * step(fract(vWorld.x / 4.6), 0.9);
      extraInk += fr * letters * 0.8;
      float course = step(0.93, fract(vWorld.y / 1.1)) + step(0.97, fract(vWorld.x / 2.2 + floor(vWorld.y / 1.1) * 0.5));
      extraInk += min(1.0, course) * 0.25;
    `,
  });
  const colMeshShaft = new THREE.InstancedMesh(G.shaft, marbleM, G.cols.length);
  const colMeshCap = new THREE.InstancedMesh(G.capital, marbleM, G.cols.length);
  G.cols.forEach((m, i) => {
    colMeshShaft.setMatrixAt(i, m);
    colMeshCap.setMatrixAt(i, m);
  });
  colMeshShaft.frustumCulled = colMeshCap.frustumCulled = false;
  const statueM = g.ink({ color: "#e9e4da", mode: "screen", angle: 60, scale: 3.5, cross: 0.8, rim: 0.3 });
  const group = new THREE.Group();
  group.add(colMeshShaft, colMeshCap, new THREE.Mesh(G.stone, stoneM), new THREE.Mesh(G.steps, stoneM), new THREE.Mesh(G.statue, statueM));
  return { group, mats: [marbleM, stoneM, statueM], G };
};

// the Lincoln figure: tall frock-coat silhouette with stovepipe hat (uses the figure kit)
export { fbm2 };
