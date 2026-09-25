// 9. THE HYPE — fastest cuts, one shot per beat, all in full colour: Earthrise,
// the Wall falls, circuits, computers, the network map, the smartphone, jets,
// Mount Rushmore, the Grand Canyon, fireworks.
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Camera, Layer } from "../components/Camera";
import { InkDraw } from "../components/InkDraw";
import { Paper } from "../components/Parchment";
import { Dust, Fireworks, Smoke, Sparks, Burst } from "../components/Particles";
import { Birds, Clouds, EngravedSky, Stars, Sun } from "../components/Sky";
import { InkSea } from "../components/Water";
import { MapBase } from "../components/MapScene";
import { Quote } from "../components/WordPop";
import { QUOTES } from "../quotes";
import { circuitGeo, computerItems, jetD, mesaLayer, Phone3D, rushmoreItems, skylineGeo, WALL_BOT, WALL_TOP, wallItems } from "../art/modern";
import { earthItems } from "../art/saturn";
import { pine } from "../art/west";
import { F, HT, L } from "../art/kit";
import { ellipseP, hatch, polyD, Pt, smoothD, stipple } from "../lib/engrave";
import { clamp, easeInOut, easeOut, lerp, memo, ramp, TAU } from "../lib/math";
import { usePalette } from "../lib/palette";
import { hash, rng } from "../lib/random";
import { getUSMap, PLACES } from "../lib/usmap";
import { sceneClock } from "../timeline";
import type { SceneDef } from "./types";

const c = sceneClock("hype");
const Instant = { start: -30, dur: 2, hatchAt: 0, washAt: 0, washDur: 1 };

// 1. Earth rising over the lunar horizon
const EarthriseShot: React.FC = () => {
  const f = useCurrentFrame();
  const pal = usePalette();
  const earth = memo("hy:earth", () => earthItems(170));
  const limb = memo("hy:limb", () => {
    const disc = ellipseP(960, 3300, 2600, 2520, 160);
    const r = rng("limb");
    const craters: string[] = [];
    for (let i = 0; i < 26; i++) {
      const x = r() * 2400 - 240;
      const y = 820 + r() * 300;
      const rx = 20 + r() * 90;
      craters.push(polyD(ellipseP(x, y, rx, rx * 0.22, 24)));
    }
    return [F(polyD(disc), "moon", 1), HT(hatch([disc], { angle: 0, spacing: 5, tone: (_, y) => 0.25 + (y - 780) / 700, threshold: 0.35, seed: "lmb" }), 1, 0.5), L(craters.join(""), 1.6), HT(stipple([disc], { count: 1500, seed: "lmbs", bbox: [-300, 760, 2220, 1100] }), 2, 0.5), L(polyD(disc), 3)];
  });
  const y = 900 - easeOut(clamp(f / 30)) * 260;
  return (
    <Camera keys={[{ f: 0, z: 1.1 }, { f: 30, z: 1.22, y: -20 }]} handheld={4} seed={91}>
      <Layer depth={0.05}>
        <rect x={-400} y={-400} width={2720} height={1900} fill={pal.space} />
        <Stars count={160} seed="erstars" />
      </Layer>
      <Layer depth={0.3}>
        <circle cx={1060} cy={y} r={260} fill={pal.sky} opacity={0.25} />
        <g transform={`translate(1060 ${y}) rotate(${f * 0.3})`}>
          <InkDraw items={earth} {...Instant} />
        </g>
      </Layer>
      <Layer depth={1}>
        <InkDraw items={limb} {...Instant} />
      </Layer>
    </Camera>
  );
};

