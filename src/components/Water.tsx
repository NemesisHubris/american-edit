// Ink-line water: perspective seas, a curling breaker, ripples and pours.
import { useCurrentFrame } from "remotion";
import { clamp, TAU } from "../lib/math";
import { usePalette } from "../lib/palette";
import { hash, noise1, seedOf } from "../lib/random";
import { Pt, polyD, smoothD } from "../lib/engrave";
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

// A breaking wave seen from the side: the face rises, the lip curls over and
// crashes into foam, then the cycle repeats. `phase` 0..1 can be driven.
export const CrashWave: React.FC<{
  x: number;
  y: number;
  w?: number;
  h?: number;
  period?: number;
  offset?: number;
  seed?: string;
  flip?: boolean;
}> = ({ x, y, w = 700, h = 260, period = 60, offset = 0, seed = "crash", flip }) => {
  const f = useCurrentFrame();
  const pal = usePalette();
  const s = seedOf(seed);
  const ph = (((f + offset) % period) + period) % period / period;
  const rise = clamp(ph / 0.45);
  const curl = clamp((ph - 0.3) / 0.4);
  const crash = clamp((ph - 0.62) / 0.38);
  const H = h * (0.35 + 0.65 * Math.sin(rise * Math.PI * 0.5)) * (1 - crash * 0.55);
  const R = H * 0.42;
  const cx = x + w * 0.1 + curl * w * 0.08;
  const cy = y - H + R;
  // back slope
  const pts: Pt[] = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    pts.push([x - w * 0.5 + t * (w * 0.6), y - H * Math.pow(Math.sin((t * Math.PI) / 2), 1.6)]);
  }
  // curl
  const sweep = 0.3 + curl * 3.4;
  for (let i = 1; i <= 14; i++) {
    const a = -Math.PI / 2 + (sweep * i) / 14;
    const rr = R * (1 - (0.45 * i) / 14);
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  const face: Pt[] = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    face.push([cx + R * 0.6 - t * R * 0.2 + t * t * w * 0.15, cy + R * 0.2 + t * (y - cy - R * 0.2)]);
  }
  const outline = smoothD(pts);
  const body = polyD([...pts, ...face.slice().reverse().map(([a, b]) => [a, b] as Pt), [x + w * 0.4, y], [x - w * 0.5, y]]);
  // interior contour lines follow the face
  const contours: string[] = [];
  for (let k = 1; k <= 7; k++) {
    const kk = k / 8;
    const c: Pt[] = [];
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      c.push([x - w * 0.35 + t * w * 0.55 + kk * 20, y - H * kk * Math.pow(Math.sin((t * Math.PI) / 2), 1.2) * 0.95 + noise1(t * 3 + k, s) * 5]);
    }
    contours.push(smoothD(c));
  }
  const spray: React.ReactNode[] = [];
  if (curl > 0.2) {
    for (let i = 0; i < 26; i++) {
      const a = crash > 0 ? crash : curl * 0.3;
      const ang = -Math.PI * (0.2 + hash(i, s) * 0.7);
      const v = 60 + hash(i, s, 2) * 160;
      const px = cx + R + Math.cos(ang) * v * a * 1.4;
      const py = y - H * 0.4 + Math.sin(ang) * v * a + 120 * a * a;
      spray.push(<circle key={i} cx={px} cy={py} r={2 + hash(i, s, 3) * 5} fill={pal.foam} stroke={pal.ink} strokeWidth={0.8} opacity={1 - crash * 0.8} />);
    }
  }
  return (
    <g transform={flip ? `translate(${2 * x} 0) scale(-1 1)` : undefined}>
      <path d={body} fill={pal.water} opacity={0.85} />
      <path d={contours.join("")} fill="none" stroke={pal.ink} strokeWidth={1.4} opacity={0.6} />
      <path d={outline} fill="none" stroke={pal.ink} strokeWidth={3} strokeLinecap="round" />
      <path d={smoothD(face)} fill="none" stroke={pal.ink} strokeWidth={2} opacity={0.7} />
      {curl > 0.3 && (
        <path
          d={smoothD([
            [cx + R * 0.9, cy - R * 0.2],
            [cx + R * 1.25, cy + R * 0.2],
            [cx + R * 1.1 + crash * 30, cy + R * 0.8],
          ])}
          fill="none"
          stroke={pal.foam}
          strokeWidth={7}
          strokeLinecap="round"
        />
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
