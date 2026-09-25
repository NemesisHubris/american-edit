// Colonial-era models: Independence Hall (brick, windows, tower and steeple,
// clock), the Liberty Bell (true lathe profile, yoke, crack, inscription),
// a writing desk with candle, inkwell, books and a feathered quill, muskets on
// a fieldstone wall, a Durham boat with oars.
import * as THREE from "three";
import { memo } from "../../lib/math";
import { rng } from "../../lib/random";
import { box, cyl, extrude, lathe, merge, place, tube } from "../geo";
import { canvasTex } from "./modern";
import type { GL } from "../GLShot";

// ------------------------------------------------------------ Independence Hall
// Units: metres. Main block 32 m wide (x), 14 m deep (z), 2 storeys; the tower
// stands on the south (+z... we face the camera toward the south facade at +z).
export const hallGeo = () =>
  memo("gl:hall", () => {
    const brick: THREE.BufferGeometry[] = [];
    const trim: THREE.BufferGeometry[] = [];
    const dark: THREE.BufferGeometry[] = [];
    const roof: THREE.BufferGeometry[] = [];
    // main block
    brick.push(box(32, 13, 14, 0, 6.5, 0));
    // hipped roof with a balustraded flat top
    const r = new THREE.CylinderGeometry(0.01, 1, 1, 4, 1);
    r.rotateY(Math.PI / 4);
    roof.push(place(r, [0, 13 + 2.4, 0], [0, 0, 0], [32 * 0.72, 4.8, 14 * 0.72]));
    trim.push(box(33, 0.6, 15, 0, 13.1, 0)); // cornice
    trim.push(box(32.4, 0.4, 14.4, 0, 6.6, 0)); // belt course
    // chimneys
    for (const x of [-13, -8, 8, 13]) brick.push(box(1.2, 4, 0.9, x, 15.5, 0));
    // wings + arcades
    for (const s of [-1, 1]) {
      brick.push(box(12, 9, 10, s * 30, 4.5, -2));
      roof.push(place(new THREE.CylinderGeometry(0.01, 1, 1, 4, 1).rotateY(Math.PI / 4), [s * 30, 9 + 1.6, -2], [0, 0, 0], [12 * 0.72, 3.2, 10 * 0.72]));
      trim.push(box(12.4, 0.4, 10.4, s * 30, 9.1, -2));
      // arcade: piers + arches between hall and wing
      for (let k = 0; k < 4; k++) brick.push(box(0.8, 5, 3, s * (17.5 + k * 1.6), 2.5, 1));
      brick.push(box(6.6, 1.2, 3, s * 20, 5.6, 1));
    }
    // windows: 9 bays x 2 storeys on the south facade (+z)
    const winFrames: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 9; i++) {
      const x = -14 + i * 3.5;
      for (const y of [3.2, 9.8]) {
        if (i === 4 && y < 5) continue; // door
        dark.push(box(1.6, 2.8, 0.2, x, y, 7.02));
        winFrames.push(box(1.9, 0.2, 0.3, x, y + 1.5, 7.05), box(1.9, 0.25, 0.4, x, y - 1.5, 7.1)); // lintel, sill
        winFrames.push(box(0.08, 2.8, 0.25, x, y, 7.08), box(1.6, 0.08, 0.25, x, y, 7.08)); // muntins
        winFrames.push(box(0.12, 2.8, 0.25, x - 0.86, y, 7.05), box(0.12, 2.8, 0.25, x + 0.86, y, 7.05));
        // keystone
        winFrames.push(box(0.4, 0.5, 0.35, x, y + 1.75, 7.1));
      }
    }
    // doorway with pediment + pilasters
    dark.push(box(2.2, 4, 0.2, 0, 2, 7.02));
    winFrames.push(box(0.4, 4.6, 0.5, -1.5, 2.3, 7.15), box(0.4, 4.6, 0.5, 1.5, 2.3, 7.15));
    const ped = extrude(
      [
        [-2.2, 0],
        [2.2, 0],
        [0, 1.2],
      ],
      0.5,
    );
    winFrames.push(place(ped, [0, 4.7, 7.2]));
    trim.push(...winFrames);
    // tower (south side, centred): brick base, then wooden stages
    brick.push(box(8, 20, 8, 0, 10, 10));
    for (let i = 0; i < 3; i++) {
      const y = 4 + i * 5.5;
      dark.push(box(1.4, 3.2, 0.2, 0, y, 14.02));
      trim.push(box(1.7, 0.2, 0.3, 0, y + 1.7, 14.05), box(1.7, 0.25, 0.4, 0, y - 1.7, 14.1), box(0.08, 3.2, 0.25, 0, y, 14.06), box(1.4, 0.08, 0.25, 0, y, 14.06));
    }
    trim.push(box(8.6, 0.6, 8.6, 0, 20.2, 10));
    // clock stage
    trim.push(box(6, 5, 6, 0, 23, 10));
    // octagonal belfry with arched openings + columns
    const bel = new THREE.CylinderGeometry(2.6, 2.6, 5, 8, 1);
    bel.rotateY(Math.PI / 8);
    trim.push(place(bel, [0, 28, 10]));
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
      trim.push(cyl(0.18, 0.2, 4.6, 8, Math.cos(a) * 2.85, 28, 10 + Math.sin(a) * 2.85));
      dark.push(place(box(1.2, 3, 0.2), [Math.cos(a + Math.PI / 8) * 2.62, 28.2, 10 + Math.sin(a + Math.PI / 8) * 2.62], [0, -(a + Math.PI / 8) + Math.PI / 2, 0]));
    }
    trim.push(place(new THREE.CylinderGeometry(3.1, 3.1, 0.5, 8).rotateY(Math.PI / 8), [0, 30.7, 10]));
    // second, smaller octagon + dome + spire + weathervane
    const b2 = new THREE.CylinderGeometry(1.8, 2.1, 3.2, 8, 1);
    b2.rotateY(Math.PI / 8);
    trim.push(place(b2, [0, 32.6, 10]));
    trim.push(
      place(
        lathe(
          [
            [2.0, 0],
            [1.9, 0.8],
            [1.2, 1.8],
            [0.5, 2.6],
            [0.3, 3.2],
            [0.25, 6.5],
            [0.05, 8.5],
            [0, 8.6],
          ],
          24,
        ),
        [0, 34.2, 10],
      ),
    );
    trim.push(tube([new THREE.Vector3(0, 42.6, 10), new THREE.Vector3(0, 44.5, 10)], 0.05, 2, 5));
    trim.push(place(box(1.4, 0.3, 0.05), [0.3, 44, 10]));
    // clock faces (east / west / south)
    const clock = cyl(1.6, 1.6, 0.2, 32).rotateX(Math.PI / 2);
    const faces = [place(clock, [0, 23, 13.1])];
    // steps
    trim.push(box(4, 0.3, 1.5, 0, 0.15, 14.8), box(3.4, 0.3, 1.2, 0, 0.45, 14.4));
    return { brick: merge(brick), trim: merge(trim), dark: merge(dark), roof: merge(roof), clock: merge(faces) };
  });

