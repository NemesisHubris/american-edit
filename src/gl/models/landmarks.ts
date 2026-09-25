// Landmarks: Mount Rushmore (sculpted heads in a granite cliff), the Grand
// Canyon (terraced strata terrain + river), a night skyline with lit windows,
// the lower-48 map as extruded states.
import * as THREE from "three";
import { memo } from "../../lib/math";
import { rng } from "../../lib/random";
import { fbm2, ridged2, vnoise2 } from "../noise";
import { box, merge, terrain } from "../geo";
import { getUSMap } from "../../lib/usmap";
import type { GL } from "../GLShot";

// ------------------------------------------------------------ Rushmore
// A head as a displaced sphere: brow, eye sockets, nose, cheekbones, mouth,
// chin, jaw. Face looks to +z. `beard`, `glasses`, `hair` give each president
// a readable silhouette.
type HeadStyle = { beard?: number; glasses?: boolean; hair?: number; wide?: number; jaw?: number; nose?: number; tilt?: number };
const bump = (x: number, y: number, cx: number, cy: number, sx: number, sy: number) => Math.exp(-((x - cx) ** 2) / (sx * sx) - ((y - cy) ** 2) / (sy * sy));

export const headGeo = (st: HeadStyle, seed: number) => {
  const g = new THREE.SphereGeometry(1, 160, 120);
  const p = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    // head proportions: taller than wide, deeper than wide
    let x = v.x * 0.78 * (st.wide ?? 1);
    let y = v.y * 1.05;
    let z = v.z * 0.92;
    const front = Math.max(0, v.z); // 0 at the sides, 1 at the face
    // face-plane coords
    const fx = v.x;
    const fy = v.y;
    let d = 0;
    if (front > 0.2) {
      const w = Math.min(1, (front - 0.2) / 0.3);
      d += 0.12 * bump(fx, fy, 0, 0.28, 0.55, 0.09) * w; // brow ridge
      d -= 0.13 * (bump(fx, fy, -0.28, 0.14, 0.15, 0.1) + bump(fx, fy, 0.28, 0.14, 0.15, 0.1)) * w; // eye sockets
      d += 0.05 * (bump(fx, fy, -0.28, 0.13, 0.08, 0.05) + bump(fx, fy, 0.28, 0.13, 0.08, 0.05)) * w; // eyeballs
      const nose = st.nose ?? 1;
      d += 0.3 * nose * bump(fx, fy, 0, -0.02, 0.09, 0.2) * Math.max(0, 1 - Math.abs(fy + 0.02) / 0.3) * w; // nose
      d += 0.1 * nose * bump(fx, fy, 0, -0.2, 0.14, 0.05) * w; // nose tip / nostrils
      d += 0.07 * (bump(fx, fy, -0.36, -0.05, 0.14, 0.12) + bump(fx, fy, 0.36, -0.05, 0.14, 0.12)) * w; // cheekbones
      d -= 0.05 * bump(fx, fy, 0, -0.38, 0.22, 0.03) * w; // mouth line
      d += 0.05 * (bump(fx, fy, 0, -0.33, 0.2, 0.04) + bump(fx, fy, 0, -0.44, 0.18, 0.04)) * w; // lips
      d += 0.1 * (st.jaw ?? 1) * bump(fx, fy, 0, -0.62, 0.22, 0.12) * w; // chin
      if (st.glasses) {
        const ring = (cx: number) => Math.exp(-((Math.hypot(fx - cx, (fy - 0.13) * 1.3) - 0.14) ** 2) / 0.0006);
        d += 0.05 * (ring(-0.27) + ring(0.27)) * w;
        d += 0.04 * bump(fx, fy, 0, 0.14, 0.06, 0.015) * w;
      }
      if (st.beard) d += st.beard * 0.12 * bump(fx, fy, 0, -0.55, 0.5, 0.22) * w * (0.8 + 0.4 * vnoise2(fx * 30, fy * 30, seed));
    }
    // jaw narrowing below
    if (y < -0.3) {
      const k = 1 - Math.min(0.35, (-0.3 - y) * 0.6) * (1 - (st.jaw ?? 1) * 0.3);
      x *= k;
      z = z * (0.9 + 0.1 * k);
    }
    // hair mass on top / back
    if (y > 0.35 && v.z < 0.6) d += (st.hair ?? 0.5) * 0.08 * (vnoise2(v.x * 10 + seed, v.y * 10, seed) - 0.3);
    // chisel marks
    d += (fbm2(v.x * 6 + seed, v.y * 6 + v.z * 6, 3, seed) - 0.5) * 0.04;
    const n = new THREE.Vector3(x, y, z).normalize();
    p.setXYZ(i, x + n.x * d, y + n.y * d, z + n.z * d);
  }
  g.computeVertexNormals();
  return g;
};

