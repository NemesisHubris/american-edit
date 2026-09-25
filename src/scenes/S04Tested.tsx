// 4. A NATION TESTED — 1863. Cannons fire with recoil and smoke; fog rolls
// over a split-rail fence at dawn; a lone silhouette in a stovepipe hat; the
// Lincoln Memorial columns draw themselves as the camera tilts up.
import { useCurrentFrame } from "remotion";
import { Camera, Layer } from "../components/Camera";
import { InkDraw } from "../components/InkDraw";
import { Paper } from "../components/Parchment";
import { Dust, Embers, Fog, Smoke, Sparks } from "../components/Particles";
import { Birds, Clouds, EngravedSky, Sun } from "../components/Sky";
import { YearSlam } from "../components/YearSlam";
import { Quote } from "../components/WordPop";
import { QUOTES } from "../quotes";
import { cannonParts, memorialItems, railFence } from "../art/civilwar";
import { F, grass, groundHatch, HT, L, tree } from "../art/kit";
import { hatch, polyD, Pt, smoothD } from "../lib/engrave";
import { clamp, easeInOut, memo, ramp, TAU } from "../lib/math";
import { usePalette } from "../lib/palette";
import { noise1 } from "../lib/random";
import { DISPLAY_FAMILY } from "../fonts";
import { sceneClock } from "../timeline";
import type { SceneDef } from "./types";

const c = sceneClock("tested");
const FIRE_A = [c(0.5), c(2)];
const FIRE_B = [c(1.5)];

const recoil = (f: number, fires: number[]) => {
  let r = 0;
  for (const t of fires) {
    const a = f - t;
    if (a >= 0) r = Math.max(r, a < 2 ? (a / 2) * 60 : 60 * Math.exp(-(a - 2) / 10));
  }
  return r;
};

const Cannon: React.FC<{ x: number; y: number; s: number; fires: number[]; seed: string; elev?: number }> = ({ x, y, s, fires, seed, elev = -7 }) => {
  const f = useCurrentFrame();
  const pal = usePalette();
  const parts = memo("cw:cannon", cannonParts);
  const rc = recoil(f, fires);
  const roll = (rc / 118) * 57.3;
  const pivot: Pt = [0, -150];
  const a = (elev * Math.PI) / 180;
  const mx = pivot[0] + parts.muzzle[0] * Math.cos(a);
  const my = pivot[1] + parts.muzzle[0] * Math.sin(a);
  const wx = x + rc * s + mx * s;
  const wy = y + my * s;
  return (
    <g>
      <g transform={`translate(${x + rc * s} ${y}) scale(${s})`}>
        <InkDraw items={parts.carriage} start={0} dur={14} />
        <g transform={`translate(${pivot[0]} ${pivot[1]}) rotate(${elev})`}>
          <InkDraw items={parts.barrel} start={2} dur={14} />
        </g>
        <g transform={`translate(0 -118) rotate(${roll})`}>
          <InkDraw items={parts.wheel} start={4} dur={12} />
        </g>
      </g>
      {fires.map((t, i) => {
        const age = f - t;
        if (age < 0 || age > 5) return null;
        const r = 120 * s * (1 - age / 6);
        const pts: Pt[] = Array.from({ length: 16 }, (_, k) => {
          const aa = (k / 16) * TAU;
          const rr = k % 2 ? r * 0.35 : r * (0.8 + noise1(k + age, i) * 0.3);
          return [wx - r * 0.6 + Math.cos(aa) * rr * 1.4, wy + Math.sin(aa) * rr * 0.8] as Pt;
        });
        return (
          <g key={i}>
            <circle cx={wx - r * 0.5} cy={wy} r={r * 2.2} fill={pal.glow} opacity={0.45 * (1 - age / 5)} />
            <path d={polyD(pts)} fill={pal.flame} stroke={pal.ink} strokeWidth={1.5} />
            <path d={polyD(pts.map(([px, py]) => [wx - r * 0.6 + (px - (wx - r * 0.6)) * 0.5, wy + (py - wy) * 0.5] as Pt))} fill="#fffbe8" />
          </g>
        );
      })}
      {fires.map((t, i) => (
        <g key={`s${i}`}>
          <Smoke x={wx - 20 * s} y={wy} count={16} start={t} life={70} size={110 * s} spread={3} vx={-13 * s} vy={-1.2} wind={-0.6} shade={0.55} seed={`${seed}${i}`} />
          <Sparks x={wx} y={wy} t0={t} count={26} speed={26 * s} angle={Math.PI} spread={1.2} gravity={0.6} life={16} seed={`${seed}sp${i}`} />
        </g>
      ))}
    </g>
  );
};