export const makeHall = (g: GL) => {
  const G = hallGeo();
  const brickM = g.ink({
    color: "#a2553a",
    mode: "world",
    dir: [0, 1, 0],
    scale: 3.6,
    cross: 0.6,
    shade: 0.9,
    frag: /* glsl */ `
      // flemish bond brick courses
      vec3 wp = vWorld * vec3(1.0, 1.0, 1.0);
      float course = floor(wp.y / 0.2);
      float along = (abs(N.x) > 0.5 ? wp.z : wp.x) / 0.3 + mod(course, 2.0) * 0.5;
      float mortar = max(1.0 - smoothstep(0.0, 0.08, abs(fract(wp.y / 0.2) - 0.5) * 2.0 - 0.84), 1.0 - smoothstep(0.0, 0.06, abs(fract(along) - 0.5) * 2.0 - 0.88));
      float header = step(0.5, fract(along * 0.5));
      albedo *= mix(0.88, 1.08, hash12(vec2(floor(along), course))) * mix(1.0, 0.75, header * 0.35);
      albedo = mix(albedo, vec3(0.86, 0.8, 0.7), mortar * 0.55);
    `,
  });
  const trimM = g.ink({ color: "#f1ebdd", mode: "world", dir: [0, 1, 0], scale: 6, cross: 0.6, shade: 0.9 });
  const darkM = g.ink({ color: "#2a2e33", mode: "world", dir: [0, 1, 0.2], scale: 10, spec: 0.8, gloss: 50, rim: 0.2 });
  const roofM = g.ink({ color: "#6a6660", mode: "world", dir: [1, 0, 0], scale: 3, cross: 0.4 });
  const clockTex = canvasTex("clockface", 256, 256, (ctx) => {
    ctx.fillStyle = "#f4efe2";
    ctx.beginPath();
    ctx.arc(128, 128, 126, 0, 7);
    ctx.fill();
    ctx.strokeStyle = "#1a1510";
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.fillStyle = "#1a1510";
    ctx.font = "bold 26px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const R = ["XII", "I", "II", "III", "IIII", "V", "VI", "VII", "VIII", "IX", "X", "XI"];
    R.forEach((t, i) => {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      ctx.fillText(t, 128 + Math.cos(a) * 96, 128 + Math.sin(a) * 96);
    });
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(128, 128);
    ctx.lineTo(128 + 50, 128 - 30);
    ctx.moveTo(128, 128);
    ctx.lineTo(128 - 10, 128 - 80);
    ctx.stroke();
  });
  const clockM = g.ink({ color: "#ffffff", hatch: 0.3, uniforms: { uClk: { value: clockTex } }, fragDecl: "uniform sampler2D uClk;", frag: "albedo = texture(uClk, vec2(vUv.x, 1.0 - vUv.y)).rgb;" });
  // cylinder cap uvs are planar; good enough for the clock disc
  const group = new THREE.Group();
  group.add(new THREE.Mesh(G.brick, brickM), new THREE.Mesh(G.trim, trimM), new THREE.Mesh(G.dark, darkM), new THREE.Mesh(G.roof, roofM), new THREE.Mesh(G.clock, clockM));
  return { group, mats: [brickM, trimM, darkM, roofM, clockM] };
};

