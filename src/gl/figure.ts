// Posable 3D human figures with realistic proportions (about 1.8 m tall),
// tapered limbs, a lofted torso and costume pieces. Joints are Groups so a
// pose is just a set of rotations; `pose(p)` applies one.
import * as THREE from "three";
import { InkOpts } from "./materials";
import type { GL } from "./GLShot";

// capsule-ish limb from the joint (y = 0) down to y = -len, radii r0 -> r1
export const limbGeo = (len: number, r0: number, r1: number, seg = 18, bulge = 0.08) => {
  const pts: [number, number][] = [];
  const n = 10;
  pts.push([0, -len - r1 * 0.95]);
  pts.push([r1 * 0.6, -len - r1 * 0.75]);
  pts.push([r1 * 0.92, -len - r1 * 0.3]);
  for (let i = n; i >= 0; i--) {
    const t = i / n; // 1 at the bottom
    const r = r0 + (r1 - r0) * t;
    const b = Math.sin(t * Math.PI) * bulge * (r0 + r1);
    pts.push([r + b, -len * t]);
  }
  pts.push([r0 * 0.92, r0 * 0.3]);
  pts.push([r0 * 0.6, r0 * 0.75]);
  pts.push([0, r0 * 0.95]);
  const g = new THREE.LatheGeometry(
    pts.map(([r, y]) => new THREE.Vector2(r, y)),
    seg,
  );
  g.computeVertexNormals();
  return g;
};

