// Industrial-age models: 4-4-0 "American" locomotive with rods and valve gear,
// track, telegraph poles; golden spike + maul; Edison lamp; Wright Flyer;
// Model T; Hoover Dam; Golden Gate towers/cables; Empire State Building.
import * as THREE from "three";
import { memo } from "../../lib/math";
import { box, cyl, extrude, lathe, merge, place, tube } from "../geo";
import type { GL } from "../GLShot";

// ------------------------------------------------------------ 4-4-0 locomotive (front = +z)
export const locoGeo = () =>
  memo("gl:loco", () => {
    const body: THREE.BufferGeometry[] = [];
    const dark: THREE.BufferGeometry[] = [];
    const brass: THREE.BufferGeometry[] = [];
    const red: THREE.BufferGeometry[] = [];
    // boiler + smokebox
    body.push(place(cyl(0.72, 0.72, 5.2, 32).rotateX(Math.PI / 2), [0, 2.05, 1.2]));
    dark.push(place(cyl(0.78, 0.78, 1.4, 32).rotateX(Math.PI / 2), [0, 2.05, 4.3]));
    dark.push(place(cyl(0.7, 0.7, 0.06, 32).rotateX(Math.PI / 2), [0, 2.05, 5.02])); // smokebox door
    // boiler bands
    for (const z of [-0.8, 0.4, 1.6, 2.8]) brass.push(place(cyl(0.74, 0.74, 0.07, 32).rotateX(Math.PI / 2), [0, 2.05, z]));
    // balloon stack
    dark.push(
      place(
        lathe(
          [
            [0.22, 0],
            [0.24, 0.5],
            [0.4, 0.9],
            [0.72, 1.35],
            [0.75, 1.55],
            [0.55, 1.6],
            [0.0, 1.6],
          ],
          32,
          30,
        ),
        [0, 2.7, 4.2],
      ),
    );
    // steam dome + sand dome (brass)
    brass.push(place(lathe([[0.4, 0], [0.4, 0.35], [0.33, 0.55], [0.15, 0.68], [0, 0.7]], 28, 20), [0, 2.65, 2.4]));
    brass.push(place(lathe([[0.32, 0], [0.32, 0.25], [0.25, 0.42], [0, 0.5]], 28, 16), [0, 2.65, 0.8]));
    brass.push(place(cyl(0.05, 0.08, 0.35, 12), [0.35, 2.95, 1.6])); // whistle
    // headlamp box
    dark.push(box(0.8, 0.8, 0.7, 0, 3.25, 4.55));
    brass.push(place(cyl(0.3, 0.3, 0.06, 24).rotateX(Math.PI / 2), [0, 3.25, 4.92]));
    // cab
    red.push(box(2.3, 2.0, 1.9, 0, 2.6, -2.2));
    dark.push(box(2.6, 0.12, 2.3, 0, 3.66, -2.2)); // roof
    dark.push(box(0.6, 0.7, 0.05, 0.7, 2.9, -1.24), box(0.6, 0.7, 0.05, -0.7, 2.9, -1.24)); // windows (front)
    // running boards, frame, pilot (cowcatcher)
    dark.push(box(2.2, 0.12, 6.6, 0, 1.25, 1.4));
    const pilot = extrude(
      [
        [-1.1, 0],
        [1.1, 0],
        [0, 1.1],
      ],
      0.8,
    );
    pilot.rotateX(-Math.PI / 2);
    for (let k = -5; k <= 5; k++) red.push(place(box(0.05, 0.7, 0.05), [k * 0.2, 0.7, 5.1 + (5 - Math.abs(k)) * 0.1], [0.6, 0, 0]));
    red.push(place(box(2.2, 0.15, 0.2), [0, 1.1, 5.2]));
    // cylinders + steam chests
    for (const s of [-1, 1]) {
      dark.push(place(cyl(0.34, 0.34, 1.1, 20).rotateX(Math.PI / 2), [s * 1.0, 1.35, 3.5]));
      dark.push(box(0.4, 0.5, 1.0, s * 0.95, 1.85, 3.5));
    }
    // tender
    red.push(box(2.4, 1.6, 4.2, 0, 1.9, -5.8));
    dark.push(box(2.5, 0.25, 4.3, 0, 1.0, -5.8));
    dark.push(place(new THREE.SphereGeometry(1, 12, 8), [0, 2.8, -5.3], [0, 0, 0], [1.0, 0.45, 1.6])); // wood pile
    return { body: merge(body), dark: merge(dark), brass: merge(brass), red: merge(red) };
  });

