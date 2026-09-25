// 6. THE GREATEST GENERATION — 1944. Heavier shake. Landing craft ramps slam
// down in rough surf, spray hits the lens; hedgehogs in drifting smoke; a
// helmet in the sand as waves wash over; fighters roar past; the flag rises.
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Camera, Layer } from "../components/Camera";
import { InkDraw } from "../components/InkDraw";
import { Paper } from "../components/Parchment";
import { Dust, Embers, Fog, Smoke, Sparks } from "../components/Particles";
import { Clouds, EngravedSky, Sun } from "../components/Sky";
import { CrashWave, InkSea } from "../components/Water";
import { Flag } from "../components/Cloth";
import { YearSlam } from "../components/YearSlam";
import { Quote } from "../components/WordPop";
import { QUOTES } from "../quotes";
import { Fighter3D, hedgehog, helmetItems, Higgins3D, raisingFigures, rubbleMound } from "../art/ww2";
import { F, groundHatch, HT, L } from "../art/kit";
import { hatch, polyD, Pt, smoothD } from "../lib/engrave";
import { clamp, easeIn, easeOut, lerp, memo } from "../lib/math";
import { usePalette } from "../lib/palette";
import { hash, noise1 } from "../lib/random";
import { DEFAULT_CAM, project, Pose } from "../lib/three";
import { sceneClock } from "../timeline";
import type { SceneDef } from "./types";

const c = sceneClock("greatest");

const rampAngle = (f: number, t0: number) => {
  const a = f - t0;
  if (a < 0) return 0.05 * Math.sin(f / 3);
  if (a < 6) return easeIn(a / 6) * 1.75;
  return 1.75 - Math.sin(Math.min(Math.PI, (a - 6) * 0.5)) * 0.12 * Math.exp(-(a - 6) / 8);
};

