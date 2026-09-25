// Ink-line water: perspective seas, a curling breaker, ripples and pours.
import { useCurrentFrame } from "remotion";
import { clamp, TAU } from "../lib/math";
import { usePalette } from "../lib/palette";
import { hash, noise1, seedOf } from "../lib/random";
import { hatch, Pt, polyD, smoothD } from "../lib/engrave";
import { useUid } from "../lib/uid";
import { tok } from "./InkDraw";

// Engraved sea: broken wave lines packed toward the horizon, drifting and
// bobbing, with a wash gradient underneath and foam flecks up close.
export const InkSea: React.FC<{
  top: number;
  bottom?: number;
  x0?: number;
  x1?: number;
  rows?: number;
  amp?: number;
  speed?: number;
  drift?: number;
  seed?: string;
  wash?: string;
  washNear?: string;
  lineOp?: number;
  foam?: number;
  t?: number;
}> = ({ top, bottom = 1200, x0 = -300, x1 = 2220, rows = 34, amp = 14, speed = 1, drift = 0.6, seed = "sea", wash, washNear, lineOp = 0.9, foam = 0.5, t }) => {
  const frame = useCurrentFrame();
  const f = t ?? frame;
  const pal = usePalette();
  const id = useUid("sea");
  const s = seedOf(seed);
  const lines: string[] = [];
  const heavy: string[] = [];
  const foamD: string[] = [];
  for (let j = 0; j < rows; j++) {
    const tj = (j + 1) / rows;
    const y0 = top + (bottom - top) * Math.pow(tj, 1.9);
    const A = amp * (0.12 + Math.pow(tj, 1.4));
    const lam = 50 + 520 * tj;
    const step = 10 + 26 * tj;
    const ph = hash(j, s) * TAU;
    const w = f * 0.07 * speed;
    let seg: Pt[] = [];
    const out = tj > 0.55 ? heavy : lines;
    const flush = () => {
      if (seg.length > 1) out.push(smoothD(seg));
      seg = [];
    };
    for (let x = x0; x <= x1; x += step) {
      const xx = x + f * drift * (0.4 + tj);
      const y =
        y0 +
        A * (0.65 * Math.sin((TAU * xx) / lam + w + ph) + 0.35 * Math.sin((TAU * xx) / (lam * 0.47) - w * 1.3 + ph * 2)) +
        noise1(xx / 90, s + j) * A * 0.4;
      const gate = noise1(xx / (lam * 0.8) + j * 7.1, s + 3) > -0.35;
      if (gate) seg.push([x, y]);
      else flush();
      if (foam > 0 && tj > 0.45 && hash(Math.floor(xx / 40), j, s) > 1 - foam * 0.12 && Math.sin((TAU * xx) / lam + w + ph) > 0.8)
        foamD.push(`M${x.toFixed(1)} ${(y - A * 0.4).toFixed(1)}l${(8 + tj * 14).toFixed(1)} ${(-3 - tj * 4).toFixed(1)}`);
    }
    flush();
  }
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={tok(pal, wash, pal.water)} stopOpacity={0.55} />
          <stop offset="1" stopColor={tok(pal, washNear, pal.waterDeep)} stopOpacity={0.9} />
        </linearGradient>
      </defs>
      <rect x={x0} y={top} width={x1 - x0} height={bottom - top} fill={`url(#${id})`} />
      <path d={lines.join("")} fill="none" stroke={pal.ink} strokeWidth={1.1} opacity={0.75 * lineOp} strokeLinecap="round" />
      <path d={heavy.join("")} fill="none" stroke={pal.ink} strokeWidth={2.2} opacity={lineOp} strokeLinecap="round" />
      <path d={foamD.join("")} fill="none" stroke={pal.foam} strokeWidth={3} opacity={0.9} strokeLinecap="round" />
    </g>
  );
};

// A breaking wave seen from the side, built from keyframed silhouettes: a
// swell rises, the crest pitches forward into a curling lip over a shadowed
// barrel, then the lip plunges and explodes into foam. `phase` 0..1 drives it.
const SWELL: [number, number][] = [
  [-0.5, 0], [-0.3, 0.12], [-0.12, 0.3], [0, 0.42], [0.1, 0.43], [0.18, 0.39], [0.24, 0.33], [0.27, 0.28],
  [0.25, 0.3], [0.22, 0.32], [0.18, 0.34], [0.2, 0.26], [0.24, 0.16], [0.3, 0.07], [0.42, 0],
];
const PLUNGE: [number, number][] = [
  [-0.5, 0], [-0.32, 0.24], [-0.14, 0.62], [0, 0.95], [0.13, 1.0], [0.25, 0.9], [0.32, 0.7], [0.3, 0.5],
  [0.24, 0.6], [0.16, 0.72], [0.08, 0.78], [0.03, 0.58], [0.05, 0.33], [0.15, 0.12], [0.36, 0],
];
const CRASHED: [number, number][] = [
  [-0.5, 0], [-0.32, 0.2], [-0.12, 0.45], [0.02, 0.62], [0.16, 0.62], [0.3, 0.45], [0.38, 0.25], [0.4, 0.1],
  [0.33, 0.2], [0.24, 0.32], [0.12, 0.42], [0.06, 0.3], [0.08, 0.16], [0.16, 0.06], [0.36, 0],
];