// 2-3. The Berlin Wall cracks, then crumbles in falling chunks
const chunkGeo = () => {
  const r = rng("chunks");
  const cols = 4;
  const rows = 6;
  const x0 = 700;
  const x1 = 1220;
  const y0 = WALL_TOP;
  const y1 = WALL_BOT;
  const V: Pt[][] = [];
  for (let i = 0; i <= cols; i++) {
    V.push([]);
    for (let j = 0; j <= rows; j++) {
      const inner = i > 0 && i < cols && j > 0 && j < rows;
      V[i].push([x0 + ((x1 - x0) * i) / cols + (inner ? (r() - 0.5) * 60 : 0), y0 + ((y1 - y0) * j) / rows + (inner ? (r() - 0.5) * 50 : 0)]);
    }
  }
  const chunks: { pts: Pt[]; c: Pt; d: number; spin: number; vx: number }[] = [];
  for (let i = 0; i < cols; i++)
    for (let j = 0; j < rows; j++) {
      const pts = [V[i][j], V[i + 1][j], V[i + 1][j + 1], V[i][j + 1]];
      const cx = pts.reduce((a, p) => a + p[0], 0) / 4;
      const cy = pts.reduce((a, p) => a + p[1], 0) / 4;
      chunks.push({ pts, c: [cx, cy], d: (rows - j) * 1.5 + r() * 3, spin: (r() - 0.5) * 12, vx: (cx - 960) * 0.04 + (r() - 0.5) * 4 });
    }
  const hole = polyD([[x0, y0], [x1, y0], [x1, y1], [x0, y1]]);
  return { chunks, hole };
};

const WallShot: React.FC<{ crumble?: boolean }> = ({ crumble }) => {
  const f = useCurrentFrame();
  const pal = usePalette();
  const wall = memo("hy:wall", wallItems);
  const geo = memo("hy:chunks", chunkGeo);
  const crack = memo("hy:crack", () => {
    const r = rng("wcrack");
    const lines: string[] = [];
    for (let k = 0; k < 9; k++) {
      const a = (k / 9) * TAU + r() * 0.4;
      const pts: Pt[] = [[960, 600]];
      let x = 960;
      let y = 600;
      for (let s = 0; s < 7; s++) {
        x += Math.cos(a + (r() - 0.5) * 0.9) * (30 + r() * 40);
        y += Math.sin(a + (r() - 0.5) * 0.9) * (30 + r() * 40);
        pts.push([x, y]);
      }
      lines.push(polyD(pts, false));
    }
    return lines;
  });
  const cp = crumble ? 1 : ramp(f, 2, 12, easeOut);
  const people = Array.from({ length: 12 }, (_, i) => {
    const x = -100 + i * 190 + (i > 5 ? 520 : 0);
    const arm = Math.sin(f / 3 + i) * 20;
    return (
      <g key={i} fill={pal.ink} transform={`translate(${x} ${WALL_TOP}) translate(0 ${-Math.abs(Math.sin(f / 4 + i)) * 8})`}>
        <path d="M-14 0L-10 -70Q0 -84 10 -70L14 0Z" />
        <circle cx={0} cy={-90} r={13} />
        <path d={`M-8 -66L${-34} ${-110 - arm}M8 -66L${34} ${-110 + arm}`} stroke={pal.ink} strokeWidth={8} strokeLinecap="round" />
      </g>
    );
  });
  return (
    <Camera keys={[{ f: 0, z: crumble ? 1.05 : 1.12 }, { f: 30, z: crumble ? 1.18 : 1.2 }]} handheld={9} seed={92}>
      <Layer depth={0.1}>
        <Paper />
        <EngravedSky h={1400} y={-300} dark={0.3} wash="dawn" />
        <Sun x={960} y={560} r={80} rays={40} spin={1.5} rayLen={1600} />
      </Layer>
      <Layer depth={1}>
        {crumble ? (
          <g>
            <defs>
              <clipPath id="wallhole" clipRule="evenodd">
                <path d={`M-600 -600H2600V1600H-600Z${geo.hole}`} clipRule="evenodd" />
              </clipPath>
            </defs>
            <g clipPath="url(#wallhole)">
              <InkDraw items={wall} {...Instant} />
            </g>
            {geo.chunks.map((ch, i) => {
              const a = Math.max(0, f - ch.d);
              const dx = ch.vx * a;
              const dy = 0.9 * a * a;
              const rot = ch.spin * a;
              return (
                <g key={i} transform={`translate(${dx} ${dy}) rotate(${rot} ${ch.c[0]} ${ch.c[1]})`} opacity={a > 26 ? 0 : 1}>
                  <path d={polyD(ch.pts)} fill={pal.stone} stroke={pal.ink} strokeWidth={3} />
                  <path d={hatch([ch.pts], { angle: 45, spacing: 5, seed: `ch${i}` })} stroke={pal.ink} strokeWidth={1} opacity={0.6} />
                  <path d={smoothD(ch.pts.slice(0, 3))} stroke={i % 3 ? pal.flagRed : pal.gold} strokeWidth={9} fill="none" opacity={0.8} />
                </g>
              );
            })}
            <Smoke x={960} y={900} rate={1.2} life={36} size={140} vx={0} vy={-3} spread={8} shade={0.3} seed="wdust" />
          </g>
        ) : (
          <g>
            <InkDraw items={wall} {...Instant} />
            {crack.map((d, i) => (
              <path key={i} d={d} stroke={pal.ink} strokeWidth={7 - i * 0.3} fill="none" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - cp} strokeLinejoin="round" />
            ))}
            <Sparks x={960} y={600} t0={2} count={40} speed={20} spread={TAU} gravity={0.8} color="stone" seed="wsp" />
            <Smoke x={960} y={600} count={10} start={2} life={24} size={70} spread={8} shade={0.3} seed="wpuff" />
          </g>
        )}
        {people}
      </Layer>
      <Layer depth={1.4}>
        <Dust count={60} speed={2.5} color="stone" size={3} seed="wd" />
      </Layer>
    </Camera>
  );
};

