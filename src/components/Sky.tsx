// Engraved skies: horizontal-line skies, drifting cumulus, sun and rays,
// birds, the Moon and stars.
import { useCurrentFrame } from "remotion";
import { memo, TAU } from "../lib/math";
import { usePalette } from "../lib/palette";
import { hash, noise1, rng, seedOf } from "../lib/random";
import { engrave, hatch, Pt, polyD, rectP, smoothD, tones } from "../lib/engrave";
import { useUid } from "../lib/uid";
import { tok } from "./InkDraw";

// Classic engraver's sky: horizontal lines, denser toward `darkAt`.
export const EngravedSky: React.FC<{
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  spacing?: number;
  dark?: number; // overall darkness 0..1
  darkTop?: boolean;
  seed?: string;
  wash?: string;
  washOp?: number;
  width?: number;
  cross?: boolean;
}> = ({ x = -300, y = -300, w = 2520, h = 1000, spacing = 7, dark = 0.5, darkTop = true, seed = "sky", wash, washOp = 0.5, width = 1.1, cross = false }) => {
  const pal = usePalette();
  const id = useUid("skyg");
  const key = `sky:${x}:${y}:${w}:${h}:${spacing}:${dark}:${darkTop}:${seed}:${cross}`;
  const d = memo(key, () => {
    const tone = (px: number, py: number) => {
      const t = (py - y) / h;
      const g = darkTop ? 1 - t : t;
      return g * (0.4 + dark) + noise1(px / 300, seedOf(seed)) * 0.08 + noise1(px / 90 + py / 50, 3) * 0.04;
    };
    const base = hatch([rectP(x, y, w, h)], { angle: 0, spacing, tone, threshold: 0.18, step: 8, seed, trim: 4, wobble: 0.6 });
    const second = cross ? hatch([rectP(x, y, w, h)], { angle: 0, spacing: spacing * 0.5, tone, threshold: 0.75, step: 8, seed: seed + "b", trim: 6 }) : "";
    return base + second;
  });
  // In full colour the sky becomes a rich gradient (deep blue into sky blue,
  // or into dawn orange); in sepia it stays a light wash over the paper.
  const color = pal.mode === "color";
  const top = color ? (wash === "night" ? pal.night : pal.skyDeep) : tok(pal, wash, pal.skyDeep);
  const bottom = color ? (wash === "dawn" ? pal.dawn : wash === "night" ? pal.skyDeep : pal.sky) : tok(pal, wash, pal.sky);
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1={darkTop ? "0" : "1"} x2="0" y2={darkTop ? "1" : "0"}>
          <stop offset="0" stopColor={top} stopOpacity={color ? 0.95 : washOp} />
          <stop offset="1" stopColor={bottom} stopOpacity={color ? 0.9 : washOp * 0.2} />
        </linearGradient>
      </defs>
      <rect x={x} y={y} width={w} height={h} fill={`url(#${id})`} />
      <path d={d} fill="none" stroke={pal.ink} strokeWidth={width} opacity={color ? 0.3 : 0.55} strokeLinecap="round" />
    </g>
  );
};

type CloudGeo = { outline: string; hatch: string[]; fill: string; w: number; h: number };

const buildCloud = (seed: string, w: number, h: number): CloudGeo => {
  const r = rng(seed);
  const nb = 6 + Math.floor(r() * 4);
  const bumps = Array.from({ length: nb }, (_, i) => {
    const t = (i + 0.5) / nb;
    const cx = (t - 0.5) * w * 0.9 + (r() - 0.5) * w * 0.08;
    const rad = h * (0.35 + 0.55 * Math.sin(t * Math.PI) * (0.6 + r() * 0.5));
    return { cx, rad };
  });
  const top: Pt[] = [];
  const bottom = h * 0.12;
  for (let px = -w / 2; px <= w / 2; px += w / 60) {
    let yt = bottom;
    for (const b of bumps) {
      const dx = px - b.cx;
      if (Math.abs(dx) < b.rad) yt = Math.min(yt, bottom - h * 0.1 - Math.sqrt(b.rad * b.rad - dx * dx));
    }
    top.push([px, yt]);
  }
  const bot: Pt[] = [];
  for (let px = w / 2; px >= -w / 2; px -= w / 20) bot.push([px, bottom + Math.sin((px / w) * Math.PI) * 4 + r() * 3]);
  const poly = [...top, ...bot];
  const tone = (px: number, py: number) => {
    const t = (py - (bottom - h)) / h;
    return 0.1 + t * 0.9 + noise1(px / 60, 4) * 0.1;
  };
  const layers = engrave([poly], tone, { angle: 8, spacing: 5.5, levels: [0.45, 0.78], angles: [4, -12], seed, width: 1 });
  // inner billow contours
  const inner = bumps
    .filter((_, i) => i % 2 === 1)
    .map((b) => {
      const a0 = Math.PI * 1.05;
      const a1 = Math.PI * 1.7;
      const pts: Pt[] = [];
      for (let k = 0; k <= 8; k++) {
        const a = a0 + ((a1 - a0) * k) / 8;
        pts.push([b.cx + Math.cos(a) * b.rad * 0.75, bottom - h * 0.1 + Math.sin(a) * b.rad * 0.75 + b.rad * 0.25]);
      }
      return smoothD(pts);
    })
    .join("");
  return { outline: smoothD(poly, true, 0.4), hatch: [...layers.map((l) => l.d), inner], fill: polyD(poly), w, h };
};

