// 1. COLD OPEN — three half-second flashes (boot in lunar dust, flag on a
// windswept ridge, rocket engines igniting), hard cut to black, "1776".
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Camera, Layer } from "../components/Camera";
import { InkDraw } from "../components/InkDraw";
import { Paper } from "../components/Parchment";
import { Dust, Embers, Smoke, Sparks } from "../components/Particles";
import { Flag } from "../components/Cloth";
import { Clouds, EngravedSky, Stars, Sun } from "../components/Sky";
import { YearSlam } from "../components/YearSlam";
import { bootItems, lunarGround, saturnBase } from "../art/space";
import { Plume } from "../art/Plume";
import { F, grass, HT, L } from "../art/kit";
import { hatch, polyD, Pt, smoothD, engrave } from "../lib/engrave";
import { clamp, easeIn, easeOut, memo, ramp, TAU } from "../lib/math";
import { usePalette } from "../lib/palette";
import { hash, noise1, rng } from "../lib/random";
import { sceneClock } from "../timeline";
import type { SceneDef } from "./types";

const c = sceneClock("coldOpen");

// Boot pressing into lunar dust, dust puffing out in slow low-gravity arcs
const BootShot: React.FC = () => {
  const f = useCurrentFrame();
  const pal = usePalette();
  const boot = memo("co:boot", bootItems);
  const ground = memo("co:ground", () => lunarGround(360, "co"));
  const contact = 5;
  const down = f < contact ? -140 * (1 - easeIn(f / contact)) : Math.min(12, (f - contact) * 3);
  const s = 1.05;
  const r = rng("bootdust");
  const grains = Array.from({ length: 120 }, (_, i) => ({ a: -Math.PI * (0.05 + r() * 0.9), v: 3 + r() * 9, sz: 1.5 + r() * 3.5, side: i % 2 ? 1 : -1 }));
  const a = f - contact;
  return (
    <Camera keys={[{ f: 0, z: 1.02, y: -10 }, { f: 16, z: 1.12, y: 10 }]} handheld={4}>
      <Layer depth={0.15}>
        <rect x={-400} y={-400} width={2720} height={900} fill={pal.space} />
        <Stars count={90} h={700} />
      </Layer>
      <Layer depth={0.7}>
        <InkDraw items={ground.items} start={-4} dur={8} hatchAt={2} washAt={0} washDur={4} />
      </Layer>
      <Layer depth={1}>
        <g transform={`translate(1000 ${880 + down}) scale(${s})`}>
          <InkDraw items={boot} start={-3} dur={8} hatchAt={2} washAt={0} washDur={4} />
        </g>
        {a >= 0 && (
          <g>
            <Smoke x={760} y={890} count={14} start={contact} life={44} size={95} spread={5} vx={-7} vy={-1.6} shade={0.25} opacity={0.9} seed="bootpuffL" />
            <Smoke x={1260} y={890} count={14} start={contact} life={44} size={95} spread={5} vx={7} vy={-1.6} shade={0.25} opacity={0.9} seed="bootpuffR" />
            {grains.map((g, i) => {
              const t = a;
              const x = 1000 + g.side * (240 + Math.cos(g.a) * g.v * t * 1.6);
              const y = 890 + Math.sin(g.a) * g.v * t + 0.12 * t * t;
              return <circle key={i} cx={x} cy={y} r={g.sz} fill={pal.inkSoft} opacity={clamp(1 - t / 30)} />;
            })}
          </g>
        )}
      </Layer>
      <Layer depth={1.5}>
        <Dust count={40} speed={1.2} color="moon" size={3} seed="coDust" />
      </Layer>
    </Camera>
  );
};