export const CrashWave: React.FC<{
  x: number;
  y: number;
  w?: number;
  h?: number;
  period?: number;
  offset?: number;
  seed?: string;
  flip?: boolean;
  phase?: number;
}> = ({ x, y, w = 700, h = 260, period = 60, offset = 0, seed = "crash", flip, phase }) => {
  const f = useCurrentFrame();
  const pal = usePalette();
  const s = seedOf(seed);
  const ph = phase ?? (((f + offset) % period) + period) % period / period;
  const curl = clamp(ph / 0.62);
  const crash = clamp((ph - 0.62) / 0.3);
  const ec = curl * curl * (3 - 2 * curl);
  const shape = SWELL.map(([sx, sy], i) => {
    const [px, py] = PLUNGE[i];
    const [cx2, cy2] = CRASHED[i];
    const ax = sx + (px - sx) * ec;
    const ay = sy + (py - sy) * ec;
    return [x + (ax + (cx2 - ax) * crash) * w, y - (ay + (cy2 - ay) * crash) * h] as Pt;
  });
  const back = shape.slice(0, 5);
  const lipOut = shape.slice(3, 8);
  const tip = shape[7];
  const under = shape.slice(7, 11);
  const face = shape.slice(10);
  const body = smoothD(shape.concat([[x - 0.5 * w, y]]), true, 0.4);
  const tubePts: Pt[] = [...under, [shape[11][0] + w * 0.02, shape[11][1] + h * 0.1], [tip[0] - w * 0.02, tip[1] + h * 0.12]];
  const contours: string[] = [];
  for (let k = 1; k <= 14; k++) {
    const kk = k / 15;
    contours.push(smoothD(shape.slice(0, 7).map(([px, py], i) => [px + kk * w * 0.03 * i * 0.3, y - (y - py) * (1 - kk * 0.92) + noise1(i + k * 0.7, s) * h * 0.006] as Pt)));
  }
  const faceLines: string[] = [];
  for (let k = 1; k <= 6; k++) faceLines.push(smoothD(face.map(([px, py], i) => [px - k * w * 0.012 * (1 - i / face.length), py - k * h * 0.012] as Pt)));
  const streaks: string[] = [];
  for (let i = 0; i < 16; i++) {
    const t = hash(i, s, 9);
    const k = Math.min(3, Math.floor(t * 4));
    const [px0, py0] = back[k];
    const [px1, py1] = back[k + 1];
    const px = px0 + (px1 - px0) * (t * 4 - k);
    const py = py0 + (py1 - py0) * (t * 4 - k) + h * (0.04 + hash(i, s, 7) * 0.25);
    const len = w * (0.02 + hash(i, s, 8) * 0.05);
    streaks.push(`M${px.toFixed(1)} ${py.toFixed(1)}l${len.toFixed(1)} ${(-len * 0.45).toFixed(1)}`);
  }
  const fingers: string[] = [];
  lipOut.concat([tip]).forEach(([px, py], i) => {
    for (let j = 0; j < 3; j++) {
      const len = w * (0.012 + hash(i, j, s) * 0.03) * (0.4 + curl);
      const a = 0.4 + i * 0.35 + j * 0.3;
      fingers.push(`M${px.toFixed(1)} ${py.toFixed(1)}q${(Math.cos(a) * len * 0.5).toFixed(1)} ${(-len * 0.2).toFixed(1)} ${(Math.cos(a) * len).toFixed(1)} ${(Math.sin(a) * len).toFixed(1)}`);
    }
  });
  const spray: React.ReactNode[] = [];
  if (curl > 0.7) {
    const a = crash > 0 ? 0.3 + crash : (curl - 0.7);
    for (let i = 0; i < 44; i++) {
      const ang = -Math.PI * (0.05 + hash(i, s) * 0.85);
      const v = w * (0.05 + hash(i, s, 2) * 0.25);
      const px = tip[0] + Math.cos(ang) * v * a;
      const py = tip[1] + h * 0.2 + Math.sin(ang) * v * a * 0.9 + w * 0.1 * a * a;
      spray.push(<circle key={i} cx={px} cy={py} r={(2 + hash(i, s, 3) * 6) * Math.max(1, w / 700)} fill={pal.foam} stroke={pal.ink} strokeWidth={0.8} opacity={1 - crash * 0.6} />);
    }
  }
  const lw = Math.max(1, w / 900);
  return (
    <g transform={flip ? `translate(${2 * x} 0) scale(-1 1)` : undefined} strokeLinecap="round" strokeLinejoin="round">
      <path d={body} fill={pal.water} opacity={0.93} />
      <path d={contours.join("")} fill="none" stroke={pal.ink} strokeWidth={1.3 * lw} opacity={0.7} />
      <path d={streaks.join("")} fill="none" stroke={pal.foam} strokeWidth={3 * lw} opacity={0.85} />
      {curl > 0.35 && (
        <g opacity={clamp((curl - 0.35) / 0.3)}>
          <path d={smoothD(tubePts, true)} fill={pal.waterDeep} />
          <path d={hatch([tubePts], { angle: 75, spacing: 4 * lw, seed })} fill="none" stroke={pal.ink} strokeWidth={1.2 * lw} opacity={0.8} />
          <path d={faceLines.join("")} fill="none" stroke={pal.ink} strokeWidth={1.2 * lw} opacity={0.7} />
        </g>
      )}
      <path d={smoothD(shape.slice(0, 11))} fill="none" stroke={pal.ink} strokeWidth={3 * lw} />
      <path d={smoothD(face)} fill="none" stroke={pal.ink} strokeWidth={2.2 * lw} />
      <path d={smoothD(shape.slice(2, 8))} fill="none" stroke={pal.foam} strokeWidth={5 * lw} opacity={0.95} />
      <path d={fingers.join("")} fill="none" stroke={pal.foam} strokeWidth={3 * lw} />
      <path d={fingers.join("")} fill="none" stroke={pal.ink} strokeWidth={0.8 * lw} opacity={0.5} />
      {crash > 0 && (
        <ellipse cx={tip[0]} cy={y - h * 0.15} rx={w * 0.22 * crash + 10} ry={h * 0.22 * crash + 5} fill={pal.foam} opacity={0.8 * (1 - crash * 0.5)} stroke={pal.ink} strokeWidth={1.2} />
      )}
      {spray}
    </g>
  );
};

