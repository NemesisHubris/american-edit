// 2. THE FOUNDING — candle desk, quill writing, Independence Hall at dawn,
// the Liberty Bell, muskets in fog, rowboats crossing an icy river.
import { useCurrentFrame } from "remotion";
import { Camera, Layer } from "../components/Camera";
import { InkDraw } from "../components/InkDraw";
import { Paper } from "../components/Parchment";
import { Dust, Fog } from "../components/Particles";
import { Birds, Clouds, EngravedSky, Moon, Stars, Sun } from "../components/Sky";
import { InkSea, Ripples } from "../components/Water";
import { Flag } from "../components/Cloth";
import { LightLeak } from "../components/Effects";
import { Quote } from "../components/WordPop";
import { QUOTES } from "../quotes";
import {
  bellGeo,
  boatItems,
  booksItems,
  candleItems,
  deskItems,
  hallItems,
  inkwellItems,
  musketItems,
  quillItems,
  tricornItems,
} from "../art/founding";
import { bricks, F, grass, groundHatch, HT, L, stoneWall, tree } from "../art/kit";
import { engrave, ellipseP, hatch, polyD, Pt, rectP, smoothD } from "../lib/engrave";
import { clamp, easeInOut, easeOut, memo, ramp, TAU } from "../lib/math";
import { usePalette } from "../lib/palette";
import { hash, noise1, rng } from "../lib/random";
import { useUid } from "../lib/uid";
import { ITALIC_FAMILY, DISPLAY_FAMILY } from "../fonts";
import { sceneClock } from "../timeline";
import type { SceneDef } from "./types";

const c = sceneClock("founding");

const flameD = (x: number, y: number, h: number, lean: number, w: number) =>
  `M${x - w} ${y}C${x - w * 1.3} ${y - h * 0.4} ${x + lean - w * 0.4} ${y - h * 0.75} ${x + lean} ${y - h}C${x + lean + w * 0.4} ${y - h * 0.75} ${x + w * 1.3} ${y - h * 0.4} ${x + w} ${y}Q${x} ${y + w * 0.9} ${x - w} ${y}Z`;