// Face relief in head-local coords (fx, fy in -1..1), returns extra height / s
const faceRelief = (fx: number, fy: number, st: HeadStyle, seed: number) => {
  let d = 0;
  const nose = st.nose ?? 1;
  d += 0.1 * bump(fx, fy, 0, 0.3, 0.6, 0.08); // brow ridge
  d -= 0.12 * (bump(fx, fy, -0.3, 0.16, 0.14, 0.09) + bump(fx, fy, 0.3, 0.16, 0.14, 0.09)); // eye sockets
  d += 0.035 * (bump(fx, fy, -0.3, 0.15, 0.07, 0.045) + bump(fx, fy, 0.3, 0.15, 0.07, 0.045)); // eyeballs
  d += 0.13 * nose * bump(fx, fy, 0, 0.0, 0.11, 0.22) * Math.max(0, 1 - Math.abs(fy) / 0.32); // nose bridge
  d += 0.06 * nose * bump(fx, fy, 0, -0.18, 0.16, 0.07); // nose tip
  d += 0.06 * (bump(fx, fy, -0.4, -0.05, 0.15, 0.13) + bump(fx, fy, 0.4, -0.05, 0.15, 0.13)); // cheekbones
  d -= 0.05 * (bump(fx, fy, -0.25, -0.22, 0.08, 0.12) + bump(fx, fy, 0.25, -0.22, 0.08, 0.12)); // nasolabial folds
  d -= 0.05 * bump(fx, fy, 0, -0.4, 0.22, 0.025); // mouth line
  d += 0.04 * (bump(fx, fy, 0, -0.35, 0.2, 0.04) + bump(fx, fy, 0, -0.46, 0.17, 0.04)); // lips
  d += 0.08 * (st.jaw ?? 1) * bump(fx, fy, 0, -0.68, 0.24, 0.12); // chin
  if (st.glasses) {
    const ring = (cx: number) => Math.exp(-((Math.hypot(fx - cx, (fy - 0.15) * 1.3) - 0.15) ** 2) / 0.0008);
    d += 0.045 * (ring(-0.29) + ring(0.29)) + 0.035 * bump(fx, fy, 0, 0.15, 0.07, 0.02);
    d += 0.05 * bump(fx, fy, 0, -0.3, 0.3, 0.06); // moustache
  }
  if (st.beard) d += st.beard * 0.1 * bump(fx, fy, 0, -0.62, 0.55, 0.22) * (0.8 + 0.4 * vnoise2(fx * 25, fy * 25, seed));
  if (fy > 0.45) d += (st.hair ?? 0.5) * 0.06 * (vnoise2(fx * 12 + seed, fy * 12, seed) - 0.2); // hair
  return d;
};

const RUSH_HEADS: [HeadStyle, number, number, number, number][] = [
  // style, x, y (centre above base), depth offset, head height (m)
  [{ hair: 0.9, jaw: 1.1 }, -40, 50, 0, 24],
  [{ hair: 0.7, wide: 0.95 }, -15, 47, -6, 21],
  [{ glasses: true, hair: 0.4, wide: 1.05 }, 6, 45, -9, 19],
  [{ beard: 1.2, hair: 0.8, nose: 1.1 }, 32, 49, 0, 24],
];