// 4-5. Circuit board with light racing along the traces
const CircuitShot: React.FC<{ macro?: boolean }> = ({ macro }) => {
  const f = useCurrentFrame();
  const pal = usePalette();
  const g = memo("hy:pcb", () => circuitGeo());
  const board = (
    <svg width={1920} height={1080} style={{ overflow: "visible" }}>
      <rect x={-600} y={-600} width={3200} height={2400} fill="#0f4a2a" />
      <path d={hatch([[[-600, -600], [2600, -600], [2600, 1800], [-600, 1800]]], { angle: 45, spacing: 14, seed: "pcbh" })} stroke="#1c6b3e" strokeWidth={2} />
      <path d={g.traces.join("")} stroke={pal.gold} strokeWidth={6} fill="none" strokeLinejoin="round" opacity={0.85} />
      <path d={g.pads} fill={pal.gold} stroke={pal.ink} strokeWidth={1.5} />
      {g.chips.map((ch, i) => (
        <g key={i}>
          <rect x={ch.x} y={ch.y} width={ch.w} height={ch.h} rx={6} fill="#141414" stroke="#000" strokeWidth={3} />
          <path d={Array.from({ length: Math.floor(ch.w / 18) }, (_, k) => `M${ch.x + 10 + k * 18} ${ch.y}v-14M${ch.x + 10 + k * 18} ${ch.y + ch.h}v14`).join("")} stroke="#c9c9c9" strokeWidth={5} />
          <text x={ch.x + ch.w / 2} y={ch.y + ch.h / 2 + 8} textAnchor="middle" fontFamily="monospace" fontSize={22} fill="#bbb">
            {`USA-${1776 + i * 23}`}
          </text>
        </g>
      ))}
      {g.traces.map((d, i) => {
        const off = ((f * 0.045 + hash(i, 4)) % 1.2) - 0.1;
        return (
          <g key={i}>
            <path d={d} stroke={pal.glow} strokeWidth={22} fill="none" opacity={0.35} pathLength={1} strokeDasharray="0.1 2" strokeDashoffset={-off} strokeLinecap="round" />
            <path d={d} stroke="#ffffff" strokeWidth={7} fill="none" pathLength={1} strokeDasharray="0.06 2" strokeDashoffset={-off - 0.02} strokeLinecap="round" />
          </g>
        );
      })}
    </svg>
  );
  return (
    <Camera keys={[{ f: 0, z: macro ? 1.4 : 1.0, x: macro ? -80 : 0 }, { f: 15, z: macro ? 1.5 : 1.08, x: macro ? 80 : 30 }]} handheld={5} seed={93}>
      <Layer depth={1} html>
        <AbsoluteFill style={{ transform: macro ? "perspective(900px) rotateX(52deg) rotateZ(-18deg) scale(1.6)" : "rotate(-4deg) scale(1.1)" }}>{board}</AbsoluteFill>
      </Layer>
    </Camera>
  );
};

