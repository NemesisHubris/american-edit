// The engraving material: lit, shaded surfaces cut with tone-driven engraving
// lines, writing colour + (normal, depth, id) to a G-buffer for the ink pass.
import * as THREE from "three";
import { HATCH, NOISE, TNOISE } from "./glsl";
import { noiseTexture } from "./noiseTex";

export type RGB = [number, number, number];
export type ColorIn = string | number | RGB | THREE.Color;

export const col = (c: ColorIn): THREE.Color => {
  if (c instanceof THREE.Color) return c.clone();
  if (Array.isArray(c)) return new THREE.Color(c[0], c[1], c[2]);
  return new THREE.Color(c as THREE.ColorRepresentation);
};

// Uniforms shared by every material of one shot (lights, camera, time).
export const makeShared = () => ({
  uSunDir: { value: new THREE.Vector3(0.4, 0.7, 0.5).normalize() },
  uSunCol: { value: new THREE.Color(1.0, 0.95, 0.85) },
  uSky: { value: new THREE.Color(0.45, 0.45, 0.5) },
  uGround: { value: new THREE.Color(0.2, 0.18, 0.15) },
  uTime: { value: 0 },
  uFar: { value: 2000 },
  uRes: { value: new THREE.Vector2(1920, 1080) },
  uPaper: { value: new THREE.Color("#efe3c8") },
  uPL0: { value: new THREE.Vector4(0, 0, 0, 0) },
  uPLc0: { value: new THREE.Color(0, 0, 0) },
  uPL1: { value: new THREE.Vector4(0, 0, 0, 0) },
  uPLc1: { value: new THREE.Color(0, 0, 0) },
  uShadowMap: { value: null as THREE.Texture | null },
  uShadowMat: { value: new THREE.Matrix4() },
  uShadowOn: { value: 0 },
  uShadowSoft: { value: 1.5 },
  uSS: { value: 1.5 },
  uNoiseTex: { value: noiseTexture() as THREE.Texture },
});
export type Shared = ReturnType<typeof makeShared>;

export type HatchMode = "screen" | "u" | "v" | "world" | "obj" | "stipple";
const MODES: Record<HatchMode, number> = { screen: 0, u: 1, v: 2, world: 3, obj: 4, stipple: 5 };

export type InkOpts = {
  color?: ColorIn;
  emissive?: ColorIn;
  emissiveAmt?: number;
  hatch?: number; // strength of engraving lines 0..1
  mode?: HatchMode;
  scale?: number; // lines per unit (world/obj/uv) or px spacing (screen)
  scale2?: number; // second direction (uv modes)
  dir?: [number, number, number]; // world/obj hatch direction
  angle?: number; // screen hatch angle (deg)
  cross?: number; // 0..1 how readily cross-hatching appears
  shade?: number; // how much lighting darkens the colour fill (0..1)
  inkDark?: number; // colour of the lines relative to the fill (0 = black)
  rim?: number;
  rimCol?: ColorIn;
  rimPow?: number;
  spec?: number;
  gloss?: number;
  wobble?: number;
  side?: THREE.Side;
  instanced?: boolean;
  instColor?: boolean; // per-instance vec3 (instanceColor) available as vInst
  vcolor?: boolean;
  vertex?: string; // GLSL: may modify vec3 p, vec3 n (object space); has uTime, uv
  vertexDecl?: string;
  frag?: string; // GLSL: may modify albedo, emis, N, hatchMul, shadeMul, alpha; has vUv, vWorld, vObj
  fragDecl?: string;
  uniforms?: Record<string, THREE.IUniform>;
  drawDir?: [number, number, number];
  drawRange?: [number, number];
  drawNoise?: number;
  id?: number;
  edges?: number; // 1 = normal ink contours, 0 = none (writes background id)
  transparent?: boolean;
  castShadow?: boolean;
  receiveShadow?: boolean;
};

let nextId = 1;