// lofted torso: rings of superellipses [y, halfWidth, halfDepth, zOffset]
export const loftGeo = (rings: [number, number, number, number][], seg = 28, pow = 2.6) => {
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  rings.forEach(([y, w, d, z], j) => {
    for (let i = 0; i <= seg; i++) {
      const a = (i / seg) * Math.PI * 2;
      const c = Math.cos(a);
      const s = Math.sin(a);
      const x = Math.sign(c) * Math.pow(Math.abs(c), 2 / pow) * w;
      const zz = Math.sign(s) * Math.pow(Math.abs(s), 2 / pow) * d + z;
      pos.push(x, y, zz);
      uv.push(i / seg, j / (rings.length - 1));
    }
  });
  for (let j = 0; j < rings.length - 1; j++)
    for (let i = 0; i < seg; i++) {
      const a = j * (seg + 1) + i;
      const b = a + seg + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  // caps
  const capTop = pos.length / 3;
  const last = rings[rings.length - 1];
  pos.push(0, last[0] + 0.01, last[3]);
  uv.push(0.5, 1);
  const capBot = pos.length / 3;
  pos.push(0, rings[0][0] - 0.01, rings[0][3]);
  uv.push(0.5, 0);
  const lr = (rings.length - 1) * (seg + 1);
  for (let i = 0; i < seg; i++) {
    idx.push(lr + i, lr + i + 1, capTop);
    idx.push(i + 1, i, capBot);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
};

export type Costume = "apollo" | "colonial" | "frock" | "gi" | "worker" | "civilian" | "marine";

export type Pose = Partial<{
  yaw: number;
  bend: number; // spine forward bend
  lean: number; // sideways
  twist: number;
  neck: number; // head pitch
  headYaw: number;
  lSh: [number, number, number]; // shoulder x (forward), z (out), y (twist)
  rSh: [number, number, number];
  lEl: number;
  rEl: number;
  lHip: [number, number];
  rHip: [number, number];
  lKn: number;
  rKn: number;
  lAnk: number;
  rAnk: number;
  crouch: number; // lowers the pelvis
}>;

type Joints = {
  root: THREE.Group;
  pelvis: THREE.Group;
  chest: THREE.Group;
  neck: THREE.Group;
  lSh: THREE.Group;
  rSh: THREE.Group;
  lEl: THREE.Group;
  rEl: THREE.Group;
  lHand: THREE.Group;
  rHand: THREE.Group;
  lHip: THREE.Group;
  rHip: THREE.Group;
  lKn: THREE.Group;
  rKn: THREE.Group;
  lAnk: THREE.Group;
  rAnk: THREE.Group;
};

export type Figure = {
  root: THREE.Group;
  j: Joints;
  pose: (p: Pose) => void;
  mats: THREE.RawShaderMaterial[];
};

const HIP_H = 0.94;

export const makeFigure = (g: GL, costume: Costume, o: { scale?: number; mat?: InkOpts; color?: Partial<Record<"skin" | "coat" | "pants" | "hat" | "boots" | "suit", string>> } = {}) => {
  const apollo = costume === "apollo";
  const bulk = apollo ? 1.45 : costume === "gi" || costume === "marine" ? 1.12 : 1;
  const C = {
    skin: "#caa487",
    coat: costume === "colonial" ? "#3d4d6e" : costume === "frock" ? "#1f1c1a" : costume === "gi" || costume === "marine" ? "#6b6a4a" : costume === "worker" ? "#4f5a6a" : "#5a4a3c",
    pants: costume === "colonial" ? "#d9cfb8" : costume === "gi" || costume === "marine" ? "#5d5c40" : costume === "worker" ? "#46505c" : "#2c2a28",
    hat: costume === "gi" || costume === "marine" ? "#555a3a" : "#1d1a18",
    boots: "#2a2019",
    suit: "#eeebe4",
    ...o.color,
  };
  const base: InkOpts = { mode: "v", scale: 60, scale2: 40, cross: 0.6, rim: 0.6, rimPow: 2.2, ...o.mat };
  const m = {
    skin: g.ink({ ...base, color: C.skin }),
    coat: g.ink({ ...base, color: apollo ? C.suit : C.coat, frag: apollo ? "extraInk += 0.25 * smoothstep(0.35, 0.5, abs(fract(vUv.y * 14.0) - 0.5));" : undefined }),
    pants: g.ink({ ...base, color: apollo ? C.suit : C.pants, frag: apollo ? "extraInk += 0.25 * smoothstep(0.35, 0.5, abs(fract(vUv.y * 10.0) - 0.5));" : undefined }),
    hat: g.ink({ ...base, color: C.hat, spec: 0.3, gloss: 20 }),
    boots: g.ink({ ...base, color: apollo ? "#e6e2d8" : C.boots, spec: 0.4, gloss: 30 }),
    visor: g.ink({ ...base, color: "#c9a24a", spec: 1.6, gloss: 60, hatch: 0.4, rim: 1.2 }),
    gear: g.ink({ ...base, color: apollo ? "#dcd8cc" : "#4d4a36" }),
  };
  const mesh = (geo: THREE.BufferGeometry, mat: THREE.Material, parent: THREE.Object3D, pos: [number, number, number] = [0, 0, 0], rot: [number, number, number] = [0, 0, 0], sc: [number, number, number] = [1, 1, 1]) => {
    const x = new THREE.Mesh(geo, mat);
    x.position.set(...pos);
    x.rotation.set(...rot);
    x.scale.set(...sc);
    parent.add(x);
    return x;
  };
  const grp = (parent: THREE.Object3D, pos: [number, number, number]) => {
    const x = new THREE.Group();
    x.position.set(...pos);
    parent.add(x);
    return x;
  };

  const extra: THREE.RawShaderMaterial[] = [];
  const root = new THREE.Group();
  const pelvis = grp(root, [0, HIP_H, 0]);
  // torso
  const b = bulk;
  mesh(
    loftGeo([
      [-0.1, 0.16 * b, 0.11 * b, 0],
      [0.0, 0.17 * b, 0.12 * b, 0],
      [0.12, 0.15 * b, 0.11 * b, 0.0],
      [0.24, 0.155 * b, 0.115 * b, 0.01],
      [0.36, 0.18 * b, 0.125 * b, 0.015],
      [0.46, 0.2 * b, 0.12 * b, 0.0],
      [0.52, 0.16 * b, 0.1 * b, -0.01],
      [0.56, 0.07 * b, 0.07 * b, -0.01],
    ]),
    m.coat,
    pelvis,
  );
  const chest = grp(pelvis, [0, 0.36, 0]);
  const neck = grp(chest, [0, 0.2, 0]);
  if (!apollo) mesh(limbGeo(0.09, 0.052, 0.058, 12, 0), m.skin, neck, [0, 0.09, 0]);
  const head = grp(neck, [0, 0.13, 0.0]);
  if (apollo) {
    mesh(new THREE.SphereGeometry(0.2, 32, 24), m.gear, head, [0, 0.04, 0]);
    mesh(new THREE.SphereGeometry(0.19, 32, 24, Math.PI * 0.12, Math.PI * 0.76, Math.PI * 0.2, Math.PI * 0.48), m.visor, head, [0, 0.05, 0.03]);
    mesh(new THREE.BoxGeometry(0.44, 0.62, 0.22), m.gear, chest, [0, 0.02, -0.24]); // PLSS backpack
    mesh(new THREE.BoxGeometry(0.22, 0.12, 0.08), m.gear, chest, [0, -0.08, 0.2]); // RCU chest box
    // umbilical hoses (blue / red) from the chest connectors round to the PLSS
    const hose = (x: number, colr: string) => {
      const hm = g.ink({ ...base, color: colr, mode: "u", scale: 30 });
      const pts = [new THREE.Vector3(x, -0.12, 0.17), new THREE.Vector3(x * 1.9, -0.2, 0.12), new THREE.Vector3(x * 2.3, -0.05, -0.05), new THREE.Vector3(x * 1.8, 0.05, -0.16)];
      mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.022, 8), hm, chest);
      return hm;
    };
    const h1 = hose(0.08, "#3d5d9c");
    const h2 = hose(-0.08, "#a8402e");
    extra.push(h1, h2);
    // helmet: EV visor assembly shell + collar ring
    mesh(new THREE.SphereGeometry(0.212, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.58), m.gear, head, [0, 0.045, -0.005], [-0.25, 0, 0], [1, 1, 1]);
    mesh(new THREE.TorusGeometry(0.15, 0.025, 10, 28), m.gear, chest, [0, 0.2, 0.0], [Math.PI / 2, 0, 0]);
  } else {
    mesh(new THREE.SphereGeometry(0.1, 24, 18), m.skin, head, [0, 0.02, 0], [0, 0, 0], [0.92, 1.18, 1.05]);
    mesh(new THREE.ConeGeometry(0.018, 0.05, 8), m.skin, head, [0, 0.0, 0.105], [Math.PI / 2 + 0.3, 0, 0]); // nose
    mesh(new THREE.SphereGeometry(0.075, 16, 12), m.skin, head, [0, -0.05, 0.03], [0, 0, 0], [0.9, 0.75, 1.0]); // jaw
    // hats
    if (costume === "colonial") {
      const brim = new THREE.CylinderGeometry(0.2, 0.2, 0.02, 3);
      mesh(brim, m.hat, head, [0, 0.1, 0], [0, Math.PI / 6, 0]);
      mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.1, 16), m.hat, head, [0, 0.15, 0]);
    } else if (costume === "frock") {
      mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.012, 24), m.hat, head, [0, 0.1, 0]);
      mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.26, 24), m.hat, head, [0, 0.23, 0]);
      mesh(new THREE.SphereGeometry(0.08, 16, 12), m.hat, head, [0, -0.08, 0.02], [0, 0, 0], [1.1, 0.8, 1.05]); // beard
    } else if (costume === "gi" || costume === "marine") {
      mesh(new THREE.SphereGeometry(0.135, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), m.hat, head, [0, 0.03, 0], [0, 0, 0], [1, 0.9, 1.1]);
      mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.01, 20), m.hat, head, [0, 0.025, 0.01]);
      mesh(new THREE.BoxGeometry(0.34, 0.42, 0.18), m.gear, chest, [0, -0.02, -0.19]); // pack
    } else if (costume === "worker") {
      mesh(new THREE.SphereGeometry(0.11, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.45), m.hat, head, [0, 0.06, 0]);
      mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.01, 12, 1, false, -0.8, 1.6), m.hat, head, [0, 0.06, 0.1]);
    }
  }
  // coat skirts / tails
  if (costume === "colonial" || costume === "frock") {
    const len = costume === "frock" ? 0.62 : 0.5;
    mesh(new THREE.CylinderGeometry(0.19, 0.27, len, 20, 1, true), m.coat, pelvis, [0, -len / 2 + 0.02, -0.01]);
  }
  // arms
  const armR = 0.052 * b;
  const mkArm = (s: number) => {
    const sh = grp(chest, [s * 0.2 * b, 0.1, 0]);
    mesh(limbGeo(0.3, armR * 1.15, armR * 0.9), m.coat, sh);
    const el = grp(sh, [0, -0.3, 0]);
    mesh(limbGeo(0.26, armR * 0.9, armR * 0.7), m.coat, el);
    const hand = grp(el, [0, -0.27, 0]);
    mesh(new THREE.SphereGeometry(0.048 * (apollo ? 1.3 : 1), 12, 10), apollo ? m.gear : m.skin, hand, [0, -0.05, 0], [0, 0, 0], [0.8, 1.3, 0.5]);
    return { sh, el, hand };
  };
  // flag patch on the left shoulder (apollo)
  const L = mkArm(1);
  const R = mkArm(-1);
  // legs
  const legR = 0.075 * b;
  const mkLeg = (s: number) => {
    const hip = grp(pelvis, [s * 0.095 * b, -0.04, 0]);
    mesh(limbGeo(0.44, legR * 1.1, legR * 0.8), m.pants, hip);
    const kn = grp(hip, [0, -0.44, 0]);
    const bootTop = costume === "colonial" || costume === "gi" || costume === "marine" || apollo;
    mesh(limbGeo(0.44, legR * 0.8, legR * 0.55), bootTop ? m.boots : m.pants, kn);
    const ank = grp(kn, [0, -0.45, 0]);
    mesh(new THREE.BoxGeometry(0.1 * b, 0.07, 0.25 * (apollo ? 1.2 : 1)), m.boots, ank, [0, -0.03, 0.05]);
    return { hip, kn, ank };
  };
  const LL = mkLeg(1);
  const RL = mkLeg(-1);
  if (apollo) {
    const pm = g.ink({ ...base, color: "#b03a3a", hatch: 0.3, frag: "if (vUv.x < 0.4 && vUv.y > 0.45) albedo = vec3(0.2, 0.25, 0.5); else albedo = mod(floor(vUv.y * 7.0), 2.0) < 0.5 ? vec3(0.75, 0.2, 0.2) : vec3(0.95);" });
    mesh(new THREE.PlaneGeometry(0.1, 0.06), pm, L.sh, [0.075, -0.08, 0.02], [0, Math.PI / 2, 0]);
    extra.push(pm);
  }

  if (o.scale) root.scale.setScalar(o.scale);
  const j: Joints = { root, pelvis, chest, neck, lSh: L.sh, rSh: R.sh, lEl: L.el, rEl: R.el, lHand: L.hand, rHand: R.hand, lHip: LL.hip, rHip: RL.hip, lKn: LL.kn, rKn: RL.kn, lAnk: LL.ank, rAnk: RL.ank };
  const pose = (p: Pose) => {
    pelvis.position.y = HIP_H - (p.crouch ?? 0);
    pelvis.rotation.set(p.bend ?? 0, p.yaw ?? 0, p.lean ?? 0, "YXZ");
    chest.rotation.set((p.bend ?? 0) * 0.4, p.twist ?? 0, 0);
    neck.rotation.set(p.neck ?? 0, p.headYaw ?? 0, 0);
    const sh = (grp: THREE.Group, v: [number, number, number] | undefined, s: number) => grp.rotation.set(-(v?.[0] ?? 0), v?.[2] ?? 0, s * (v?.[1] ?? 0.08), "XZY");
    sh(L.sh, p.lSh, 1);
    sh(R.sh, p.rSh, -1);
    L.el.rotation.set(-(p.lEl ?? 0.15), 0, 0);
    R.el.rotation.set(-(p.rEl ?? 0.15), 0, 0);
    LL.hip.rotation.set(-(p.lHip?.[0] ?? 0), 0, p.lHip?.[1] ?? 0.03);
    RL.hip.rotation.set(-(p.rHip?.[0] ?? 0), 0, -(p.rHip?.[1] ?? 0.03));
    LL.kn.rotation.set(p.lKn ?? 0, 0, 0);
    RL.kn.rotation.set(p.rKn ?? 0, 0, 0);
    LL.ank.rotation.set(-(p.lAnk ?? 0), 0, 0);
    RL.ank.rotation.set(-(p.rAnk ?? 0), 0, 0);
  };
  pose({});
  return { root, j, pose, mats: [...Object.values(m), ...extra] } as Figure;
};

// blend two poses
export const mixPose = (a: Pose, b: Pose, t: number): Pose => {
  const out: Record<string, unknown> = {};
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  keys.forEach((k) => {
    const va = (a as Record<string, unknown>)[k];
    const vb = (b as Record<string, unknown>)[k];
    if (Array.isArray(va) || Array.isArray(vb)) {
      const A = (va as number[]) ?? [0, 0, 0];
      const B = (vb as number[]) ?? [0, 0, 0];
      out[k] = A.map((x, i) => x + ((B[i] ?? 0) - x) * t);
    } else out[k] = ((va as number) ?? 0) + (((vb as number) ?? 0) - ((va as number) ?? 0)) * t;
  });
  return out as Pose;
};