export const driverGeo = (r: number, spokes: number) => {
  const parts: THREE.BufferGeometry[] = [];
  const rim = new THREE.TorusGeometry(r - 0.06, 0.07, 8, 40);
  rim.rotateY(Math.PI / 2);
  parts.push(rim);
  parts.push(place(cyl(r, r, 0.12, 40).rotateZ(Math.PI / 2), [0.05, 0, 0])); // flange
  for (let k = 0; k < spokes; k++) {
    const sp = new THREE.CylinderGeometry(0.035, 0.05, r - 0.1, 6);
    sp.translate(0, (r - 0.1) / 2, 0);
    sp.rotateX((k / spokes) * Math.PI * 2);
    parts.push(sp);
  }
  parts.push(cyl(0.14, 0.14, 0.2, 16).rotateZ(Math.PI / 2));
  parts.push(place(box(0.12, 0.35, 0.2), [0, -r * 0.5, 0])); // counterweight
  return merge(parts);
};

export const makeLoco = (g: GL) => {
  const G = locoGeo();
  const iron = g.ink({ color: "#2f2f33", mode: "screen", angle: 70, scale: 3.5, spec: 0.8, gloss: 30, rim: 0.7 });
  const boiler = g.ink({ color: "#3b4a5a", mode: "u", scale: 90, scale2: 40, spec: 0.9, gloss: 30, rim: 0.7 });
  const brassM = g.ink({ color: "#c8973c", mode: "screen", angle: 40, scale: 3.5, spec: 1.5, gloss: 50, rim: 0.7 });
  const redM = g.ink({ color: "#8e2a22", mode: "screen", angle: 60, scale: 3.5, spec: 0.5, rim: 0.6 });
  const group = new THREE.Group();
  group.add(new THREE.Mesh(G.body, boiler), new THREE.Mesh(G.dark, iron), new THREE.Mesh(G.brass, brassM), new THREE.Mesh(G.red, redM));
  const drivers: THREE.Mesh[] = [];
  const truck: THREE.Mesh[] = [];
  const dg = driverGeo(0.85, 16);
  const tg = driverGeo(0.45, 10);
  for (const s of [-1, 1]) {
    for (const z of [0.2, -1.6]) {
      const w = new THREE.Mesh(dg, redM);
      w.position.set(s * 0.8, 0.85, z);
      group.add(w);
      drivers.push(w);
    }
    for (const z of [3.0, 4.2]) {
      const w = new THREE.Mesh(tg, iron);
      w.position.set(s * 0.8, 0.45, z);
      group.add(w);
      truck.push(w);
    }
    for (const z of [-4.6, -5.6, -6.6, -7.6]) {
      const w = new THREE.Mesh(tg, iron);
      w.position.set(s * 0.8, 0.45, z);
      group.add(w);
      truck.push(w);
    }
  }
  // side rods + main rods (animated)
  const rodM = g.ink({ color: "#b8b4aa", spec: 1.4, gloss: 50, hatch: 0.5, rim: 0.6 });
  const sideRods = [-1, 1].map((s) => {
    const m = new THREE.Mesh(box(0.06, 0.1, 1.9), rodM);
    m.userData.s = s;
    group.add(m);
    return m;
  });
  const mainRods = [-1, 1].map((s) => {
    const m = new THREE.Mesh(box(0.06, 0.1, 1.0).translate(0, 0, 0.5), rodM);
    m.userData.s = s;
    group.add(m);
    return m;
  });
  const update = (dist: number) => {
    const a = dist / 0.85;
    drivers.forEach((w) => (w.rotation.x = a));
    truck.forEach((w) => (w.rotation.x = dist / 0.45));
    sideRods.forEach((m) => {
      const s = m.userData.s as number;
      const ph = a + (s > 0 ? 0 : Math.PI / 2);
      m.position.set(s * 0.95, 0.85 + Math.sin(ph) * 0.35, -0.7 + Math.cos(ph) * 0.35);
    });
    mainRods.forEach((m) => {
      const s = m.userData.s as number;
      const ph = a + (s > 0 ? 0 : Math.PI / 2);
      const crank = new THREE.Vector3(s * 1.0, 0.85 + Math.sin(ph) * 0.35, 0.2 + Math.cos(ph) * 0.35);
      const cross = new THREE.Vector3(s * 1.0, 1.35, 2.9);
      m.position.copy(crank);
      m.scale.z = crank.distanceTo(cross);
      m.lookAt(group.localToWorld(cross.clone()));
    });
  };
  update(0);
  return { group, update, mats: [iron, boiler, brassM, redM, rodM], headlamp: new THREE.Vector3(0, 3.25, 5.0), stack: new THREE.Vector3(0, 4.4, 4.2) };
};