const VERT = (o: InkOpts) => /* glsl */ `
precision highp float;
in vec3 position;
in vec3 normal;
in vec2 uv;
#ifdef INSTANCED
in mat4 instanceMatrix;
#endif
#ifdef VCOLOR
in vec3 color;
#endif
#ifdef ICOLOR
in vec3 instanceColor;
#endif
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform float uTime;
out vec3 vWorld;
out vec3 vN;
out vec2 vUv;
out vec3 vObj;
out float vViewZ;
out vec3 vCol;
out vec3 vInst;
${NOISE}
${o.vertexDecl ?? ""}
void main() {
  vec3 p = position;
  vec3 n = normal;
  vUv = uv;
  ${o.vertex ?? ""}
  mat4 m = modelMatrix;
#ifdef INSTANCED
  m = modelMatrix * instanceMatrix;
#endif
  vec4 w = m * vec4(p, 1.0);
  vWorld = w.xyz;
  vN = normalize(mat3(m) * n);
  vObj = p;
#ifdef VCOLOR
  vCol = color;
#else
  vCol = vec3(1.0);
#endif
#ifdef ICOLOR
  vInst = instanceColor;
#else
  vInst = vec3(0.0);
#endif
  vec4 mv = viewMatrix * w;
  vViewZ = -mv.z;
  gl_Position = projectionMatrix * mv;
}
`;