// Flag on a windswept ridge: fast clouds, whipping grass, flying grit
const FlagShot: React.FC = () => {
  const f = useCurrentFrame();
  const pal = usePalette();
  const ridge = memo("co:ridge", () => {
    const r = rng("ridge");
    const pts: Pt[] = [[-300, 1200]];
    for (let x = -300; x <= 2300; x += 60) {
      const peak = Math.exp(-Math.pow((x - 1000) / 520, 2));
      pts.push([x, 1010 - peak * 360 + (r() - 0.5) * 26]);
    }
    pts.push([2300, 1200]);
    const tone = (x: number, y: number) => 0.35 + (y - 650) / 700 + (x > 1000 ? 0.2 : 0);
    const layers = engrave([pts], tone, { angle: 60, spacing: 5, levels: [0.3, 0.55, 0.8], seed: "ridge" });
    const cracks: string[] = [];
    for (let i = 0; i < 28; i++) {
      const x = r() * 2400 - 300;
      const y = 1010 - Math.exp(-Math.pow((x - 1000) / 520, 2)) * 360 + 40 + r() * 200;
      cracks.push(smoothD([[x, y], [x + 30 + r() * 40, y + 10 + r() * 30], [x + 50 + r() * 60, y + 40]]));
    }
    return [
      F(polyD(pts), "ground", 0.9),
      ...layers.map((l) => HT(l.d, l.w)),
      L(cracks.join(""), 1.4, { op: 0.8 }),
      L(smoothD(pts.slice(1, -1)), 3),
    ];
  });
  const far = memo("co:far", () => {
    const pts: Pt[] = [[-300, 1000]];
    for (let x = -300; x <= 2300; x += 50) pts.push([x, 720 - Math.abs(Math.sin(x / 210)) * 120 - Math.sin(x / 70) * 14]);
    pts.push([2300, 1000]);
    return [F(polyD(pts), "skyDeep", 0.4), HT(hatch([pts], { angle: 0, spacing: 4, seed: "farm" }), 1, 0.5), L(smoothD(pts.slice(1, -1)), 1.8)];
  });
  const gust = 1 + 0.4 * Math.sin(f / 5);
  const grassD = grass(-200, 2200, (x) => 1010 - Math.exp(-Math.pow((x - 1000) / 520, 2)) * 360 + 6, "rg", 0.09, 34);
  return (
    <Camera keys={[{ f: 0, z: 1.18, x: 40, y: 30 }, { f: 16, z: 1.08, x: -20, y: 0 }]} handheld={6} seed={4}>
      <Layer depth={0.1}>
        <Paper />
        <EngravedSky h={1100} dark={0.25} />
        <Sun x={1500} y={560} r={60} spin={0.6} />
        <Clouds
          speed={7}
          clouds={[
            { x: -200, y: 150, w: 560, h: 150, seed: "q1" },
            { x: 600, y: 90, w: 420, h: 110, seed: "q2" },
            { x: 1300, y: 230, w: 500, h: 130, seed: "q3" },
            { x: 1900, y: 120, w: 380, h: 100, seed: "q4" },
          ]}
        />
      </Layer>
      <Layer depth={0.45}>
        <InkDraw items={far} start={-4} dur={8} />
      </Layer>
      <Layer depth={1}>
        <InkDraw items={ridge} start={-4} dur={8} hatchAt={2} washAt={0} washDur={4} />
        <path d="M1000 660L1000 170" stroke={pal.ink} strokeWidth={12} strokeLinecap="round" />
        <path d="M996 660L996 170" stroke={pal.wood} strokeWidth={5} />
        <circle cx={1000} cy={164} r={11} fill={pal.gold} stroke={pal.ink} strokeWidth={2.5} />
        <Flag x={1006} y={178} w={600} h={320} amp={1.4 * gust} speed={1.7} waves={2.1} />
        <g transform={`skewX(${-12 * gust + noise1(f / 3, 2) * 6})`} style={{ transformOrigin: "1000px 900px", transformBox: "view-box" }}>
          <path d={grassD} fill="none" stroke={pal.ink} strokeWidth={1.8} strokeLinecap="round" />
        </g>
      </Layer>
      <Layer depth={1.6}>
        {Array.from({ length: 26 }, (_, i) => {
          const sp = 30 + hash(i, 3) * 30;
          const x = ((hash(i, 1) * 2600 + f * sp) % 2600) - 340;
          const y = hash(i, 2) * 1080 + Math.sin(f / 4 + i) * 20;
          return <line key={i} x1={x} y1={y} x2={x - 40 - hash(i, 4) * 60} y2={y + 6} stroke={pal.inkSoft} strokeWidth={1.5 + hash(i, 5) * 2} opacity={0.5} strokeLinecap="round" />;
        })}
      </Layer>
    </Camera>
  );
};