// A. Cannons firing on a foggy battlefield
const CannonShot: React.FC = () => {
  const pal = usePalette();
  const geo = memo("cw:field", () => {
    const ridge: Pt[] = [[-500, 700], ...Array.from({ length: 40 }, (_, i) => [-500 + i * 80, 560 - Math.sin(i * 0.6) * 30 - Math.sin(i * 0.17) * 40] as Pt), [2700, 700]];
    const trees = [...tree(100, 570, 220, "ct1", { dark: 0.4 }), ...tree(380, 555, 260, "ct2", { dark: 0.4 }), ...tree(1500, 560, 240, "ct3", { dark: 0.4 }), ...tree(1760, 570, 200, "ct4", { dark: 0.4 })];
    return {
      ridge: [F(polyD(ridge), "foliage", 0.4), HT(hatch([ridge], { angle: 0, spacing: 4, seed: "cr" }), 1, 0.5), L(smoothD(ridge.slice(1, -1)), 1.8)],
      trees,
      ground: [F(polyD([[-500, 640], [2700, 640], [2700, 1400], [-500, 1400]]), "ground", 0.55), HT(groundHatch(-500, 2700, 640, 1300, "cgnd"), 1, 0.7)],
      grassD: grass(-400, 2400, 960, "cg", 0.1, 30),
    };
  });
  return (
    <Camera keys={[{ f: 0, z: 1.1, x: -40, y: 20 }, { f: 75, z: 1.02, x: 40, y: 0 }]} handheld={5} seed={41}>
      <Layer depth={0.1}>
        <Paper />
        <EngravedSky h={900} y={-300} dark={0.45} />
        <Clouds speed={2.2} clouds={[{ x: 0, y: 40, w: 600, h: 150, seed: "cc1" }, { x: 900, y: 0, w: 500, h: 130, seed: "cc2" }, { x: 1600, y: 80, w: 420, h: 110, seed: "cc3" }]} />
      </Layer>
      <Layer depth={0.3}>
        <InkDraw items={geo.ridge} start={0} dur={10} />
        <InkDraw items={geo.trees} start={0} dur={16} />
        <Fog y={600} h={220} speed={2.2} opacity={0.9} seed="cfog1" />
      </Layer>
      <Layer depth={0.6}>
        <InkDraw items={geo.ground} start={0} dur={8} />
        <Cannon x={1480} y={760} s={0.55} fires={FIRE_B} seed="cb" />
      </Layer>
      <Layer depth={1}>
        <Cannon x={960} y={960} s={1.2} fires={FIRE_A} seed="ca" />
        <path d={geo.grassD} fill="none" stroke={pal.ink} strokeWidth={1.8} opacity={0.8} />
      </Layer>
      <Layer depth={1.5}>
        <Fog y={1000} h={300} speed={3.6} opacity={0.7} seed="cfog2" />
        <Embers x={960} y={1100} w={1800} count={30} rise={2} seed="cemb" />
      </Layer>
    </Camera>
  );
};