// 6. Vintage computers power on, screens flickering
const ComputersShot: React.FC = () => {
  const f = useCurrentFrame();
  const pal = usePalette();
  const comp = memo("hy:comp", computerItems);
  const units = [
    { x: 420, s: 0.7, t0: 6 },
    { x: 1500, s: 0.75, t0: 10 },
    { x: 960, s: 1.05, t0: 2 },
  ];
  return (
    <Camera keys={[{ f: 0, z: 1.05 }, { f: 30, z: 1.16, y: -10 }]} handheld={4} seed={94}>
      <Layer depth={0.2}>
        <rect x={-400} y={-400} width={2720} height={1900} fill={pal.night} />
        <path d={hatch([[[-400, -400], [2320, -400], [2320, 1500], [-400, 1500]]], { angle: 40, spacing: 7, seed: "room" })} stroke={pal.inkSoft} strokeWidth={1} opacity={0.5} />
      </Layer>
      <Layer depth={1}>
        <rect x={-400} y={880} width={2720} height={600} fill={pal.wood} />
        {units.map((u, i) => {
          const a = f - u.t0;
          const on = clamp(a / 6);
          const flick = a > 0 && a < 8 ? (hash(f, i) > 0.4 ? 1 : 0.3) : 1;
          const [sx0, sy0] = comp.screen[0];
          return (
            <g key={i} transform={`translate(${u.x} 900) scale(${u.s})`}>
              <InkDraw items={comp.items} {...Instant} />
              {a > 0 && (
                <g opacity={flick}>
                  <rect x={sx0 - 10} y={sy0} width={420} height={300 * on} fill="#0b2a12" transform={`translate(0 ${150 * (1 - on)})`} />
                  <rect x={sx0 - 10} y={sy0 + 150 - 2} width={420} height={4} fill="#b8ffb8" opacity={1 - on} />
                  {on >= 1 && (
                    <g fontFamily="monospace" fontSize={30} fill="#7dff7d">
                      <text x={sx0 + 10} y={sy0 + 50}>READY.</text>
                      <text x={sx0 + 10} y={sy0 + 95}>{`10 PRINT "USA"`}</text>
                      <text x={sx0 + 10} y={sy0 + 140}>RUN</text>
                      {Math.floor(f / 4) % 2 === 0 && <rect x={sx0 + 10} y={sy0 + 160} width={20} height={30} fill="#7dff7d" />}
                    </g>
                  )}
                  <circle cx={0} cy={-500} r={420} fill="#5cff7a" opacity={0.08 * on} />
                </g>
              )}
            </g>
          );
        })}
      </Layer>
      <Layer depth={1.4}>
        <Dust count={40} speed={0.6} color="glow" seed="cdust" />
      </Layer>
    </Camera>
  );
};

// 7. Glowing lines spreading across the U.S. map
const NETWORK: [keyof typeof PLACES, keyof typeof PLACES][] = [
  ["newYork", "chicago"], ["chicago", "denver"], ["denver", "sanFrancisco"], ["newYork", "washington"], ["washington", "atlanta"], ["atlanta", "houston"], ["houston", "losAngeles"],
  ["chicago", "minneapolis"], ["minneapolis", "seattle"], ["dallas", "phoenix"], ["phoenix", "losAngeles"], ["atlanta", "miami"], ["boston", "newYork"], ["chicago", "detroit"],
  ["kansasCity", "denver"], ["saltLake", "sanFrancisco"], ["nashville", "dallas"], ["seattle", "sanFrancisco"], ["denver", "saltLake"], ["kansasCity", "chicago"],
];