// ------------------------------------------------------------ Liberty Bell
// ~0.95 m tall body, lip diameter 1.1 m. Origin at the crown top; hangs down.
export const bellGeo = () =>
  memo("gl:bell", () => {
    const body = lathe(
      [
        [0.0, 0.0],
        [0.2, 0.0],
        [0.28, -0.02],
        [0.32, -0.08],
        [0.33, -0.2],
        [0.34, -0.36],
        [0.37, -0.52],
        [0.42, -0.66],
        [0.5, -0.78],
        [0.56, -0.86],
        [0.57, -0.9],
        [0.555, -0.93],
        [0.52, -0.92],
        [0.48, -0.86],
        [0.4, -0.76],
        [0.33, -0.6],
        [0.29, -0.4],
        [0.27, -0.2],
        [0.23, -0.07],
        [0.0, -0.06],
      ],
      96,
      120,
    );
    // raised bands (inscription band near the shoulder, lip rings)
    const band = (y: number, r: number, h: number) => cyl(r, r, h, 96, 0, y, 0, true);
    const bands = merge([band(-0.13, 0.334, 0.012), band(-0.25, 0.336, 0.01), band(-0.76, 0.43, 0.012), band(-0.82, 0.5, 0.01)]);
    // crown / canons
    const crown: THREE.BufferGeometry[] = [];
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      crown.push(tube([new THREE.Vector3(Math.cos(a) * 0.1, 0, Math.sin(a) * 0.1), new THREE.Vector3(Math.cos(a) * 0.08, 0.12, Math.sin(a) * 0.08), new THREE.Vector3(0, 0.16, 0)], 0.025, 8, 6));
    }
    // yoke (elm beam) with iron straps
    const yoke = merge([box(0.3, 0.26, 1.35, 0, 0.3, 0), place(extrude([[-0.15, 0], [0.15, 0], [0.1, 0.25], [-0.1, 0.25]], 1.3), [0, 0.43, 0], [0, 0, 0])]);
    const straps = merge([box(0.32, 0.05, 0.08, 0, 0.18, 0.2), box(0.32, 0.05, 0.08, 0, 0.18, -0.2), box(0.04, 0.3, 0.08, 0.16, 0.28, 0.2), box(0.04, 0.3, 0.08, -0.16, 0.28, 0.2)]);
    return { body, bands, crown: merge(crown), yoke, straps };
  });