// B. Fog rolling across a split-rail fence at dawn
const FenceShot: React.FC = () => {
  const f = useCurrentFrame();
  const geo = memo("cw:fence", () => {
    const hills: Pt[] = [[-500, 640], ...Array.from({ length: 40 }, (_, i) => [-500 + i * 80, 540 - Math.sin(i * 0.35) * 40 - Math.sin(i * 0.9) * 10] as Pt), [2700, 640]];
    return {
      fence: railFence(),
      hills: [F(polyD(hills), "foliage", 0.3), HT(hatch([hills], { angle: 0, spacing: 4.5, seed: "fhl" }), 1, 0.4), L(smoothD(hills.slice(1, -1)), 1.6)],
      trees: [...tree(1350, 548, 180, "ft1", { dark: 0.45 }), ...tree(1480, 540, 150, "ft2", { dark: 0.45 }), ...tree(200, 560, 200, "ft3", { dark: 0.45 })],
      ground: [F(polyD([[-500, 560], [2700, 560], [2700, 1400], [-500, 1400]]), "ground", 0.5), HT(groundHatch(-500, 2700, 570, 1300, "fgnd", 6), 1, 0.7)],
      grassD: grass(-400, 2400, (x) => 1030 - x * 0.02, "fg2", 0.12, 34),
    };
  });
  return (
    <Camera keys={[{ f: 0, z: 1.08, x: -60 }, { f: 60, z: 1.16, x: 60, y: -10 }]} handheld={3} seed={42}>
      <Layer depth={0.1}>
        <Paper />
        <EngravedSky h={900} y={-300} dark={0.2} wash="dawn" washOp={0.35} />
        <Sun x={1640} y={500 - f * 0.6} r={70} spin={0.2} />
        <Birds x0={-100} y0={260} x1={2000} y1={180} dur={80} count={7} seed="fbirds" />
      </Layer>
      <Layer depth={0.3}>
        <InkDraw items={geo.hills} start={0} dur={10} />
        <InkDraw items={geo.trees} start={2} dur={14} />
        <Fog y={560} h={200} speed={2.5} opacity={1} seed="ffog0" />
      </Layer>
      <Layer depth={1}>
        <InkDraw items={geo.ground} start={0} dur={8} />
        <InkDraw items={geo.fence} start={2} dur={22} overlap={0.2} hatchAt={12} washAt={14} />
        <Fog y={780} h={300} speed={4} opacity={0.85} count={11} seed="ffog1" />
      </Layer>
      <Layer depth={1.5}>
        <HtPath d={geo.grassD} />
        <Fog y={1000} h={320} speed={6} opacity={0.8} seed="ffog2" />
      </Layer>
    </Camera>
  );
};

const HtPath: React.FC<{ d: string }> = ({ d }) => {
  const pal = usePalette();
  const f = useCurrentFrame();
  return (
    <g transform={`skewX(${-6 + noise1(f / 12, 3) * 5})`} style={{ transformOrigin: "960px 1040px", transformBox: "view-box" }}>
      <path d={d} fill="none" stroke={pal.ink} strokeWidth={2} strokeLinecap="round" opacity={0.85} />
    </g>
  );
};