// Concentric ripples spreading from a point (ellipses for perspective).
export const Ripples: React.FC<{ x: number; y: number; r?: number; squash?: number; period?: number; rings?: number; offset?: number; width?: number }> = ({
  x,
  y,
  r = 160,
  squash = 0.3,
  period = 50,
  rings = 4,
  offset = 0,
  width = 2,
}) => {
  const f = useCurrentFrame();
  const pal = usePalette();
  return (
    <g fill="none" stroke={pal.ink}>
      {Array.from({ length: rings }, (_, i) => {
        const t = ((((f + offset) / period + i / rings) % 1) + 1) % 1;
        const rr = r * t;
        return <ellipse key={i} cx={x} cy={y} rx={rr} ry={rr * squash} strokeWidth={width * (1 - t * 0.6)} opacity={(1 - t) * 0.8} />;
      })}
    </g>
  );
};

// Falling sheet of water: streaks flowing downward along a curve, with
// churning foam and mist where it lands.
export const Pour: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  speed?: number;
  lines?: number;
  bulge?: number;
  seed?: string;
}> = ({ x, y, w, h, speed = 22, lines = 40, bulge = 0, seed = "pour" }) => {
  const f = useCurrentFrame();
  const pal = usePalette();
  const s = seedOf(seed);
  return (
    <g strokeLinecap="round" fill="none">
      <path d={polyD([[x, y], [x + w, y], [x + w + bulge, y + h], [x + bulge, y + h]])} fill={pal.water} opacity={0.55} />
      {Array.from({ length: lines }, (_, i) => {
        const u = (i + hash(i, s) * 0.8) / lines;
        const px = x + u * w;
        const d = `M${px} ${y}C${px + bulge * 0.2} ${y + h * 0.4} ${px + bulge * 0.8} ${y + h * 0.7} ${px + bulge} ${y + h}`;
        const dash = 30 + hash(i, s, 2) * 90;
        const gap = 20 + hash(i, s, 3) * 60;
        return (
          <path
            key={i}
            d={d}
            stroke={i % 3 === 0 ? pal.foam : pal.ink}
            strokeWidth={i % 3 === 0 ? 3 : 1.4}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-(f * speed * (0.8 + hash(i, s, 4) * 0.5)) - hash(i, s, 5) * 200}
            opacity={i % 3 === 0 ? 0.9 : 0.7}
          />
        );
      })}
    </g>
  );
};