export type CloudSpec = { x: number; y: number; w: number; h: number; seed?: string; speed?: number };

// Drifting cumulus clouds with engraved underside shading.
export const Clouds: React.FC<{ clouds: CloudSpec[]; speed?: number; span?: [number, number]; wash?: string; op?: number }> = ({
  clouds,
  speed = 0.6,
  span = [-700, 2620],
  wash,
  op = 1,
}) => {
  const f = useCurrentFrame();
  const pal = usePalette();
  const L = span[1] - span[0];
  return (
    <g opacity={op}>
      {clouds.map((c, i) => {
        const g = memo(`cloud:${c.seed ?? i}:${c.w}:${c.h}`, () => buildCloud(c.seed ?? `c${i}`, c.w, c.h));
        const sp = c.speed ?? speed;
        const x = span[0] + ((((c.x - span[0] + f * sp) % L) + L) % L);
        const bob = Math.sin(f / 60 + i) * 4;
        return (
          <g key={i} transform={`translate(${x} ${c.y + bob})`}>
            <path d={g.fill} fill={tok(pal, wash, pal.paper)} opacity={0.92} />
            <path d={g.hatch.join("")} fill="none" stroke={pal.ink} strokeWidth={1} opacity={0.6} />
            <path d={g.outline} fill="none" stroke={pal.ink} strokeWidth={2} opacity={0.85} />
          </g>
        );
      })}
    </g>
  );
};

// Sun disc with sweeping rays. `rise` 0..1 lifts it; rays rotate slowly.
export const Sun: React.FC<{ x: number; y: number; r?: number; rays?: number; rayLen?: number; spin?: number; glow?: number; op?: number }> = ({
  x,
  y,
  r = 90,
  rays = 28,
  rayLen = 1400,
  spin = 0.12,
  glow = 1,
  op = 1,
}) => {
  const f = useCurrentFrame();
  const pal = usePalette();
  const id = useUid("sun");
  const rot = f * spin;
  return (
    <g opacity={op}>
      <defs>
        <radialGradient id={id}>
          <stop offset="0" stopColor={pal.glow} stopOpacity={0.95 * glow} />
          <stop offset="0.25" stopColor={pal.sun} stopOpacity={0.55 * glow} />
          <stop offset="1" stopColor={pal.dawn} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={x} cy={y} r={r * 6} fill={`url(#${id})`} />
      <g transform={`rotate(${rot} ${x} ${y})`}>
        {Array.from({ length: rays }, (_, i) => {
          const a = (i / rays) * TAU;
          const w = 0.035 + hash(i, 5) * 0.03;
          const len = rayLen * (0.6 + hash(i, 6) * 0.5) * (0.85 + 0.15 * Math.sin(f / 20 + i));
          const p1: Pt = [x + Math.cos(a - w) * r * 1.3, y + Math.sin(a - w) * r * 1.3];
          const p2: Pt = [x + Math.cos(a) * len, y + Math.sin(a) * len];
          const p3: Pt = [x + Math.cos(a + w) * r * 1.3, y + Math.sin(a + w) * r * 1.3];
          return <path key={i} d={polyD([p1, p2, p3])} fill={pal.sun} opacity={i % 2 ? 0.16 : 0.28} />;
        })}
      </g>
      <circle cx={x} cy={y} r={r} fill={pal.sun} stroke={pal.ink} strokeWidth={2.5} />
      {[0.72, 0.5, 0.3].map((k, i) => (
        <circle key={i} cx={x} cy={y} r={r * k} fill="none" stroke={pal.ink} strokeWidth={1} opacity={0.35} />
      ))}
    </g>
  );
};

// A flock of birds flapping along a path across the sky.
export const Birds: React.FC<{
  count?: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  start?: number;
  dur?: number;
  size?: number;
  seed?: string;
}> = ({ count = 7, x0, y0, x1, y1, start = 0, dur = 120, size = 22, seed = "birds" }) => {
  const f = useCurrentFrame();
  const pal = usePalette();
  const s = seedOf(seed);
  return (
    <g fill="none" stroke={pal.ink} strokeLinecap="round" strokeLinejoin="round">
      {Array.from({ length: count }, (_, i) => {
        const t = (f - start - hash(i, s) * 20) / dur;
        if (t < 0 || t > 1.2) return null;
        const ox = (hash(i, s, 1) - 0.5) * 260;
        const oy = (hash(i, s, 2) - 0.5) * 140;
        const px = x0 + (x1 - x0) * t + ox;
        const py = y0 + (y1 - y0) * t + oy + Math.sin(t * 6 + i) * 12;
        const flap = Math.sin(f * 0.55 + i * 1.7);
        const sz = size * (0.7 + hash(i, s, 3) * 0.6);
        const wy = -flap * sz * 0.55;
        const d = `M${px - sz} ${py + wy}Q${px - sz * 0.45} ${py + wy * 0.3 - sz * 0.15} ${px} ${py}Q${px + sz * 0.45} ${py + wy * 0.3 - sz * 0.15} ${px + sz} ${py + wy}`;
        return <path key={i} d={d} strokeWidth={2.4} />;
      })}
    </g>
  );
};