const NetMapShot: React.FC = () => {
  const f = useCurrentFrame();
  const pal = usePalette();
  const m = getUSMap();
  return (
    <Camera keys={[{ f: 0, z: 1.0 }, { f: 30, z: 1.1, x: -40 }]} handheld={4} seed={95}>
      <Layer depth={1}>
        <MapBase cues={{ border: -99, sea: -99, land: -99, allFilled: true, compass: -99 }} showCartouche={false} />
        <rect x={-400} y={-400} width={2720} height={1900} fill={pal.night} opacity={0.62} />
        {NETWORK.map(([a, b], i) => {
          const pa = m.proj(PLACES[a]);
          const pb = m.proj(PLACES[b]);
          const mx = (pa[0] + pb[0]) / 2;
          const my = (pa[1] + pb[1]) / 2 - Math.hypot(pb[0] - pa[0], pb[1] - pa[1]) * 0.25;
          const d = `M${pa[0]} ${pa[1]}Q${mx} ${my} ${pb[0]} ${pb[1]}`;
          const p = ramp(f, i * 0.9, i * 0.9 + 10, easeOut);
          return (
            <g key={i}>
              <path d={d} stroke="#5fd4ff" strokeWidth={14} fill="none" opacity={0.25 * p} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} strokeLinecap="round" />
              <path d={d} stroke="#e8fbff" strokeWidth={3.5} fill="none" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} strokeLinecap="round" />
            </g>
          );
        })}
        {Object.values(PLACES).map((ll, i) => {
          const [x, y] = m.proj(ll);
          const k = ((f / 18 + hash(i, 2)) % 1 + 1) % 1;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={6} fill={pal.glow} />
              <circle cx={x} cy={y} r={6 + k * 40} fill="none" stroke={pal.glow} strokeWidth={2} opacity={1 - k} />
            </g>
          );
        })}
      </Layer>
    </Camera>
  );
};

// 8-9. The smartphone lights up and rotates in slow motion
const PhoneShot: React.FC<{ second?: boolean }> = ({ second }) => {
  const f = useCurrentFrame();
  const pal = usePalette();
  const t = clamp(f / 30);
  const yaw = second ? lerp(-0.28, 0.32, easeInOut(t)) : lerp(-2.2, -0.35, easeInOut(t));
  const light = second ? 1 : ramp(f, 14, 26, easeOut);
  const z = second ? lerp(26, 21, t) : lerp(38, 32, t);
  return (
    <Camera keys={[{ f: 0, z: 1.0 }]} handheld={3} seed={96}>
      <Layer depth={0.1} html>
        <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #25306a 0%, #0b0f28 60%, #04060f 100%)" }} />
      </Layer>
      <Layer depth={0.3}>
        {Array.from({ length: 18 }, (_, i) => {
          const x = hash(i, 1) * 1920 + Math.sin(f / 20 + i) * 20;
          const y = hash(i, 2) * 1080 - f * (0.5 + hash(i, 3));
          const colr = [pal.gold, pal.sky, pal.flagRed, "#b37bff"][i % 4];
          return <circle key={i} cx={x} cy={((y % 1080) + 1080) % 1080} r={20 + hash(i, 4) * 60} fill={colr} opacity={0.12} />;
        })}
      </Layer>
      <Layer depth={1}>
        <circle cx={960} cy={540} r={420} fill="#7aa8ff" opacity={0.12 * light} />
        <Phone3D at={{ pos: [0, 0, z], yaw, roll: second ? -0.05 : 0.08, pitch: 0.05 }} light={light} t={f + (second ? 30 : 0)} />
      </Layer>
      <Layer depth={1.3}>
        <Dust count={30} speed={0.4} color="glow" seed="pdust" />
      </Layer>
    </Camera>
  );
};

