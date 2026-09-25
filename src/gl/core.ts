// The engraving render pipeline:
//   1. shadow pass (optional, directional light)
//   2. G-buffer pass: colour + (view normal, depth, object id) via MRT
//   3. ink pass: contour lines from normal/depth/id discontinuities, depth fog,
//      sepia grading / colour flood / blueprint, then a downsample to canvas.
import * as THREE from "three";
import { getInputProps } from "remotion";
import { TNOISE } from "./glsl";
import { depthMaterial, InkMat, inkMaterial, InkOpts, makeShared, Shared } from "./materials";

THREE.ColorManagement.enabled = false;

export const W = 1920;
export const H = 1080;

const FS_VERT = /* glsl */ `
precision highp float;
in vec3 position;
in vec2 uv;
out vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const POST_FRAG = /* glsl */ `
precision highp float;
in vec2 vUv;
uniform sampler2D tColor;
uniform sampler2D tData;
uniform vec2 uTexel;
uniform float uEdgeW;
uniform float uEdgeAmt;
uniform float uDepthK;
uniform float uNormK;
uniform vec3 uInkCol;
uniform float uColorMix;
uniform vec4 uFlood;
uniform vec3 uFogCol;
uniform vec3 uFog;
uniform float uFogNoise;
uniform float uFogTop;
uniform float uTime;
uniform float uFar;
uniform float uBlue;
uniform float uBlueSweep;
uniform vec3 uSepDark;
uniform vec3 uSepMid;
uniform vec3 uSepLight;
uniform float uAspect;
uniform float uExposure;
uniform float uSat;
uniform float uContrast;
layout(location = 0) out vec4 o;
${TNOISE}

vec3 decN(vec2 e) {
  vec2 xy = e * 2.0 - 1.0;
  return vec3(xy, sqrt(max(0.0, 1.0 - dot(xy, xy))));
}

float edgeAt(vec2 uv) {
  vec4 c = texture(tData, uv);
  vec3 nc = decN(c.xy);
  float e = 0.0;
  vec2 dirs[4] = vec2[4](vec2(1.0, 0.0), vec2(0.0, 1.0), vec2(0.7071, 0.7071), vec2(0.7071, -0.7071));
  for (int i = 0; i < 4; i++) {
    vec2 d = dirs[i] * uTexel * uEdgeW;
    vec4 a = texture(tData, uv + d);
    vec4 b = texture(tData, uv - d);
    // depth: second difference (ignores smooth slopes), relative to distance
    float lap = abs(a.z + b.z - 2.0 * c.z) / max(c.z, 1e-4);
    e = max(e, smoothstep(0.02 * uDepthK, 0.06 * uDepthK, lap));
    // normals
    float nd = max(1.0 - dot(nc, decN(a.xy)), 1.0 - dot(nc, decN(b.xy)));
    e = max(e, smoothstep(0.18 * uNormK, 0.42 * uNormK, nd));
    // object id
    float idd = max(abs(a.w - c.w), abs(b.w - c.w));
    e = max(e, step(0.5, idd));
  }
  return e;
}

vec3 sepia(vec3 c) {
  float l = pow(clamp(dot(c, vec3(0.299, 0.587, 0.114)), 0.0, 1.0), 0.8);
  vec3 s = l < 0.45 ? mix(uSepDark, uSepMid, l / 0.45) : mix(uSepMid, uSepLight, smoothstep(0.45, 0.95, l));
  // keep a whisper of the original hue so washes read
  return mix(s, s * (0.75 + 0.5 * c / max(l, 0.05)), 0.12);
}