// A. Higgins boats in rough surf; ramps slam down; spray hits the lens
const LandingShot: React.FC = () => {
  const f = useCurrentFrame();
  const pal = usePalette();
  const boats: { pose: Pose; t0: number }[] = [
    { pose: { pos: [-8, -1.1 + Math.sin(f / 7 + 1) * 0.2, 22], yaw: 0.45, pitch: Math.sin(f / 8 + 1) * 0.05, roll: Math.sin(f / 9) * 0.05 }, t0: 30 },
    { pose: { pos: [7.5, -1.1 + Math.sin(f / 6 + 2) * 0.2, 27], yaw: -0.4, pitch: Math.sin(f / 7 + 2) * 0.05, roll: Math.sin(f / 10 + 1) * 0.05 }, t0: 45 },
    { pose: { pos: [0.6, -1.2 + Math.sin(f / 6) * 0.25, 10], yaw: 0.32, pitch: Math.sin(f / 7) * 0.06, roll: Math.sin(f / 8) * 0.04 }, t0: 15 },
  ];
  const hero = boats[2];
  const tipW = project([hero.pose.pos[0], hero.pose.pos[1] - 0.2, hero.pose.pos[2] - 2.3], DEFAULT_CAM);
  const slam = f - 21;
  return (
    <AbsoluteFill>
      <Camera keys={[{ f: 0, z: 1.02 }, { f: 75, z: 1.1, y: 10 }]} handheld={10} seed={61}>
        <Layer depth={0.08}>
          <Paper />
          <EngravedSky h={900} y={-300} dark={0.6} cross />
          <Smoke x={300} y={500} rate={0.3} life={120} size={120} vx={0.5} vy={-2} spread={0.6} shade={0.9} seed="col1" />
          <Smoke x={1500} y={500} rate={0.25} life={120} size={140} vx={-0.4} vy={-2.2} spread={0.6} shade={0.9} seed="col2" />
        </Layer>
        <Layer depth={0.5}>
          <InkSea top={520} rows={42} amp={26} speed={2.4} drift={2} seed="surf" />
          <CrashWave x={260} y={760} w={700} h={210} period={40} seed="lw1" />
          <CrashWave x={1600} y={740} w={640} h={200} period={46} offset={20} seed="lw2" flip />
        </Layer>
        <Layer depth={1}>
          {boats.map((b, i) => {
            const bow = project([b.pose.pos[0], b.pose.pos[1] - 0.3, b.pose.pos[2]], DEFAULT_CAM);
            const k = 10 / b.pose.pos[2];
            return (
              <g key={i}>
                <Higgins3D at={b.pose} ramp={rampAngle(f, b.t0)} troops={clamp((f - b.t0) / 6)} />
                {bow && (
                  <path
                    d={`M${bow[0] - 260 * k} ${bow[1]}q${130 * k} ${-50 * k - Math.sin(f / 4 + i) * 20 * k} ${260 * k} 0q${130 * k} ${-50 * k - Math.sin(f / 5 + i) * 20 * k} ${260 * k} 0`}
                    fill="none"
                    stroke={pal.foam}
                    strokeWidth={14 * k}
                    strokeLinecap="round"
                  />
                )}
              </g>
            );
          })}
          {tipW && slam >= 0 && (
            <g>
              <Smoke x={tipW[0]} y={tipW[1] + 40} count={16} start={21} life={34} size={130} spread={9} vy={-3} shade={0} color="foam" outline={1.4} seed="slam" />
              <Sparks x={tipW[0]} y={tipW[1]} t0={21} count={70} speed={30} gravity={1} life={26} color="foam" spread={Math.PI * 1.2} seed="slamsp" width={4} />
            </g>
          )}
          <InkSea top={1000} bottom={1300} rows={8} amp={30} speed={3} drift={3} seed="fgsea" lineOp={1} />
        </Layer>
      </Camera>
      {/* spray droplets on the lens */}
      <AbsoluteFill>
        <svg width={1920} height={1080}>
          {slam >= 0 &&
            Array.from({ length: 26 }, (_, i) => {
              const a = slam - hash(i, 7) * 6;
              if (a < 0) return null;
              const x = hash(i, 1) * 1920;
              const y = hash(i, 2) * 900 + a * a * 0.05 * hash(i, 3);
              const r = 18 + hash(i, 4) * 60;
              return (
                <g key={i} opacity={Math.max(0, 0.75 - a * 0.012)}>
                  <circle cx={x} cy={y} r={r} fill={pal.foam} opacity={0.25} />
                  <circle cx={x} cy={y} r={r} fill="none" stroke={pal.foam} strokeWidth={3} opacity={0.6} />
                  <circle cx={x - r * 0.3} cy={y - r * 0.3} r={r * 0.2} fill="#fff" opacity={0.7} />
                </g>
              );
            })}
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// B. Steel hedgehogs on the beach as smoke drifts across
const BeachShot: React.FC = () => {
  const f = useCurrentFrame();
  const pal = usePalette();
  const geo = memo("gg:beach", () => {
    const bluff: Pt[] = [[-500, 560], ...Array.from({ length: 40 }, (_, i) => [-500 + i * 80, 420 - Math.sin(i * 0.5) * 30 - Math.sin(i * 0.2) * 40] as Pt), [2700, 560]];
    const sand: Pt[] = [[-500, 560], [2700, 560], [2700, 1400], [-500, 1400]];
    return {
      bluff: [F(polyD(bluff), "foliage", 0.35), HT(hatch([bluff], { angle: 70, spacing: 4, seed: "bl" }), 1, 0.45), L(smoothD(bluff.slice(1, -1)), 1.6)],
      sand: [F(polyD(sand), "sand", 0.75), HT(groundHatch(-500, 2700, 570, 1350, "bs", 6), 1, 0.7)],
      hogs: [
        { x: 260, y: 1010, s: 2.2 },
        { x: 1500, y: 900, s: 1.6 },
        { x: 900, y: 760, s: 1.0 },
        { x: 1250, y: 680, s: 0.65 },
        { x: 400, y: 660, s: 0.6 },
        { x: 1750, y: 640, s: 0.5 },
      ].map((h, i) => ({ ...h, items: hedgehog(h.s, `hh${i}`) })),
    };
  });
  return (
    <Camera keys={[{ f: 0, z: 1.08, x: 60 }, { f: 45, z: 1.14, x: -60 }]} handheld={8} seed={62}>
      <Layer depth={0.1}>
        <Paper />
        <EngravedSky h={900} y={-300} dark={0.55} />
      </Layer>
      <Layer depth={0.3}>
        <InkDraw items={geo.bluff} start={-6} dur={8} />
        <Fog y={450} h={200} speed={2} opacity={0.7} seed="bf" />
      </Layer>
      <Layer depth={0.8}>
        <InkDraw items={geo.sand} start={-6} dur={8} />
        <path d={`M-500 ${600 + Math.sin(f / 8) * 10}Q400 ${590 + Math.sin(f / 7) * 12} 1200 ${605}T2700 ${600}`} stroke={pal.foam} strokeWidth={6} fill="none" />
        {geo.hogs
          .slice()
          .sort((a, b) => a.y - b.y)
          .map((h, i) => (
            <g key={i} transform={`translate(${h.x} ${h.y})`}>
              <ellipse cx={0} cy={0} rx={130 * h.s} ry={16 * h.s} fill={pal.ink} opacity={0.3} />
              <InkDraw items={h.items} start={-4 + i} dur={8} washAt={0} washDur={4} />
            </g>
          ))}
        <Smoke x={1900} y={650} rate={0.45} life={80} size={220} vx={-14} vy={-0.8} spread={1} shade={0.85} seed="bsm1" />
        <Fog y={640} h={320} speed={-9} opacity={0.55} color="smoke" count={10} seed="bsmog" />
        <Embers x={700} y={900} w={600} count={40} rise={3} seed="bemb" />
      </Layer>
      <Layer depth={1.4}>
        <Smoke x={2100} y={950} rate={0.4} life={70} size={280} vx={-20} vy={-0.5} spread={1} shade={0.9} seed="bsm2" />
        <Dust count={50} speed={2} color="inkSoft" seed="bdst" />
      </Layer>
    </Camera>
  );
};

// C. A helmet in the sand; waves wash over it and retreat
const HelmetShot: React.FC = () => {
  const f = useCurrentFrame();
  const pal = usePalette();
  const helmet = memo("gg:helmet", helmetItems);
  const ripples = memo("gg:ripples", () => {
    const out: string[] = [];
    for (let k = 0; k < 16; k++) {
      const y = 620 + k * 32;
      out.push(smoothD(Array.from({ length: 12 }, (_, i) => [-300 + i * 220, y + Math.sin(i * 1.3 + k) * 10] as Pt)));
    }
    return out.join("");
  });
  const phase = f * 0.16 + 0.4;
  const reach = Math.max(0, Math.sin(phase));
  const edge = 380 + reach * 520;
  const water: Pt[] = [[-300, -300], [2300, -300], [2300, edge - 40], ...Array.from({ length: 30 }, (_, i) => [2300 - i * 90, edge + Math.sin(i * 0.9 + f * 0.3) * 18 + noise1(i * 0.7, 3) * 20] as Pt), [-300, edge]];
  const foam = water.slice(3);
  return (
    <Camera keys={[{ f: 0, z: 1.06, y: 10, x: -40 }, { f: 45, z: 1.24, y: 40, x: 40 }]} handheld={6} seed={63}>
      <Layer depth={0.5}>
        <Paper />
        <rect x={-400} y={-400} width={2720} height={1900} fill={pal.sand} opacity={0.7} />
        <path d={ripples} stroke={pal.ink} strokeWidth={1.6} fill="none" opacity={0.6} />
        <path d={groundHatch(-400, 2320, 300, 1400, "hs", 7)} stroke={pal.ink} strokeWidth={1} fill="none" opacity={0.4} />
      </Layer>
      <Layer depth={1}>
        <ellipse cx={1010} cy={775} rx={330} ry={60} fill={pal.ink} opacity={0.35} />
        <g transform="translate(1000 760) rotate(-8)">
          <InkDraw items={helmet} start={-6} dur={10} hatchAt={0} washAt={0} washDur={4} />
        </g>
        <path d="M640 790Q800 740 1000 780T1380 790L1400 840L620 840Z" fill={pal.sand} />
        <path d="M640 790Q800 740 1000 780T1380 790" stroke={pal.ink} strokeWidth={2} fill="none" />
        <path d={polyD(water)} fill={pal.water} opacity={0.42} />
        <path d={hatch([water], { angle: 0, spacing: 9, seed: "wsh" })} stroke={pal.foam} strokeWidth={1.5} opacity={0.5} />
        <path d={smoothD(foam)} stroke={pal.foam} strokeWidth={10} fill="none" />
        <path d={smoothD(foam)} stroke={pal.ink} strokeWidth={1.4} fill="none" opacity={0.6} />
        {Array.from({ length: 40 }, (_, i) => {
          const x = hash(i, 1) * 2200 - 150;
          const y = edge - 20 - hash(i, 2) * 200;
          return <circle key={i} cx={x} cy={y} r={2 + hash(i, 3) * 5} fill="none" stroke={pal.foam} strokeWidth={2} opacity={0.8} />;
        })}
      </Layer>
      <Layer depth={1.5}>
        <Dust count={24} speed={1} color="foam" seed="hdst" />
      </Layer>
    </Camera>
  );
};

// D. Fighters roar past in formation over the ocean
const fighterPose = (f: number, i: number): Pose => {
  const t = clamp((f - i * 5) / 52);
  const z = lerp(80, -6, Math.pow(t, 1.25));
  return { pos: [3 + i * 5 + t * 3, 1.5 + i * 1.6 - t * 0.5, z], yaw: -0.08, roll: -0.25 - i * 0.05, pitch: 0.03 };
};

const FighterShot: React.FC = () => {
  const f = useCurrentFrame();
  const pal = usePalette();
  return (
    <Camera keys={[{ f: 0, z: 1.0 }]} handheld={6} seed={64}>
      <Layer depth={0.05}>
        <Paper />
        <EngravedSky h={900} y={-300} dark={0.35} />
        <Sun x={400} y={300} r={60} spin={0.3} />
      </Layer>
      <Layer depth={0.2}>
        <Clouds speed={9} clouds={[{ x: 0, y: 120, w: 600, h: 150, seed: "fc1" }, { x: 800, y: 40, w: 520, h: 140, seed: "fc2" }, { x: 1500, y: 180, w: 460, h: 120, seed: "fc3" }]} />
      </Layer>
      <Layer depth={0.6}>
        <InkSea top={560} rows={40} amp={12} speed={2} drift={7} seed="ocean" />
      </Layer>
      <Layer depth={1}>
        {[3, 2, 1, 0].map((i) => (
          <Fighter3D key={i} at={fighterPose(f, i)} prop={f * 1.3 + i} />
        ))}
      </Layer>
      <Layer depth={1.6}>
        {Array.from({ length: 30 }, (_, i) => {
          const sp = 40 + hash(i, 3) * 40;
          const x = ((hash(i, 1) * 2400 - f * sp) % 2400 + 2400) % 2400 - 240;
          const y = hash(i, 2) * 1080;
          return <line key={i} x1={x} y1={y} x2={x + 80 + hash(i, 4) * 120} y2={y} stroke={pal.inkSoft} strokeWidth={1.4} opacity={0.35} />;
        })}
      </Layer>
    </Camera>
  );
};

// E. The flag rises on Iwo Jima, silhouetted against a moving sky
const RaisingShot: React.FC = () => {
  const f = useCurrentFrame();
  const pal = usePalette();
  const mound = memo("gg:mound", rubbleMound);
  const angle = lerp(34, 64, easeOut(clamp(f / 70)));
  const fig = raisingFigures(angle);
  const [tx, ty] = fig.poleTop;
  const [bx, by] = fig.poleBase;
  const pd = (Math.atan2(by - ty, bx - tx) * 180) / Math.PI;
  return (
    <Camera keys={[{ f: 0, z: 1.0, x: 20 }, { f: 75, z: 1.12, x: -20, y: -20 }]} handheld={5} seed={65}>
      <Layer depth={0.05}>
        <Paper />
        <EngravedSky h={1400} y={-300} dark={0.45} wash="dawn" washOp={0.3} />
        <Sun x={1300} y={420} r={90} rays={36} spin={0.4} rayLen={1700} />
      </Layer>
      <Layer depth={0.2}>
        <Clouds speed={4} clouds={[{ x: -200, y: 60, w: 700, h: 170, seed: "ic1" }, { x: 700, y: 10, w: 540, h: 140, seed: "ic2" }, { x: 1400, y: 150, w: 620, h: 160, seed: "ic3" }]} />
        <Smoke x={200} y={800} rate={0.2} life={120} size={110} vx={1} vy={-1.5} spread={0.6} shade={0.8} seed="ism" />
      </Layer>
      <Layer depth={1}>
        <g transform={`translate(${tx} ${ty}) rotate(${pd - 90})`}>
          <Flag x={0} y={0} w={330} h={200} amp={0.9} speed={0.8} waves={1.4} stars={48} droop={0.25} />
        </g>
        <line x1={bx} y1={by} x2={tx} y2={ty} stroke={pal.ink} strokeWidth={12} strokeLinecap="round" />
        <path d={fig.d} fill={pal.ink} />
        <InkDraw items={mound} start={-6} dur={8} washAt={0} washDur={3} />
      </Layer>
      <Layer depth={1.4}>
        <Dust count={40} speed={1.5} color="inkSoft" seed="idust" />
      </Layer>
    </Camera>
  );
};

export const greatest: SceneDef = {
  id: "greatest",
  seedBase: 60,
  shots: [
    { from: 0, dur: c(2.5), el: <LandingShot />, enter: "whip", name: "landing craft" },
    { from: c(2.5), dur: c(4) - c(2.5), el: <BeachShot />, enter: "burn", origin: [1600, 900], name: "hedgehogs" },
    { from: c(4), dur: c(5.5) - c(4), el: <HelmetShot />, enter: "ink", origin: [1000, 700], name: "helmet" },
    { from: c(5.5), dur: c(7.5) - c(5.5), el: <FighterShot />, enter: "whip", name: "fighters" },
    { from: c(7.5), dur: c(10) - c(7.5), el: <RaisingShot />, enter: "morph", name: "flag raising" },
  ],
  hits: [
    { f: c(0.5) + 6, amp: 30, dur: 18, punch: 0.04 },
    { f: 36, amp: 14, dur: 10 },
    { f: 51, amp: 14, dur: 10 },
    { f: c(3), amp: 20, dur: 14, punch: 0.02 },
    { f: c(5.5) + 44, amp: 26, dur: 16, punch: 0.03 },
    { f: c(7.5), amp: 12, dur: 12 },
  ],
  flashes: [{ f: c(3), dur: 8, color: "#ffd9a0", peak: 0.6 }],
  Overlay: () => (
    <>
      <YearSlam text="1944" startFrame={c(0.5) + 1} fontSize={300} display scrim={0.75} exitAt={c(1.3)} />
      <Quote {...QUOTES.eisenhower} start={c(4) + 3} end={c(7.5) + 8} framesPerWord={3} />
    </>
  ),
};