const FRAG = (o: InkOpts) => /* glsl */ `
precision highp float;
in vec3 vWorld;
in vec3 vN;
in vec2 vUv;
in vec3 vObj;
in float vViewZ;
in vec3 vCol;
in vec3 vInst;
uniform mat4 viewMatrix;
uniform vec3 cameraPosition;
uniform vec3 uAlbedo;
uniform vec3 uEmissive;
uniform float uEmissiveAmt;
uniform vec3 uSunDir;
uniform vec3 uSunCol;
uniform vec3 uSky;
uniform vec3 uGround;
uniform vec3 uRimCol;
uniform float uRim;
uniform float uRimPow;
uniform float uSpec;
uniform float uGloss;
uniform vec4 uPL0;
uniform vec3 uPLc0;
uniform vec4 uPL1;
uniform vec3 uPLc1;
uniform float uHatch;
uniform int uMode;
uniform float uScale;
uniform float uScale2;
uniform vec3 uDir;
uniform float uAngle;
uniform float uCross;
uniform float uShade;
uniform float uInkDark;
uniform float uWobble;
uniform float uDraw;
uniform float uFill;
uniform vec3 uDrawDir;
uniform vec2 uDrawRange;
uniform float uDrawNoise;
uniform float uId;
uniform float uFar;
uniform float uTime;
uniform vec3 uPaper;
uniform sampler2D uShadowMap;
uniform mat4 uShadowMat;
uniform float uShadowOn;
uniform float uShadowSoft;
uniform float uReceive;
uniform float uOpacity;
uniform float uSS;
layout(location = 0) out vec4 gColor;
layout(location = 1) out vec4 gData;
${NOISE}
${TNOISE}
${HATCH}
${o.fragDecl ?? ""}

float shadowAt(vec3 wp, vec3 N) {
  if (uShadowOn < 0.5 || uReceive < 0.5) return 1.0;
  vec4 sp = uShadowMat * vec4(wp + N * 0.02, 1.0);
  vec3 s = sp.xyz / sp.w * 0.5 + 0.5;
  if (s.x < 0.0 || s.x > 1.0 || s.y < 0.0 || s.y > 1.0 || s.z > 1.0) return 1.0;
  vec2 ts = vec2(1.0) / vec2(textureSize(uShadowMap, 0));
  float lit = 0.0;
  for (int x = -1; x <= 1; x++)
    for (int y = -1; y <= 1; y++) {
      float d = texture(uShadowMap, s.xy + vec2(float(x), float(y)) * ts * uShadowSoft).r;
      lit += s.z - 0.0015 <= d ? 1.0 : 0.0;
    }
  return lit / 9.0;
}

void main() {
  vec3 N = normalize(vN);
  if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(cameraPosition - vWorld);
  vec3 albedo = uAlbedo * vCol;
  vec3 emis = uEmissive * uEmissiveAmt;
  float hatchMul = 1.0;
  float shadeMul = 1.0;
  float alpha = uOpacity;
  float extraInk = 0.0;
  ${o.frag ?? ""}

  // draw-on: outlines appear first, then the fill
  float fillA = 1.0;
#ifdef DRAWON
  float dn = tn3(vWorld * uDrawNoise);
  float sw = clamp((dot(vWorld, uDrawDir) - uDrawRange.x) / max(1e-3, uDrawRange.y - uDrawRange.x), 0.0, 1.0);
  float dt = sw * 0.7 + dn * 0.3;
  if (dt > uDraw) discard;
  fillA = smoothstep(dt, dt + 0.12, uFill);
#endif

  float sh = shadowAt(vWorld, N);
  float ndl = dot(N, uSunDir);
  float diff = clamp(ndl, 0.0, 1.0) * sh;
  vec3 hemi = mix(uGround, uSky, N.y * 0.5 + 0.5);
  vec3 light = hemi + uSunCol * diff;
  if (uPL0.w > 0.0) {
    vec3 d = uPL0.xyz - vWorld;
    float dist = length(d);
    float att = pow(clamp(1.0 - dist / uPL0.w, 0.0, 1.0), 2.0);
    light += uPLc0 * att * max(dot(N, d / dist) * 0.8 + 0.2, 0.0);
  }
  if (uPL1.w > 0.0) {
    vec3 d = uPL1.xyz - vWorld;
    float dist = length(d);
    float att = pow(clamp(1.0 - dist / uPL1.w, 0.0, 1.0), 2.0);
    light += uPLc1 * att * max(dot(N, d / dist) * 0.8 + 0.2, 0.0);
  }
  // rim light, strongest when the sun is behind the subject
  float rim = pow(1.0 - max(dot(N, V), 0.0), uRimPow) * uRim * (0.3 + 0.9 * max(0.0, dot(-V, uSunDir))) * (0.4 + 0.6 * sh);
  light += uRimCol * uSunCol * rim;
  vec3 H = normalize(uSunDir + V);
  float spec = pow(max(dot(N, H), 0.0), uGloss) * uSpec * sh;

  float lum = dot(light, vec3(0.299, 0.587, 0.114));
  float dark = clamp(1.0 - lum, 0.0, 1.0);
  vec3 shaded = albedo * mix(vec3(1.0), light, uShade * shadeMul) + uSunCol * spec;

  // engraving lines (or stipple dots for sand, dust, stone)
  float ink = 0.0;
  if (uMode == 5 && uHatch > 0.0) {
    vec2 fc = gl_FragCoord.xy / uSS;
    float t = clamp(dark * hatchMul + extraInk, 0.0, 1.0);
    float cell = tvn(fc * 0.9) * 0.6 + tvn(fc * 2.3 + 7.0) * 0.4;
    ink = smoothstep(1.0 - t * 0.9, 1.0 - t * 0.9 + 0.08, cell) * uHatch;
  } else if (uHatch > 0.0) {
    float c1, c2;
    if (uMode == 0) {
      vec2 q = gl_FragCoord.xy / (uScale * uSS);
      float a = radians(uAngle);
      c1 = dot(q, vec2(cos(a), sin(a)));
      c2 = dot(q, vec2(cos(a + 1.2), sin(a + 1.2)));
    } else if (uMode == 1) {
      c1 = vUv.x * uScale;
      c2 = vUv.y * uScale2;
    } else if (uMode == 2) {
      c1 = vUv.y * uScale;
      c2 = vUv.x * uScale2;
    } else {
      vec3 P = uMode == 3 ? vWorld : vObj;
      vec3 d1 = normalize(uDir);
      vec3 d2 = normalize(cross(d1, normalize(vec3(0.31, 0.83, 0.47))));
      c1 = dot(P, d1) * uScale;
      c2 = dot(P, d2) * uScale;
    }
    float wob = (tn3(vWorld * 1.7) - 0.5) * uWobble;
    c1 += wob;
    c2 += wob * 0.7;
    float t = clamp(dark * hatchMul + extraInk, 0.0, 1.0);
    float w1 = smoothstep(0.22, 0.85, t) * 0.78;
    float w2 = smoothstep(0.62 - 0.25 * uCross, 0.98, t) * 0.62;
    float w3 = smoothstep(0.86, 1.0, t) * 0.5;
    ink = engraveLine(c1, w1);
    ink = max(ink, engraveLine(c2, w2));
    ink = max(ink, engraveLine(c1 * 2.0 + 0.5, w3));
    ink *= uHatch;
  }
  vec3 color = mix(shaded, shaded * uInkDark, ink) + emis;
  color = mix(uPaper, color, fillA);
#ifdef ALPHACUT
  if (alpha <= 0.001) discard;
#endif
  gColor = vec4(color, 0.0);
  vec3 nv = normalize(mat3(viewMatrix) * N);
  gData = vec4(nv.xy * 0.5 + 0.5, vViewZ / uFar, uId);
}
`;