export const makeBell = (g: GL) => {
  const B = bellGeo();
  const bronze = g.ink({
    color: "#6d5a3c",
    mode: "u",
    scale: 180,
    scale2: 80,
    spec: 1.1,
    gloss: 28,
    rim: 0.7,
    rimPow: 2.5,
    uniforms: { uCrack: { value: 0 } },
    fragDecl: "uniform float uCrack;",
    frag: /* glsl */ `
      // patina mottling
      albedo *= 0.8 + tvn(vObj.xy * 20.0 + vObj.z * 13.0) * 0.35;
      // inscription band: rows of small raised letters (as ink ticks)
      float y = vObj.y;
      float inBand = step(-0.24, y) * step(y, -0.14);
      float a = atan(vObj.z, vObj.x);
      float glyph = step(0.55, tvn(vec2(a * 60.0, floor((y + 0.24) / 0.05) * 7.0))) * step(0.15, fract((y + 0.24) / 0.05)) * step(fract((y + 0.24) / 0.05), 0.85);
      extraInk += inBand * glyph * 0.8;
      // the crack: a jagged line down the front, drawn in as uCrack grows
      float ca = atan(vObj.z, vObj.x) - 1.5708;
      float wig = (tvn(vec2(y * 40.0, 3.0)) - 0.5) * 0.05 + (tvn(vec2(y * 140.0, 7.0)) - 0.5) * 0.015;
      float d = abs(ca - wig - 0.02);
      float grow = step(-0.92 + (1.0 - uCrack) * 0.9, y) * step(y, -0.18);
      float crack = (1.0 - smoothstep(0.004, 0.018, d)) * grow * step(0.0, vObj.z);
      albedo = mix(albedo, vec3(0.05), crack);
      extraInk += crack;
    `,
  });
  const wood = g.ink({ color: "#6a4a2c", mode: "world", dir: [0, 0, 1], scale: 50, cross: 0.5, frag: "extraInk += 0.3 * step(0.5, fract(vWorld.z * 30.0 + tvn(vWorld.zy * 8.0) * 2.0));" });
  const iron = g.ink({ color: "#2e2c2a", spec: 0.6, gloss: 30 });
  const bell = new THREE.Group();
  bell.add(new THREE.Mesh(B.body, bronze), new THREE.Mesh(B.bands, bronze), new THREE.Mesh(B.crown, bronze));
  const yoke = new THREE.Group();
  yoke.add(new THREE.Mesh(B.yoke, wood), new THREE.Mesh(B.straps, iron));
  return { bell, yoke, bronze, mats: [bronze, wood, iron] };
};

// ------------------------------------------------------------ desk still life
export const quillGeo = () =>
  memo("gl:quill", () => {
    // shaft along +y (0 = nib), gently curved; vane as a curved ribbon either side
    const curve = (y: number) => Math.sin(y * 3.2) * 0.012;
    const shaft = tube(
      [0, 0.06, 0.12, 0.2, 0.28, 0.34].map((y) => new THREE.Vector3(curve(y), y, 0)),
      0.0035,
      24,
      6,
    );
    const nib = place(new THREE.ConeGeometry(0.004, 0.018, 8), [0, -0.007, 0], [Math.PI, 0, 0]);
    // vane: u = across (0 at the rachis), v = along; outline tapers at both ends
    const vane = (side: number, width: number) => {
      const nu = 8;
      const nv = 60;
      const pos: number[] = [];
      const uv: number[] = [];
      const idx: number[] = [];
      for (let j = 0; j <= nv; j++) {
        const v = j / nv;
        const y = 0.06 + v * 0.29;
        const w = width * Math.pow(Math.sin(Math.min(1, v * 1.08) * Math.PI), 0.7) * (v > 0.85 ? 1 - (v - 0.85) * 3 : 1);
        for (let i = 0; i <= nu; i++) {
          const u = i / nu;
          const x = curve(y) + side * u * w;
          // barbs sweep toward the tip and the vane cups slightly
          pos.push(x, y + u * w * 0.9, -u * u * w * 0.25);
          uv.push(u, v);
        }
      }
      for (let j = 0; j < nv; j++)
        for (let i = 0; i < nu; i++) {
          const a0 = j * (nu + 1) + i;
          idx.push(a0, a0 + 1, a0 + nu + 1, a0 + 1, a0 + nu + 2, a0 + nu + 1);
        }
      const gg = new THREE.BufferGeometry();
      gg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      gg.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
      gg.setIndex(idx);
      gg.computeVertexNormals();
      return gg;
    };
    return { shaft: merge([shaft, nib]), barbs: merge([vane(-1, 0.045), vane(1, 0.028)]) };
  });

