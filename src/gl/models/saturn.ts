// Saturn V (1 unit = 1 m, engine exits at y = 0) with roll-pattern markings,
// F-1 engines, fairings and fins, and the Launch Umbilical Tower on the
// mobile launcher (red lattice, swing arms, hammerhead crane).
import * as THREE from "three";
import { memo } from "../../lib/math";
import { cyl, extrude, lathe, merge, place } from "../geo";
import type { GL } from "../GLShot";

const R1 = 5.05; // S-IC / S-II radius
const R3 = 3.3; // S-IVB radius
const RS = 1.96; // service module radius

const bodyProfile: [number, number][] = [
  [0.1, 5.2],
  [3.0, 5.2],
  [4.6, 5.6],
  [R1, 6.4],
  [R1, 48],
  [R1 - 0.05, 48.4],
  [R1, 48.8],
  [R1, 79],
  [R1 - 0.1, 79.4],
  [R3 + 0.05, 86.5],
  [R3, 87],
  [R3, 99.5],
  [R3 - 0.05, 100.3],
  [RS + 0.05, 108.2],
  [RS, 108.6],
  [RS, 115.2],
  [RS - 0.1, 115.5],
  [1.2, 117.4],
  [0.35, 118.6],
  [0.0, 118.8],
];

export const saturnGeo = () =>
  memo("gl:saturnGeo", () => {
    const body = lathe(bodyProfile, 96);
    const bell = lathe(
      [
        [1.95, 0],
        [1.7, 1.2],
        [1.25, 3.2],
        [0.75, 4.6],
        [0.62, 5.2],
        [0.9, 5.6],
        [0.5, 6.0],
      ],
      40,
      30,
    );
    const bells: THREE.BufferGeometry[] = [];
    const eng: [number, number][] = [
      [0, 0],
      [3.3, 3.3],
      [-3.3, 3.3],
      [3.3, -3.3],
      [-3.3, -3.3],
    ];
    for (const [x, z] of eng) bells.push(place(bell, [x, 0.1, z]));
    const fairing = lathe(
      [
        [0.0, 2.4],
        [1.35, 2.6],
        [1.45, 5.0],
        [1.3, 11],
        [0.8, 13.5],
        [0.0, 14],
      ],
      24,
      24,
    );
    const fins: THREE.BufferGeometry[] = [];
    const fairings: THREE.BufferGeometry[] = [];
    const fin = extrude(
      [
        [0, 0],
        [4.2, 1.2],
        [4.2, 4.2],
        [0, 9.5],
      ],
      0.35,
    );
    for (let k = 0; k < 4; k++) {
      const a = Math.PI / 4 + (k * Math.PI) / 2;
      const x = Math.cos(a) * (R1 - 0.2);
      const z = Math.sin(a) * (R1 - 0.2);
      fairings.push(place(fairing, [x, 0.2, z]));
      fins.push(place(fin, [Math.cos(a) * (R1 + 0.8), 1.6, Math.sin(a) * (R1 + 0.8)], [0, -a, 0]));
    }
    // launch escape system: truss + motor
    const les: THREE.BufferGeometry[] = [];
    const lr = 0.55;
    for (let k = 0; k < 4; k++) {
      const a = (k * Math.PI) / 2 + Math.PI / 4;
      les.push(
        new THREE.CylinderGeometry(0.07, 0.07, 3.6, 6).applyMatrix4(
          new THREE.Matrix4().compose(
            new THREE.Vector3(Math.cos(a) * lr * 0.7, 120.6, Math.sin(a) * lr * 0.7),
            new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12)),
            new THREE.Vector3(1, 1, 1),
          ),
        ),
      );
    }
    les.push(
      lathe(
        [
          [0.0, 122.2],
          [0.62, 122.3],
          [0.62, 126.8],
          [0.45, 127.6],
          [0.3, 128.6],
          [0.06, 129.6],
          [0.0, 129.8],
        ],
        32,
      ),
    );
    les.push(cyl(0.02, 0.02, 1.2, 4, 0, 130.3, 0));
    return {
      body,
      engines: merge(bells),
      fins: merge([...fins, ...fairings]),
      les: merge(les),
    };
  });