// rails + ties (instanced ties); along z
export const makeTrack = (g: GL, len = 600) => {
  const railM = g.ink({ color: "#8a8680", spec: 1.2, gloss: 40, mode: "screen", angle: 0, scale: 3.5 });
  const tieM = g.ink({ color: "#5a4632", mode: "screen", angle: 80, scale: 3.5, instanced: true });
  const rails = merge([box(0.08, 0.14, len, -0.72, 0.1, -len / 2 + 40), box(0.08, 0.14, len, 0.72, 0.1, -len / 2 + 40)]);
  const n = Math.floor(len / 0.6);
  const ties = new THREE.InstancedMesh(box(2.6, 0.12, 0.22), tieM, n);
  for (let i = 0; i < n; i++) ties.setMatrixAt(i, new THREE.Matrix4().makeTranslation(0, 0, 40 - i * 0.6));
  ties.frustumCulled = false;
  const group = new THREE.Group();
  group.add(new THREE.Mesh(rails, railM), ties);
  // ballast
  const bal = new THREE.Mesh(box(4, 0.2, len, 0, -0.02, -len / 2 + 40), g.ink({ color: "#9a9080", mode: "stipple", hatch: 0.9 }));
  group.add(bal);
  return { group };
};

export const makePoles = (g: GL, n = 30, spacing = 18, x = 5) => {
  const m = g.ink({ color: "#5a4a38", mode: "screen", angle: 80, scale: 3.5, instanced: true });
  const pole = merge([cyl(0.1, 0.14, 7, 8, 0, 3.5, 0), box(1.6, 0.1, 0.1, 0, 6.6, 0), box(1.2, 0.1, 0.1, 0, 6.1, 0)]);
  const im = new THREE.InstancedMesh(pole, m, n);
  for (let i = 0; i < n; i++) im.setMatrixAt(i, new THREE.Matrix4().makeTranslation(x, 0, 30 - i * spacing));
  im.frustumCulled = false;
  const wires: THREE.BufferGeometry[] = [];
  for (const [wx, wy] of [
    [-0.7, 6.6],
    [0.7, 6.6],
    [-0.5, 6.1],
    [0.5, 6.1],
  ])
    for (let i = 0; i < n - 1; i++) {
      const z0 = 30 - i * spacing;
      const z1 = z0 - spacing;
      wires.push(tube([new THREE.Vector3(x + wx, wy, z0), new THREE.Vector3(x + wx, wy - 0.5, (z0 + z1) / 2), new THREE.Vector3(x + wx, wy, z1)], 0.012, 8, 3));
    }
  const group = new THREE.Group();
  group.add(im, new THREE.Mesh(merge(wires), g.ink({ color: "#222", hatch: 0 })));
  return { group };
};