export const makeDesk = (g: GL) => {
  const group = new THREE.Group();
  const woodM = g.ink({
    color: "#7a4b2a",
    mode: "screen",
    angle: 8,
    scale: 3.5,
    cross: 0.5,
    spec: 0.5,
    gloss: 30,
    frag: "float grain = tfbm(vec2(vWorld.x * 2.0, vWorld.z * 22.0 + tvn(vWorld.xz * 3.0) * 2.0)); albedo *= 0.78 + grain * 0.4; extraInk += smoothstep(0.62, 0.7, grain) * 0.25;",
  });
  group.add(new THREE.Mesh(box(1.8, 0.05, 0.9, 0, -0.025, 0), woodM));
  // parchment sheet (the Declaration) with handwriting texture
  const waxM = g.ink({ color: "#efe6d0", mode: "screen", angle: 80, scale: 3.5, rim: 0.5, emissive: "#3a2a10", emissiveAmt: 0.25 });
  const candle = lathe(
    [
      [0, 0],
      [0.022, 0],
      [0.022, 0.2],
      [0.02, 0.205],
      [0.012, 0.21],
      [0, 0.206],
    ],
    32,
  );
  // wax drips
  const drips: THREE.BufferGeometry[] = [candle];
  const r = rng("drips");
  for (let i = 0; i < 7; i++) {
    const a = r() * Math.PI * 2;
    const L = 0.03 + r() * 0.1;
    drips.push(tube([new THREE.Vector3(Math.cos(a) * 0.021, 0.205, Math.sin(a) * 0.021), new THREE.Vector3(Math.cos(a) * 0.024, 0.205 - L * 0.5, Math.sin(a) * 0.024), new THREE.Vector3(Math.cos(a) * 0.023, 0.205 - L, Math.sin(a) * 0.023)], 0.004, 6, 5));
  }
  const candleMesh = new THREE.Mesh(merge(drips), waxM);
  const brassM = g.ink({ color: "#b58a3a", mode: "screen", angle: 70, scale: 3.5, spec: 1.4, gloss: 40, rim: 0.6 });
  const holder = lathe(
    [
      [0, 0],
      [0.09, 0],
      [0.1, 0.01],
      [0.09, 0.02],
      [0.03, 0.03],
      [0.022, 0.05],
      [0.03, 0.06],
      [0.028, 0.07],
      [0, 0.07],
    ],
    48,
    40,
  );
  const handle = tube([new THREE.Vector3(0.09, 0.012, 0), new THREE.Vector3(0.13, 0.03, 0), new THREE.Vector3(0.12, 0.06, 0), new THREE.Vector3(0.095, 0.05, 0)], 0.006, 16, 6);
  const candleG = new THREE.Group();
  candleG.add(new THREE.Mesh(merge([holder, handle]), brassM));
  candleMesh.position.y = 0.07;
  candleG.add(candleMesh);
  group.add(candleG);
  // inkwell: glass body + ink + pewter lid
  const glassM = g.ink({ color: "#3a4a4a", spec: 1.8, gloss: 90, hatch: 0.5, rim: 1.2, rimCol: "#d8f0ff" });
  const well = lathe(
    [
      [0, 0],
      [0.045, 0],
      [0.05, 0.01],
      [0.05, 0.05],
      [0.03, 0.065],
      [0.022, 0.075],
      [0.024, 0.08],
      [0.018, 0.08],
    ],
    32,
    24,
  );
  const wellMesh = new THREE.Mesh(well, glassM);
  group.add(wellMesh);
  // books
  const bookM = g.ink({ color: "#5a2a22", mode: "screen", angle: 20, scale: 3.5, spec: 0.4 });
  const pagesM = g.ink({ color: "#e8dcc0", mode: "world", dir: [0, 1, 0], scale: 900, hatch: 0.5 });
  const books = new THREE.Group();
  const bk = [
    [0.26, 0.05, 0.19, 0, 0.025, 0, 0.1],
    [0.24, 0.04, 0.17, 0.01, 0.07, 0.005, -0.05],
    [0.22, 0.035, 0.16, -0.01, 0.107, 0, 0.15],
  ];
  bk.forEach(([w, h, d, x, y, z, rot]) => {
    const cover = new THREE.Mesh(box(w, h, d), bookM);
    const pages = new THREE.Mesh(box(w * 0.96, h * 0.82, d * 1.005), pagesM);
    const b = new THREE.Group();
    b.add(cover, pages);
    b.position.set(x, y, z);
    b.rotation.y = rot;
    books.add(b);
  });
  group.add(books);
  const Q = quillGeo();
  const quillM = g.ink({
    color: "#f3efe6",
    mode: "u",
    scale: 1,
    hatch: 0.8,
    rim: 0.6,
    side: THREE.DoubleSide,
    frag: /* glsl */ `
      // individual barbs: fine lines along u, split gaps, frayed edge
      float barb = abs(fract(vUv.y * 180.0 + vUv.x * 30.0) - 0.5);
      float split = step(0.93, tvn(vec2(vUv.y * 12.0, 3.0))) * step(0.4, vUv.x);
      float fray = step(0.9 + tvn(vec2(vUv.y * 90.0, 1.0)) * 0.12, vUv.x);
      if (split > 0.5 || fray > 0.5) discard;
      albedo *= 0.85 + barb * 0.3;
      extraInk += smoothstep(0.35, 0.5, barb) * 0.5 + (1.0 - vUv.x) * 0.15;
      albedo = mix(albedo, vec3(0.35, 0.3, 0.25), smoothstep(0.75, 1.0, vUv.y) * 0.4);
    `,
  });
  const shaftM = g.ink({ color: "#e8dcc0", spec: 0.8 });
  const quill = new THREE.Group();
  quill.add(new THREE.Mesh(Q.shaft, shaftM), new THREE.Mesh(Q.barbs, quillM));
  return { group, candleG, wellMesh, books, quill, mats: [woodM, waxM, brassM, glassM, bookM, pagesM, quillM, shaftM] };
};

