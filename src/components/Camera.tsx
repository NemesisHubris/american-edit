import { createContext, useContext } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { easeInOut, lerp } from "../lib/math";
import { noise1 } from "../lib/random";

export type CamState = { x: number; y: number; z: number; r: number };
export type CamKey = Partial<CamState> & { f: number; ease?: (t: number) => number };

const CamCtx = createContext<CamState>({ x: 0, y: 0, z: 1, r: 0 });
export const useCam = () => useContext(CamCtx);

const interp = (keys: CamKey[], f: number, prop: keyof CamState, def: number) => {
  const ks = keys.filter((k) => k[prop] !== undefined);
  if (ks.length === 0) return def;
  if (f <= ks[0].f) return ks[0][prop]!;
  for (let i = 0; i < ks.length - 1; i++) {
    const a = ks[i];
    const b = ks[i + 1];
    if (f <= b.f) {
      const t = (f - a.f) / Math.max(1e-6, b.f - a.f);
      return lerp(a[prop]!, b[prop]!, (b.ease ?? easeInOut)(t));
    }
  }
  return ks[ks.length - 1][prop]!;
};

// Camera for 2.5D shots. x/y are in subject-plane pixels, z is zoom, r is roll
// in degrees. `handheld` adds seeded drift so the frame never sits still.
export const Camera: React.FC<{
  keys: CamKey[];
  handheld?: number;
  seed?: number;
  offset?: Partial<CamState>;
  children: React.ReactNode;
}> = ({ keys, handheld = 0, seed = 1, offset, children }) => {
  const f = useCurrentFrame();
  const hx = handheld ? noise1(f / 40, seed) * handheld + noise1(f / 11, seed + 3) * handheld * 0.25 : 0;
  const hy = handheld ? noise1(f / 45, seed + 7) * handheld * 0.7 + noise1(f / 13, seed + 9) * handheld * 0.2 : 0;
  const hr = handheld ? noise1(f / 60, seed + 11) * handheld * 0.012 : 0;
  const cam: CamState = {
    x: interp(keys, f, "x", 0) + hx + (offset?.x ?? 0),
    y: interp(keys, f, "y", 0) + hy + (offset?.y ?? 0),
    z: interp(keys, f, "z", 1) * (offset?.z ?? 1),
    r: interp(keys, f, "r", 0) + hr + (offset?.r ?? 0),
  };
  return (
    <CamCtx.Provider value={cam}>
      <AbsoluteFill style={{ overflow: "hidden" }}>{children}</AbsoluteFill>
    </CamCtx.Provider>
  );
};

export const layerTransform = (cam: CamState, depth: number) => {
  const s = 1 + (cam.z - 1) * depth;
  return `translate(960px, 540px) rotate(${cam.r * Math.min(1, depth)}deg) scale(${s}) translate(${-960 - cam.x * depth}px, ${-540 - cam.y * depth}px)`;
};

// A parallax plane. depth 0 = infinitely far (static), 1 = subject plane,
// >1 = foreground (moves faster than the subject). Children are SVG elements
// in a 1920x1080 coordinate space unless `html` is set.
export const Layer: React.FC<{
  depth?: number;
  html?: boolean;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ depth = 1, html, style, children }) => {
  const cam = useCam();
  return (
    <AbsoluteFill style={{ transform: layerTransform(cam, depth), transformOrigin: "0 0", ...style }}>
      {html ? (
        children
      ) : (
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ overflow: "visible" }}>
          {children}
        </svg>
      )}
    </AbsoluteFill>
  );
};
