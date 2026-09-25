// Sequences shots on beat-snapped cuts with animated transitions:
// ink wipe, page burn, line morph, whip pan (motion blur), flash and punch.
import { AbsoluteFill, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, easeIn, easeInOut, easeOut, TAU } from "../lib/math";
import { COLOR, Palette, PaletteContext, SEPIA } from "../lib/palette";
import { hash, noise1 } from "../lib/random";
import { Pt, smoothD } from "../lib/engrave";
import { useUid } from "../lib/uid";
import { PaperOverlay } from "./Parchment";

export type TransitionKind = "cut" | "whip" | "whipUp" | "whipDown" | "ink" | "burn" | "morph" | "flash" | "punch";

export type ShotSpec = {
  from: number;
  dur: number;
  el: React.ReactNode;
  enter?: TransitionKind;
  tdur?: number;
  origin?: [number, number];
  palette?: Palette | "color" | "sepia";
  overlay?: { texture?: number; vignette?: number; grain?: number };
  name?: string;
};

const DEFAULT_TDUR: Record<TransitionKind, number> = {
  cut: 0,
  whip: 5,
  whipUp: 5,
  whipDown: 5,
  ink: 12,
  burn: 16,
  morph: 12,
  flash: 0,
  punch: 0,
};

const WHIP_OUT = 4;

