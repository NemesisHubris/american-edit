// Procedural geometry kit.
import * as THREE from "three";
import { mergeGeometries, mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export { mergeGeometries };

// smooth sphere (polyhedron geometries are non-indexed = flat shaded)
export const smoothIco = (r: number, detail: number) => {
  const g = new THREE.IcosahedronGeometry(r, detail);
  g.deleteAttribute("normal");
  g.deleteAttribute("uv");
  const m = mergeVertices(g);
  m.computeVertexNormals();
  return m;
};

// Smooth lathe from [radius, y] points; `smooth` resamples with Catmull-Rom.
export const lathe = (pts: [number, number][], segs = 64, smooth = 0) => {
  let v = pts.map(([r, y]) => new THREE.Vector2(Math.max(0, r), y));
  if (smooth > 0) {
    const curve = new THREE.SplineCurve(v);
    v = curve.getSpacedPoints(smooth);
  }
  const g = new THREE.LatheGeometry(v, segs);
  g.computeVertexNormals();
  return g;
};

// Heightfield terrain centred on the origin: size [w, d], resolution [nx, nz]
export const terrain = (w: number, d: number, nx: number, nz: number, height: (x: number, z: number) => number) => {
  const g = new THREE.PlaneGeometry(w, d, nx, nz);
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) p.setY(i, height(p.getX(i), p.getZ(i)));
  g.computeVertexNormals();
  return g;
};

export const box = (w: number, h: number, d: number, x = 0, y = 0, z = 0) => {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(x, y, z);
  return g;
};

export const cyl = (rt: number, rb: number, h: number, segs = 24, x = 0, y = 0, z = 0, open = false) => {
  const g = new THREE.CylinderGeometry(rt, rb, h, segs, 1, open);
  g.translate(x, y, z);
  return g;
};

// Tube through points
export const tube = (pts: THREE.Vector3[], r: number, segs = 64, rsegs = 8, closed = false) =>
  new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, closed), segs, r, rsegs, closed);

// Extrude a 2D outline ([x, y] points, optional holes) by depth, centred on z
export const extrude = (outline: [number, number][], depth: number, holes: [number, number][][] = [], bevel = 0) => {
  const s = new THREE.Shape(outline.map(([x, y]) => new THREE.Vector2(x, y)));
  for (const h of holes) s.holes.push(new THREE.Path(h.map(([x, y]) => new THREE.Vector2(x, y))));
  const g = new THREE.ExtrudeGeometry(s, {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments: 16,
  });
  g.translate(0, 0, -depth / 2);
  return g;
};

// Merge a list of geometries after applying matrices; strips to position/normal/uv
export const merge = (parts: THREE.BufferGeometry[]) => {
  const clean = parts.map((g) => {
    const n = g.index ? g.toNonIndexed() : g;
    const out = new THREE.BufferGeometry();
    out.setAttribute("position", n.attributes.position);
    if (!n.attributes.normal) n.computeVertexNormals();
    out.setAttribute("normal", n.attributes.normal);
    out.setAttribute("uv", n.attributes.uv ?? new THREE.BufferAttribute(new Float32Array((n.attributes.position.count as number) * 2), 2));
    return out;
  });
  return mergeGeometries(clean)!;
};

export const place = (g: THREE.BufferGeometry, pos: [number, number, number], rot: [number, number, number] = [0, 0, 0], scale: number | [number, number, number] = 1) => {
  const m = new THREE.Matrix4().compose(
    new THREE.Vector3(...pos),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)),
    typeof scale === "number" ? new THREE.Vector3(scale, scale, scale) : new THREE.Vector3(...scale),
  );
  return g.clone().applyMatrix4(m);
};

// Instanced mesh from a list of matrices
export const instanced = (g: THREE.BufferGeometry, m: THREE.Material, mats: THREE.Matrix4[]) => {
  const im = new THREE.InstancedMesh(g, m, mats.length);
  mats.forEach((x, i) => im.setMatrixAt(i, x));
  im.instanceMatrix.needsUpdate = true;
  im.frustumCulled = false;
  return im;
};

export const mat4 = (pos: [number, number, number], rot: [number, number, number] = [0, 0, 0], scale: number | [number, number, number] = 1) =>
  new THREE.Matrix4().compose(
    new THREE.Vector3(...pos),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)),
    typeof scale === "number" ? new THREE.Vector3(scale, scale, scale) : new THREE.Vector3(...scale),
  );