// ------------------------------------------------------------ golden spike + maul
export const spikeGeo = () =>
  memo("gl:spike", () => ({
    spike: merge([box(0.03, 0.3, 0.03, 0, 0.15, 0), place(box(0.06, 0.03, 0.05), [0.015, 0.3, 0]), place(new THREE.ConeGeometry(0.02, 0.05, 4), [0, -0.02, 0], [Math.PI, 0, 0])]),
    maul: merge([cyl(0.02, 0.025, 0.9, 10, 0, -0.45, 0), place(cyl(0.06, 0.06, 0.28, 16).rotateZ(Math.PI / 2), [0, 0, 0])]),
    rail: box(0.12, 0.16, 3, 0, 0.08, 0),
    plate: box(0.25, 0.02, 0.4, 0.2, 0.01, 0),
    tie: box(2.6, 0.2, 0.3, 0, -0.1, 0),
  }));

// ------------------------------------------------------------ Edison lamp (base at y=0, ~0.12 m tall)
export const bulbGeo = () =>
  memo("gl:bulb", () => {
    const glass = lathe(
      [
        [0.012, 0.03],
        [0.018, 0.045],
        [0.035, 0.07],
        [0.045, 0.1],
        [0.042, 0.13],
        [0.028, 0.155],
        [0.008, 0.165],
        [0.0, 0.17],
      ],
      48,
      40,
    );
    const baseParts: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 6; i++) baseParts.push(cyl(0.013, 0.013, 0.004, 24, 0, 0.004 + i * 0.005, 0));
    baseParts.push(cyl(0.012, 0.012, 0.03, 24, 0, 0.015, 0));
    const stem = merge([cyl(0.004, 0.006, 0.05, 12, 0, 0.055, 0), tube([new THREE.Vector3(-0.004, 0.07, 0), new THREE.Vector3(-0.01, 0.09, 0), new THREE.Vector3(-0.012, 0.1, 0)], 0.0006, 8, 4), tube([new THREE.Vector3(0.004, 0.07, 0), new THREE.Vector3(0.01, 0.09, 0), new THREE.Vector3(0.012, 0.1, 0)], 0.0006, 8, 4)]);
    // carbon filament: horseshoe loop
    const fpts: THREE.Vector3[] = [];
    for (let i = 0; i <= 30; i++) {
      const a = Math.PI + (i / 30) * Math.PI;
      fpts.push(new THREE.Vector3(Math.cos(a) * 0.012, 0.1 + 0.02 + Math.sin(a) * -0.022, Math.sin(i * 0.5) * 0.001));
    }
    const filament = tube(fpts, 0.0008, 60, 5);
    return { glass, base: merge(baseParts), stem, filament };
  });