export const rushmoreHeight = (x: number, up: number) => {
  // granite face: vertical fractures, rounded summit, talus apron
  let h = (ridged2(x * 0.06, up * 0.015, 5, 9) - 0.45) * 18 + (fbm2(x * 0.025, up * 0.025, 5, 3) - 0.5) * 22 + (ridged2(x * 0.2, up * 0.05, 3, 4) - 0.4) * 3;
  h += -Math.pow(Math.max(0, up - 66), 1.6) * 0.45 + Math.max(0, 14 - up) * 1.3 - Math.abs(x) * 0.08;
  RUSH_HEADS.forEach(([st, hx, hy, dz, s], i) => {
    const a = s * 0.42 * (st.wide ?? 1);
    const b = s * 0.55;
    const fx = (x - hx) / a;
    const fy = (up - hy) / b;
    const q = fx * fx + fy * fy;
    // shoulders / neck mass below each head
    const neck = s * 0.5 * Math.exp(-((x - hx) ** 2) / (a * a * 1.8) - Math.max(0, hy - b * 0.9 - up) ** 2 / (s * s * 0.6)) * (up < hy - b * 0.5 ? 1 : 0);
    let head = -1e9;
    if (q < 1.15) {
      const dome = s * 0.62 * Math.sqrt(Math.max(0, 1 - Math.min(1, q)));
      head = dome + faceRelief(fx, fy, st, i * 7) * s * 1.1 + dz + 10;
    }
    h = Math.max(h, head, neck + dz + 6 + h * 0.3);
  });
  // chisel texture
  return h + (fbm2(x * 0.4, up * 0.4, 2, 1) - 0.5) * 0.35;
};

export const makeRushmore = (g: GL) => {
  const granite = g.ink({
    color: "#cbc2b2",
    mode: "world",
    dir: [0.15, 1, 0.1],
    scale: 1.3,
    cross: 0.75,
    shade: 1,
    frag: /* glsl */ `
      albedo *= 0.84 + tvn(vWorld.xy * vec2(0.3, 0.06)) * 0.25;
      extraInk += (tvn(vWorld.xy * vec2(1.2, 0.2)) - 0.5) * 0.15;
    `,
  });
  const group = new THREE.Group();
  const cliff = memo("rushCliff", () => {
    const gg = terrain(420, 110, 700, 260, (x, zz) => rushmoreHeight(x, -zz + 55));
    gg.rotateX(Math.PI / 2);
    return gg;
  });
  const cliffMesh = new THREE.Mesh(cliff, granite);
  cliffMesh.position.set(0, 55, -20);
  group.add(cliffMesh);
  const talus = terrain(420, 220, 160, 100, (x, zz) => (fbm2(x * 0.03, zz * 0.03, 5, 4) - 0.5) * 14 + Math.max(0, -zz) * 0.4);
  const tal = new THREE.Mesh(talus, g.ink({ color: "#b8ab95", mode: "stipple", hatch: 0.9, shade: 1 }));
  tal.position.set(0, -4, 70);
  group.add(tal);
  return { group, granite };
};

// Ponderosa pines: instanced cones stacked, dark green
export const makePines = (g: GL, spots: [number, number, number, number][]) => {
  const tiers: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 5; k++) {
    const c = new THREE.ConeGeometry(1 - k * 0.15, 1.2, 9, 1);
    c.translate(0, 1.2 + k * 0.75, 0);
    const p = c.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) p.setX(i, p.getX(i) * (1 + Math.sin(i * 1.7) * 0.12));
    tiers.push(c);
  }
  tiers.push(new THREE.CylinderGeometry(0.1, 0.14, 1.4, 6).translate(0, 0.7, 0));
  const geo = merge(tiers);
  const mat = g.ink({ color: "#3f5a36", mode: "screen", angle: 70, scale: 3.5, instanced: true, cross: 0.8, shade: 0.9 });
  const mesh = new THREE.InstancedMesh(geo, mat, spots.length);
  spots.forEach(([x, y, z, s], i) => mesh.setMatrixAt(i, new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, i, 0)), new THREE.Vector3(s, s * 1.3, s))));
  mesh.frustumCulled = false;
  return { mesh, mat };
};

