// A flag as wave-deformed cloth: stripes, canton and stars follow a travelling
// wave; folds get shading and engraved hatching in the troughs.
import { useCurrentFrame } from "remotion";
import { TAU } from "../lib/math";
import { usePalette } from "../lib/palette";
import { Pt, polyD, hatchParam } from "../lib/engrave";

export type FlagProps = {
  x: number; // hoist top-left
  y: number;
  w: number;
  h: number;
  amp?: number; // wave strength
  speed?: number; // cycles per second
  waves?: number; // waves across the fly
  stars?: 50 | 48 | 13 | 0;
  t?: number; // time override (frames)
  droop?: number; // 0 flying .. 1 hanging
  hatch?: boolean;
  outline?: number;
  lift?: number; // stiffness toward the fly end (Moon flag = 0.0)
};

const starD = (cx: number, cy: number, r: number) => {
  const pts: Pt[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.4;
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  return polyD(pts);
};

const starLayout = (n: number): [number, number][] => {
  if (n === 50) {
    const out: [number, number][] = [];
    for (let r = 0; r < 9; r++) {
      const cols = r % 2 === 0 ? 6 : 5;
      for (let c = 0; c < cols; c++) out.push([(c * 2 + (r % 2 === 0 ? 1 : 2)) / 12, (r + 1) / 10]);
    }
    return out;
  }
  if (n === 48) {
    const out: [number, number][] = [];
    for (let r = 0; r < 6; r++) for (let c = 0; c < 8; c++) out.push([(c + 0.5) / 8, (r + 0.5) / 6]);
    return out;
  }
  if (n === 13) {
    return Array.from({ length: 13 }, (_, i) => {
      const a = (i / 13) * TAU - Math.PI / 2;
      return [0.5 + Math.cos(a) * 0.32, 0.5 + Math.sin(a) * 0.36] as [number, number];
    });
  }
  return [];
};

export const Flag: React.FC<FlagProps> = ({ x, y, w, h, amp = 1, speed = 0.8, waves = 1.6, stars = 50, t, droop = 0, hatch = true, outline = 2.5, lift = 1 }) => {
  const frame = useCurrentFrame();
  const pal = usePalette();
  const time = (t ?? frame) / 30;
  const phase = (u: number, v: number) => TAU * (u * waves - time * speed) + v * 0.9;
  const P = (u: number, v: number): Pt => {
    const ph = phase(u, v);
    const k = Math.pow(u, 0.85) * amp;
    const dy = Math.sin(ph) * h * 0.09 * k + droop * u * u * h * 0.35 * (1 - v * 0.3);
    const dx = -(1 - Math.cos(ph)) * w * 0.025 * k - droop * u * w * 0.2;
    const sway = Math.sin(TAU * time * speed * 0.5) * h * 0.02 * u * lift;
    return [x + u * w + dx, y + v * h + dy + sway];
  };
  const shadeAt = (u: number, v: number) => Math.cos(phase(u, v)) * Math.pow(u, 0.6) * amp;
  const N = 36;
  const edge = (v: number) => Array.from({ length: N + 1 }, (_, i) => P(i / N, v));
  const stripes: React.ReactNode[] = [];
  for (let s = 0; s < 13; s++) {
    const top = edge(s / 13);
    const bot = edge((s + 1) / 13).reverse();
    stripes.push(<path key={s} d={polyD([...top, ...bot])} fill={s % 2 === 0 ? pal.flagRed : pal.flagWhite} />);
  }
  const cw = 0.4;
  const ch = 7 / 13;
  const cantonPts: Pt[] = [];
  const CN = 14;
  for (let i = 0; i <= CN; i++) cantonPts.push(P((i / CN) * cw, 0));
  for (let i = 0; i <= 8; i++) cantonPts.push(P(cw, (i / 8) * ch));
  for (let i = CN; i >= 0; i--) cantonPts.push(P((i / CN) * cw, ch));
  const shades: React.ReactNode[] = [];
  for (let i = 0; i < N; i++) {
    const u0 = i / N;
    const u1 = (i + 1) / N;
    const sv = shadeAt((u0 + u1) / 2, 0.5);
    const poly = [...Array.from({ length: 7 }, (_, k) => P(u0, k / 6)), ...Array.from({ length: 7 }, (_, k) => P(u1, 1 - k / 6))];
    shades.push(<path key={i} d={polyD(poly)} fill={sv > 0 ? "#fff" : "#000"} opacity={Math.min(0.42, Math.abs(sv) * 0.4)} />);
  }
  const hatchD = hatch
    ? hatchParam((vv, uu) => P(uu, vv), {
        lines: 70,
        samples: 26,
        tone: (vv, uu) => -shadeAt(uu, vv),
        threshold: 0.32,
      })
    : "";
  const outlinePts = [...edge(0), ...Array.from({ length: 9 }, (_, k) => P(1, k / 8)), ...edge(1).reverse(), ...Array.from({ length: 9 }, (_, k) => P(0, 1 - k / 8))];
  return (
    <g>
      {stripes}
      <path d={polyD(cantonPts)} fill={pal.flagBlue} />
      {starLayout(stars).map(([su, sv], i) => {
        const [sx, sy] = P(su * cw, sv * ch);
        return <path key={i} d={starD(sx, sy, h * 0.028)} fill={pal.flagWhite} />;
      })}
      <g>{shades}</g>
      {hatch && <path d={hatchD} fill="none" stroke={pal.ink} strokeWidth={1.1} opacity={0.5} />}
      {Array.from({ length: 12 }, (_, s) => (
        <path key={`sl${s}`} d={polyD(edge((s + 1) / 13), false)} fill="none" stroke={pal.ink} strokeWidth={0.8} opacity={0.35} />
      ))}
      <path d={polyD(outlinePts)} fill="none" stroke={pal.ink} strokeWidth={outline} strokeLinejoin="round" />
    </g>
  );
};