// A. Candle flickering on a writing desk; light pool and swaying shadows
const CandleShot: React.FC = () => {
  const f = useCurrentFrame();
  const pal = usePalette();
  const id = useUid("cg");
  const FX = 820;
  const FY = 442;
  const geo = memo("fd:candle", () => {
    const wall = rectP(-500, -400, 2920, 1120);
    const tone = (x: number, y: number) => 0.18 + Math.hypot(x - FX, (y - FY) * 1.3) / 1500;
    const wallItems = engrave([wall], tone, { angle: 42, spacing: 5, levels: [0.3, 0.48, 0.66, 0.84], seed: "wall" }).map((l) => HT(l.d, l.w));
    // framed chart on the wall
    const frame = [
      F(polyD(rectP(1240, 120, 460, 330)), "paper", 0.9),
      ...engrave([rectP(1240, 120, 460, 330)], (x) => 0.2 + (x - 1240) / 900, { angle: 42, spacing: 5, levels: [0.4, 0.62], seed: "chart" }).map((l) => HT(l.d, l.w)),
      L(polyD(rectP(1240, 120, 460, 330)), 3),
      L(polyD(rectP(1220, 100, 500, 370)), 4),
      L(smoothD([[1290, 380], [1350, 300], [1420, 330], [1480, 240], [1560, 280], [1640, 200]]), 2),
      L(smoothD([[1300, 200], [1380, 230], [1400, 180], [1470, 190]]), 1.5),
      L(polyD(ellipseP(1600, 380, 34, 34, 24)), 1.5),
      L("M1600 340V420M1560 380H1640", 1.2),
    ];
    const desk = deskItems(960, 380);
    const candle = candleItems(FX, FY + 8, 700);
    const well = inkwellItems(1150, 712);
    const books = booksItems(1380, 716);
    const quill = quillItems(520);
    const papers: Pt[] = [[260, 780], [700, 760], [740, 900], [230, 930]];
    const paperItems = [
      F(polyD(papers), "paper", 1),
      L(polyD(papers), 2),
      HT(Array.from({ length: 7 }, (_, i) => `M${290 + i * 2} ${800 + i * 17}Q${480} ${790 + i * 17} ${680 - i * 3} ${785 + i * 17}`).join(""), 1.2, 0.8),
    ];
    return { wallItems, frame, desk, candle, well, books, quill, paperItems };
  });
  const fl = noise1(f / 2.6, 1);
  const h = 78 * (1 + 0.14 * noise1(f / 1.9, 2));
  const lean = 10 * noise1(f / 3.3, 3);
  const glow = 0.82 + 0.18 * fl;
  // shadows swing opposite to the flame lean
  const sh = -lean * 1.6;
  return (
    <Camera keys={[{ f: 0, z: 1.08, x: -40, y: 20 }, { f: 80, z: 1.22, x: 10, y: -10 }]} handheld={3} seed={21}>
      <Layer depth={0.55}>
        <Paper />
        <InkDraw items={geo.wallItems} start={0} dur={14} hatchAt={0} hatchDur={16} />
        <InkDraw items={geo.frame} start={6} dur={20} />
        <path d={`M1210 700L${1480 + sh * 8} ${80}L${1560 + sh * 8} ${80}L1290 700Z`} fill={pal.ink} opacity={0.18} />
      </Layer>
      <Layer depth={1}>
        <InkDraw items={geo.desk} start={0} dur={16} hatchAt={8} washAt={10} />
        <InkDraw items={geo.paperItems} start={4} dur={14} />
        <InkDraw items={geo.books} start={6} dur={18} />
        <InkDraw items={geo.well} start={8} dur={14} />
        <g transform={`translate(1150 620) rotate(${24 + noise1(f / 40, 5) * 1.2})`}>
          <InkDraw items={geo.quill} start={10} dur={18} />
        </g>
        <InkDraw items={geo.candle} start={2} dur={16} hatchAt={8} washAt={10} />
        <defs>
          <radialGradient id={id}>
            <stop offset="0" stopColor={pal.glow} stopOpacity={0.9} />
            <stop offset="0.4" stopColor={pal.flame} stopOpacity={0.35} />
            <stop offset="1" stopColor={pal.fire} stopOpacity={0} />
          </radialGradient>
        </defs>
        <ellipse cx={FX} cy={720} rx={560 * glow} ry={140 * glow} fill={`url(#${id})`} opacity={0.55} />
        <circle cx={FX + lean * 0.3} cy={FY - 40} r={260 * glow} fill={`url(#${id})`} opacity={0.75} />
        <path d={flameD(FX, FY, h, lean, 15)} fill={pal.flame} stroke={pal.ink} strokeWidth={1.5} />
        <path d={flameD(FX, FY - 4, h * 0.55, lean * 0.6, 7)} fill="#fffcee" />
        <path
          d={smoothD(Array.from({ length: 12 }, (_, i) => [FX + lean + Math.sin(i * 0.9 - f * 0.25) * (4 + i * 3), FY - h - i * 26] as Pt))}
          fill="none"
          stroke={pal.inkSoft}
          strokeWidth={2}
          opacity={0.5}
        />
      </Layer>
      <Layer depth={1.45}>
        <Dust count={45} x={300} y={100} w={1200} h={700} speed={0.3} color="glow" size={2.6} seed="cdust" opacity={0.9} />
      </Layer>
      <Layer depth={0} html>
        <LightLeak seed={3} intensity={0.35 * glow} />
      </Layer>
    </Camera>
  );
};

const LINES = [
  { text: "IN CONGRESS, July 4, 1776.", x: 360, y: 330, size: 50, width: 760, font: DISPLAY_FAMILY, weight: 700, a: 14, b: 40 },
  { text: "The unanimous Declaration of the thirteen united States of America,", x: 250, y: 450, size: 42, width: 1300, font: ITALIC_FAMILY, weight: 700, a: 40, b: 70 },
  { text: "When in the Course of human events, it becomes necessary for one people", x: 250, y: 545, size: 36, width: 1320, font: ITALIC_FAMILY, weight: 400, a: 70, b: 100 },
];

