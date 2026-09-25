// The West: the Alamo church facade, a covered (prairie schooner) wagon,
// oxen with walking legs, sea stacks, a dugout canoe.
import * as THREE from "three";
import { memo } from "../../lib/math";
import { box, cyl, extrude, lathe, merge, place, smoothIco, tube } from "../geo";
import { driverGeo } from "./industry";
import { fbm2, ridged2 } from "../noise";
import type { GL } from "../GLShot";

// ------------------------------------------------------------ the Alamo (facade faces +z)
export const alamoGeo = () =>
  memo("gl:alamo", () => {
    const W = 19;
    const H = 10.5;
    // facade outline with the iconic curved parapet ("hump")
    const outline: [number, number][] = [[-W / 2, 0], [W / 2, 0], [W / 2, H]];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      const x = W / 2 - t * W;
      const hump = Math.max(0, 1 - Math.abs(x) / 5.5);
      const y = H + Math.sin(hump * Math.PI * 0.5) ** 1.6 * 3.2 + (Math.abs(x) < 5.5 && Math.abs(x) > 4.6 ? 0.3 : 0);
      outline.push([x, y]);
    }
    outline.push([-W / 2, H]);
    // door arch opening
    const door: [number, number][] = [];
    for (let i = 0; i <= 16; i++) {
      const a = Math.PI - (i / 16) * Math.PI;
      door.push([Math.cos(a) * 1.7, 4.2 + Math.sin(a) * 1.7]);
    }
    door.push([1.7, 0.3], [-1.7, 0.3]);
    const facade = extrude(outline, 1.2, [door.reverse()], 0.03);
    const stone: THREE.BufferGeometry[] = [facade];
    // pilasters / engaged columns flanking the door (two storeys), niches between
    for (const s of [-1, 1]) {
      for (const x of [2.6, 4.6]) {
        stone.push(cyl(0.3, 0.33, 4.6, 16, s * x, 2.3, 0.75));
        stone.push(box(0.85, 0.35, 0.85, s * x, 0.18, 0.75), box(0.85, 0.35, 0.85, s * x, 4.72, 0.75));
        stone.push(cyl(0.26, 0.28, 3.6, 16, s * x, 7.0, 0.75));
        stone.push(box(0.75, 0.3, 0.75, s * x, 8.9, 0.75));
      }
      // niches (arched recesses) with ledges
      stone.push(box(1.2, 0.15, 0.5, s * 3.6, 1.6, 0.75), box(1.1, 0.15, 0.45, s * 3.6, 5.9, 0.75));
      // upper window
    }
    // entablature bands
    stone.push(box(10.5, 0.45, 0.4, 0, 5.0, 0.75), box(10.5, 0.35, 0.3, 0, 9.2, 0.7));
    // window above the door
    const dark: THREE.BufferGeometry[] = [];
    dark.push(box(1.1, 1.8, 0.2, 0, 7.2, 0.62));
    dark.push(box(3.3, 3.9, 0.2, 0, 2.2, -0.2)); // door void
    for (const s of [-1, 1]) {
      dark.push(box(0.9, 2.3, 0.2, s * 3.6, 2.85, 0.55), box(0.8, 2.0, 0.2, s * 3.6, 7.0, 0.55)); // niche shadows
      dark.push(box(0.8, 1.3, 0.2, s * 7.4, 3.5, 0.62)); // side windows
    }
    // side walls / roofless nave behind + convento long barrack to the left
    stone.push(box(1.2, 10.5, 22, -W / 2 + 0.6, 5.25, -11), box(1.2, 10.5, 22, W / 2 - 0.6, 5.25, -11));
    stone.push(box(40, 5, 8, -W / 2 - 20, 2.5, -2));
    for (let k = 0; k < 8; k++) dark.push(box(1, 1.6, 0.2, -W / 2 - 4 - k * 4.5, 2.2, 2.02));
    // rubble at the base
    return { stone: merge(stone), dark: merge(dark) };
  });