// ------------------------------------------------------------ Wright Flyer (1903), nose +z
export const flyerGeo = () =>
  memo("gl:flyer", () => {
    const span = 12.3;
    const chord = 1.98;
    const gap = 1.83;
    const wing = (y: number) => {
      // cambered sheet with wing warping tips
      const g = new THREE.PlaneGeometry(span, chord, 40, 6);
      g.rotateX(-Math.PI / 2);
      const p = g.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < p.count; i++) {
        const z = p.getZ(i);
        const x = p.getX(i);
        p.setY(i, y + Math.sin(((z + chord / 2) / chord) * Math.PI) * 0.08 + (Math.abs(x) / (span / 2)) ** 2 * 0.05);
      }
      g.computeVertexNormals();
      return g;
    };
    const wings = merge([wing(0.9), wing(0.9 + gap)]);
    const struts: THREE.BufferGeometry[] = [];
    for (let k = -4; k <= 4; k++) {
      const x = (k / 4) * (span / 2 - 0.1);
      for (const z of [-chord / 2 + 0.1, chord / 2 - 0.1]) struts.push(cyl(0.02, 0.02, gap, 6, x, 0.9 + gap / 2, z));
    }
    // canard elevator in front, twin rudders behind
    const canard = merge([place(new THREE.PlaneGeometry(4.5, 0.9).rotateX(-Math.PI / 2), [0, 1.3, 3.6]), place(new THREE.PlaneGeometry(4.5, 0.9).rotateX(-Math.PI / 2), [0, 1.9, 3.6])]);
    const rudder = merge([place(new THREE.PlaneGeometry(0.5, 1.8), [0.3, 1.8, -3.3], [0, Math.PI / 2, 0]), place(new THREE.PlaneGeometry(0.5, 1.8), [-0.3, 1.8, -3.3], [0, Math.PI / 2, 0])]);
    // booms, skids, engine, propellers mounts
    struts.push(tube([new THREE.Vector3(0.5, 0.9, 1.0), new THREE.Vector3(0.4, 1.3, 3.6)], 0.02, 2, 4), tube([new THREE.Vector3(-0.5, 0.9, 1.0), new THREE.Vector3(-0.4, 1.3, 3.6)], 0.02, 2, 4));
    struts.push(tube([new THREE.Vector3(0.5, 0.9, -1.0), new THREE.Vector3(0.3, 1.2, -3.3)], 0.02, 2, 4), tube([new THREE.Vector3(-0.5, 0.9, -1.0), new THREE.Vector3(-0.3, 1.2, -3.3)], 0.02, 2, 4));
    struts.push(tube([new THREE.Vector3(0.5, 0.3, 3.2), new THREE.Vector3(0.5, 0.3, -1.2)], 0.03, 2, 5), tube([new THREE.Vector3(-0.5, 0.3, 3.2), new THREE.Vector3(-0.5, 0.3, -1.2)], 0.03, 2, 5));
    struts.push(box(0.5, 0.4, 0.6, 0.6, 1.1, -0.2));
    return { wings, canard, rudder, struts: merge(struts) };
  });

export const propGeo = () => memo("gl:prop", () => merge([place(box(2.5, 0.18, 0.04), [0, 0, 0], [0, 0, 0.15])]));

// ------------------------------------------------------------ Model T (nose +z)
export const modelTGeo = () =>
  memo("gl:modelT", () => {
    const body: THREE.BufferGeometry[] = [];
    const brass: THREE.BufferGeometry[] = [];
    body.push(box(1.3, 0.55, 1.2, 0, 1.0, 1.1)); // hood
    body.push(box(1.45, 0.7, 1.5, 0, 1.05, -0.3)); // body tub
    body.push(box(1.4, 0.95, 0.12, 0, 1.55, -1.05)); // seat back
    body.push(box(1.35, 0.05, 1.7, 0, 2.1, -0.4)); // roof
    for (const x of [-0.65, 0.65]) for (const z of [0.3, -1.1]) body.push(cyl(0.02, 0.02, 0.9, 6, x, 1.65, z));
    brass.push(box(1.0, 0.8, 0.1, 0, 1.05, 1.75)); // radiator
    brass.push(place(cyl(0.14, 0.14, 0.12, 20).rotateX(Math.PI / 2), [0.45, 1.25, 1.85]), place(cyl(0.14, 0.14, 0.12, 20).rotateX(Math.PI / 2), [-0.45, 1.25, 1.85]));
    // fenders
    for (const s of [-1, 1]) {
      body.push(tube([new THREE.Vector3(s * 0.8, 0.95, 2.0), new THREE.Vector3(s * 0.8, 1.05, 1.4), new THREE.Vector3(s * 0.8, 0.85, 1.0), new THREE.Vector3(s * 0.8, 0.6, 0.4), new THREE.Vector3(s * 0.8, 0.6, -0.6), new THREE.Vector3(s * 0.8, 0.95, -1.4)], 0.12, 30, 6));
    }
    const wheel = driverGeo(0.45, 12);
    return { body: merge(body), brass: merge(brass), wheel };
  });

