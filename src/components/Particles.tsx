// Ink-style particle systems. Every particle's state is a pure function of the
// frame and a seed, so renders are deterministic and frames can be rendered
// in any order.
import { useCurrentFrame } from "remotion";
import { clamp, TAU } from "../lib/math";
import { usePalette } from "../lib/palette";
import { hash, noise1, seedOf } from "../lib/random";
import { smoothD } from "../lib/engrave";
import { useUid } from "../lib/uid";
import { tok } from "./InkDraw";

type Emit = {
  x: number;
  y: number;
  start?: number;
  end?: number;
  rate?: number; // puffs per frame
  count?: number; // burst mode: all puffs at `start`
  life?: number;
  size?: number;
  grow?: number;
  vx?: number;
  vy?: number;
  spread?: number; // velocity randomness (px/frame)
  wind?: number; // px/frame drift
  rise?: number; // px/frame upward drift (negative y)
  seed?: string;
  shade?: number; // 0 light steam .. 1 dark smoke
  opacity?: number;
  outline?: number; // ink outline width
  color?: string;
};

const puffPath = (cx: number, cy: number, r: number, s: number, t: number) => {
  const pts: [number, number][] = [];
  const n = 11;
  for (let k = 0; k < n; k++) {
    const a = (k / n) * TAU;
    const rr = r * (1 + 0.2 * noise1(k * 1.9 + s * 7.3 + t * 0.025, 5) + 0.08 * Math.sin(a * 3 + s));
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  return smoothD(pts, true);
};

// Billowing smoke / steam puffs: soft wash body, ink outline and curl strokes.
export const Smoke: React.FC<Emit> = (p) => {
  const f = useCurrentFrame();
  const pal = usePalette();
  const id = useUid("smk");
  const seed = seedOf(p.seed ?? "smoke");
  const life = p.life ?? 60;
  const start = p.start ?? 0;
  const burst = p.count !== undefined;
  const rate = p.rate ?? 0.4;
  const total = burst ? p.count! : Math.ceil(((p.end ?? 100000) - start) * rate);
  const size = p.size ?? 40;
  const shade = p.shade ?? 0.4;
  const tau = life * 0.3;
  const body = tok(pal, p.color, pal.smoke);
  const puffs: React.ReactNode[] = [];
  // Only iterate over puffs that could be alive
  const firstAlive = burst ? 0 : Math.max(0, Math.floor((f - start - life) * rate) - 1);
  const lastAlive = burst ? total - 1 : Math.min(total - 1, Math.ceil((f - start) * rate) + 1);
  for (let i = firstAlive; i <= lastAlive; i++) {
    const birth = burst ? start + hash(i, seed, 1) * 3 : start + i / rate + hash(i, seed, 1) * (0.6 / rate);
    const a = f - birth;
    if (a < 0 || a > life) continue;
    const ang = hash(i, seed, 2) * TAU;
    const spd = (p.spread ?? 1.2) * (0.3 + hash(i, seed, 3));
    const vx = (p.vx ?? 0) + Math.cos(ang) * spd;
    const vy = (p.vy ?? -1.5) + Math.sin(ang) * spd * 0.7;
    const k = tau * (1 - Math.exp(-a / tau));
    const x = p.x + vx * k + (p.wind ?? 0) * a + noise1(a / 25 + i, seed) * size * 0.3;
    const y = p.y + vy * k - (p.rise ?? 0) * a;
    const r = size * (0.5 + 0.5 * hash(i, seed, 4)) * (0.35 + (p.grow ?? 1.6) * (1 - Math.exp(-a / (life * 0.35))));
    const op = (p.opacity ?? 0.95) * clamp(a / 3) * clamp((life - a) / (life * 0.45));
    if (op <= 0.01) continue;
    const d = puffPath(x, y, r, i + seed * 0.001, a);
    const ow = p.outline ?? 1.6;
    puffs.push(
      <g key={i} opacity={op}>
        <path d={d} fill={`url(#${id})`} />
        {ow > 0 && <path d={d} fill="none" stroke={pal.ink} strokeWidth={ow} opacity={0.55} />}
        {ow > 0 && (
          <path
            d={`M${x + r * 0.55 * Math.cos(0.2)} ${y + r * 0.55 * Math.sin(0.2)}A${r * 0.55} ${r * 0.55} 0 0 1 ${x + r * 0.55 * Math.cos(1.5)} ${y + r * 0.55 * Math.sin(1.5)}M${x + r * 0.78 * Math.cos(0.1)} ${y + r * 0.78 * Math.sin(0.1)}A${r * 0.78} ${r * 0.78} 0 0 1 ${x + r * 0.78 * Math.cos(1.7)} ${y + r * 0.78 * Math.sin(1.7)}`}
            fill="none"
            stroke={pal.ink}
            strokeWidth={ow * 0.7}
            opacity={0.35}
          />
        )}
      </g>,
    );
  }
  return (
    <g>
      <defs>
        <radialGradient id={id} cx="0.38" cy="0.35" r="0.7">
          <stop offset="0" stopColor={pal.foam} stopOpacity={0.95 - shade * 0.3} />
          <stop offset="0.55" stopColor={body} stopOpacity={0.9} />
          <stop offset="1" stopColor={pal.inkSoft} stopOpacity={0.35 + shade * 0.5} />
        </radialGradient>
      </defs>
      {puffs}
    </g>
  );
};

// Drifting fog banks: soft wash ellipses plus faint ink wisps.
export const Fog: React.FC<{
  y: number;
  h: number;
  count?: number;
  speed?: number;
  opacity?: number;
  seed?: string;
  color?: string;
  wisps?: number;
  x0?: number;
  x1?: number;
}> = ({ y, h, count = 9, speed = 1.2, opacity = 0.7, seed = "fog", color, wisps = 6, x0 = -700, x1 = 2620 }) => {
  const f = useCurrentFrame();
  const pal = usePalette();
  const id = useUid("fog");
  const s = seedOf(seed);
  const span = x1 - x0;
  const c = tok(pal, color, pal.foam);
  return (
    <g>
      <defs>
        <radialGradient id={id}>
          <stop offset="0" stopColor={c} stopOpacity={0.85} />
          <stop offset="0.6" stopColor={c} stopOpacity={0.35} />
          <stop offset="1" stopColor={c} stopOpacity={0} />
        </radialGradient>
      </defs>
      {Array.from({ length: count }, (_, i) => {
        const w = 700 + hash(i, s, 1) * 800;
        const sp = speed * (0.6 + hash(i, s, 2) * 0.8);
        const x = x0 + ((((hash(i, s, 3) * span + f * sp) % span) + span) % span);
        const yy = y + (hash(i, s, 4) - 0.5) * h + Math.sin(f / 50 + i) * h * 0.08;
        const hh = h * (0.5 + hash(i, s, 5) * 0.6);
        return <ellipse key={i} cx={x} cy={yy} rx={w / 2} ry={hh / 2} fill={`url(#${id})`} opacity={opacity * (0.7 + 0.3 * Math.sin(f / 37 + i * 2))} />;
      })}
      {Array.from({ length: wisps }, (_, i) => {
        const sp = speed * (0.9 + hash(i, s, 6) * 0.7);
        const len = 300 + hash(i, s, 7) * 500;
        const x = x0 + ((((hash(i, s, 8) * span + f * sp) % span) + span) % span);
        const yy = y + (hash(i, s, 9) - 0.5) * h * 0.8;
        const pts: [number, number][] = [];
        for (let k = 0; k <= 8; k++) {
          const px = x - len / 2 + (len * k) / 8;
          pts.push([px, yy + Math.sin(k * 0.9 + f / 30 + i) * 10 + noise1(k * 0.5 + i, s) * 8]);
        }
        return <path key={`w${i}`} d={smoothD(pts)} fill="none" stroke={pal.ink} strokeWidth={1.3} opacity={0.18 * opacity} strokeLinecap="round" />;
      })}
    </g>
  );
};

// Floating dust motes / pollen caught in light.
export const Dust: React.FC<{
  count?: number;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  speed?: number;
  size?: number;
  seed?: string;
  color?: string;
  opacity?: number;
}> = ({ count = 60, x = 0, y = 0, w = 1920, h = 1080, speed = 0.4, size = 2.4, seed = "dust", color, opacity = 0.7 }) => {
  const f = useCurrentFrame();
  const pal = usePalette();
  const s = seedOf(seed);
  const c = tok(pal, color, pal.ink);
  return (
    <g>
      {Array.from({ length: count }, (_, i) => {
        const sx = (hash(i, s, 1) - 0.4) * speed;
        const sy = (hash(i, s, 2) - 0.6) * speed;
        const px = x + ((((hash(i, s, 3) * w + f * sx + noise1(f / 40 + i, s) * 30) % w) + w) % w);
        const py = y + ((((hash(i, s, 4) * h + f * sy + noise1(f / 50 + i, s + 1) * 30) % h) + h) % h);
        const tw = 0.5 + 0.5 * Math.sin(f / (6 + hash(i, s, 5) * 10) + i);
        return <circle key={i} cx={px} cy={py} r={size * (0.4 + hash(i, s, 6))} fill={c} opacity={opacity * (0.3 + 0.7 * tw)} />;
      })}
    </g>
  );
};

// Rising embers with a warm glow.
export const Embers: React.FC<{
  x: number;
  y: number;
  w?: number;
  count?: number;
  rise?: number;
  life?: number;
  seed?: string;
  size?: number;
  color?: string;
}> = ({ x, y, w = 200, count = 40, rise = 3, life = 60, seed = "emb", size = 3, color }) => {
  const f = useCurrentFrame();
  const pal = usePalette();
  const id = useUid("emb");
  const s = seedOf(seed);
  const c = tok(pal, color, pal.fire);
  return (
    <g>
      <defs>
        <radialGradient id={id}>
          <stop offset="0" stopColor={pal.glow} stopOpacity={1} />
          <stop offset="0.35" stopColor={c} stopOpacity={0.8} />
          <stop offset="1" stopColor={c} stopOpacity={0} />
        </radialGradient>
      </defs>
      {Array.from({ length: count }, (_, i) => {
        const period = life * (0.7 + hash(i, s, 1) * 0.6);
        const a = (f + hash(i, s, 2) * period) % period;
        const t = a / period;
        const px = x + (hash(i, s, 3) - 0.5) * w + noise1(a / 15 + i, s) * 40;
        const py = y - a * rise * (0.6 + hash(i, s, 4) * 0.8);
        const op = Math.sin(t * Math.PI) * (0.6 + 0.4 * Math.sin(f / 3 + i));
        const r = size * (0.6 + hash(i, s, 5));
        return <circle key={i} cx={px} cy={py} r={r * 3} fill={`url(#${id})`} opacity={op} />;
      })}
    </g>
  );
};

// Spark burst (hammer strike, welding): streaks with gravity.
export const Sparks: React.FC<{
  x: number;
  y: number;
  t0: number;
  count?: number;
  speed?: number;
  gravity?: number;
  life?: number;
  angle?: number; // centre direction (rad), default up
  spread?: number;
  seed?: string;
  color?: string;
  width?: number;
}> = ({ x, y, t0, count = 40, speed = 18, gravity = 0.8, life = 18, angle = -Math.PI / 2, spread = Math.PI * 0.9, seed = "spk", color, width = 2.5 }) => {
  const f = useCurrentFrame();
  const pal = usePalette();
  const s = seedOf(seed);
  const c = tok(pal, color, pal.flame);
  const a = f - t0;
  if (a < 0 || a > life * 1.6) return null;
  return (
    <g strokeLinecap="round">
      {Array.from({ length: count }, (_, i) => {
        const l = life * (0.5 + hash(i, s, 1));
        if (a > l) return null;
        const ang = angle + (hash(i, s, 2) - 0.5) * spread;
        const v = speed * (0.35 + hash(i, s, 3));
        const pos = (t: number): [number, number] => [x + Math.cos(ang) * v * t * (1 - t / (l * 2.5)), y + Math.sin(ang) * v * t + 0.5 * gravity * t * t];
        const [x1, y1] = pos(Math.max(0, a - 2.5));
        const [x2, y2] = pos(a);
        const op = 1 - a / l;
        return (
          <g key={i} opacity={op}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={width * 2.8} opacity={0.3} />
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={pal.glow} strokeWidth={width} />
          </g>
        );
      })}
    </g>
  );
};

export type Burst = { x: number; y: number; t0: number; r?: number; color?: string; count?: number; launchFrom?: number };

// Fireworks: optional rising shell, then a radial burst of trailing sparks.
export const Fireworks: React.FC<{ bursts: Burst[]; seed?: string; life?: number }> = ({ bursts, seed = "fw", life = 42 }) => {
  const f = useCurrentFrame();
  const pal = usePalette();
  const id = useUid("fwg");
  const s = seedOf(seed);
  return (
    <g strokeLinecap="round">
      <defs>
        <radialGradient id={id}>
          <stop offset="0" stopColor="#fff" stopOpacity={0.9} />
          <stop offset="0.3" stopColor={pal.glow} stopOpacity={0.5} />
          <stop offset="1" stopColor={pal.glow} stopOpacity={0} />
        </radialGradient>
      </defs>
      {bursts.map((b, bi) => {
        const a = f - b.t0;
        const col = tok(pal, b.color, pal.gold);
        const R = b.r ?? 220;
        const n = b.count ?? 44;
        const nodes: React.ReactNode[] = [];
        if (b.launchFrom !== undefined && a < 0 && a > -14) {
          const lt = (a + 14) / 14;
          const ly = b.launchFrom + (b.y - b.launchFrom) * (1 - Math.pow(1 - lt, 2));
          nodes.push(<line key="l" x1={b.x} y1={ly + 40} x2={b.x} y2={ly} stroke={col} strokeWidth={3} opacity={0.8} />);
        }
        if (a >= 0 && a <= life) {
          const tau = 7;
          const fl = clamp(1 - a / 8);
          if (fl > 0) nodes.push(<circle key="fl" cx={b.x} cy={b.y} r={R * 0.9} fill={`url(#${id})`} opacity={fl} />);
          for (let i = 0; i < n; i++) {
            const ang = (i / n) * TAU + hash(i, bi, s) * 0.2;
            const v = R * (0.75 + hash(i, bi, s + 1) * 0.3);
            const pos = (t: number): [number, number] => {
              const k = 1 - Math.exp(-t / tau);
              return [b.x + Math.cos(ang) * v * k, b.y + Math.sin(ang) * v * k + 0.09 * t * t];
            };
            const [x1, y1] = pos(Math.max(0, a - 5));
            const [x2, y2] = pos(a);
            const op = Math.pow(1 - a / life, 1.3) * (a > life * 0.6 ? 0.5 + 0.5 * Math.sin(a * 2 + i) : 1);
            nodes.push(
              <g key={i} opacity={op}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={col} strokeWidth={6} opacity={0.35} />
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={col} strokeWidth={2.6} />
                <circle cx={x2} cy={y2} r={2.6} fill="#fff" />
              </g>,
            );
          }
        }
        return <g key={bi}>{nodes}</g>;
      })}
    </g>
  );
};