// Engraved Moon: disc, maria wash, craters and hatched terminator.
export const Moon: React.FC<{ x: number; y: number; r: number; glow?: number; seed?: string }> = ({ x, y, r, glow = 1, seed = "moon" }) => {
  const pal = usePalette();
  const id = useUid("mg");
  const geo = memo(`moon:${seed}`, () => {
    const rr = rng(seed);
    const craters = Array.from({ length: 22 }, () => {
      const a = rr() * TAU;
      const d = Math.sqrt(rr()) * 0.85;
      return { x: Math.cos(a) * d, y: Math.sin(a) * d, r: 0.03 + rr() * rr() * 0.14 };
    });
    const maria = Array.from({ length: 5 }, () => ({ x: (rr() - 0.5) * 1.1, y: (rr() - 0.5) * 1.1, r: 0.18 + rr() * 0.22 }));
    const disc = Array.from({ length: 64 }, (_, k) => [Math.cos((k / 64) * TAU), Math.sin((k / 64) * TAU)] as Pt);
    const shade = engrave([disc.map(([a, b]) => [a * 100, b * 100] as Pt)], tones.sphere(0, 0, 100, -0.6, -0.4), {
      angle: 110,
      spacing: 4.5,
      levels: [0.55, 0.8],
      seed,
      width: 1,
    });
    return { craters, maria, shade };
  });
  const k = r / 100;
  return (
    <g>
      <defs>
        <radialGradient id={id}>
          <stop offset="0.45" stopColor={pal.moon} stopOpacity={0.5 * glow} />
          <stop offset="1" stopColor={pal.moon} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={x} cy={y} r={r * 2.2} fill={`url(#${id})`} />
      <circle cx={x} cy={y} r={r} fill={pal.moon} />
      {geo.maria.map((m, i) => (
        <circle key={`m${i}`} cx={x + m.x * r * 0.7} cy={y + m.y * r * 0.7} r={m.r * r} fill={pal.inkSoft} opacity={0.14} />
      ))}
      <g transform={`translate(${x} ${y}) scale(${k})`}>
        {geo.shade.map((l, i) => (
          <path key={i} d={l.d} fill="none" stroke={pal.ink} strokeWidth={l.w / k} opacity={0.5} />
        ))}
      </g>
      {geo.craters.map((c, i) => (
        <g key={i}>
          <circle cx={x + c.x * r} cy={y + c.y * r} r={c.r * r} fill="none" stroke={pal.ink} strokeWidth={1.4} opacity={0.55} />
          <path
            d={`M${x + c.x * r - c.r * r * 0.8} ${y + c.y * r + c.r * r * 0.3}A${c.r * r} ${c.r * r} 0 0 0 ${x + c.x * r + c.r * r * 0.5} ${y + c.y * r + c.r * r * 0.8}`}
            fill="none"
            stroke={pal.ink}
            strokeWidth={2.2}
            opacity={0.45}
          />
        </g>
      ))}
      <circle cx={x} cy={y} r={r} fill="none" stroke={pal.ink} strokeWidth={2.5} />
    </g>
  );
};

export const Stars: React.FC<{ count?: number; x?: number; y?: number; w?: number; h?: number; seed?: string; size?: number; color?: string }> = ({
  count = 120,
  x = -200,
  y = -200,
  w = 2320,
  h = 1100,
  seed = "stars",
  size = 2.2,
  color,
}) => {
  const f = useCurrentFrame();
  const pal = usePalette();
  const s = seedOf(seed);
  const c = tok(pal, color, pal.foam);
  return (
    <g>
      {Array.from({ length: count }, (_, i) => {
        const tw = 0.55 + 0.45 * Math.sin(f / (4 + hash(i, s) * 9) + i * 3);
        const sz = size * (0.4 + hash(i, s, 3) * hash(i, s, 4) * 2.2);
        const px = x + hash(i, s, 1) * w;
        const py = y + hash(i, s, 2) * h;
        return (
          <g key={i} opacity={tw}>
            <circle cx={px} cy={py} r={sz} fill={c} />
            {sz > 2.6 && <path d={`M${px - sz * 3} ${py}H${px + sz * 3}M${px} ${py - sz * 3}V${py + sz * 3}`} stroke={c} strokeWidth={0.8} />}
          </g>
        );
      })}
    </g>
  );
};