void main() {
  vec2 jit = (vec2(tvn(vUv * vec2(420.0, 240.0)), tvn(vUv * vec2(420.0, 240.0) + 31.0)) - 0.5) * uTexel * 1.4;
  vec4 cc = texture(tColor, vUv);
  vec3 col = cc.rgb * uExposure;
  float cover = cc.a;
  vec4 dd = texture(tData, vUv);
  float e = edgeAt(vUv + jit) * uEdgeAmt * (1.0 - clamp(cover, 0.0, 1.0));
  // ink-bleed: lines slightly darker in the middle, soft outside
  vec3 inkc = mix(uInkCol, col * 0.25, 0.25);
  col = mix(col, inkc, e);

  // fog (depth + height-ish via screen y), with rolling noise
  float z = dd.z * uFar;
  float fog = smoothstep(uFog.x, uFog.y, z) * uFog.z * (1.0 - step(0.999, dd.z));
  if (uFogNoise > 0.0) {
    float n = tfbm(vec2(vUv.x * 3.0 * uAspect + uTime * 0.05, vUv.y * 6.0));
    fog *= mix(1.0, 0.4 + n * 1.2, uFogNoise);
    fog = clamp(fog + uFogTop * smoothstep(0.35, 0.0, abs(vUv.y - 0.38)) * n * uFogNoise, 0.0, 1.0);
  }
  col = mix(col, uFogCol, clamp(fog, 0.0, 1.0));

  // grading: sepia <-> colour, with an ink-edged colour flood
  col = clamp((col - 0.5) * uContrast + 0.5, 0.0, 1.2);
  float l = dot(col, vec3(0.299, 0.587, 0.114));
  vec3 colr = mix(vec3(l), col, uSat);
  float cm = uColorMix;
  vec3 rimAdd = vec3(0.0);
  if (uFlood.w > 0.0) {
    vec2 p = (vUv - uFlood.xy) * vec2(uAspect, 1.0);
    float r = length(p);
    float nz = tfbm(vec2(atan(p.y, p.x) * 2.5, uTime * 0.2)) * 0.12 * uFlood.z;
    float edge = uFlood.z + nz;
    cm = smoothstep(edge + 0.01, edge - 0.03, r);
    float rim = exp(-pow((r - edge) / 0.025, 2.0));
    rimAdd = vec3(1.0, 0.9, 0.65) * rim * 0.8 * (1.0 - smoothstep(1.2, 1.6, uFlood.z));
  }
  vec3 outc = mix(sepia(col), colr, cm) + rimAdd;

  // blueprint mode: white lines on blue, revealed above a sweep line
  if (uBlue > 0.0) {
    float bm = uBlue * step(uBlueSweep, vUv.y);
    float grid = max(step(0.97, fract(vUv.x * uAspect * 24.0)), step(0.97, fract(vUv.y * 24.0))) * 0.15;
    vec3 bp = vec3(0.12, 0.3, 0.55) + grid + (e * 0.9 + (1.0 - l) * 0.12) * vec3(0.9, 0.95, 1.0);
    outc = mix(outc, bp, bm);
    float scan = exp(-pow((vUv.y - uBlueSweep) * 120.0, 2.0)) * uBlue;
    outc += vec3(0.7, 0.9, 1.0) * scan;
  }
  o = vec4(outc, 1.0);
}
`;

const BLIT_FRAG = /* glsl */ `
precision highp float;
in vec2 vUv;
uniform sampler2D tSrc;
uniform vec2 uTexel;
layout(location = 0) out vec4 o;
void main() {
  vec4 s = texture(tSrc, vUv + vec2(-0.25, -0.25) * uTexel)
         + texture(tSrc, vUv + vec2(0.25, -0.25) * uTexel)
         + texture(tSrc, vUv + vec2(-0.25, 0.25) * uTexel)
         + texture(tSrc, vUv + vec2(0.25, 0.25) * uTexel);
  o = s * 0.25;
}
`;

export type PostOpts = {
  edgeW?: number;
  edgeAmt?: number;
  depthK?: number;
  normK?: number;
  ink?: THREE.ColorRepresentation;
  fogCol?: THREE.ColorRepresentation;
  fog?: [number, number, number];
  fogNoise?: number;
  fogTop?: number;
  exposure?: number;
  sat?: number;
  contrast?: number;
};

export class InkRenderer {
  renderer: THREE.WebGLRenderer;
  shared: Shared = makeShared();
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(40, W / H, 0.5, 2000);
  gRT: THREE.WebGLRenderTarget;
  pRT: THREE.WebGLRenderTarget | null = null;
  post: THREE.RawShaderMaterial;
  blit: THREE.RawShaderMaterial;
  quad: THREE.Mesh;
  qScene = new THREE.Scene();
  qCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  ss: number;
  mats: InkMat[] = [];
  shadow: { rt: THREE.WebGLRenderTarget; cam: THREE.OrthographicCamera; center: THREE.Vector3; dist: number } | null = null;

  constructor(canvas: HTMLCanvasElement, ss = 1.5) {
    this.ss = ss;
    this.shared.uSS.value = ss;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, alpha: false, powerPreference: "high-performance" });
    this.renderer.debug.onShaderError = (gl, _p, vs, fs) => {
      throw new Error(`Shader compile failed:\n${gl.getShaderInfoLog(vs)}\n${gl.getShaderInfoLog(fs)}`);
    };
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(W, H, false);
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    this.renderer.autoClear = true;
    const gw = Math.round(W * ss);
    const gh = Math.round(H * ss);
    this.gRT = new THREE.WebGLRenderTarget(gw, gh, { count: 2, type: THREE.HalfFloatType, depthBuffer: true, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
    this.gRT.textures[1].minFilter = THREE.NearestFilter;
    this.gRT.textures[1].magFilter = THREE.NearestFilter;
    if (ss !== 1) this.pRT = new THREE.WebGLRenderTarget(gw, gh, { type: THREE.UnsignedByteType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
    this.post = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: FS_VERT,
      fragmentShader: POST_FRAG,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        tColor: { value: this.gRT.textures[0] },
        tData: { value: this.gRT.textures[1] },
        uTexel: { value: new THREE.Vector2(1 / gw, 1 / gh) },
        uEdgeW: { value: 1.2 * ss },
        uEdgeAmt: { value: 1 },
        uDepthK: { value: 1 },
        uNormK: { value: 1 },
        uInkCol: { value: new THREE.Color("#1c120a") },
        uColorMix: { value: 0 },
        uFlood: { value: new THREE.Vector4(0.5, 0.5, 0, 0) },
        uFogCol: { value: new THREE.Color("#e8dcc0") },
        uFog: { value: new THREE.Vector3(1e5, 2e5, 0) },
        uFogNoise: { value: 0 },
        uFogTop: { value: 0 },
        uTime: this.shared.uTime,
        uFar: this.shared.uFar,
        uNoiseTex: this.shared.uNoiseTex,
        uBlue: { value: 0 },
        uBlueSweep: { value: 0 },
        uSepDark: { value: new THREE.Color("#241509") },
        uSepMid: { value: new THREE.Color("#a98356") },
        uSepLight: { value: new THREE.Color("#f1e3c2") },
        uAspect: { value: W / H },
        uExposure: { value: 1 },
        uSat: { value: 1 },
        uContrast: { value: 1.12 },
      },
    });
    this.blit = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: FS_VERT,
      fragmentShader: BLIT_FRAG,
      depthTest: false,
      depthWrite: false,
      uniforms: { tSrc: { value: this.pRT?.texture ?? null }, uTexel: { value: new THREE.Vector2(ss / gw, ss / gh) } },
    });
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.post);
    this.quad.frustumCulled = false;
    this.qScene.add(this.quad);
    this.camera.far = 2000;
  }

  ink(o: InkOpts = {}) {
    const m = inkMaterial(this.shared, o);
    this.mats.push(m);
    return m;
  }

  setPost(o: PostOpts) {
    const u = this.post.uniforms;
    if (o.edgeW !== undefined) u.uEdgeW.value = o.edgeW * this.ss;
    if (o.edgeAmt !== undefined) u.uEdgeAmt.value = o.edgeAmt;
    if (o.depthK !== undefined) u.uDepthK.value = o.depthK;
    if (o.normK !== undefined) u.uNormK.value = o.normK;
    if (o.ink !== undefined) u.uInkCol.value.set(o.ink);
    if (o.fogCol !== undefined) u.uFogCol.value.set(o.fogCol);
    if (o.fog !== undefined) u.uFog.value.set(...o.fog);
    if (o.fogNoise !== undefined) u.uFogNoise.value = o.fogNoise;
    if (o.fogTop !== undefined) u.uFogTop.value = o.fogTop;
    if (o.exposure !== undefined) u.uExposure.value = o.exposure;
    if (o.sat !== undefined) u.uSat.value = o.sat;
    if (o.contrast !== undefined) u.uContrast.value = o.contrast;
  }

  enableShadows(size = 2048, extent = 20, dist = 60) {
    const rt = new THREE.WebGLRenderTarget(size, size, { type: THREE.FloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
    const cam = new THREE.OrthographicCamera(-extent, extent, extent, -extent, 0.5, dist * 2.5);
    this.shadow = { rt, cam, center: new THREE.Vector3(), dist };
    this.shared.uShadowMap.value = rt.texture;
    this.shared.uShadowOn.value = 1;
  }

  private renderShadow() {
    const s = this.shadow;
    if (!s) return;
    const dir = this.shared.uSunDir.value;
    s.cam.position.copy(s.center).addScaledVector(dir, s.dist);
    s.cam.lookAt(s.center);
    s.cam.updateMatrixWorld();
    s.cam.updateProjectionMatrix();
    this.shared.uShadowMat.value.multiplyMatrices(s.cam.projectionMatrix, s.cam.matrixWorldInverse);
    const swapped: [THREE.Mesh, THREE.Material | THREE.Material[]][] = [];
    const hidden: THREE.Object3D[] = [];
    this.scene.traverseVisible((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const mat = m.material as InkMat;
      if (!mat?.userData?.ink || !mat.userData.castShadow || mat.transparent) {
        hidden.push(m);
        return;
      }
      if (!mat.userData.depthMat) mat.userData.depthMat = depthMaterial(mat);
      swapped.push([m, m.material]);
      m.material = mat.userData.depthMat;
    });
    hidden.forEach((o) => (o.visible = false));
    this.renderer.setRenderTarget(s.rt);
    this.renderer.setClearColor(new THREE.Color(1, 1, 1), 1);
    this.renderer.clear();
    this.renderer.render(this.scene, s.cam);
    swapped.forEach(([m, mat]) => (m.material = mat));
    hidden.forEach((o) => (o.visible = true));
  }

  render(colorMix: number, flood?: { x: number; y: number; r: number }) {
    const r = this.renderer;
    this.shared.uFar.value = this.camera.far;
    this.camera.aspect = W / H;
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld();
    this.renderShadow();
    r.setRenderTarget(this.gRT);
    r.setClearColor(new THREE.Color(0.5, 0.5, 1.0), 0);
    r.clear();
    const hide: THREE.Object3D[] = [];
    // dev: --props='{"skip":"puffs,sky,<mesh name>"}' hides layers for profiling
    const skip = String((getInputProps() as { skip?: string }).skip ?? "");
    if (skip)
      this.scene.traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.RawShaderMaterial | undefined;
        const fs = m?.fragmentShader ?? "";
        const kind = fs.includes("uCore") ? "glow" : fs.includes("iStretch") || fs.includes("uOutline") ? "puffs" : fs.includes("uCloudCol") ? "sky" : (o as THREE.InstancedMesh).isInstancedMesh ? "inst" : fs.includes("uSkyW") ? "water" : "mesh";
        if (skip.split(",").includes(kind) || (o.name && skip.split(",").includes(o.name))) {
          o.visible = false;
          hide.push(o);
        }
      });
    r.render(this.scene, this.camera);
    hide.forEach((o) => (o.visible = true));
    const u = this.post.uniforms;
    u.uColorMix.value = colorMix;
    if (flood) u.uFlood.value.set(flood.x, flood.y, flood.r, 1);
    else u.uFlood.value.set(0.5, 0.5, 0, 0);
    this.quad.material = this.post;
    if (skip.includes("post")) u.uEdgeAmt.value = 0;
    r.setRenderTarget(this.pRT);
    r.render(this.qScene, this.qCam);
    if (this.pRT) {
      this.quad.material = this.blit;
      r.setRenderTarget(null);
      r.render(this.qScene, this.qCam);
    }

  }

  dispose() {
    this.gRT.dispose();
    this.pRT?.dispose();
    this.shadow?.rt.dispose();
    this.mats.forEach((m) => {
      m.dispose();
      (m.userData.depthMat as THREE.Material | undefined)?.dispose();
    });
    this.post.dispose();
    this.blit.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}