// ------------------------------------------------------------ Brown Bess musket (length ~1.55 m along +y)
export const musketGeo = () =>
  memo("gl:musket", () => {
    const stock = extrude(
      [
        [-0.02, 0.0],
        [0.06, 0.0],
        [0.07, 0.03],
        [0.04, 0.3],
        [0.025, 0.4],
        [0.022, 1.1],
        [0.012, 1.1],
        [0.012, 0.42],
        [-0.02, 0.3],
        [-0.035, 0.05],
      ],
      0.04,
      [],
      0.006,
    );
    const barrel = cyl(0.011, 0.013, 1.12, 12, 0.018, 0.98, 0);
    const lock = box(0.02, 0.12, 0.05, 0.035, 0.38, 0.02);
    const hammer = place(box(0.012, 0.05, 0.012), [0.05, 0.43, 0.035], [0, 0, -0.5]);
    const guard = tube([new THREE.Vector3(-0.005, 0.33, 0), new THREE.Vector3(-0.03, 0.36, 0), new THREE.Vector3(-0.005, 0.4, 0)], 0.004, 8, 4);
    const bayonet = place(new THREE.ConeGeometry(0.006, 0.4, 3), [0.03, 1.72, 0]);
    const rings = [0.6, 0.85, 1.05].map((y) => cyl(0.018, 0.018, 0.012, 12, 0.012, y, 0));
    return { wood: stock, metal: merge([barrel, lock, hammer, guard, bayonet, ...rings]) };
  });