// Noisy closed blob around (cx, cy). `lumps` = noise cells around the rim,
// `fine` adds ragged detail (burnt/torn edges).
export const blobD = (cx: number, cy: number, r: number, seed: number, rough = 0.14, lumps = 5, n = 72, fine = 0) => {
  const pts: Pt[] = [];
  for (let k = 0; k < n; k++) {
    const t = k / n;
    const a = t * TAU;
    // wrap-safe noise: blend two samples so the seam matches
    const nz = (freq: number, sd: number) => noise1(t * freq + sd, sd) * (1 - t) + noise1((t - 1) * freq + sd, sd) * t;
    const rr = r * (1 + rough * nz(lumps, seed) + fine * nz(lumps * 6, seed + 9));
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  return smoothD(pts, true);
};

const inkShapes = (p: number, o: Pt, seed: number) => {
  const shapes: string[] = [];
  const R = easeInOut(p) * 2500;
  if (R > 1) shapes.push(blobD(o[0], o[1], R, seed, 0.18, 6, 72, 0.03));
  for (let i = 0; i < 6; i++) {
    const d = clamp((p - 0.05 * i) / 0.7);
    if (d <= 0) continue;
    const ang = hash(i, seed) * TAU;
    const dist = 250 + hash(i, seed, 2) * 500;
    shapes.push(blobD(o[0] + Math.cos(ang) * dist, o[1] + Math.sin(ang) * dist * 0.6, easeOut(d) * (180 + hash(i, seed, 3) * 400), seed + i * 13, 0.22, 5, 48, 0.04));
  }
  return shapes;
};

const burnShape = (p: number, o: Pt, seed: number) => blobD(o[0], o[1], easeIn(p) * 2600 + 5, seed, 0.34, 6, 160, 0.09);

const morphEdge = (p: number, f: number): Pt[] => {
  const X = -150 + easeInOut(p) * 2250;
  const pts: Pt[] = [];
  for (let y = -40; y <= 1120; y += 40) pts.push([X + Math.sin(y / 70 + f * 0.4) * 30 + noise1(y / 60, 7) * 25, y]);
  return pts;
};

export const resolvePalette = (p: ShotSpec["palette"]) => (p === "color" ? COLOR : p === "sepia" || !p ? SEPIA : p);

export const Shots: React.FC<{ shots: ShotSpec[]; overlay?: boolean; seedBase?: number }> = ({ shots, overlay = true, seedBase = 0 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const uid = useUid("shots");
  let topIndex = 0;
  const layers: React.ReactNode[] = [];
  const edges: React.ReactNode[] = [];
  shots.forEach((s, i) => {
    const next = shots[i + 1];
    const kind = s.enter ?? "cut";
    const td = s.tdur ?? DEFAULT_TDUR[kind];
    const nextKind = next?.enter ?? "cut";
    const nextTd = next ? next.tdur ?? DEFAULT_TDUR[nextKind] : 0;
    const overlapsNext = next && (nextKind === "ink" || nextKind === "burn" || nextKind === "morph");
    const end = next ? next.from + (overlapsNext ? nextTd : 0) : Infinity;
    if (f < s.from || f >= end) return;
    topIndex = i;
    const a = f - s.from;
    const style: React.CSSProperties = {};
    let blur = 0;
    let blurDir: "x" | "y" = "x";
    // entering
    const o: Pt = s.origin ?? [hash(i, 11) * 1400 + 260, hash(i, 12) * 600 + 240];
    const seed = i * 31 + seedBase;
    if (a < td) {
      const p = clamp(a / td);
      if (kind === "whip" || kind === "whipUp" || kind === "whipDown") {
        const q = easeOut(p);
        const dist = (1 - q) * 1100;
        blur = (1 - q) * 55;
        if (kind === "whip") style.transform = `translateX(${dist}px)`;
        else {
          blurDir = "y";
          style.transform = `translateY(${kind === "whipUp" ? -dist : dist}px)`;
        }
      } else if (kind === "ink") {
        // the new shot opens up inside the ink that flooded the old one
        const p2 = clamp((p - 0.3) / 0.7);
        const rev = inkShapes(p2, o, seed + 5);
        style.clipPath = p2 > 0 ? `path('${rev.join(" ")}')` : "path('M0 0Z')";
      } else if (kind === "burn") {
        const d = burnShape(p, o, seed);
        style.clipPath = `path('${d}')`;
        edges.push(
          <g key={`e${i}`} fill="none" strokeLinejoin="round">
            <path d={d} stroke="#241206" strokeWidth={46} opacity={0.75} />
            <path d={d} stroke="#6b2d0a" strokeWidth={22} opacity={0.9} />
            <path d={d} stroke="#ff8a2a" strokeWidth={9} opacity={0.95} />
            <path d={d} stroke="#ffe39a" strokeWidth={3} />
          </g>,
        );
      } else if (kind === "morph") {
        const e = morphEdge(p, f);
        const poly = [[-200, -100] as Pt, ...e, [-200, 1200] as Pt];
        style.clipPath = `path('${smoothD(poly, true, 0.2)}')`;
        const smears: React.ReactNode[] = [];
        for (let k = 0; k < 26; k++) {
          const yy = hash(k, seed) * 1080;
          const ex = e[Math.min(e.length - 1, Math.round((yy + 40) / 40))][0];
          const len = 40 + hash(k, seed, 2) * 220;
          smears.push(<line key={k} x1={ex} y1={yy} x2={ex + len * (1 - p * 0.5)} y2={yy + (hash(k, seed, 3) - 0.5) * 20} stroke="#1d1208" strokeWidth={1.5 + hash(k, seed, 4) * 3} opacity={0.6} />);
        }
        edges.push(
          <g key={`e${i}`} opacity={Math.sin(p * Math.PI)}>
            <path d={smoothD(e)} fill="none" stroke="#1d1208" strokeWidth={5} />
            {smears}
          </g>,
        );
      } else if (kind === "punch") {
        const sp = spring({ frame: a, fps, config: { damping: 14, stiffness: 240, mass: 0.6 } });
        style.transform = `scale(${1.16 - 0.16 * sp})`;
      }
    }
    if (a < 8 && kind === "flash") {
      edges.push(<rect key={`fl${i}`} x={0} y={0} width={1920} height={1080} fill="#fffaf0" opacity={Math.pow(1 - a / 8, 1.5)} />);
    }
    if (a < 5 && kind === "punch") {
      edges.push(<rect key={`pf${i}`} x={0} y={0} width={1920} height={1080} fill="#fffaf0" opacity={0.5 * (1 - a / 5)} />);
    }
    // exiting by whip
    if (next && (nextKind === "whip" || nextKind === "whipUp" || nextKind === "whipDown")) {
      const b = f - (next.from - WHIP_OUT);
      if (b >= 0) {
        const q = easeIn(clamp(b / WHIP_OUT));
        const dist = q * 1100;
        blur = Math.max(blur, q * 55);
        if (nextKind === "whip") style.transform = `translateX(${-dist}px)`;
        else {
          blurDir = "y";
          style.transform = `translateY(${nextKind === "whipUp" ? dist : -dist}px)`;
        }
      }
    }
    let inkFlood: React.ReactNode = null;
    if (next && nextKind === "ink" && f >= next.from) {
      const p1 = clamp((f - next.from) / (nextTd * 0.55));
      const no: Pt = next.origin ?? [hash(i + 1, 11) * 1400 + 260, hash(i + 1, 12) * 600 + 240];
      inkFlood = (
        <AbsoluteFill>
          <svg width={1920} height={1080}>
            <path d={inkShapes(p1, no, (i + 1) * 31 + seedBase).join(" ")} fill="#150c05" />
          </svg>
        </AbsoluteFill>
      );
    }
    const fid = `${uid}b${i}`;
    if (blur > 0.5) style.filter = `url(#${fid})`;
    layers.push(
      <Sequence key={i} from={s.from} layout="none" name={s.name ?? `shot ${i}`}>
        {blur > 0.5 && (
          <svg width={0} height={0} style={{ position: "absolute" }}>
            <filter id={fid} x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation={blurDir === "x" ? `${blur} 0` : `0 ${blur}`} />
            </filter>
          </svg>
        )}
        <PaletteContext.Provider value={resolvePalette(s.palette)}>
          <AbsoluteFill style={{ ...style, overflow: "hidden" }}>
            {s.el}
            {inkFlood}
          </AbsoluteFill>
        </PaletteContext.Provider>
      </Sequence>,
    );
  });
  const top = shots[topIndex];
  return (
    <AbsoluteFill style={{ backgroundColor: "#0b0704", overflow: "hidden" }}>
      {layers}
      {overlay && top && <PaperOverlay seed={topIndex + seedBase} {...(top.palette === "color" ? { texture: 0.55, grain: 0.1 } : {})} {...top.overlay} />}
      <AbsoluteFill>
        <svg width={1920} height={1080}>{edges}</svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
