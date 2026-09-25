// Rocket exhaust: turbulent outer flame, white-hot core and shock diamonds.
import { useCurrentFrame } from "remotion";
import { usePalette } from "../lib/palette";
import { noise1 } from "../lib/random";
import { useUid } from "../lib/uid";
import { Pt, smoothD } from "../lib/engrave";

export const Plume: React.FC<{ x: number; y: number; r: number; len: number; g: number; seed?: number; spread?: number }> = ({ x, y, r, len, g, seed = 1, spread = 3 }) => {
  const f = useCurrentFrame();
  const pal = usePalette();
  const id = useUid("plume");
  if (g <= 0) return null;
  const L = len * g * (1 + 0.08 * noise1(f / 2, seed));
  const side = (s: number, widen: number, jag: number): Pt[] => {
    const pts: Pt[] = [];
    for (let i = 0; i <= 14; i++) {
      const t = i / 14;
      const w = r * (1 + (widen - 1) * Math.pow(t, 0.8)) + noise1(t * 6 - f * 0.6, seed + s) * r * jag * t;
      pts.push([x + s * w, y + t * L]);
    }
    return pts;
  };
  const outer = [...side(-1, spread, 0.5), ...side(1, spread, 0.5).reverse()];
  const coreSide = (s: number): Pt[] =>
    Array.from({ length: 9 }, (_, i) => {
      const t = i / 8;
      return [x + s * r * 0.72 * (1 - t) * (1 + 0.06 * noise1(f * 0.8 + i, seed)), y + t * L * 0.5] as Pt;
    });
  const core = [...coreSide(-1), ...coreSide(1).reverse()];
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={pal.flame} stopOpacity={1} />
          <stop offset="0.3" stopColor={pal.fire} stopOpacity={0.9} />
          <stop offset="0.75" stopColor={pal.fire} stopOpacity={0.45} />
          <stop offset="1" stopColor={pal.fire} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={smoothD(outer, true)} fill={`url(#${id})`} />
      <path d={smoothD(outer, true)} fill="none" stroke={pal.ink} strokeWidth={1.5} opacity={0.35} />
      <path d={smoothD(core, true)} fill={pal.glow} opacity={0.95} />
      <path d={smoothD(core.map(([px, py]) => [x + (px - x) * 0.55, py] as Pt), true)} fill="#fffdf4" />
      {[0.14, 0.28, 0.42, 0.56].map((t, i) => {
        const cy = y + t * L;
        const w = r * 0.32 * (1 - t * 0.6);
        return <path key={i} d={`M${x} ${cy - w * 1.6}L${x + w} ${cy}L${x} ${cy + w * 1.6}L${x - w} ${cy}Z`} fill="#fff" opacity={0.9 - t} />;
      })}
    </g>
  );
};
