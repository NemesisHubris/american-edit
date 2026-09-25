// A Remotion shot rendered by the engraving renderer. `setup` builds the scene
// once (per mount) and returns an update(frame) function run on every frame.
import { useLayoutEffect, useRef } from "react";
import { cancelRender, continueRender, delayRender, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { usePalette } from "../lib/palette";
import { InkRenderer, H, W } from "./core";

export type GL = InkRenderer & { fps: number };
export type Update = (f: number, t: number) => void;
export type Setup = (g: GL) => Update;

export type Flood = { at: number; dur: number; origin: [number, number] };

export const GLShot: React.FC<{ setup: Setup; ss?: number; flood?: Flood; color?: boolean }> = ({ setup, ss = 1.0, flood, color }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pal = usePalette();
  const canvas = useRef<HTMLCanvasElement>(null);
  const st = useRef<{ g: GL; update: Update } | null>(null);

  useLayoutEffect(() => {
    const handle = delayRender("GL setup");
    try {
      const g = new InkRenderer(canvas.current!, ss) as GL;
      g.fps = fps;
      const update = setup(g);
      st.current = { g, update };
      continueRender(handle);
    } catch (e) {
      cancelRender(e as Error);
    }
    return () => {
      st.current?.g.dispose();
      st.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    const s = st.current;
    if (!s) return;
    const handle = delayRender("GL frame");
    try {
      const t = f / fps;
      s.g.shared.uTime.value = t;
      s.update(f, t);
      const mix = color ?? pal.mode === "color" ? 1 : 0;
      let fl: { x: number; y: number; r: number } | undefined;
      if (flood && f >= flood.at) {
        const p = Math.min(1, (f - flood.at) / flood.dur);
        const e = 1 - Math.pow(1 - p, 2.2);
        fl = { x: flood.origin[0] / W, y: 1 - flood.origin[1] / H, r: e * 2.4 + 0.01 };
      }
      s.g.render(fl && f < flood!.at + flood!.dur ? 0 : mix, fl && f < flood!.at + flood!.dur ? fl : undefined);
      continueRender(handle);
    } catch (e) {
      cancelRender(e as Error);
    }
  });

  return <canvas ref={canvas} width={W} height={H} style={{ position: "absolute", left: 0, top: 0, width: W, height: H }} />;
};

// --- small helpers for setups -------------------------------------------------

export const V3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

// Camera keyframes: position + look target, eased between keys
export type CamKey = { f: number; pos: [number, number, number]; look: [number, number, number]; fov?: number };
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const camAt = (keys: CamKey[], f: number, easing: (t: number) => number = ease) => {
  let a = keys[0];
  let b = keys[0];
  let t = 0;
  if (f >= keys[keys.length - 1].f) a = b = keys[keys.length - 1];
  else if (f > keys[0].f)
    for (let i = 0; i < keys.length - 1; i++)
      if (f >= keys[i].f && f <= keys[i + 1].f) {
        a = keys[i];
        b = keys[i + 1];
        t = easing((f - a.f) / Math.max(1e-6, b.f - a.f));
        break;
      }
  const L = (u: number, v: number) => u + (v - u) * t;
  return {
    pos: new THREE.Vector3(L(a.pos[0], b.pos[0]), L(a.pos[1], b.pos[1]), L(a.pos[2], b.pos[2])),
    look: new THREE.Vector3(L(a.look[0], b.look[0]), L(a.look[1], b.look[1]), L(a.look[2], b.look[2])),
    fov: L(a.fov ?? 40, b.fov ?? 40),
  };
};

// Applies keyed camera + handheld drift (seeded sines) to g.camera
export const driveCamera = (g: GL, keys: CamKey[], f: number, handheld = 0.02, seed = 1) => {
  const c = camAt(keys, f);
  const t = f / 30;
  const hx = (Math.sin(t * 1.3 + seed) + Math.sin(t * 2.9 + seed * 2) * 0.5) * handheld;
  const hy = (Math.sin(t * 1.7 + seed * 3) + Math.sin(t * 3.7 + seed) * 0.4) * handheld;
  g.camera.position.copy(c.pos);
  g.camera.fov = c.fov;
  g.camera.lookAt(c.look);
  g.camera.rotateX(hy * 0.5);
  g.camera.rotateY(hx * 0.5);
  g.camera.updateProjectionMatrix();
};

// Draw-on control: outlines over [start, start+dur], fill trailing by `lag`
// (the DRAWON variant has a discard, so it's only compiled in while drawing)
export const drawIn = (mats: THREE.RawShaderMaterial[], f: number, start: number, dur: number, lag = 0.5) => {
  const p = (f - start) / dur;
  const draw = p * 1.25;
  const fill = (p - lag) * 1.4;
  const drawing = draw < 1.3 || fill < 1.3;
  for (const m of mats) {
    m.uniforms.uDraw.value = draw;
    m.uniforms.uFill.value = fill;
    const has = !!m.defines?.DRAWON;
    if (drawing !== has) {
      m.defines = { ...(m.defines ?? {}) };
      if (drawing) m.defines.DRAWON = 1;
      else delete m.defines.DRAWON;
      m.needsUpdate = true;
    }
  }
};