// ------------------------------------------------------------ Hoover Dam: arch-gravity wall in a canyon
export const damGeo = () =>
  memo("gl:dam", () => {
    // arch in plan (radius 150 m), thick base tapering to the crest; faces downstream +z
    const segs = 80;
    const pos: number[] = [];
    const idx: number[] = [];
    const uv: number[] = [];
    const H = 220;
    const rows = 30;
    for (let j = 0; j <= rows; j++) {
      const y = (j / rows) * H;
      const t = y / H;
      const thick = 200 * (1 - t) ** 1.6 + 14;
      const R = 180 + thick;
      for (let i = 0; i <= segs; i++) {
        const a = (i / segs - 0.5) * 1.35;
        pos.push(Math.sin(a) * R, y, Math.cos(a) * R - 180);
        uv.push(i / segs, t);
      }
    }
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < segs; i++) {
        const a0 = j * (segs + 1) + i;
        idx.push(a0, a0 + segs + 1, a0 + 1, a0 + 1, a0 + segs + 1, a0 + segs + 2);
      }
    const face = new THREE.BufferGeometry();
    face.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    face.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    face.setIndex(idx);
    face.computeVertexNormals();
    // crest road, intake towers upstream, powerhouse wings at the base
    const extra: THREE.BufferGeometry[] = [];
    extra.push(place(box(380, 4, 16), [0, H + 2, -168]));
    for (const x of [-60, -20, 20, 60]) extra.push(place(cyl(8, 9, 30, 16), [x, H + 15, -200]));
    extra.push(box(120, 30, 40, -90, 15, 30), box(120, 30, 40, 90, 15, 30));
    return { face, extra: merge(extra), H };
  });

// ------------------------------------------------------------ Golden Gate tower (x across the bridge)
export const ggTowerGeo = () =>
  memo("gl:ggTower", () => {
    const parts: THREE.BufferGeometry[] = [];
    const H = 227;
    // two stepped legs
    for (const s of [-1, 1]) {
      const steps = [
        [0, 70, 12, 10],
        [70, 140, 10.5, 9],
        [140, 190, 9, 8],
        [190, H, 7.5, 7],
      ];
      for (const [y0, y1, w, d] of steps) {
        parts.push(box(w, y1 - y0, d, s * 14, (y0 + y1) / 2, 0));
        // art-deco vertical ribs
        for (const rx of [-w / 3, 0, w / 3]) parts.push(box(0.8, y1 - y0, d + 0.6, s * 14 + rx, (y0 + y1) / 2, 0));
      }
    }
    // portal struts between legs
    for (const [y, h] of [
      [68, 10],
      [138, 9],
      [188, 8],
      [H - 6, 12],
    ])
      parts.push(box(22, h, 6, 0, y, 0));
    // saddles on top
    parts.push(box(8, 6, 10, -14, H + 3, 0), box(8, 6, 10, 14, H + 3, 0));
    return { tower: merge(parts), H };
  });

// ------------------------------------------------------------ Empire State Building (levels 0..102)
export const esbLevels = () =>
  memo("gl:esb", () => {
    // [y0, y1, width x, depth z]
    const L: [number, number, number, number][] = [
      [0, 25, 130, 60],
      [25, 30, 118, 56],
      [30, 260, 70, 50],
      [260, 300, 60, 40],
      [300, 320, 50, 34],
      [320, 330, 40, 28],
      [330, 380, 24, 24],
    ];
    return L;
  });