export const makeAlamo = (g: GL) => {
  const A = alamoGeo();
  const limestone = g.ink({
    color: "#d8c8a6",
    mode: "screen",
    angle: 75,
    scale: 3.4,
    cross: 0.7,
    rim: 0.3,
    drawDir: [0, 1, 0],
    drawRange: [0, 14],
    frag: /* glsl */ `
      // coursed rubble stone + pockmarks from the siege
      float row = floor(vWorld.y / 0.45);
      float along = (abs(N.x) > 0.5 ? vWorld.z : vWorld.x) / 0.9 + mod(row, 2.0) * 0.5;
      float joint = max(1.0 - smoothstep(0.0, 0.06, abs(fract(vWorld.y / 0.45) - 0.5) * 2.0 - 0.9), 1.0 - smoothstep(0.0, 0.05, abs(fract(along) - 0.5) * 2.0 - 0.92));
      extraInk += joint * 0.35;
      albedo *= 0.8 + hash12(vec2(floor(along), row)) * 0.3;
      float pock = step(0.86, tvn(vWorld.xy * 3.0 + vWorld.z));
      extraInk += pock * 0.5;
    `,
  });
  const darkM = g.ink({ color: "#2a2420", hatch: 0.4, drawDir: [0, 1, 0], drawRange: [0, 14] });
  const group = new THREE.Group();
  group.add(new THREE.Mesh(A.stone, limestone), new THREE.Mesh(A.dark, darkM));
  return { group, mats: [limestone, darkM] };
};

// ------------------------------------------------------------ covered wagon (front +z)
export const wagonGeo = () =>
  memo("gl:wagon", () => {
    const wood: THREE.BufferGeometry[] = [];
    wood.push(box(1.3, 0.55, 3.6, 0, 1.05, 0)); // bed
    wood.push(box(1.4, 0.08, 3.8, 0, 1.33, 0));
    wood.push(box(0.1, 0.1, 2.4, 0, 0.8, 2.6)); // tongue
    wood.push(cyl(0.05, 0.05, 1.5, 8, 0, 0.6, 1.15).rotateZ(Math.PI / 2), cyl(0.05, 0.05, 1.5, 8, 0, 0.6, -1.25).rotateZ(Math.PI / 2));
    // bonnet: canvas over hoops (bows), flared at the ends
    const canvasPos: number[] = [];
    const idx: number[] = [];
    const uv: number[] = [];
    const segs = 20;
    const rows = 16;
    for (let j = 0; j <= rows; j++) {
      const t = j / rows;
      const z = (t - 0.5) * 3.9;
      const flare = 1 + Math.pow(Math.abs(t - 0.5) * 2, 3) * 0.25;
      for (let i = 0; i <= segs; i++) {
        const a = (i / segs) * Math.PI;
        const x = Math.cos(a) * 0.72 * flare;
        const y = 1.35 + Math.sin(a) * 1.25 * (1 + Math.abs(t - 0.5) * 0.25);
        const sag = Math.sin(t * Math.PI * 5) * 0.03 * Math.sin(a);
        canvasPos.push(x * (1 - sag), y - sag, z);
        uv.push(i / segs, t);
      }
    }
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < segs; i++) {
        const a0 = j * (segs + 1) + i;
        idx.push(a0, a0 + 1, a0 + segs + 1, a0 + 1, a0 + segs + 2, a0 + segs + 1);
      }
    const canvas = new THREE.BufferGeometry();
    canvas.setAttribute("position", new THREE.Float32BufferAttribute(canvasPos, 3));
    canvas.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    canvas.setIndex(idx);
    canvas.computeVertexNormals();
    // water barrel + toolbox on the side
    wood.push(place(lathe([[0.18, 0], [0.22, 0.2], [0.18, 0.4]], 16, 12), [0.8, 0.9, 0.6]));
    wood.push(box(0.2, 0.25, 0.9, -0.78, 1.0, -0.6));
    return { wood: merge(wood), canvas, wheel: driverGeo(0.6, 12), bigWheel: driverGeo(0.75, 14) };
  });