// C. A lone silhouette in a stovepipe hat against fast-moving clouds
const LincolnShot: React.FC = () => {
  const f = useCurrentFrame();
  const pal = usePalette();
  const geo = memo("cw:hill", () => {
    const hill: Pt[] = [[-500, 1400], [-500, 900], [200, 820], [700, 770], [1100, 752], [1500, 770], [2000, 830], [2600, 900], [2600, 1400]];
    return { hill: smoothD(hill, true, 0.4), grassD: grass(-400, 2500, (x) => 820 - Math.exp(-Math.pow((x - 1100) / 700, 2)) * 68 + 2, "lg", 0.1, 30) };
  });
  const tail = noise1(f / 6, 2) * 14 + Math.sin(f / 4) * 6;
  const X = 1150;
  const Y = 756;
  const man = [
    // legs (front leg striding)
    `M${X - 30} ${Y}C${X - 28} ${Y - 60} ${X - 22} ${Y - 130} ${X - 12} ${Y - 200}L${X + 10} ${Y - 200}C${X + 2} ${Y - 130} ${X - 8} ${Y - 60} ${X - 10} ${Y}Z`,
    `M${X + 14} ${Y}C${X + 12} ${Y - 70} ${X + 10} ${Y - 140} ${X + 8} ${Y - 200}L${X + 30} ${Y - 200}C${X + 32} ${Y - 140} ${X + 34} ${Y - 70} ${X + 34} ${Y}Z`,
    `M${X - 40} ${Y + 2}h32v-10h-26ZM${X + 12} ${Y + 2}h32v-10h-26Z`,
    // frock coat: broad shoulders, fitted waist, skirt flaring to the knee
    `M${X - 42} ${Y - 385}C${X - 50} ${Y - 340} ${X - 36} ${Y - 290} ${X - 32} ${Y - 250}C${X - 40} ${Y - 210} ${X - 50} ${Y - 170} ${X - 52} ${Y - 140}L${X + 10} ${Y - 150}L${X + 62 + tail} ${Y - 132 + tail * 0.3}C${X + 54 + tail * 0.6} ${Y - 180} ${X + 40} ${Y - 220} ${X + 34} ${Y - 250}C${X + 44} ${Y - 300} ${X + 48} ${Y - 350} ${X + 38} ${Y - 388}Z`,
    // collar + neck
    `M${X - 14} ${Y - 384}L${X - 12} ${Y - 404}L${X + 14} ${Y - 404}L${X + 16} ${Y - 384}Z`,
    // head with beard (profile facing left)
    `M${X - 18} ${Y - 402}C${X - 34} ${Y - 408} ${X - 40} ${Y - 432} ${X - 36} ${Y - 448}L${X - 45} ${Y - 462}L${X - 35} ${Y - 468}C${X - 32} ${Y - 490} ${X - 16} ${Y - 500} ${X + 4} ${Y - 500}C${X + 24} ${Y - 500} ${X + 30} ${Y - 478} ${X + 28} ${Y - 456}C${X + 28} ${Y - 432} ${X + 20} ${Y - 412} ${X + 8} ${Y - 402}Z`,
    // stovepipe hat
    `M${X - 46} ${Y - 494}L${X + 42} ${Y - 494}L${X + 40} ${Y - 506}L${X - 44} ${Y - 506}Z`,
    `M${X - 31} ${Y - 506}L${X - 33} ${Y - 628}L${X + 31} ${Y - 628}L${X + 28} ${Y - 506}Z`,
    // arm bent, hand at the lapel
    `M${X - 36} ${Y - 360}C${X - 56} ${Y - 320} ${X - 54} ${Y - 280} ${X - 30} ${Y - 262}L${X - 8} ${Y - 300}L${X - 16} ${Y - 310}L${X - 30} ${Y - 290}C${X - 38} ${Y - 310} ${X - 30} ${Y - 340} ${X - 22} ${Y - 360}Z`,
  ].join("");
  return (
    <Camera keys={[{ f: 0, z: 1.0, y: 20 }, { f: 75, z: 1.12, y: -30, x: 40 }]} handheld={3} seed={43}>
      <Layer depth={0.05}>
        <Paper />
        <EngravedSky h={1300} y={-300} dark={0.4} wash="dawn" washOp={0.3} />
        <Sun x={1150} y={330} r={110} rays={36} spin={0.5} rayLen={1700} />
      </Layer>
      <Layer depth={0.2}>
        <Clouds
          speed={7}
          clouds={[
            { x: -300, y: 80, w: 700, h: 170, seed: "lc1" },
            { x: 500, y: 20, w: 520, h: 140, seed: "lc2" },
            { x: 1200, y: 170, w: 640, h: 160, seed: "lc3" },
            { x: 1900, y: 60, w: 560, h: 150, seed: "lc4" },
            { x: 800, y: 300, w: 420, h: 110, seed: "lc5" },
          ]}
        />
      </Layer>
      <Layer depth={1}>
        <path d={geo.hill} fill={pal.ink} />
        <path d={hatch([[[-500, 1400], [-500, 900], [200, 820], [700, 770], [1100, 752], [1500, 770], [2000, 830], [2600, 900], [2600, 1400]]], { angle: 20, spacing: 6, seed: "hl" })} stroke={pal.inkSoft} strokeWidth={1} opacity={0.5} />
        <g transform={`skewX(${-8 + noise1(f / 8, 5) * 6})`} style={{ transformOrigin: "960px 800px", transformBox: "view-box" }}>
          <path d={geo.grassD} fill="none" stroke={pal.ink} strokeWidth={2.4} strokeLinecap="round" />
        </g>
        <g transform={`translate(${X} ${Y}) scale(1.1) translate(${-X} ${-Y})`}>
          <path d={man} fill="none" stroke={pal.glow} strokeWidth={5} opacity={0.5} />
          <path d={man} fill={pal.ink} />
        </g>
      </Layer>
      <Layer depth={1.4}>
        <Dust count={40} speed={2.2} color="inkSoft" seed="ldust" />
      </Layer>
    </Camera>
  );
};