// 10-11. Fighter jets streak overhead with vapor trails
const JetsShot: React.FC<{ second?: boolean }> = ({ second }) => {
  const f = useCurrentFrame();
  const pal = usePalette();
  const n = second ? 30 : 15;
  const t = clamp(f / n);
  const form: [number, number][] = [
    [0, 0],
    [-150, 160],
    [150, 160],
    [0, 320],
  ];
  const head = second ? -55 : -38;
  const hr = (head * Math.PI) / 180;
  const dirx = Math.sin(hr);
  const diry = -Math.cos(hr);
  const lead: Pt = second ? [lerp(1500, 500, t), lerp(1200, -300, t)] : [lerp(1800, 200, t), lerp(1400, -400, t)];
  return (
    <Camera keys={[{ f: 0, z: 1.0 }]} handheld={7} seed={97}>
      <Layer depth={0.05}>
        <Paper />
        <EngravedSky h={1400} y={-300} dark={0.2} />
        <Sun x={420} y={260} r={70} rays={36} spin={0.8} />
      </Layer>
      <Layer depth={0.3}>
        <Clouds speed={second ? 6 : 12} clouds={[{ x: 0, y: 700, w: 700, h: 170, seed: "jc1" }, { x: 900, y: 820, w: 600, h: 150, seed: "jc2" }, { x: 1500, y: 600, w: 500, h: 130, seed: "jc3" }]} />
      </Layer>
      <Layer depth={1}>
        {form.map(([ox, oy], i) => {
          const c0 = Math.cos(hr);
          const s0 = Math.sin(hr);
          const x = lead[0] + ox * c0 - oy * s0;
          const y = lead[1] + ox * s0 + oy * c0;
          const trail = second ? 1400 : 700;
          return (
            <g key={i}>
              <line x1={x - dirx * 120} y1={y - diry * 120} x2={x - dirx * trail} y2={y - diry * trail} stroke="#ffffff" strokeWidth={second ? 18 : 10} opacity={0.7} strokeLinecap="round" />
              <line x1={x - dirx * 100 - 60} y1={y - diry * 100} x2={x - dirx * trail * 0.5 - 60} y2={y - diry * trail * 0.5} stroke="#ffffff" strokeWidth={3} opacity={0.6} />
              <line x1={x - dirx * 100 + 60} y1={y - diry * 100} x2={x - dirx * trail * 0.5 + 60} y2={y - diry * trail * 0.5} stroke="#ffffff" strokeWidth={3} opacity={0.6} />
              <g transform={`translate(${x} ${y}) rotate(${head}) scale(${second ? 0.9 : 1.2})`}>
                <circle cx={0} cy={140} r={26} fill={pal.fire} opacity={0.8} />
                <path d={jetD(1)} fill={pal.steel} stroke={pal.ink} strokeWidth={2.4} />
                <path d={hatch([[[0, -130], [22, -30], [90, 30], [26, 44], [28, 80], [-28, 80], [-26, 44], [-90, 30], [-22, -30]]], { angle: 90, spacing: 5, seed: `jet${i}` })} stroke={pal.ink} strokeWidth={1} opacity={0.5} />
                <path d="M0 -110L6 -70L-6 -70Z" fill={pal.gold} />
              </g>
            </g>
          );
        })}
      </Layer>
      <Layer depth={1.6}>
        {Array.from({ length: 24 }, (_, i) => {
          const x = hash(i, 1) * 1920;
          const y = ((hash(i, 2) * 1400 + f * 60) % 1400) - 160;
          return <line key={i} x1={x} y1={y} x2={x + 20} y2={y + 120} stroke="#ffffff" strokeWidth={2} opacity={0.35} />;
        })}
      </Layer>
    </Camera>
  );
};

// 12-13. Flying past Mount Rushmore
const RushmoreShot: React.FC<{ close?: boolean }> = ({ close }) => {
  const f = useCurrentFrame();
  const rush = memo("hy:rush", rushmoreItems);
  const pines = memo("hy:pines", () => [...pine(-200, 1120, 420, "rp1"), ...pine(200, 1150, 520, "rp2"), ...pine(700, 1120, 380, "rp3"), ...pine(1300, 1160, 560, "rp4"), ...pine(1800, 1130, 440, "rp5"), ...pine(2200, 1150, 500, "rp6")]);
  const n = close ? 15 : 30;
  return (
    <Camera keys={[{ f: 0, z: close ? 1.7 : 1.05, x: close ? 250 : -220, y: close ? -60 : 30 }, { f: n, z: close ? 1.85 : 1.12, x: close ? 420 : 220, y: close ? -80 : 0 }]} handheld={4} seed={98}>
      <Layer depth={0.05}>
        <Paper />
        <EngravedSky h={1400} y={-400} dark={0.2} />
        <Clouds speed={3} clouds={[{ x: 100, y: -60, w: 600, h: 150, seed: "rc1" }, { x: 1200, y: -120, w: 520, h: 140, seed: "rc2" }]} />
      </Layer>
      <Layer depth={1}>
        <InkDraw items={rush} {...Instant} />
        <Birds x0={-100} y0={200} x1={2100} y1={120} dur={40} count={4} seed="rb" />
      </Layer>
      <Layer depth={1.9}>
        <g transform={`translate(${-f * (close ? 30 : 16)} 0)`}>
          <InkDraw items={pines} {...Instant} />
        </g>
      </Layer>
    </Camera>
  );
};

