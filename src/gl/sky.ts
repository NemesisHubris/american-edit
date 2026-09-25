// Engraved sky dome: gradient, sun with glow and slowly turning rays, drifting
// hatched cloud banks, stars. Writes background (id 0, far depth) to the G-buffer.
import * as THREE from "three";
import { HATCH, NOISE, TNOISE } from "./glsl";
import { col, ColorIn, Shared } from "./materials";

export type SkyOpts = {
  top?: ColorIn;
  horizon?: ColorIn;
  bottom?: ColorIn;
  horizonY?: number; // direction.y of the horizon band
  sunCol?: ColorIn;
  sunSize?: number; // radians
  glow?: number;
  rays?: number;
  rayCount?: number;
  lines?: number; // engraved sky lines 0..1
  lineSpacing?: number; // px
  clouds?: number; // coverage 0..1
  cloudCol?: ColorIn;
  cloudShade?: ColorIn;
  cloudScale?: number;
  cloudSpeed?: number;
  cloudHeight?: number;
  stars?: number;
  sunDir?: THREE.Vector3; // defaults to the shared light direction
};

const VERT = /* glsl */ `
precision highp float;
in vec3 position;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
out vec3 vDir;
void main() {
  vDir = normalize(position);
  vec4 w = modelMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * viewMatrix * w;
  gl_Position.z = gl_Position.w * 0.99999;
}
`;

const FRAG = /* glsl */ `
precision highp float;
in vec3 vDir;
uniform vec3 uTop;
uniform vec3 uHorizon;
uniform vec3 uBottom;
uniform float uHorizonY;
uniform vec3 uSkySun;
uniform vec3 uSunC;
uniform float uSunSize;
uniform float uGlow;
uniform float uRays;
uniform float uRayCount;
uniform float uLines;
uniform float uLineSpacing;
uniform float uClouds;
uniform vec3 uCloudCol;
uniform vec3 uCloudShade;
uniform float uCloudScale;
uniform float uCloudSpeed;
uniform float uCloudHeight;
uniform float uStars;
uniform float uTime;
uniform float uSS;
layout(location = 0) out vec4 gColor;
layout(location = 1) out vec4 gData;
${NOISE}
${TNOISE}
${HATCH}

float cloudN(vec2 p) {
  vec2 q = vec2(tfbm(p * 0.45), tfbm(p * 0.45 + 7.3));
  return tfbm(p + q * 1.6);
}
float cloudDen(float n) {
  float th = 0.66 - uClouds * 0.3;
  return smoothstep(th, th + 0.07, n);
}

void main() {
  vec3 d = normalize(vDir);
  float y = d.y - uHorizonY;
  vec3 c = y > 0.0 ? mix(uHorizon, uTop, pow(clamp(y / 0.75, 0.0, 1.0), 0.9)) : mix(uHorizon, uBottom, clamp(-y / 0.15, 0.0, 1.0));
  float dark = 1.0 - dot(c, vec3(0.299, 0.587, 0.114));
  // engraving: the paper carries the light, lines carry the tone
  c = mix(c, vec3(1.0, 0.98, 0.94), 0.35);

  vec3 sd = normalize(uSkySun);
  float cosA = dot(d, sd);
  float ang = acos(clamp(cosA, -1.0, 1.0));
  // rays: angular noise around the sun
  vec3 t1 = normalize(cross(sd, vec3(0.0, 1.0, 0.0001)));
  vec3 t2 = cross(sd, t1);
  float phi = atan(dot(d, t2), dot(d, t1));
  float rn = tvn(vec2(phi * uRayCount / 6.2831 * 1.0 + uTime * 0.04, 0.0)) * 0.6 + tvn(vec2(phi * uRayCount * 0.37 - uTime * 0.03, 3.0)) * 0.4;
  float rays = pow(smoothstep(0.35, 1.0, rn), 1.5) * exp(-ang * 1.6) * uRays * step(0.0, y + 0.02);
  float glow = exp(-ang * ang / (uSunSize * uSunSize * 30.0)) * 0.7 + exp(-ang * 3.0) * 0.35;
  c = mix(c, uSunC, clamp(glow * uGlow, 0.0, 1.0));
  c += uSunC * rays * 0.45;
  dark = clamp(dark - glow * uGlow * 0.8 - rays * 0.6, 0.0, 1.0);

  // clouds on a virtual plane
  if (uClouds > 0.0 && d.y > uHorizonY - 0.02) {
    vec2 cp = d.xz / (d.y + uCloudHeight) * uCloudScale + vec2(uTime * uCloudSpeed, 0.0);
    float n = cloudN(cp);
    float den = cloudDen(n);
    vec2 sdir = normalize(sd.xz + 1e-4) * 0.09;
    float n2 = cloudN(cp + sdir);
    float lit = clamp(0.55 + (n - n2) * 9.0 - (n - 0.66 + uClouds * 0.3) * 1.2, 0.0, 1.0);
    float fade = smoothstep(uHorizonY - 0.02, uHorizonY + 0.08, d.y);
    vec3 cc = mix(uCloudShade, uCloudCol, lit);
    cc = mix(cc, uSunC, clamp(glow * 0.8, 0.0, 1.0) * lit);
    c = mix(c, cc, den * fade);
    dark = mix(dark, (1.0 - lit) * 0.8 + 0.1, den * fade);
    // silver lining
    c += uSunC * smoothstep(0.02, 0.2, den) * (1.0 - smoothstep(0.2, 0.6, den)) * glow * 1.5 * fade;
  }

  // stars
  if (uStars > 0.0) {
    vec3 g = d * 180.0;
    vec3 cell = floor(g);
    float h = hash13(cell);
    if (h > 0.985) {
      vec3 cp = cell + 0.5 + (vec3(hash13(cell + 1.0), hash13(cell + 2.0), hash13(cell + 3.0)) - 0.5) * 0.6;
      float s = 1.0 - smoothstep(0.0, 0.12 + 0.12 * hash13(cell + 5.0), length(g - cp));
      float tw = 0.7 + 0.3 * sin(uTime * (2.0 + h * 10.0) + h * 40.0);
      c += vec3(1.0, 0.97, 0.9) * s * tw * uStars * step(uHorizonY, d.y);
    }
  }

  // engraved horizontal lines, heavier where darker
  if (uLines > 0.0) {
    vec2 fc = gl_FragCoord.xy / uSS;
    float s = fc.y / uLineSpacing + (tvn(fc * vec2(0.004, 0.02)) - 0.5) * 0.35;
    float w = clamp(dark * 1.1 - 0.05, 0.0, 0.85);
    float ink = engraveLine(s, w) * uLines;
    c = mix(c, c * 0.18, ink);
  }
  gColor = vec4(c, 0.0);
  gData = vec4(0.5, 0.5, 1.0, 0.0);
}
`;