// ox: lumpy body, head with horns, four jointed legs
export const makeOx = (g: GL, color = "#6a4e34") => {
  const hide = g.ink({ color, mode: "screen", angle: 60, scale: 3.4, cross: 0.7, rim: 0.5 });
  const horn = g.ink({ color: "#e8dcc4", spec: 0.8 });
  const root = new THREE.Group();
  const body = new THREE.Mesh(
    (() => {
      const b = smoothIco(1, 3);
      const p = b.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i);
        const y = p.getY(i);
        const z = p.getZ(i);
        const hump = z > 0.3 && y > 0.3 ? 0.15 : 0;
        p.setXYZ(i, x * 0.45, y * 0.5 + hump, z * 1.1);
      }
      b.computeVertexNormals();
      return b;
    })(),
    hide,
  );
  body.position.y = 1.2;
  root.add(body);
  const head = new THREE.Group();
  head.position.set(0, 1.35, 1.25);
  const skull = new THREE.Mesh(smoothIco(1, 2), hide);
  skull.scale.set(0.22, 0.25, 0.42);
  skull.position.z = 0.25;
  skull.rotation.x = 0.5;
  head.add(skull);
  for (const s of [-1, 1]) {
    const h = new THREE.Mesh(tube([new THREE.Vector3(s * 0.15, 0.15, 0.1), new THREE.Vector3(s * 0.4, 0.25, 0.05), new THREE.Vector3(s * 0.5, 0.45, 0.1)], 0.035, 8, 5), horn);
    head.add(h);
  }
  root.add(head);
  const legs: THREE.Group[] = [];
  for (const [x, z] of [
    [0.25, 0.7],
    [-0.25, 0.7],
    [0.25, -0.7],
    [-0.25, -0.7],
  ]) {
    const leg = new THREE.Group();
    leg.position.set(x, 1.0, z);
    const upper = new THREE.Mesh(cyl(0.1, 0.08, 0.5, 8, 0, -0.25, 0), hide);
    const lower = new THREE.Group();
    lower.position.y = -0.5;
    lower.add(new THREE.Mesh(cyl(0.07, 0.06, 0.5, 8, 0, -0.25, 0), hide));
    leg.add(upper, lower);
    root.add(leg);
    legs.push(leg);
  }
  const walk = (ph: number) => {
    legs.forEach((leg, i) => {
      const p = ph + (i === 0 || i === 3 ? 0 : Math.PI);
      leg.rotation.x = Math.sin(p) * 0.35;
      (leg.children[1] as THREE.Group).rotation.x = Math.max(0, -Math.cos(p)) * 0.6;
    });
    head.rotation.x = Math.sin(ph * 2) * 0.05;
    body.position.y = 1.2 + Math.abs(Math.sin(ph)) * 0.03;
  };
  return { root, walk, mats: [hide, horn] };
};

// sea stack: tall eroded rock
export const seaStackGeo = (seed: number, h: number, r: number) => {
  const g = new THREE.CylinderGeometry(r * 0.7, r, h, 24, 24);
  g.translate(0, h / 2, 0);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    const a = Math.atan2(z, x);
    const k = 1 + (ridged2(a * 2 + seed, y * 0.08, 4, seed) - 0.5) * 0.5 + (fbm2(a * 5, y * 0.3, 3, seed + 1) - 0.5) * 0.25;
    const top = y > h * 0.85 ? 1 - (y - h * 0.85) / (h * 0.15) * 0.5 : 1;
    p.setXYZ(i, x * k * top, y, z * k * top);
  }
  g.computeVertexNormals();
  return g;
};

export const canoeGeo = () =>
  memo("gl:canoe", () => {
    const pts: [number, number][] = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      pts.push([(t - 0.5) * 7, Math.sin(t * Math.PI) * 0.45]);
    }
    for (let i = 20; i >= 0; i--) {
      const t = i / 20;
      pts.push([(t - 0.5) * 7, -Math.sin(t * Math.PI) * 0.45]);
    }
    const hull = extrude(pts, 0.5, [], 0.05);
    hull.rotateX(Math.PI / 2);
    hull.rotateY(Math.PI / 2);
    return hull;
  });

export { box };