// B. The quill dips, then writes across the parchment in real time
const QuillShot: React.FC = () => {
  const f = useCurrentFrame();
  const pal = usePalette();
  const uid = useUid("ql");
  const quill = memo("fd:quill2", () => quillItems(640));
  const well = memo("fd:well2", () => inkwellItems(1680, 260));
  const sheet = memo("fd:sheet", () => {
    const r = rng("deckle");
    const pts: Pt[] = [];
    const edge = (x0: number, y0: number, x1: number, y1: number) => {
      for (let i = 0; i < 30; i++) {
        const t = i / 30;
        pts.push([x0 + (x1 - x0) * t + (r() - 0.5) * 5, y0 + (y1 - y0) * t + (r() - 0.5) * 5]);
      }
    };
    edge(150, 150, 1780, 170);
    edge(1780, 170, 1760, 1180);
    edge(1760, 1180, 130, 1170);
    edge(130, 1170, 150, 150);
    const rules: string[] = [];
    for (let y = 400; y < 1150; y += 95) rules.push(`M200 ${y}H1720`);
    return [F(polyD(pts), "paper", 1), HT(hatch([pts], { angle: 0, spacing: 6, tone: (x, y) => 0.1 + y / 3000 + Math.abs(x - 960) / 4000, threshold: 0.35, seed: "sheet" }), 0.8, 0.3), L(polyD(pts), 2), HT(rules.join(""), 0.8, 0.25)];
  });
  // pen path: dip, travel to the line start, then write
  const writing = LINES.find((l) => f >= l.a && f < l.b) ?? (f >= LINES[2].b ? LINES[2] : null);
  let px: number;
  let py: number;
  if (f < 14) {
    const dip = Math.sin((f / 14) * Math.PI);
    const t = easeInOut(clamp((f - 6) / 8));
    px = 1690 + (LINES[0].x - 1690) * t;
    py = 170 + dip * 60 + (LINES[0].y - 170) * t;
  } else if (writing) {
    const p = clamp((f - writing.a) / (writing.b - writing.a));
    px = writing.x + p * writing.width;
    py = writing.y - Math.abs(Math.sin(f * 1.9)) * writing.size * 0.55;
  } else {
    px = LINES[0].x;
    py = LINES[0].y;
  }
  return (
    <Camera keys={[{ f: 0, z: 1.28 }, { f: 90, z: 1.4 }]} handheld={3} seed={22} offset={{ x: (px - 960) * 0.55, y: (py - 540) * 0.5 }}>
      <Layer depth={0.4}>
        <rect x={-400} y={-400} width={2720} height={1900} fill={pal.wood} />
        <path d={hatch([rectP(-400, -400, 2720, 1900)], { angle: 80, spacing: 6, seed: "dsk" })} stroke={pal.ink} strokeWidth={1} opacity={0.35} />
      </Layer>
      <Layer depth={1}>
        <g transform="rotate(-2 960 540)">
          <InkDraw items={sheet} start={-6} dur={10} washAt={0} washDur={4} />
          <defs>
            {LINES.map((l, i) => {
              const p = f < l.a ? 0 : clamp((f - l.a) / (l.b - l.a));
              return (
                <clipPath key={i} id={`${uid}c${i}`}>
                  <rect x={l.x - 10} y={l.y - l.size * 1.2} width={p * l.width + 10} height={l.size * 1.8} />
                </clipPath>
              );
            })}
          </defs>
          {LINES.map((l, i) => (
            <text
              key={i}
              x={l.x}
              y={l.y}
              fontFamily={l.font}
              fontWeight={l.weight}
              fontSize={l.size}
              fill={pal.ink}
              textLength={l.width}
              lengthAdjust="spacingAndGlyphs"
              clipPath={`url(#${uid}c${i})`}
            >
              {l.text}
            </text>
          ))}
          <InkDraw items={well} start={-4} dur={10} />
          <g transform={`translate(${px} ${py}) rotate(${34 + Math.sin(f * 0.9) * 3})`}>
            <InkDraw items={quill} start={-4} dur={8} washAt={0} washDur={4} />
          </g>
        </g>
      </Layer>
      <Layer depth={1.5}>
        <Dust count={30} speed={0.3} color="glow" seed="qdust" />
      </Layer>
      <Layer depth={0} html>
        <LightLeak seed={5} intensity={0.45} />
      </Layer>
    </Camera>
  );
};