// ------------------------------------------------------------ Grand Canyon
// Terraced strata: noise height quantised into ledges with steep risers, a
// winding inner gorge, buttes left standing.
export const riverX = (z: number) => Math.sin(z * 0.004) * 160 + Math.sin(z * 0.011 + 1) * 60;
const sstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
export const canyonHeight = (x: number, z: number) => {
  const d = Math.abs(x - riverX(z));
  const n = fbm2(x * 0.003, z * 0.003, 5, 17);
  let depth = Math.min(1, Math.max(0, (650 - d + (n - 0.5) * 500) / 650));
  // isolated flat-topped buttes and temples left standing inside the canyon
  const b = ridged2(x * 0.004 + 3, z * 0.004, 4, 5);
  const mesa = sstep(0.6, 0.66, b) * (d > 60 ? 1 : 0);
  depth = depth * (1 - mesa * (0.35 + 0.4 * sstep(0.66, 0.8, b)));
  let h = -Math.pow(depth, 0.9) * 520;
  // terraces: ledges with steep risers
  const step = 52;
  const t = h / step;
  const fl = Math.floor(t);
  const fr = t - fl;
  h = (fl + Math.pow(fr, 4)) * step;
  h += (fbm2(x * 0.02, z * 0.02, 3, 2) - 0.5) * 8;
  // inner gorge
  h -= Math.max(0, 40 - d) * 2.2;
  return h;
};

export const makeCanyon = (g: GL, size = 3000, res = 500) => {
  const mat = g.ink({
    color: "#c9794a",
    mode: "world",
    dir: [0, 1, 0],
    scale: 0.14,
    cross: 0.4,
    shade: 1,
    rim: 0.25,
    hatch: 0.55,
    inkDark: 0.45,
    frag: /* glsl */ `
      // coloured strata bands by altitude
      float yy = vWorld.y;
      float band = fract(yy / 52.0);
      vec3 red = vec3(0.74, 0.38, 0.22);
      vec3 buff = vec3(0.9, 0.7, 0.48);
      vec3 grey = vec3(0.6, 0.52, 0.48);
      vec3 c = mix(red, buff, smoothstep(0.35, 0.75, tvn(vec2(yy * 0.03, 1.0))));
      c = mix(c, grey, smoothstep(-260.0, -460.0, yy) * 0.6);
      c = mix(c, vec3(0.94, 0.84, 0.66), smoothstep(-20.0, 0.0, yy) * 0.6);
      albedo = c * (0.92 + band * 0.12);
      extraInk += (1.0 - smoothstep(0.0, 0.06, band)) * 0.3 * smoothstep(0.5, 0.2, abs(N.y));
      hatchMul = 0.85;
    `,
  });
  const geo = terrain(size, size, res, res, canyonHeight);
  const mesh = new THREE.Mesh(geo, mat);
  // river ribbon on the gorge floor
  const pos: number[] = [];
  const idx: number[] = [];
  let k = 0;
  for (let z = -size / 2; z <= size / 2; z += 8) {
    const x = riverX(z);
    const y = canyonHeight(x, z) + 3;
    pos.push(x - 14, y, z, x + 14, y, z);
    if (k > 0) idx.push(2 * k - 2, 2 * k - 1, 2 * k, 2 * k - 1, 2 * k + 1, 2 * k);
    k++;
  }
  const rg = new THREE.BufferGeometry();
  rg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  rg.setAttribute("uv", new THREE.Float32BufferAttribute(new Array((pos.length / 3) * 2).fill(0), 2));
  rg.setIndex(idx);
  rg.computeVertexNormals();
  const river = new THREE.Mesh(rg, g.ink({ color: "#3f8c86", spec: 1.6, gloss: 60, mode: "screen", angle: 0, scale: 3, emissive: "#2d6a6a", emissiveAmt: 0.4, side: THREE.DoubleSide }));
  return { mesh, mat, river };
};

