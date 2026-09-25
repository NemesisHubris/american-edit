// WWII models: LCVP Higgins boat with drop ramp, Czech hedgehog obstacles,
// M1 helmet, P-51 Mustang.
import * as THREE from "three";
import { memo } from "../../lib/math";
import { box, cyl, extrude, lathe, merge, place } from "../geo";

// Higgins boat (LCVP): 11 m, flat bow ramp hinged at the bottom front (+z)
export const higginsGeo = () =>
  memo("gl:higgins", () => {
    const hull: THREE.BufferGeometry[] = [];
    // boxy hull: sides, stern, bottom
    hull.push(box(3.2, 0.12, 9, 0, 0.1, -0.5)); // bottom
    for (const s of [-1, 1]) hull.push(box(0.12, 1.9, 9, s * 1.6, 1.05, -0.5));
    hull.push(box(3.2, 1.9, 0.12, 0, 1.05, -5.0)); // stern
    // gunwale lip + armour plates at the stern cockpit
    for (const s of [-1, 1]) hull.push(box(0.3, 0.12, 9, s * 1.65, 2.0, -0.5));
    hull.push(box(1.0, 0.8, 0.12, 1.0, 2.3, -3.8), box(1.0, 0.8, 0.12, -1.0, 2.3, -3.8));
    // .30 cal guns on the stern pintles
    hull.push(place(cyl(0.04, 0.04, 1.2, 8).rotateX(Math.PI / 2), [1.1, 2.6, -3.6]), place(cyl(0.04, 0.04, 1.2, 8).rotateX(Math.PI / 2), [-1.1, 2.6, -3.6]));
    // hull chine: flared lower hull below the waterline
    const flare = extrude(
      [
        [-1.9, 0],
        [1.9, 0],
        [1.6, 0.6],
        [-1.6, 0.6],
      ],
      9.2,
    );
    hull.push(place(flare, [0, -0.5, -0.5]));
    // ramp: hinged at z = 4, y = 0.2, stands up to y ~ 2.1; reinforcing ribs
    const ramp: THREE.BufferGeometry[] = [box(3.0, 2.0, 0.12, 0, 1.0, 0)];
    for (let k = -2; k <= 2; k++) ramp.push(box(0.08, 2.0, 0.12, k * 0.6, 1.0, 0.1));
    for (const y of [0.5, 1.2, 1.8]) ramp.push(box(3.0, 0.08, 0.12, 0, y, 0.1));
    return { hull: merge(hull), ramp: merge(ramp) };
  });

// Czech hedgehog: three steel angle beams crossed at right angles
export const hedgehogGeo = () =>
  memo("gl:hedgehog", () => {
    const angle = (L: number) => merge([box(L, 0.18, 0.02, 0, 0.09, 0), box(L, 0.02, 0.18, 0, 0, 0.09)]);
    const a = angle(2.2);
    const parts = [
      place(a, [0, 0, 0], [0, 0, Math.PI / 4]),
      place(a, [0, 0, 0], [Math.PI / 4, Math.PI / 2, 0]),
      place(a, [0, 0, 0], [0, Math.PI / 4, Math.PI / 2]),
    ];
    return merge(parts);
  });

// M1 helmet: steel pot with a rim + chin strap
export const helmetGeo = () =>
  memo("gl:helmet", () => {
    const shell = lathe(
      [
        [0, 0.19],
        [0.06, 0.188],
        [0.12, 0.17],
        [0.16, 0.13],
        [0.18, 0.08],
        [0.19, 0.03],
        [0.2, 0.005],
        [0.215, 0.0],
        [0.2, -0.005],
      ],
      48,
      30,
    );
    // flatten front-back slightly (helmets are oval)
    shell.scale(1, 1, 1.12);
    const strap = new THREE.TorusGeometry(0.17, 0.006, 6, 40, Math.PI);
    strap.rotateY(Math.PI / 2);
    strap.rotateZ(Math.PI);
    strap.translate(0, 0.0, 0);
    return { shell, strap };
  });

// P-51 Mustang (nose +z)
export const mustangGeo = () =>
  memo("gl:p51", () => {
    const fus = lathe(
      [
        [0.0, 4.9],
        [0.25, 4.8],
        [0.5, 4.5],
        [0.62, 3.8],
        [0.66, 2.4],
        [0.6, 0.5],
        [0.42, -2.0],
        [0.2, -4.2],
        [0.05, -4.6],
      ],
      24,
      30,
    );
    fus.rotateX(Math.PI / 2);
    const wing = extrude(
      [
        [0.4, 1.4],
        [5.6, 0.5],
        [5.6, -0.4],
        [0.4, -0.9],
        [-0.4, -0.9],
        [-5.6, -0.4],
        [-5.6, 0.5],
        [-0.4, 1.4],
      ],
      0.14,
    );
    wing.rotateX(Math.PI / 2);
    wing.translate(0, -0.35, 0.5);
    const tailH = extrude(
      [
        [0.2, -3.4],
        [2.1, -3.9],
        [2.1, -4.4],
        [-2.1, -4.4],
        [-2.1, -3.9],
        [-0.2, -3.4],
      ],
      0.08,
    );
    tailH.rotateX(Math.PI / 2);
    tailH.translate(0, 0.1, 0);
    const tailV = extrude(
      [
        [0, 0],
        [-1.4, 0],
        [-1.2, 1.5],
        [-0.6, 1.6],
      ],
      0.08,
    );
    tailV.rotateY(Math.PI / 2);
    tailV.translate(0, 0.3, -3.2);
    const scoop = place(new THREE.SphereGeometry(0.4, 16, 10), [0, -0.6, -0.3], [0, 0, 0], [0.8, 0.6, 2.2]);
    const canopy = place(new THREE.SphereGeometry(0.42, 20, 12), [0, 0.55, 1.0], [0, 0, 0], [0.85, 0.85, 2.0]);
    const spinner = place(new THREE.ConeGeometry(0.3, 0.6, 16), [0, 0, 5.1], [Math.PI / 2, 0, 0]);
    return { body: merge([fus, wing, tailH, tailV, scoop]), canopy, spinner };
  });

export const propBladesGeo = () => memo("gl:p51prop", () => merge([0, 1, 2, 3].map((k) => place(box(0.2, 1.7, 0.04), [0, 0, 0], [0, 0, (k * Math.PI) / 2]).translate(0, 0, 0))));
