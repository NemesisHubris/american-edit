// Shared GLSL chunks for the engraving renderer.

export const NOISE = /* glsl */ `
float hash13(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float vnoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash13(i), hash13(i + vec3(1, 0, 0)), f.x), mix(hash13(i + vec3(0, 1, 0)), hash13(i + vec3(1, 1, 0)), f.x), f.y),
    mix(mix(hash13(i + vec3(0, 0, 1)), hash13(i + vec3(1, 0, 1)), f.x), mix(hash13(i + vec3(0, 1, 1)), hash13(i + vec3(1, 1, 1)), f.x), f.y),
    f.z);
}
float vnoise2(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1, 0)), f.x), mix(hash12(i + vec2(0, 1)), hash12(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec3 p) {
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 4; i++) { s += a * vnoise(p); p = p * 2.03 + 17.1; a *= 0.5; }
  return s;
}
float fbm2(vec2 p) {
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 5; i++) { s += a * vnoise2(p); p = p * 2.03 + 17.1; a *= 0.5; }
  return s;
}
`;

// Engraving line with width modulated by tone; fades to flat tone when the
// lines get denser than the pixel grid (no moire).
export const HATCH = /* glsl */ `
float engraveLine(float s, float w) {
  float d = abs(fract(s) - 0.5);
  float fw = max(fwidth(s), 1e-4);
  float hw = w * 0.5;
  float cov = (1.0 - smoothstep(hw - fw, hw + fw, d)) * smoothstep(0.0, 0.08, w);
  float fade = clamp(1.0 - (fw - 0.3) * 2.5, 0.0, 1.0);
  return mix(w, cov, fade);
}
`;

// Texture-backed noise (much cheaper than hashing in a software renderer).
// r = 5-octave fbm, g = fbm (other seed), b = value noise, a = fine fbm.
// Domain: one texture tile spans 8 units, matching fbm2/vnoise2 frequencies.
export const TNOISE = /* glsl */ `
uniform sampler2D uNoiseTex;
float tfbm(vec2 p) { return texture(uNoiseTex, p * 0.125).r; }
float tfbmB(vec2 p) { return texture(uNoiseTex, p * 0.125).g; }
float tvn(vec2 p) { return texture(uNoiseTex, p * 0.125).b; }
float tn3(vec3 p) { return (texture(uNoiseTex, p.xz * 0.125).r + texture(uNoiseTex, p.xy * 0.125 + 0.37).g) * 0.5; }
`;