// D. Tilt up the Lincoln Memorial as its columns draw themselves
const MemorialShot: React.FC = () => {
  const f = useCurrentFrame();
  const pal = usePalette();
  const geo = memo("cw:memorial", memorialItems);
  const t = easeInOut(clamp(f / 90));
  return (
    <Camera keys={[{ f: 0, x: 0, y: 60, z: 1.08 }, { f: 90, x: 0, y: -1180, z: 1.02 }]} handheld={3} seed={44}>
      <Layer depth={0.3}>
        <Paper />
        <EngravedSky x={-600} y={-2600} w={3200} h={1600} dark={0.25} />
        <Clouds speed={1.8} clouds={[{ x: 200, y: -2150, w: 600, h: 150, seed: "mc1" }, { x: 1300, y: -2250, w: 500, h: 130, seed: "mc2" }]} />
      </Layer>
      <Layer depth={1}>
        <InkDraw items={geo.items} start={-8} dur={44} overlap={0.45} hatchAt={20} hatchDur={20} washAt={22} washDur={20} />
        {geo.frieze.map((fr, i) => (
          <text key={i} x={fr.x} y={fr.y} textAnchor="middle" fontFamily={DISPLAY_FAMILY} fontWeight={700} fontSize={18} letterSpacing={3} fill={pal.ink} opacity={ramp(f, 40 + i * 2, 50 + i * 2)}>
            {fr.t}
          </text>
        ))}
        <path d="M-200 -1900L700 -1900L2000 1100L1300 1100Z" fill={pal.sun} opacity={0.08 + 0.03 * Math.sin(f / 8)} />
      </Layer>
      <Layer depth={1.3}>
        <Birds x0={-100} y0={-200 - t * 900} x1={2100} y1={-400 - t * 900} dur={70} count={6} seed="mbirds" />
        <Dust count={40} speed={0.4} color="glow" seed="mdust" y={-1600} h={2800} />
      </Layer>
    </Camera>
  );
};

export const tested: SceneDef = {
  id: "tested",
  seedBase: 40,
  shots: [
    { from: 0, dur: c(2.5), el: <CannonShot />, enter: "burn", origin: [300, 200], name: "cannons" },
    { from: c(2.5), dur: c(4.5) - c(2.5), el: <FenceShot />, enter: "morph", name: "fence" },
    { from: c(4.5), dur: c(7) - c(4.5), el: <LincolnShot />, enter: "ink", origin: [1150, 500], name: "lincoln" },
    { from: c(7), dur: c(10) - c(7), el: <MemorialShot />, enter: "whipUp", name: "memorial" },
  ],
  hits: [
    { f: FIRE_A[0], amp: 22, dur: 14, punch: 0.03 },
    { f: FIRE_B[0], amp: 10, dur: 10 },
    { f: FIRE_A[1], amp: 18, dur: 12, punch: 0.02 },
  ],
  Overlay: () => (
    <>
      <YearSlam text="1863" startFrame={c(0.5) - 5} fontSize={300} display scrim={0.75} exitAt={c(2.2)} />
      <Quote {...QUOTES.lincoln} start={c(4.5) + 3} end={c(10)} framesPerWord={3} fontSize={62} />
    </>
  ),
};