// Fieldstone wall: dry-laid flat stones in courses (bevelled noisy slabs)
export const makeStoneWall = (g: GL, length: number, height: number, seed = "wall") => {
  const r = rng(seed);
  const slab = new THREE.BoxGeometry(1, 1, 1, 4, 3, 3);
  const p = slab.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    // round the corners and roughen the faces
    const k = 1 - 0.18 * (Math.abs(x * 2) ** 4 + Math.abs(y * 2) ** 4 + Math.abs(z * 2) ** 4) / 3;
    const n = 1 + (Math.sin(x * 13 + y * 7) * Math.sin(z * 11 - x * 5)) * 0.06;
    p.setXYZ(i, x * k * n, y * k * n, z * k * n);
  }
  slab.deleteAttribute("normal");
  const geo = slab.toNonIndexed();
  geo.computeVertexNormals();
  const mats: THREE.Matrix4[] = [];
  let y = 0.06;
  while (y < height) {
    let x = -length / 2 + (r() - 0.5) * 0.2;
    const h = 0.09 + r() * 0.08;
    while (x < length / 2) {
      const w = 0.22 + r() * 0.34;
      mats.push(new THREE.Matrix4().compose(new THREE.Vector3(x + w / 2, y + h / 2, (r() - 0.5) * 0.04), new THREE.Quaternion().setFromEuler(new THREE.Euler((r() - 0.5) * 0.08, (r() - 0.5) * 0.12, (r() - 0.5) * 0.1)), new THREE.Vector3(w * 0.96, h * 0.92, 0.3 + r() * 0.1)));
      x += w;
    }
    y += h;
  }
  // flat capstones
  for (let x = -length / 2; x < length / 2; ) {
    const w = 0.4 + r() * 0.4;
    mats.push(new THREE.Matrix4().compose(new THREE.Vector3(x + w / 2, y + 0.05, 0), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, (r() - 0.5) * 0.1, (r() - 0.5) * 0.06)), new THREE.Vector3(w * 0.97, 0.1, 0.42)));
    x += w;
  }
  const mat = g.ink({ color: "#a39a8b", mode: "screen", angle: 20, scale: 3.5, cross: 0.8, instanced: true, frag: "albedo *= 0.75 + tvn(vWorld.xy * 4.0 + vWorld.z) * 0.45; extraInk += (tvn(vWorld.xy * 22.0) - 0.5) * 0.3;" });
  const mesh = new THREE.InstancedMesh(geo, mat, mats.length);
  mats.forEach((m, i) => mesh.setMatrixAt(i, m));
  mesh.frustumCulled = false;
  return { mesh, mat, top: y + 0.1 };
};

// irregular ice floe slab
export const floeGeo = (seed: number) => {
  const r = rng("floe" + seed);
  const pts: [number, number][] = [];
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (r() - 0.5) * 0.4;
    const rr = 0.6 + r() * 0.5;
    pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
  }
  const g = extrude(pts, 0.25, [], 0.05);
  g.rotateX(Math.PI / 2);
  return g;
};

// ------------------------------------------------------------ Durham boat (~12 m) with oars
export const boatGeo = () =>
  memo("gl:boat", () => {
    // hull lofted from cross-sections along z (bow at +z)
    const sections = 16;
    const seg = 14;
    const pos: number[] = [];
    const uv: number[] = [];
    const idx: number[] = [];
    for (let j = 0; j <= sections; j++) {
      const t = j / sections;
      const z = (t - 0.5) * 12;
      const taper = Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, t * 0.96 + 0.02))), 0.55);
      const w = 1.1 * taper + 0.02;
      const d = 0.8 * (0.7 + 0.3 * taper);
      const sheer = 0.25 * Math.pow(Math.abs(t - 0.5) * 2, 2);
      for (let i = 0; i <= seg; i++) {
        const a = (i / seg) * Math.PI; // 0..pi: port gunwale -> keel -> starboard gunwale
        const x = -Math.cos(a) * w;
        const y = -Math.sin(a) * d + sheer;
        pos.push(x, y, z);
        uv.push(i / seg, t);
      }
    }
    for (let j = 0; j < sections; j++)
      for (let i = 0; i < seg; i++) {
        const a = j * (seg + 1) + i;
        const b = a + seg + 1;
        idx.push(a, a + 1, b, b, a + 1, b + 1);
      }
    const hull = new THREE.BufferGeometry();
    hull.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    hull.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    hull.setIndex(idx);
    hull.computeVertexNormals();
    const thwarts: THREE.BufferGeometry[] = [];
    for (let k = -4; k <= 4; k += 1.6) thwarts.push(box(2.0 * Math.max(0.3, Math.cos((k / 6) * 1.2)), 0.08, 0.3, 0, -0.1, k));
    thwarts.push(box(0.12, 0.12, 12, 0, 0.02, 0)); // gunwale rails approximated by a spine
    return { hull, thwarts: merge(thwarts) };
  });

export const oarGeo = () =>
  memo("gl:oar", () => merge([cyl(0.03, 0.03, 3.6, 8, 0, 0, 0), place(box(0.02, 0.7, 0.16), [0, -1.9, 0])]));