// C. Independence Hall draws itself at dawn: sun rising, rays sweeping, birds
const HallShot: React.FC = () => {
  const f = useCurrentFrame();
  const pal = usePalette();
  const geo = memo("fd:hall", () => {
    const hall = hallItems(960, 1000);
    const street = [F(polyD([[-400, 1000], [2320, 1000], [2320, 1500], [-400, 1500]]), "sand", 0.6), HT(groundHatch(-400, 2320, 1000, 1400, "street"), 1, 0.7), L("M-400 1000H2320", 2.6)];
    const trees = [...tree(120, 1010, 620, "t1"), ...tree(1820, 1010, 580, "t2", { width: 0.7 })];
    const lamp = (x: number) => [
      L(`M${x} 1000V720`, 5),
      L(`M${x - 18} 1000h36M${x - 10} 980h20`, 3),
      L(polyD([[x - 26, 720], [x + 26, 720], [x + 18, 660], [x - 18, 660]]), 2.4),
      F(polyD([[x - 26, 720], [x + 26, 720], [x + 18, 660], [x - 18, 660]]), "glow", 0.7),
      L(polyD([[x - 30, 660], [x + 30, 660], [x, 630]]), 2.4),
    ];
    return { hall: hall.items, street, trees, lamps: [...lamp(470), ...lamp(1450)] };
  });
  const sunY = 700 - easeOut(clamp(f / 90)) * 150;
  const sweep = -30 + f * 0.9;
  return (
    <Camera keys={[{ f: 0, z: 1.12, y: 180, x: 30 }, { f: 95, z: 1.0, y: -170, x: -20 }]} handheld={3} seed={23}>
      <Layer depth={0.15}>
        <Paper />
        <EngravedSky h={1400} y={-500} dark={0.35} wash="dawn" washOp={0.35} darkTop />
        <Sun x={1620} y={sunY} r={70} rays={30} spin={0.25} />
        <Clouds
          speed={1.2}
          clouds={[
            { x: 100, y: -120, w: 520, h: 130, seed: "h1" },
            { x: 900, y: -220, w: 420, h: 110, seed: "h2" },
            { x: 1500, y: 60, w: 380, h: 100, seed: "h3" },
          ]}
        />
      </Layer>
      <Layer depth={0.35}>
        <Birds x0={-200} y0={200} x1={2100} y1={60} dur={110} count={9} size={20} />
      </Layer>
      <Layer depth={0.8}>
        <InkDraw items={geo.street} start={0} dur={14} />
        <g transform="translate(960 1000) scale(0.9) translate(-960 -1000)">
          <InkDraw items={geo.hall} start={2} dur={46} overlap={0.12} hatchAt={30} hatchDur={20} washAt={36} washDur={20} />
        </g>
        {[0, 1, 2].map((k) => {
          const a = ((sweep + k * 16) * Math.PI) / 180;
          const x2 = 1620 + Math.cos(Math.PI + a * 0.4) * 2400;
          const y2 = sunY + Math.sin(Math.PI + a * 0.4) * -700 + 900;
          return <path key={k} d={`M1620 ${sunY}L${x2} ${y2 - 90}L${x2} ${y2 + 90}Z`} fill={pal.sun} opacity={0.12} />;
        })}
      </Layer>
      <Layer depth={1.25}>
        <InkDraw items={geo.trees} start={4} dur={30} />
        <InkDraw items={geo.lamps} start={8} dur={20} />
        <Dust count={40} speed={0.4} color="glow" seed="hdust" />
      </Layer>
    </Camera>
  );
};

