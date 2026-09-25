// The lunar surface: cratered regolith under a hard low sun, black starry sky,
// the Earth hanging above the horizon. Optional high-res patch for a bootprint.
import * as THREE from "three";
import type { GL } from "../GLShot";
import { makeSky } from "../sky";
import { terrain, extrude, merge, place, smoothIco } from "../geo";
import { fbm2 } from "../noise";
import { rng } from "../../lib/random";
import { craterField, lunarHeight, makeEarth, regolithMat } from "../models/space";
import { limbGeo, loftGeo } from "../figure";

export const lunarSet = (g: GL, o: { rocks?: number; sun?: [number, number, number]; earth?: [number, number, number]; earthR?: number; flatAt?: [number, number, number]; seed?: string; shadows?: number } = {}) => {
  const sh = g.shared;
  sh.uSunDir.value.set(...(o.sun ?? [0.6, 0.32, 0.25])).normalize();
  sh.uSunCol.value.set(1.35, 1.3, 1.2);
  sh.uSky.value.set(0.06, 0.065, 0.08);
  sh.uGround.value.set(0.14, 0.13, 0.12);
  g.camera.far = 1800;
  g.camera.near = 0.05;
  const sky = makeSky(sh, { top: "#030408", horizon: "#07080d", bottom: "#050505", glow: 0, rays: 0, lines: 0.12, lineSpacing: 5, stars: 1.4, paper: 0 });
  g.scene.add(sky.mesh);
  g.setPost({ fog: [1e5, 2e5, 0], edgeW: 1.1, contrast: 1.15, ink: "#141210" });
  const craters = craterField(o.seed ?? "mare", 110, 500, 1.5, 38);
  const flat = o.flatAt;
  const base = lunarHeight(craters);
  const hf = (x: number, z: number) => {
    let h = base(x, z);
    if (flat) {
      const d = Math.hypot(x - flat[0], z - flat[1]);
      const k = Math.min(1, Math.max(0, (d - flat[2]) / (flat[2] * 3)));
      h = h * k + base(flat[0], flat[1]) * (1 - k);
    }
    return h;
  };
  const ground = new THREE.Mesh(terrain(600, 600, 320, 320, hf), regolithMat(g));
  g.scene.add(ground);
  // boulder field: lumpy rocks, many small, a few large, half-buried
  const rockGeo = smoothIco(1, 3);
  const rp = rockGeo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < rp.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(rp, i);
    const b = 1 + (fbm2(v.x * 2 + 3, v.y * 2 + v.z * 2, 4, 5) - 0.5) * 0.8;
    rp.setXYZ(i, v.x * b, v.y * b * 0.7, v.z * b);
  }
  rockGeo.computeVertexNormals();
  const rockM = g.ink({ color: "#a9a49a", mode: "screen", angle: 35, scale: 3.4, cross: 0.8, shade: 1, instanced: true });
  const nRocks = o.rocks ?? 500;
  const rocks = new THREE.InstancedMesh(rockGeo, rockM, nRocks);
  const rr = rng((o.seed ?? "mare") + "rocks");
  for (let i = 0; i < nRocks; i++) {
    const rad = 4 + Math.pow(rr(), 0.7) * 120;
    const a = rr() * Math.PI * 2;
    const x = (flat?.[0] ?? 0) + Math.cos(a) * rad;
    const z = (flat?.[1] ?? 0) + Math.sin(a) * rad;
    const s = 0.05 + Math.pow(rr(), 6) * 1.6;
    rocks.setMatrixAt(i, new THREE.Matrix4().compose(new THREE.Vector3(x, hf(x, z) - s * 0.25, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rr(), rr() * 6, rr())), new THREE.Vector3(s, s, s)));
  }
  rocks.frustumCulled = false;
  g.scene.add(rocks);
  if (o.shadows) g.enableShadows(2048, o.shadows, 120);
  let earth: ReturnType<typeof makeEarth> | null = null;
  if (o.earth) {
    earth = makeEarth(g, o.earthR ?? 30);
    earth.mesh.position.set(...o.earth);
    earth.mesh.rotation.y = 2.2;
    g.scene.add(earth.mesh);
  }
  return { ground, hf, earth, sky };
};