// 14-15. Grand Canyon fly-over at golden hour
const CanyonShot: React.FC<{ second?: boolean }> = ({ second }) => {
  const f = useCurrentFrame();
  const pal = usePalette();
  const layers = memo("hy:canyon2", () => [mesaLayer(460, 110, "m1", 0.05), mesaLayer(540, 160, "m2", 0.25), mesaLayer(650, 230, "m3", 0.45, true), mesaLayer(800, 300, "m4", 0.7, true), mesaLayer(1000, 380, "m5", 0.95, true)]);
  const n = second ? 15 : 30;
  const t = clamp(f / n);
  return (
    <Camera keys={[{ f: 0, z: 1.0, x: second ? 100 : -60 }, { f: n, z: second ? 1.25 : 1.35, x: second ? 220 : 40 }]} handheld={4} seed={99}>
      <Layer depth={0.03}>
        <Paper />
        <EngravedSky h={1300} y={-300} dark={0.25} wash="dawn" />
        <Sun x={second ? 1500 : 320} y={380} r={80} rays={40} spin={0.6} rayLen={1800} />
      </Layer>
      {layers.map((items, i) => (
        <Layer key={i} depth={0.25 + i * 0.3}>
          <InkDraw items={items} {...Instant} />
          {i === 2 && <path d="M700 660C800 690 900 640 960 700S1080 760 1120 800" stroke={pal.water} strokeWidth={12} fill="none" />}
          {i === 2 && <path d="M700 660C800 690 900 640 960 700S1080 760 1120 800" stroke="#ffffff" strokeWidth={3} fill="none" strokeDasharray="10 40" strokeDashoffset={-f * 4} />}
        </Layer>
      ))}
      <Layer depth={1.6}>
        <Birds x0={-100} y0={300} x1={2000} y1={250} dur={n + 10} count={3} size={30} seed="condor" />
        <g opacity={0.25 + 0.1 * t}>
          <Dust count={30} speed={1} color="glow" seed="cy" />
        </g>
      </Layer>
    </Camera>
  );
};

// 16-20. Fireworks over the city skyline
const FireworksShot: React.FC<{ variant: number; frames: number }> = ({ variant, frames }) => {
  const f = useCurrentFrame();
  const pal = usePalette();
  const sky = memo("hy:skyline", () => skylineGeo());
  const cols = ["flagRed", "gold", "flagWhite", "sky", "fire", "glow"];
  const bursts: Burst[] = Array.from({ length: variant === 3 ? 12 : 5 }, (_, i) => ({
    x: 200 + hash(i, variant, 1) * 1520,
    y: 150 + hash(i, variant, 2) * 350,
    t0: Math.floor(hash(i, variant, 3) * (frames * 0.6)) - (variant === 1 ? 6 : 0),
    r: 180 + hash(i, variant, 4) * 180,
    color: cols[i % cols.length],
    count: 40,
    launchFrom: 900,
  }));
  if (variant === 1) bursts.unshift({ x: 960, y: 480, t0: 0, r: 520, color: "gold", count: 70 });
  return (
    <Camera keys={[{ f: 0, z: variant === 1 ? 1.25 : 1.02 }, { f: frames, z: variant === 1 ? 1.4 : 1.1, y: -10 }]} handheld={5} seed={100 + variant}>
      <Layer depth={0.05}>
        <Paper />
        <EngravedSky h={1300} y={-300} dark={0.8} wash="night" />
        <Stars count={100} h={700} seed={`fws${variant}`} />
      </Layer>
      <Layer depth={0.5}>
        <Fireworks bursts={bursts} seed={`fw${variant}`} life={36} />
      </Layer>
      <Layer depth={0.7}>
        <path d={sky.d} fill={pal.night} stroke={pal.ink} strokeWidth={2} />
        <path d={sky.windows} stroke={pal.glow} strokeWidth={6} opacity={0.8} />
        <InkSea top={900} bottom={1250} rows={16} amp={6} speed={0.6} drift={0.4} wash="night" washNear="night" seed={`riv${variant}`} lineOp={0.6} />
        {bursts.slice(0, 5).map((b, i) => (b.t0 <= f && f - b.t0 < 30 ? <ellipse key={i} cx={b.x} cy={1100 - (b.y - 150) * 0.3} rx={60} ry={120} fill={(pal as unknown as Record<string, string>)[b.color ?? "gold"]} opacity={0.3 * (1 - (f - b.t0) / 30)} /> : null))}
      </Layer>
      <Layer depth={1.3}>
        {Array.from({ length: 16 }, (_, i) => {
          const x = -100 + i * 140 + hash(i, 5) * 40;
          const arm = Math.sin(f / 4 + i) * 16;
          return (
            <g key={i} fill="#05070f" transform={`translate(${x} ${1080 + Math.abs(Math.sin(f / 5 + i)) * -10})`}>
              <path d="M-40 0Q-40 -100 0 -110Q40 -100 40 0Z" />
              <circle cx={0} cy={-135} r={28} />
              {i % 3 === 0 && <path d={`M20 -100L${60} ${-190 + arm}`} stroke="#05070f" strokeWidth={16} strokeLinecap="round" />}
            </g>
          );
        })}
      </Layer>
    </Camera>
  );
};