// D. The Liberty Bell swings gently; its crack draws itself in
const BellShot: React.FC = () => {
  const f = useCurrentFrame();
  const pal = usePalette();
  const bell = memo("fd:bell", bellGeo);
  const back = memo("fd:bellback2", () => {
    const wall = rectP(-500, -400, 2920, 1900);
    const win: Pt[] = [[1380, 1000], [1380, 360], ...ellipseP(1560, 360, 180, 200, 30, Math.PI, TAU).slice(1, -1), [1740, 360], [1740, 1000]];
    const winInner = win.map(([x, y]) => [1560 + (x - 1560) * 0.86, 560 + (y - 560) * 0.92] as Pt);
    const light = (x: number, y: number) => 0.22 + Math.hypot(x - 1560, (y - 560) * 0.8) / 1700;
    return {
      wall: [
        F(polyD(wall), "brick", 0.35),
        HT(bricks(wall, 26, "bw"), 1.1, 0.35),
        ...engrave([wall], light, { angle: 40, spacing: 6, levels: [0.42, 0.6, 0.78], seed: "bwsh" }).map((l) => HT(l.d, l.w)),
      ],
      win: [
        F(polyD(win), "stone", 0.9),
        F(polyD(winInner), "dawn", 0.6),
        HT(hatch([winInner], { angle: 0, spacing: 7, tone: (_, y) => 0.8 - (y - 160) / 1100, threshold: 0.4, seed: "wsky" }), 1, 0.45),
        L(polyD(win), 3.5),
        L(polyD(winInner), 2.4),
        L("M1560 190V1000M1420 560H1700M1420 780H1700", 3),
      ],
    };
  });
  const swing = Math.sin(f / 13) * 4.5 * easeOut(clamp(f / 10));
  const crackP = ramp(f, 16, 40, easeInOut);
  return (
    <Camera keys={[{ f: 0, z: 1.02, y: 0 }, { f: 70, z: 1.16, y: 30 }]} handheld={3} seed={24}>
      <Layer depth={0.4}>
        <Paper />
        <InkDraw items={back.wall} start={0} dur={10} hatchAt={0} />
        <InkDraw items={back.win} start={2} dur={16} />
        <path d="M1400 300L1740 300L900 1200L180 1200Z" fill={pal.sun} opacity={0.13 + 0.04 * Math.sin(f / 9)} />
      </Layer>
      <Layer depth={1}>
        <g transform={`translate(820 150) rotate(${swing}) scale(0.82)`}>
          <g transform={`rotate(${-swing * 1.8} 0 ${bell.yOf(0.1)})`} opacity={ramp(f, 30, 36)}>
            <path d={`M-6 ${bell.yOf(0.1)}L6 ${bell.yOf(0.1)}L10 ${bell.yOf(1.04)}L-10 ${bell.yOf(1.04)}Z`} fill={pal.ink} />
            <ellipse cx={0} cy={bell.yOf(1.04) + 14} rx={26} ry={34} fill={pal.ink} />
          </g>
          <InkDraw items={bell.items} start={0} dur={28} hatchAt={14} washAt={16} />
          {crackP > 0 && (
            <path d={bell.crackD} fill="none" stroke={pal.ink} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - crackP} />
          )}
          <path id="insc" d={polyD(Array.from({ length: 31 }, (_, i) => bell.surf(0.06 + (i / 30) * 0.88, 0.12)), false)} fill="none" />
          <text fontFamily={DISPLAY_FAMILY} fontWeight={700} fontSize={15} letterSpacing={1.5} fill={pal.ink} opacity={ramp(f, 20, 34)}>
            <textPath href="#insc">PROCLAIM LIBERTY THRO&apos; ALL THE LAND</textPath>
          </text>
        </g>
      </Layer>
      <Layer depth={1.4}>
        <Dust count={80} x={500} y={0} w={1300} h={1080} speed={0.35} color="glow" size={2.8} seed="bdust" />
      </Layer>
    </Camera>
  );
};

