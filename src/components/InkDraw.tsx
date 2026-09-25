import { useCurrentFrame } from "remotion";
import { clamp, easeInOut, easeOut, ramp } from "../lib/math";
import { Palette, usePalette } from "../lib/palette";

export type InkItem = {
  d: string;
  kind?: "line" | "hatch" | "fill";
  w?: number; // stroke width
  color?: string; // palette token or CSS colour
  fill?: string; // palette token or CSS colour (fill items)
  op?: number; // max opacity
  order?: number; // 0..1 drawing order for lines
  dash?: string; // e.g. dotted trails
  cap?: "round" | "butt" | "square";
  noBleed?: boolean;
};

export const tok = (pal: Palette, c: string | undefined, fallback: string) => {
  if (!c) return fallback;
  return (pal as unknown as Record<string, string>)[c] ?? c;
};

// Split multi-subpath line data into single strokes so each draws on its own.
export const splitSubpaths = (d: string) =>
  d
    .split(/(?=M)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1);

export type InkTiming = {
  start?: number; // frame lines start drawing
  dur?: number; // frames for all lines to draw
  hatchAt?: number; // frames after start
  hatchDur?: number;
  washAt?: number;
  washDur?: number;
  overlap?: number; // fraction of the timeline each stroke spends drawing
};

// Line art that draws itself stroke by stroke, then gains hatching and washes.
export const InkDraw: React.FC<
  InkTiming & {
    items: InkItem[];
    progress?: number; // override line progress 0..1
    hatchProgress?: number;
    washProgress?: number;
    split?: boolean;
  }
> = ({ items, start = 0, dur = 30, hatchAt, hatchDur = 14, washAt, washDur = 16, overlap = 0.35, progress, hatchProgress, washProgress, split = true }) => {
  const f = useCurrentFrame();
  const pal = usePalette();
  const P = progress ?? ramp(f, start, start + dur, easeInOut);
  const hA = start + (hatchAt ?? dur * 0.6);
  const wA = start + (washAt ?? dur * 0.8);
  const H = hatchProgress ?? ramp(f, hA, hA + hatchDur, easeOut);
  const W = washProgress ?? ramp(f, wA, wA + washDur, easeOut);
  const blueprint = pal.mode === "blueprint";

  const fills: React.ReactNode[] = [];
  const hatches: React.ReactNode[] = [];
  const lines: React.ReactNode[] = [];
  const lineItems: InkItem[] = [];
  for (const it of items) {
    const kind = it.kind ?? "line";
    if (kind === "line") {
      if (split && !it.dash) {
        const parts = splitSubpaths(it.d);
        parts.forEach((d, i) => lineItems.push({ ...it, d, order: it.order !== undefined ? it.order + (i / parts.length) * 0.05 : undefined }));
      } else lineItems.push(it);
    }
  }
  items.forEach((it, i) => {
    const kind = it.kind ?? "line";
    if (kind === "fill" && W > 0 && !blueprint) {
      fills.push(<path key={`f${i}`} d={it.d} fill={tok(pal, it.fill, pal.stone)} opacity={(it.op ?? 1) * W} />);
    }
    if (kind === "hatch" && H > 0) {
      hatches.push(
        <path
          key={`h${i}`}
          d={it.d}
          fill="none"
          stroke={tok(pal, it.color, pal.ink)}
          strokeWidth={it.w ?? 1}
          strokeLinecap="round"
          opacity={(it.op ?? 0.85) * H * (blueprint ? 0.45 : 1)}
        />,
      );
    }
  });
  const n = lineItems.length;
  lineItems.forEach((it, i) => {
    const order = it.order ?? i / Math.max(1, n);
    const p = clamp((P - order * (1 - overlap)) / overlap);
    if (p <= 0) return;
    const stroke = tok(pal, it.color, pal.ink);
    const w = it.w ?? 2;
    const drawing = p < 1;
    const dashProps = it.dash
      ? { strokeDasharray: it.dash }
      : drawing
        ? { pathLength: 1, strokeDasharray: "1 1", strokeDashoffset: 1 - p }
        : {};
    if (!it.noBleed && !blueprint)
      lines.push(
        <path
          key={`b${i}`}
          d={it.d}
          fill="none"
          stroke={stroke}
          strokeWidth={w * 2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.09 * (it.op ?? 1)}
          {...(it.dash ? {} : dashProps)}
        />,
      );
    lines.push(
      <path
        key={`l${i}`}
        d={it.d}
        fill="none"
        stroke={stroke}
        strokeWidth={w}
        strokeLinecap={it.cap ?? "round"}
        strokeLinejoin="round"
        opacity={(it.op ?? 1) * (it.dash ? p : 1)}
        {...dashProps}
      />,
    );
  });
  return (
    <g>
      <g>{fills}</g>
      <g>{hatches}</g>
      <g>{lines}</g>
    </g>
  );
};

// Dotted/dashed line (trails, routes) revealed progressively along its length.
export const Trail: React.FC<{
  d: string;
  progress: number;
  w?: number;
  dash?: string;
  color?: string;
  op?: number;
  id: string;
}> = ({ d, progress, w = 4, dash = "0.1 12", color, op = 1, id }) => {
  const pal = usePalette();
  if (progress <= 0) return null;
  return (
    <g>
      <mask id={id} maskUnits="userSpaceOnUse" x={-5000} y={-5000} width={12000} height={12000}>
        <path
          d={d}
          fill="none"
          stroke="#fff"
          strokeWidth={w * 6}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray="1 1"
          strokeDashoffset={1 - clamp(progress)}
        />
      </mask>
      <path
        d={d}
        fill="none"
        stroke={tok(pal, color, pal.ink)}
        strokeWidth={w}
        strokeLinecap="round"
        strokeDasharray={dash}
        opacity={op}
        mask={`url(#${id})`}
      />
    </g>
  );
};