export const inkMaterial = (shared: Shared, o: InkOpts = {}) => {
  const defines: Record<string, number> = {};
  if (o.instanced) defines.INSTANCED = 1;
  if (o.vcolor) defines.VCOLOR = 1;
  if (o.instColor) defines.ICOLOR = 1;
  const id = o.edges === 0 ? 0 : o.id ?? nextId++;
  const m = new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader: VERT(o),
    fragmentShader: FRAG(o),
    defines,
    side: o.side ?? THREE.FrontSide,
    uniforms: {
      ...shared,
      uAlbedo: { value: col(o.color ?? "#d8c8a8") },
      uEmissive: { value: col(o.emissive ?? "#000000") },
      uEmissiveAmt: { value: o.emissiveAmt ?? 1 },
      uRimCol: { value: col(o.rimCol ?? "#ffe8c0") },
      uRim: { value: o.rim ?? 0 },
      uRimPow: { value: o.rimPow ?? 3 },
      uSpec: { value: o.spec ?? 0 },
      uGloss: { value: o.gloss ?? 30 },
      uHatch: { value: o.hatch ?? 1 },
      uMode: { value: MODES[o.mode ?? "world"] },
      uScale: { value: o.scale ?? (o.mode === "screen" ? 6 : 8) },
      uScale2: { value: o.scale2 ?? o.scale ?? 8 },
      uDir: { value: new THREE.Vector3(...(o.dir ?? [0.2, 1, 0.1])) },
      uAngle: { value: o.angle ?? 20 },
      uCross: { value: o.cross ?? 0.5 },
      uShade: { value: o.shade ?? 0.55 },
      uInkDark: { value: o.inkDark ?? 0.22 },
      uWobble: { value: o.wobble ?? 0.25 },
      uDraw: { value: 2 },
      uFill: { value: 3 },
      uDrawDir: { value: new THREE.Vector3(...(o.drawDir ?? [0, 1, 0])) },
      uDrawRange: { value: new THREE.Vector2(...(o.drawRange ?? [0, 10])) },
      uDrawNoise: { value: o.drawNoise ?? 0.6 },
      uId: { value: id },
      uReceive: { value: o.receiveShadow === false ? 0 : 1 },
      uOpacity: { value: 1 },
      ...(o.uniforms ?? {}),
    },
  });
  m.userData.ink = true;
  m.userData.castShadow = o.castShadow !== false;
  return m;
};

export type InkMat = ReturnType<typeof inkMaterial>;

// Depth-only material for the shadow pass (same vertex hook as the ink material).
export const depthMaterial = (src: InkMat) => {
  const instanced = !!src.defines?.INSTANCED;
  const vs = src.vertexShader;
  return new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader: vs,
    fragmentShader: /* glsl */ `
      precision highp float;
      layout(location = 0) out vec4 o;
      void main() { o = vec4(gl_FragCoord.z, 0.0, 0.0, 1.0); }
    `,
    defines: instanced ? { INSTANCED: 1 } : {},
    uniforms: src.uniforms,
    side: THREE.DoubleSide,
  });
};