// E. Muskets against a stone wall while fog rolls past
const MusketShot: React.FC = () => {
  const pal = usePalette();
  const geo = memo("fd:muskets", () => {
    const wall = stoneWall(-200, 600, 2320, 280, "fw", 5);
    const guns: { m: Pt; b: Pt }[] = [
      { m: [560, 380], b: [800, 1010] },
      { m: [810, 360], b: [1040, 1010] },
      { m: [1090, 400], b: [1270, 1010] },
    ];
    const muskets = guns.map((g, i) => {
      const len = Math.hypot(g.b[0] - g.m[0], g.b[1] - g.m[1]);
      const ang = (Math.atan2(g.b[1] - g.m[1], g.b[0] - g.m[0]) * 180) / Math.PI;
      return { items: musketItems(len - 20, `mk${i}`), ang, m: g.m };
    });
    const hills: Pt[] = [[-400, 700], ...Array.from({ length: 30 }, (_, i) => [-400 + i * 100, 520 - Math.sin(i * 0.7) * 50 - Math.sin(i * 0.23) * 60] as Pt), [2600, 700]];
    const far = [F(polyD(hills), "foliage", 0.35), HT(hatch([hills], { angle: 0, spacing: 5, seed: "fh" }), 1, 0.4), L(smoothD(hills.slice(1, -1)), 1.6)];
    const trees = [...tree(300, 560, 300, "ft1", { dark: 0.4 }), ...tree(1500, 540, 360, "ft2", { dark: 0.4 }), ...tree(1720, 560, 260, "ft3", { dark: 0.4 })];
    const ground = [F(polyD([[-400, 880], [2320, 880], [2320, 1500], [-400, 1500]]), "ground", 0.6), HT(groundHatch(-400, 2320, 880, 1300, "fgnd"), 1, 0.7)];
    return { wall, muskets, far, trees, ground, hat: tricornItems(1520, 600, 0.95), grass: grass(-300, 2300, 885, "fg", 0.1, 28) };
  });
  return (
    <Camera keys={[{ f: 0, z: 1.12, x: -60, y: 10 }, { f: 65, z: 1.04, x: 60, y: -10 }]} handheld={3} seed={25}>
      <Layer depth={0.2}>
        <Paper />
        <EngravedSky h={1000} y={-300} dark={0.15} />
      </Layer>
      <Layer depth={0.45}>
        <InkDraw items={geo.far} start={0} dur={12} />
        <InkDraw items={geo.trees} start={2} dur={16} />
        <Fog y={560} h={320} speed={3.2} opacity={1} count={12} seed="fog1" />
      </Layer>
      <Layer depth={1}>
        <InkDraw items={geo.ground} start={0} dur={10} />
        <InkDraw items={geo.wall} start={0} dur={18} hatchAt={8} washAt={10} />
        <path d={geo.grass} fill="none" stroke={pal.ink} strokeWidth={1.6} opacity={0.8} />
        <InkDraw items={geo.hat} start={10} dur={12} />
        {geo.muskets.map((m, i) => (
          <g key={i} transform={`translate(${m.m[0]} ${m.m[1]}) rotate(${m.ang}) scale(1 1.5)`}>
            <InkDraw items={m.items} start={6 + i * 4} dur={16} />
          </g>
        ))}
      </Layer>
      <Layer depth={1.5}>
        <Fog y={900} h={380} speed={5} opacity={0.95} count={12} seed="fog2" />
        <Fog y={640} h={260} speed={4} opacity={0.55} count={10} seed="fog3" />
      </Layer>
    </Camera>
  );
};