// roll pattern + stage joints, driven by object-space height & angle
const MARKINGS = /* glsl */ `
  float y = vObj.y;
  float a = atan(vObj.z, vObj.x) / 6.2831853 + 0.5;
  float blk = 0.0;
  if (y > 6.5 && y < 18.5) blk = step(0.5, fract(a * 4.0 + 0.125));
  if (y > 36.0 && y < 47.6) blk = step(0.5, fract(a * 4.0 + 0.625));
  if (y > 47.9 && y < 49.2) blk = 1.0;
  if (y > 77.8 && y < 79.3) blk = 1.0;
  if (y > 87.2 && y < 91.5) blk = step(0.5, fract(a * 4.0 + 0.125));
  if (y > 99.6 && y < 100.3) blk = 1.0;
  // service module: silver radiator panels; CM: bright
  if (y > 108.5 && y < 115.2) { albedo = vec3(0.78, 0.8, 0.82); hatchMul = 1.2; }
  if (y > 115.2) { albedo = vec3(0.92, 0.9, 0.86); }
  albedo = mix(albedo, vec3(0.1, 0.1, 0.11), blk);
  // panel seams and corrugation
  float seam = 0.0;
  float ys[9] = float[9](18.5, 24.5, 30.5, 36.0, 54.0, 60.0, 66.0, 72.0, 93.0);
  for (int i = 0; i < 9; i++) seam = max(seam, 1.0 - smoothstep(0.02, 0.09, abs(y - ys[i])));
  if (y > 48.0 && y < 54.0) extraInk += 0.35 * step(0.5, fract(a * 180.0));
  if (y > 100.3 && y < 108.2) extraInk += 0.15;
  extraInk += seam * 0.9;
`;

export const makeSaturn = (g: GL) => {
  const geo = saturnGeo();
  const body = g.ink({ color: "#f1efe8", mode: "u", scale: 150, scale2: 60, frag: MARKINGS, spec: 0.35, gloss: 25, rim: 0.9, rimPow: 2.5 });
  const engines = g.ink({ color: "#3a3632", mode: "u", scale: 60, spec: 0.6, gloss: 18, rim: 0.2 });
  const fins = g.ink({ color: "#e8e6df", mode: "world", dir: [0, 1, 0], scale: 3 });
  const les = g.ink({ color: "#c9c3b8", mode: "u", scale: 40 });
  const group = new THREE.Group();
  group.add(new THREE.Mesh(geo.body, body), new THREE.Mesh(geo.engines, engines), new THREE.Mesh(geo.fins, fins), new THREE.Mesh(geo.les, les));
  // vents where LOX boil-off streams out
  const vents: [number, number, number][] = [
    [R1 * 0.7, 44, R1 * 0.7],
    [-R1 * 0.9, 42, R1 * 0.4],
    [R1, 74, 0.2],
    [-R1 * 0.6, 76, R1 * 0.8],
    [R3, 95, 0.5],
    [-R3 * 0.7, 97, R3 * 0.7],
  ];
  return { group, mats: [body, engines, fins, les], vents };
};

// ---------------------------------------------------------------------------
// Launch Umbilical Tower on the Mobile Launcher

type Seg = [THREE.Vector3, THREE.Vector3, number];
const beamMatrix = (a: THREE.Vector3, b: THREE.Vector3, t: number) => {
  const d = b.clone().sub(a);
  const len = d.length();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  return new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), q, new THREE.Vector3(t, len, t));
};