// ------------------------------------------------------------ skyline
export const makeSkyline = (g: GL, o: { count?: number; x?: [number, number]; z?: [number, number]; seed?: string } = {}) => {
  const r = rng(o.seed ?? "sky");
  const geos: THREE.BufferGeometry[] = [];
  const n = o.count ?? 70;
  const xr = o.x ?? [-600, 600];
  const zr = o.z ?? [-300, -80];
  for (let i = 0; i < n; i++) {
    const w = 18 + r() * 34;
    const d = 18 + r() * 30;
    const h = 40 + Math.pow(r(), 2.2) * 260;
    const x = xr[0] + r() * (xr[1] - xr[0]);
    const z = zr[0] + r() * (zr[1] - zr[0]);
    geos.push(box(w, h, d, x, h / 2, z));
    if (h > 170) {
      // setbacks + spire
      geos.push(box(w * 0.7, h * 0.18, d * 0.7, x, h + h * 0.09, z));
      geos.push(box(w * 0.4, h * 0.1, d * 0.4, x, h * 1.23, z));
      geos.push(new THREE.CylinderGeometry(0.4, 1.2, h * 0.25, 6).translate(x, h * 1.4, z));
    }
  }
  const mat = g.ink({
    color: "#1b2233",
    mode: "world",
    dir: [0, 1, 0],
    scale: 0.35,
    hatch: 0.6,
    shade: 0.6,
    rim: 0.5,
    rimCol: "#8fb0ff",
    uniforms: { uFlash: { value: new THREE.Color(0, 0, 0) } },
    fragDecl: "uniform vec3 uFlash;",
    frag: /* glsl */ `
      // window grid on the walls (not roofs)
      float wall = 1.0 - step(0.7, abs(N.y));
      vec2 wp = vec2(dot(vWorld.xz, normalize(vec2(-N.z, N.x) + 1e-5)), vWorld.y);
      vec2 cell = floor(wp / vec2(3.2, 4.0));
      vec2 f = fract(wp / vec2(3.2, 4.0));
      float win = step(0.2, f.x) * step(f.x, 0.8) * step(0.25, f.y) * step(f.y, 0.75);
      float lit = step(0.45, hash12(cell + floor(vWorld.x / 60.0) * 17.0));
      vec3 warm = mix(vec3(1.0, 0.8, 0.45), vec3(0.8, 0.9, 1.0), hash12(cell * 1.7));
      emis += warm * win * lit * wall * 0.9;
      albedo += uFlash * 0.25;
      hatchMul = 1.0 - win * lit * wall;
    `,
  });
  return { mesh: new THREE.Mesh(merge(geos), mat), mat };
};

// ------------------------------------------------------------ US map (extruded states)
export const stateRings = () =>
  memo("gl:stateRings", () => {
    const m = getUSMap();
    return m.states.map((s) => {
      const rings: [number, number][][] = [];
      for (const part of s.d.split("M").filter(Boolean)) {
        const pts = part
          .replace(/Z/g, "")
          .split("L")
          .map((q) => q.split(",").map(Number) as [number, number])
          .filter((q) => q.length === 2 && isFinite(q[0]) && isFinite(q[1]));
        if (pts.length > 2) rings.push(pts);
      }
      return { id: s.id, c: s.c, rings };
    });
  });

// map px (1920x1080 layout) -> world: x right, z down the map, 1 px = k units
export const makeUSMap = (g: GL, k = 0.1, depth = 1.5, gap = 0.8) => {
  const states = stateRings();
  const geos: THREE.BufferGeometry[] = [];
  for (const s of states)
    for (const ring of s.rings) {
      // shrink ring towards its centroid a little to leave a gap between states
      const cx = ring.reduce((a, p) => a + p[0], 0) / ring.length;
      const cy = ring.reduce((a, p) => a + p[1], 0) / ring.length;
      const pts = ring.map(([x, y]) => {
        const dx = x - cx;
        const dy = y - cy;
        const L = Math.hypot(dx, dy) || 1;
        const sh = Math.min(gap, L * 0.3);
        return new THREE.Vector2((x - (dx / L) * sh - 960) * k, -(y - (dy / L) * sh - 560) * k);
      });
      if (THREE.ShapeUtils.isClockWise(pts)) pts.reverse();
      const shape = new THREE.Shape(pts);
      const eg = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 1 });
      eg.rotateX(-Math.PI / 2);
      geos.push(eg);
    }
  return merge(geos);
};

export const mapPx = (p: [number, number], k = 0.1) => new THREE.Vector3((p[0] - 960) * k, 0, (p[1] - 560) * k);
export { box };