// F. Night crossing: boats with pulling oars, drifting ice, falling snow
const RowShot: React.FC = () => {
  const f = useCurrentFrame();
  const pal = usePalette();
  const geo = memo("fd:row", () => {
    const shore: Pt[] = [[-400, 560], ...Array.from({ length: 60 }, (_, i) => [-400 + i * 50, 470 - Math.abs(Math.sin(i * 1.3)) * 50 - Math.sin(i * 0.4) * 30 - (hash(i, 3) > 0.7 ? 40 : 0)] as Pt), [2600, 560]];
    const shoreItems = [F(polyD(shore), "night", 0.85), HT(hatch([shore], { angle: 70, spacing: 3.4, seed: "sh1" }), 1, 0.7), HT(hatch([shore], { angle: -20, spacing: 4, seed: "sh2" }), 1, 0.5)];
    const r = rng("ice");
    const ice = Array.from({ length: 22 }, (_, i) => {
      const n = 6 + Math.floor(r() * 4);
      const s = 20 + r() * 70;
      const pts = Array.from({ length: n }, (_, k) => {
        const a = (k / n) * TAU;
        return [Math.cos(a) * s * (0.6 + r() * 0.6), Math.sin(a) * s * 0.3 * (0.6 + r() * 0.5)] as Pt;
      });
      return { pts, x: r() * 2600 - 300, y: 560 + Math.pow(r(), 0.7) * 520, sp: 0.6 + r() * 1.4, id: i };
    });
    return { shoreItems, ice, boat1: boatItems(760, "b1"), boat2: boatItems(760, "b2") };
  });
  const bx = 640 + f * 1.4;
  const bob = Math.sin(f / 10) * 5;
  const row = (f * 0.22) % TAU;
  const figure = (x: number, y: number, lean: number, k: number) => (
    <g key={k} transform={`translate(${x} ${y}) rotate(${lean})`} fill={pal.ink}>
      <path d="M-18 0Q-22 -50 -10 -70L10 -70Q22 -50 18 0Z" />
      <circle cx={0} cy={-84} r={13} />
      <path d="M-22 -92Q0 -110 22 -92L14 -86Q0 -96 -14 -86Z" />
    </g>
  );
  const rowers = [0, 1, 2, 3, 4].map((k) => {
    const x = -250 + k * 110;
    const lean = Math.sin(row + k * 0.2) * 16;
    return figure(x, -20, lean, k);
  });
  const oars = [0, 1, 2, 3, 4].map((k) => {
    const x = -240 + k * 110;
    const a = -150 + Math.sin(row + k * 0.2) * 22;
    const dip = Math.cos(row + k * 0.2) > 0 ? 1 : 0.4;
    const len = 300;
    const ex = x + Math.cos((a * Math.PI) / 180) * len;
    const ey = -40 + Math.abs(Math.sin((a * Math.PI) / 180)) * len * 0.35 * dip + 40;
    return <line key={k} x1={x} y1={-40} x2={ex} y2={ey} stroke={pal.ink} strokeWidth={5} strokeLinecap="round" />;
  });
  const splash = Math.cos(row) > 0.95;
  return (
    <Camera keys={[{ f: 0, z: 1.3, x: -60, y: 130 }, { f: 90, z: 1.42, x: 120, y: 150 }]} handheld={4} seed={26}>
      <Layer depth={0.1}>
        <rect x={-400} y={-400} width={2720} height={1100} fill={pal.night} />
        <EngravedSky h={1000} y={-400} dark={0.9} cross wash="night" washOp={0.7} />
        <Stars count={90} h={700} y={-200} seed="nstars" />
        <Moon x={1480} y={170} r={80} />
      </Layer>
      <Layer depth={0.35}>
        <InkDraw items={geo.shoreItems} start={0} dur={10} />
      </Layer>
      <Layer depth={0.7}>
        <InkSea top={540} bottom={1300} rows={36} amp={10} speed={0.8} drift={-0.8} wash="night" washNear="night" seed="delaware" />
        {Array.from({ length: 14 }, (_, i) => (
          <line key={i} x1={1440 + (hash(i, 7) - 0.5) * 120} y1={560 + i * 34} x2={1440 + (hash(i, 7) - 0.5) * 120 + 30 + hash(i, 8) * 60} y2={560 + i * 34} stroke={pal.moon} strokeWidth={3} opacity={0.5 + 0.4 * Math.sin(f / 5 + i)} />
        ))}
        {geo.ice.map((c) => {
          const x = ((c.x - f * c.sp + 3000) % 2800) - 400;
          const k = (c.y - 540) / 540;
          const pts = c.pts.map(([px, py]) => [x + px * (0.5 + k), c.y + py * (0.5 + k) + Math.sin(f / 12 + c.id) * 3] as Pt);
          return (
            <g key={c.id}>
              <path d={polyD(pts)} fill={pal.foam} opacity={0.9} />
              <path d={hatch([pts], { angle: 10, spacing: 3.2, tone: (_, y) => (y - c.y) / 20 + 0.5, threshold: 0.5, seed: `i${c.id}` })} stroke={pal.ink} strokeWidth={1} opacity={0.7} />
              <path d={polyD(pts)} fill="none" stroke={pal.ink} strokeWidth={1.8} />
            </g>
          );
        })}
      </Layer>
      <Layer depth={0.85}>
        <g transform={`translate(${1250 + f * 0.9} ${640 + Math.sin(f / 11) * 3}) scale(0.5)`}>
          <InkDraw items={geo.boat2} start={0} dur={12} />
          {[0, 1, 2, 3].map((k) => figure(-200 + k * 120, -20, Math.sin(row + 1 + k) * 14, k))}
        </g>
      </Layer>
      <Layer depth={1}>
        <g transform={`translate(${bx} ${800 + bob}) rotate(${Math.sin(f / 14) * 1.5})`}>
          {oars}
          <InkDraw items={geo.boat1} start={0} dur={14} />
          {rowers}
          <g fill={pal.ink}>
            <path d="M250 -20L262 -150Q270 -190 290 -196L312 -196Q330 -190 336 -150L330 -20Z" />
            <path d="M262 -150Q230 -120 214 -60L240 -60Q250 -110 272 -130Z" />
            <circle cx={300} cy={-214} r={17} />
            <path d="M272 -222Q300 -246 328 -222L318 -214Q300 -228 282 -214Z" />
            <path d="M160 -20Q156 -90 172 -120L200 -120Q210 -90 206 -20Z" />
            <circle cx={186} cy={-136} r={14} />
          </g>
          <path d="M196 -120L150 -380" stroke={pal.ink} strokeWidth={5} />
          <g transform="translate(150 -380) rotate(12)">
            <Flag x={0} y={0} w={200} h={120} amp={0.7} speed={0.6} waves={1.2} stars={13} outline={2} />
          </g>
        </g>
        {splash && <Ripples x={bx - 220} y={880} r={140} squash={0.25} period={24} rings={3} />}
      </Layer>
      <Layer depth={1.4}>
        {Array.from({ length: 90 }, (_, i) => {
          const x = ((hash(i, 1) * 2400 + f * (1.5 + hash(i, 3))) % 2400) - 240 + Math.sin(f / 15 + i) * 20;
          const y = ((hash(i, 2) * 1300 + f * (3 + hash(i, 4) * 3)) % 1300) - 110;
          return <circle key={i} cx={x} cy={y} r={1.5 + hash(i, 5) * 3} fill={pal.foam} opacity={0.75} />;
        })}
      </Layer>
    </Camera>
  );
};

export const founding: SceneDef = {
  id: "founding",
  seedBase: 10,
  shots: [
    { from: 0, dur: c(2.5), el: <CandleShot />, enter: "burn", origin: [960, 1000], name: "candle" },
    { from: c(2.5), dur: c(5) - c(2.5), el: <QuillShot />, enter: "morph", name: "quill" },
    { from: c(5), dur: c(8) - c(5), el: <HallShot />, enter: "whip", name: "independence hall" },
    { from: c(8), dur: c(10) - c(8), el: <BellShot />, enter: "ink", origin: [960, 500], name: "liberty bell" },
    { from: c(10), dur: c(12) - c(10), el: <MusketShot />, enter: "morph", name: "muskets" },
    { from: c(12), dur: c(15) - c(12), el: <RowShot />, enter: "ink", origin: [1400, 300], name: "crossing" },
  ],
  hits: [{ f: c(5), amp: 6, dur: 10 }],
  Overlay: () => <Quote {...QUOTES.declaration} start={c(5.5)} end={c(11)} framesPerWord={4} />,
};