export const makeSky = (shared: Shared, o: SkyOpts = {}) => {
  const u = {
    uTop: { value: col(o.top ?? "#c9d8e8") },
    uHorizon: { value: col(o.horizon ?? "#f3e6cc") },
    uBottom: { value: col(o.bottom ?? "#b8a88a") },
    uHorizonY: { value: o.horizonY ?? 0 },
    uSkySun: { value: o.sunDir ?? shared.uSunDir.value },
    uSunC: { value: col(o.sunCol ?? "#fff1c8") },
    uSunSize: { value: o.sunSize ?? 0.03 },
    uGlow: { value: o.glow ?? 1 },
    uRays: { value: o.rays ?? 0.6 },
    uRayCount: { value: o.rayCount ?? 36 },
    uLines: { value: o.lines ?? 0.6 },
    uLineSpacing: { value: o.lineSpacing ?? 6 },
    uClouds: { value: o.clouds ?? 0 },
    uCloudCol: { value: col(o.cloudCol ?? "#fbf3e2") },
    uCloudShade: { value: col(o.cloudShade ?? "#a3978a") },
    uCloudScale: { value: o.cloudScale ?? 1.4 },
    uCloudSpeed: { value: o.cloudSpeed ?? 0.02 },
    uCloudHeight: { value: o.cloudHeight ?? 0.25 },
    uStars: { value: o.stars ?? 0 },
    uTime: shared.uTime,
    uSS: shared.uSS,
    uNoiseTex: shared.uNoiseTex,
  };
  const mat = new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: u,
    side: THREE.BackSide,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1000, 64, 32), mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = 1000; // after opaque geometry: only uncovered pixels get shaded
  mesh.onBeforeRender = (_r, _s, cam) => {
    mesh.position.copy(cam.position);
    mesh.updateMatrixWorld();
  };
  return { mesh, u };
};