// Saturn V base from low at the side: four F-1s ignite, exhaust blasts out
const EnginesShot: React.FC = () => {
  const f = useCurrentFrame();
  const base = memo("co:saturnBase", saturnBase);
  const ign = 2;
  const g = ramp(f, ign, ign + 6, easeOut);
  return (
    <Camera keys={[{ f: 0, z: 1.0, y: -40 }, { f: 16, z: 1.1, y: 30 }]} handheld={9} seed={7}>
      <Layer depth={0.2}>
        <Paper />
        <EngravedSky h={1400} y={-200} dark={0.45} />
      </Layer>
      <Layer depth={1}>
        <InkDraw items={base.items} start={-5} dur={7} hatchAt={1} washAt={0} washDur={3} />
        {base.bells.map((b, i) => (
          <Plume key={i} x={b.x} y={b.y} r={b.r} len={900} g={g} seed={i + 1} />
        ))}
        <Sparks x={960} y={760} t0={ign + 1} count={70} speed={38} angle={Math.PI / 2} spread={Math.PI * 1.3} gravity={0.3} seed="ignsp" />
      </Layer>
      <Layer depth={1.3}>
        <Smoke x={760} y={1080} rate={0.8} start={ign + 1} life={34} size={190} vx={-12} vy={-1} spread={5} shade={0.55} seed="exW" />
        <Smoke x={1160} y={1080} rate={0.8} start={ign + 1} life={34} size={190} vx={12} vy={-1} spread={5} shade={0.55} seed="exE" />
        <Smoke x={960} y={1150} rate={0.7} start={ign} life={30} size={230} vx={0} vy={-3} spread={8} shade={0.4} seed="exC" />
      </Layer>
    </Camera>
  );
};

// Black card for the year: a faint ring of thirteen stars turning, embers,
// and a shockwave + sparks on the slam
const YearCard: React.FC<{ impact: number }> = ({ impact }) => {
  const f = useCurrentFrame();
  const a = f - impact;
  const ring = (r0: number, n: number, rot: number, op: number, size: number) =>
    Array.from({ length: n }, (_, i) => {
      const ang = (i / n) * TAU + rot;
      const cx = 960 + Math.cos(ang) * r0;
      const cy = 540 + Math.sin(ang) * r0;
      const pts: Pt[] = [];
      for (let k = 0; k < 10; k++) {
        const aa = -Math.PI / 2 + (k * Math.PI) / 5;
        const rr = k % 2 === 0 ? size : size * 0.4;
        pts.push([cx + Math.cos(aa) * rr, cy + Math.sin(aa) * rr]);
      }
      return <path key={i} d={polyD(pts)} fill="#d8b26a" opacity={op} />;
    });
  const pulse = a >= 0 ? Math.exp(-a / 10) : 0;
  return (
    <AbsoluteFill style={{ backgroundColor: "#0b0704" }}>
      <svg width={1920} height={1080}>
        <g transform={`translate(960 540) scale(${1 + (f - 45) * 0.004 + pulse * 0.05}) translate(-960 -540)`}>
        <g opacity={0.35 + pulse * 0.6}>{ring(360, 13, f * 0.025, 1, 22)}</g>
        <circle cx={960} cy={540} r={420} fill="none" stroke="#d8b26a" strokeWidth={1.5} opacity={0.18 + pulse * 0.4} />
        <circle cx={960} cy={540} r={300} fill="none" stroke="#d8b26a" strokeWidth={1} opacity={0.12 + pulse * 0.3} />
        {a >= 0 &&
          [0, 5].map((d) => {
            const t = clamp((a - d) / 22);
            return t > 0 && t < 1 ? <ellipse key={d} cx={960} cy={540} rx={200 + easeOut(t) * 900} ry={120 + easeOut(t) * 520} fill="none" stroke="#f0d9a8" strokeWidth={6 * (1 - t)} opacity={1 - t} /> : null;
          })}
        </g>
        <Embers x={960} y={1120} w={2000} count={110} rise={6} life={60} seed="yc" size={2.6} />
        <Sparks x={960} y={540} t0={impact} count={80} speed={40} angle={0} spread={TAU} gravity={0.5} life={24} seed="ycs" />
        <Dust count={40} color="#8a6a40" seed="ycd" speed={0.8} />
      </svg>
    </AbsoluteFill>
  );
};

const SLAM = c(1.5) + 10; // year starts falling; impact lands on the 2.0s beat

export const coldOpen: SceneDef = {
  id: "coldOpen",
  seedBase: 0,
  shots: [
    { from: 0, dur: c(0.5), el: <BootShot />, name: "boot" },
    { from: c(0.5), dur: c(1) - c(0.5), el: <FlagShot />, enter: "flash", name: "flag ridge" },
    { from: c(1), dur: c(1.5) - c(1), el: <EnginesShot />, enter: "flash", name: "engines" },
    { from: c(1.5), dur: c(3) - c(1.5), el: <YearCard impact={c(2)} />, name: "1776 card", overlay: { texture: 0.25, vignette: 0.8 } },
  ],
  hits: [
    { f: 5, amp: 10, dur: 10 },
    { f: c(0.5), amp: 8, dur: 8 },
    { f: c(1) + 3, amp: 22, dur: 14, punch: 0.03 },
    { f: c(2), amp: 24, dur: 16, punch: 0.04 },
  ],
  Overlay: () => <YearSlam text="1776" startFrame={SLAM} fontSize={330} display exitAt={c(3) - 8} />,
};