export const towerSegs = () =>
  memo("gl:towerSegs", () => {
    const segs: Seg[] = [];
    const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
    const cx = -19;
    const hw = 6;
    const top = 122;
    const step = 6.1;
    const corners = [V(cx - hw, 0, -hw), V(cx + hw, 0, -hw), V(cx + hw, 0, hw), V(cx - hw, 0, hw)];
    for (const c of corners) segs.push([c.clone(), c.clone().setY(top), 0.9]);
    for (let y = 0; y < top - 0.1; y += step) {
      const y2 = Math.min(top, y + step);
      for (let k = 0; k < 4; k++) {
        const a = corners[k].clone().setY(y2);
        const b = corners[(k + 1) % 4].clone().setY(y2);
        segs.push([a, b, 0.55]);
        // X bracing on each face
        const a0 = corners[k].clone().setY(y);
        const b0 = corners[(k + 1) % 4].clone().setY(y);
        segs.push([a0, b, 0.3]);
        segs.push([b0, a, 0.3]);
      }
      // floor diagonal
      segs.push([corners[0].clone().setY(y2), corners[2].clone().setY(y2), 0.25]);
    }
    // hammerhead crane
    const hy = top + 3;
    segs.push([V(cx - 8, hy, -2), V(cx + 18, hy, -2), 1.0]);
    segs.push([V(cx - 8, hy, 2), V(cx + 18, hy, 2), 1.0]);
    segs.push([V(cx - 8, hy + 3, 0), V(cx + 18, hy + 3, 0), 0.8]);
    for (let x = -8; x <= 18; x += 3) {
      segs.push([V(cx + x, hy, -2), V(cx + x, hy + 3, 0), 0.3]);
      segs.push([V(cx + x, hy, 2), V(cx + x, hy + 3, 0), 0.3]);
    }
    for (const c of corners) segs.push([c.clone().setY(top), V(cx, hy, 0), 0.5]);
    // swing arms: [height, reach to radius]
    const arms: [number, number][] = [
      [20, R1],
      [52, R1],
      [62, R1],
      [74, R1],
      [84, R1],
      [96, R3],
      [104, R3],
      [112, RS],
    ];
    for (const [y, r] of arms) {
      const x0 = cx + hw;
      const x1 = -r - 0.4;
      for (const dz of [-1.4, 1.4]) {
        segs.push([V(x0, y, dz), V(x1, y, dz), 0.45]);
        segs.push([V(x0, y + 2.4, dz), V(x1, y + 2.4, dz), 0.45]);
        const n = Math.max(2, Math.round((x1 - x0) / 2.4));
        for (let i = 0; i < n; i++) {
          const xa = x0 + ((x1 - x0) * i) / n;
          const xb = x0 + ((x1 - x0) * (i + 1)) / n;
          segs.push([V(xa, i % 2 ? y : y + 2.4, dz), V(xb, i % 2 ? y + 2.4 : y, dz), 0.22]);
          segs.push([V(xa, y, -1.4), V(xa, y, 1.4), 0.2]);
        }
      }
    }
    return segs.map(([a, b, t]) => beamMatrix(a, b, t));
  });

export const makeLaunchTower = (g: GL) => {
  const group = new THREE.Group();
  const beams = g.ink({ color: "#b3452c", mode: "screen", scale: 4, angle: 70, instanced: true, shade: 0.7, drawDir: [0, 1, 0], drawRange: [0, 130] });
  const unit = new THREE.BoxGeometry(1, 1, 1);
  const mats = towerSegs();
  const im = new THREE.InstancedMesh(unit, beams, mats.length);
  mats.forEach((m, i) => im.setMatrixAt(i, m));
  im.frustumCulled = false;
  group.add(im);
  // white room + arm housings
  const housing = g.ink({ color: "#e9e4da", mode: "world", dir: [0, 1, 0], scale: 2 });
  group.add(new THREE.Mesh(merge([place(new THREE.BoxGeometry(4, 3.4, 4), [-4.6, 113.2, 0]), place(new THREE.BoxGeometry(3, 3, 5), [-12, 123.5, 0])]), housing));
  // mobile launcher deck (with the flame hole) and hold-down posts
  const deck = g.ink({ color: "#8f8a80", mode: "world", dir: [1, 0.2, 0], scale: 1.4, cross: 0.6 });
  const deckGeo = extrude(
    [
      [-24, -20],
      [24, -20],
      [24, 20],
      [-24, 20],
    ],
    7.6,
    [
      [
        [-7, -7],
        [7, -7],
        [7, 7],
        [-7, 7],
      ].reverse() as [number, number][],
    ],
  );
  deckGeo.rotateX(-Math.PI / 2);
  deckGeo.translate(0, -3.8, 0);
  const posts: THREE.BufferGeometry[] = [deckGeo];
  for (const [x, z] of [
    [-22, -18],
    [22, -18],
    [22, 18],
    [-22, 18],
    [0, -18],
    [0, 18],
  ])
    posts.push(place(new THREE.BoxGeometry(3, 6, 3), [x, -10.6, z]));
  for (let k = 0; k < 4; k++) {
    const a = Math.PI / 4 + (k * Math.PI) / 2;
    posts.push(place(new THREE.BoxGeometry(1.6, 4, 1.6), [Math.cos(a) * 6.4, 2, Math.sin(a) * 6.4]));
  }
  group.add(new THREE.Mesh(merge(posts), deck));
  return { group, mats: [beams, housing, deck] };
};