// high-res regolith patch that takes a bootprint as `uPress` goes 0 -> 1
export const printPatch = (g: GL, size = 2.4, res = 260) => {
  const geo = new THREE.PlaneGeometry(size, size, res, res);
  geo.rotateX(-Math.PI / 2);
  const mat = g.ink({
    color: "#bdb8ad",
    mode: "stipple",
    hatch: 0.9,
    shade: 1,
    uniforms: { uPress: { value: 0 }, uSize: { value: size } },
    vertexDecl: /* glsl */ `
      uniform float uPress; uniform float uSize;
      float sdRoundRect(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
      float printH(vec2 q) {
        // boot sole: 0.33 m long (z), 0.13 m wide, with chevron tread ridges
        float d = sdRoundRect(q, vec2(0.068, 0.165), 0.06);
        float inside = 1.0 - smoothstep(-0.004, 0.006, d);
        float tread = 0.5 + 0.5 * sin((q.y + abs(q.x) * 0.6) * 150.0);
        float rim = exp(-pow(max(d, 0.0) / 0.03, 2.0)) * (1.0 - inside);
        float grain = (vnoise(vec3(q * 90.0, 1.0)) - 0.5) * 0.004;
        return uPress * (-0.035 * inside + 0.006 * tread * inside + 0.012 * rim) + grain;
      }
    `,
    vertex: /* glsl */ `
      float e = 0.004;
      float h0 = printH(p.xz);
      float hx = printH(p.xz + vec2(e, 0.0));
      float hz = printH(p.xz + vec2(0.0, e));
      p.y += h0;
      n = normalize(vec3(-(hx - h0) / e, 1.0, -(hz - h0) / e));
    `,
    frag: /* glsl */ `
      float grit = tvn(vWorld.xz * 60.0) * 0.5 + tfbm(vWorld.xz * 8.0) * 0.5;
      albedo *= 0.8 + grit * 0.4;
    `,
  });
  return { mesh: new THREE.Mesh(geo, mat), mat };
};

// Apollo EVA boot (overshoe) + lower suit leg; sole centred at the origin, toe to +z
export const makeBoot = (g: GL) => {
  const soleOutline: [number, number][] = [];
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    soleOutline.push([Math.sign(c) * Math.pow(Math.abs(c), 0.55) * 0.068, Math.sign(s) * Math.pow(Math.abs(s), 0.55) * 0.165]);
  }
  const sole = extrude(soleOutline, 0.045, [], 0.006);
  sole.rotateX(Math.PI / 2);
  const soleG = place(sole, [0, 0.022, 0]);
  const upper = loftGeo(
    [
      [0.045, 0.074, 0.17, 0.0],
      [0.09, 0.075, 0.16, -0.005],
      [0.14, 0.07, 0.13, -0.02],
      [0.19, 0.066, 0.09, -0.05],
      [0.25, 0.07, 0.075, -0.06],
      [0.33, 0.078, 0.078, -0.06],
    ],
    32,
  );
  const leg = place(limbGeo(0.55, 0.1, 0.085, 24, 0.12), [0, 0.88, -0.06]);
  const straps = merge([place(new THREE.BoxGeometry(0.16, 0.02, 0.05), [0, 0.2, -0.02], [0.3, 0, 0]), place(new THREE.BoxGeometry(0.16, 0.02, 0.05), [0, 0.13, 0.06], [0.1, 0, 0])]);
  const soleM = g.ink({ color: "#4d6f9a", mode: "world", dir: [0, 0, 1], scale: 90, cross: 0.6, frag: "extraInk += 0.35 * step(0.5, fract(vObj.z * 55.0));" });
  const upperM = g.ink({ color: "#ecebe6", mode: "v", scale: 70, scale2: 50, rim: 0.5, cross: 0.6, frag: "extraInk += 0.2 * smoothstep(0.3, 0.5, abs(fract(vObj.y * 24.0) - 0.5));" });
  const legM = g.ink({ color: "#eeede8", mode: "v", scale: 60, scale2: 40, rim: 0.6, cross: 0.6, frag: "extraInk += 0.28 * smoothstep(0.32, 0.5, abs(fract(vObj.y * 9.0) - 0.5));" });
  const strapM = g.ink({ color: "#9a8f7a", hatch: 0.6 });
  const group = new THREE.Group();
  group.add(new THREE.Mesh(soleG, soleM), new THREE.Mesh(upper, upperM), new THREE.Mesh(leg, legM), new THREE.Mesh(straps, strapM));
  return { group, mats: [soleM, upperM, legM, strapM] };
};