const S = (a: number, b: number, el: React.ReactNode, enter: "cut" | "flash" | "punch" | "whip" | "whipUp" = "cut", name = "") => ({
  from: c(a),
  dur: c(b) - c(a),
  el,
  enter,
  palette: "color" as const,
  name,
});

export const hype: SceneDef = {
  id: "hype",
  seedBase: 90,
  shots: [
    S(0, 1, <EarthriseShot />, "cut", "earthrise"),
    S(1, 1.5, <WallShot />, "punch", "wall cracks"),
    S(1.5, 2.5, <WallShot crumble />, "cut", "wall falls"),
    S(2.5, 3, <CircuitShot />, "flash", "circuit"),
    S(3, 3.5, <CircuitShot macro />, "cut", "circuit macro"),
    S(3.5, 4.5, <ComputersShot />, "punch", "computers"),
    S(4.5, 5.5, <NetMapShot />, "whip", "network map"),
    S(5.5, 6.5, <PhoneShot />, "flash", "phone"),
    S(6.5, 7.5, <PhoneShot second />, "cut", "phone close"),
    S(7.5, 8, <JetsShot />, "punch", "jets"),
    S(8, 9, <JetsShot second />, "cut", "vapor trails"),
    S(9, 10, <RushmoreShot />, "whip", "rushmore"),
    S(10, 10.5, <RushmoreShot close />, "cut", "rushmore close"),
    S(10.5, 11.5, <CanyonShot />, "flash", "grand canyon"),
    S(11.5, 12, <CanyonShot second />, "cut", "canyon 2"),
    S(12, 13, <FireworksShot variant={0} frames={30} />, "punch", "fireworks"),
    S(13, 13.5, <FireworksShot variant={1} frames={15} />, "cut", "firework burst"),
    S(13.5, 14.5, <FireworksShot variant={2} frames={30} />, "flash", "skyline"),
    S(14.5, 15.5, <FireworksShot variant={3} frames={30} />, "cut", "finale"),
    S(15.5, 16, <FireworksShot variant={1} frames={15} />, "punch", "last burst"),
  ],
  hits: Array.from({ length: 32 }, (_, i) => ({ f: c(i * 0.5), amp: i % 2 === 0 ? 14 : 7, dur: 8, punch: i % 4 === 0 ? 0.03 : 0 })),
  flashes: [{ f: c(15.5), dur: 10, peak: 0.8 }],
  Overlay: () => (
    <>
      <Quote {...QUOTES.reagan} start={c(1) + 2} end={c(4.5)} framesPerWord={3} />
      <Quote {...QUOTES.jobs} start={c(5.5) + 2} end={c(10.5)} framesPerWord={3} fontSize={60} />
    </>
  ),
};

