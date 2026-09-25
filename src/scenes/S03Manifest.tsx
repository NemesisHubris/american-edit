// 3. MANIFEST DESTINY — 1805. The map draws itself; Louisiana floods in;
// Lewis & Clark's canoe travels to the Pacific; waves crash; the Alamo inset;
// wagons roll west; states fill to the Pacific.
import { Sequence, useCurrentFrame } from "remotion";
import { Camera, Layer } from "../components/Camera";
import { InkDraw, Trail } from "../components/InkDraw";
import { Paper } from "../components/Parchment";
import { Dust, Embers, Fog, Smoke, Sparks } from "../components/Particles";
import { Birds, Clouds, EngravedSky, Sun } from "../components/Sky";
import { CrashWave, InkSea } from "../components/Water";
import { Canoe, MapBase, MapCues, MapWagon, Ship } from "../components/MapScene";
import { YearSlam } from "../components/YearSlam";
import { Quote } from "../components/WordPop";
import { QUOTES } from "../quotes";
import { alamoItems, oxBody, pine, pioneerBody, rock, wagonBody } from "../art/west";
import { F, grass, groundHatch, HT, L, wheel } from "../art/kit";
import { hatch, polyD, Pt, rectP, smoothD, ellipseP } from "../lib/engrave";
import { clamp, easeInOut, lerp, memo, ramp, TAU } from "../lib/math";
import { usePalette } from "../lib/palette";
import { hash, noise2 } from "../lib/random";
import { useUid } from "../lib/uid";
import { along, getUSMap, LEWIS_CLARK, OREGON_TRAIL, PLACES } from "../lib/usmap";
import { DISPLAY_FAMILY, ITALIC_FAMILY } from "../fonts";
import { sceneClock } from "../timeline";
import type { SceneDef } from "./types";

const c = sceneClock("manifest");

const CUES: MapCues = {
  border: 0,
  sea: 0,
  compass: 2,
  land: 6,
  original: c(1.2),
  labels: c(1.8),
  rivers: c(2.0),
  louisiana: c(2.6),
  westStart: c(15.1),
  westDur: 44,
};
const TRAIL0 = c(2.9);
const TRAIL1 = c(6.8);
const OREGON0 = c(15);
const OREGON1 = c(16.6);

const PACIFIC_COAST: [number, number][] = [
  [-124.6, 48.2], [-124.2, 46.8], [-124.0, 45.2], [-124.2, 43.6], [-124.4, 42.2], [-124.1, 40.6], [-123.6, 39.0], [-122.8, 37.9], [-122.1, 36.8], [-121.2, 35.6], [-120.3, 34.6], [-118.9, 34.0], [-117.6, 33.2],
];

type Cam = { x: number; y: number; z: number };

const MapShot: React.FC<{ at: number; cam: (sf: number, canoe: { x: number; y: number }) => Cam; oregon?: boolean; waves?: boolean }> = ({ at, cam, oregon, waves }) => {
  const f = useCurrentFrame();
  const pal = usePalette();
  const uid = useUid("md");
  const sf = f + at;
  const m = getUSMap();
  const lc = memo("md:lc", () => along(m.pts(LEWIS_CLARK)));
  const ot = memo("md:ot", () => along(m.pts(OREGON_TRAIL)));
  const coast = memo("md:pc", () => m.pts(PACIFIC_COAST));
  const trailP = ramp(sf, TRAIL0, TRAIL1, easeInOut);
  const canoe = lc.at(trailP);
  const cm = cam(sf, canoe);
  const oP = ramp(sf, OREGON0, OREGON1, easeInOut);
  return (
    <Camera keys={[{ f: 0, x: cm.x, y: cm.y, z: cm.z }]} handheld={3} seed={30 + at}>
      <Layer depth={1}>
        <Sequence from={-at} layout="none">
          <MapBase cues={CUES} />
        </Sequence>
        <Ship x={180} y={540} seed={2} speed={0.3} />
        <Ship x={1700} y={640} seed={4} dir={-1} speed={0.25} />
        <Ship x={1250} y={930} seed={6} speed={0.2} s={0.8} />
        {trailP > 0 && <Trail d={lc.d} progress={trailP} w={3.5} dash="0.1 9" id={`${uid}lc`} color="brick" />}
        {trailP > 0 && trailP < 1 && <Canoe x={canoe.x} y={canoe.y - 6} angle={canoe.angle} s={1.15} />}
        {trailP >= 1 && (
          <g>
            <circle cx={canoe.x} cy={canoe.y} r={10 + Math.sin(sf / 4) * 2} fill="none" stroke={pal.brick} strokeWidth={2.5} />
            <text x={canoe.x + 14} y={canoe.y - 12} fontFamily={ITALIC_FAMILY} fontSize={12} fill={pal.ink}>
              Fort Clatsop
            </text>
          </g>
        )}
        {oregon && oP > 0 && <Trail d={ot.d} progress={oP} w={3} dash="0.1 8" id={`${uid}ot`} color="ink" />}
        {oregon &&
          [0, 1, 2, 3].map((k) => {
            const p = oP - k * 0.07;
            if (p <= 0) return null;
            const q = ot.at(p);
            return <MapWagon key={k} x={q.x} y={q.y - 6} angle={q.angle} s={0.45} roll={-sf * 12} />;
          })}
        {waves &&
          coast.map(([x, y], i) =>
            [0, 1, 2].map((k) => {
              const t = (((sf / 30 + i * 0.37 + k / 3) % 1) + 1) % 1;
              const px = x - 70 + t * 55;
              return (
                <path
                  key={`${i}-${k}`}
                  d={`M${px - 12} ${y + k * 6}q12 -10 24 0`}
                  fill="none"
                  stroke={pal.ink}
                  strokeWidth={1.8}
                  opacity={Math.sin(t * Math.PI) * 0.8}
                />
              );
            }),
          )}
      </Layer>
      <Layer depth={1.35}>
        <Dust count={36} speed={0.4} color="inkSoft" size={2.2} seed={`md${at}`} opacity={0.5} />
      </Layer>
    </Camera>
  );
};

const centerOn = (p: { x: number; y: number }, z: number): Cam => ({ x: p.x - 960, y: p.y - 540, z });

// D. "Ocian in view!": bluff with two explorers, sea stacks, breakers, gulls
const PacificShot: React.FC = () => {
  const f = useCurrentFrame();
  const pal = usePalette();
  const geo = memo("md:pacific", () => {
    const stack1: Pt[] = [[1160, 760], [1170, 560], [1200, 470], [1250, 440], [1290, 470], [1310, 580], [1330, 760]];
    const stack2: Pt[] = [[1380, 740], [1395, 620], [1420, 590], [1450, 610], [1470, 740]];
    const cliff: Pt[] = [[1500, 1200], [1520, 760], [1560, 600], [1600, 420], [1700, 330], [1900, 300], [2400, 280], [2400, 1200]];
    const pines = [...pine(1640, 420, 180, "p1"), ...pine(1740, 340, 220, "p2"), ...pine(1860, 320, 200, "p3"), ...pine(1990, 310, 240, "p4"), ...pine(2120, 300, 210, "p5")];
    const bluff: Pt[] = [[-500, 1200], [-500, 560], [-100, 540], [260, 560], [460, 600], [600, 700], [700, 900], [740, 1200]];
    return {
      stacks: [...rock(stack1, "st1", false), ...rock(stack2, "st2", false)],
      cliff: rock(cliff, "cliff", false),
      pines,
      bluff: [...rock(bluff, "bluff", true), HT(grass(-480, 520, (x) => 548 + Math.max(0, x - 260) * 0.2, "bg", 0.12, 26), 1.5, 0.9)],
    };
  });
  return (
    <Camera keys={[{ f: 0, z: 1.02, x: 40 }, { f: 60, z: 1.12, x: -40, y: -10 }]} handheld={4} seed={33}>
      <Layer depth={0.1}>
        <Paper />
        <EngravedSky h={900} y={-300} dark={0.25} />
        <Sun x={600} y={330} r={60} spin={0.2} />
        <Clouds speed={1.5} clouds={[{ x: 200, y: 100, w: 500, h: 130, seed: "pc1" }, { x: 1000, y: 40, w: 420, h: 110, seed: "pc2" }]} />
      </Layer>
      <Layer depth={0.35}>
        <InkSea top={470} rows={40} amp={12} speed={1.2} drift={0.5} seed="pac" />
        <Birds x0={-100} y0={300} x1={2000} y1={200} dur={70} count={6} size={18} seed="gulls" />
      </Layer>
      <Layer depth={0.7}>
        <InkDraw items={geo.stacks} start={0} dur={18} />
        {[1245, 1425].map((x, i) => (
          <path key={i} d={`M${x - 110} ${755 - i * 16}q${55} ${-20 - 12 * Math.sin(f / 5 + i)} 110 0q55 ${-20 - 12 * Math.sin(f / 6 + i)} 110 0`} fill="none" stroke={pal.foam} strokeWidth={6} opacity={0.9} />
        ))}
        <CrashWave x={900} y={900} w={900} h={260} period={44} seed="cw1" />
        <Sparks x={1250} y={740} t0={Math.floor(f / 22) * 22} count={16} speed={9} life={16} gravity={0.5} color="foam" seed={`sp${Math.floor(f / 22)}`} width={3} />
      </Layer>
      <Layer depth={0.9}>
        <InkDraw items={geo.cliff} start={2} dur={16} />
        <InkDraw items={geo.pines} start={8} dur={18} />
      </Layer>
      <Layer depth={1.3}>
        <InkDraw items={geo.bluff} start={0} dur={14} />
        <g fill={pal.ink}>
          <g transform="translate(330 566) scale(1.6)">
            <path d="M-14 0L-10 -60Q0 -80 10 -60L14 0Z" />
            <circle cx={0} cy={-74} r={10} />
            <path d="M-16 -80Q0 -96 16 -80L10 -76Q0 -84 -10 -76Z" />
            <path d={`M8 -56L${40} ${-66 - Math.sin(f / 10) * 3}`} stroke={pal.ink} strokeWidth={5} strokeLinecap="round" />
          </g>
          <g transform="translate(220 560) scale(1.6)">
            <path d="M-14 0L-12 -56Q0 -76 12 -56L14 0Z" />
            <circle cx={0} cy={-70} r={10} />
            <path d="M-3 -58L-3 -130" stroke={pal.ink} strokeWidth={4} />
          </g>
        </g>
      </Layer>
      <Layer depth={1.6}>
        <Fog y={900} h={200} speed={2} opacity={0.4} seed="pfog" />
      </Layer>
    </Camera>
  );
};

// E. A breaker crashes right at the camera
const CrashShot: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <Camera keys={[{ f: 0, z: 1.05 }, { f: 45, z: 1.18, y: 30 }]} handheld={7} seed={34}>
      <Layer depth={0.15}>
        <Paper />
        <EngravedSky h={800} y={-300} dark={0.3} />
        <Clouds speed={2.5} clouds={[{ x: 300, y: 60, w: 600, h: 150, seed: "cc1" }, { x: 1300, y: 20, w: 420, h: 120, seed: "cc2" }]} />
      </Layer>
      <Layer depth={0.5}>
        <InkSea top={420} rows={38} amp={18} speed={1.8} drift={1.2} seed="crashsea" />
      </Layer>
      <Layer depth={1}>
        <CrashWave x={820} y={1120} w={1900} h={760} phase={0.28 + (f / 45) * 0.7} seed="big" />
        <Sparks x={1300} y={640} t0={22} count={60} speed={22} life={24} gravity={0.7} color="foam" seed="bigspray" width={4} spread={Math.PI * 1.4} />
        <Smoke x={1400} y={700} count={10} start={24} life={30} size={120} spread={7} vx={4} vy={-2} shade={0} color="foam" outline={1} seed="spraypuff" />
      </Layer>
      <Layer depth={1.8}>
        {f > 26 &&
          Array.from({ length: 22 }, (_, i) => {
            const a = f - 26 - hash(i, 3) * 6;
            if (a < 0) return null;
            const x = hash(i, 1) * 1920;
            const y = hash(i, 2) * 1080;
            return <circle key={i} cx={x} cy={y + a * 2} r={8 + hash(i, 4) * 30} fill="#fffaf0" opacity={Math.max(0, 0.5 - a * 0.03)} />;
          })}
      </Layer>
    </Camera>
  );
};

// F. Framed inset: the Alamo facade draws itself while smoke drifts past
const AlamoShot: React.FC = () => {
  const f = useCurrentFrame();
  const pal = usePalette();
  const uid = useUid("al");
  const alamo = memo("md:alamo", () => alamoItems(960, 740));
  const frame = memo("md:alframe", () => {
    const outer = ellipseP(960, 520, 690, 430, 90);
    const inner = ellipseP(960, 520, 660, 405, 90);
    const beads: string[] = [];
    for (let k = 0; k < 72; k++) {
      const a = (k / 72) * TAU;
      beads.push(polyD(ellipseP(960 + Math.cos(a) * 676, 520 + Math.sin(a) * 418, 5, 5, 8)));
    }
    return [
      L(polyD(outer), 5),
      L(polyD(inner), 2.2),
      L(beads.join(""), 1.4),
      L(polyD(ellipseP(960, 520, 710, 448, 90)), 1.4),
      ...[-1, 1].map((sd) => L(smoothD([[960 + sd * 600, 860], [960 + sd * 720, 900], [960 + sd * 760, 820], [960 + sd * 700, 790], [960 + sd * 680, 840]]), 2.4)),
      F(polyD(rectP(730, 60, 460, 70)), "paper", 1),
      L(polyD(rectP(730, 60, 460, 70)), 3),
      L(polyD(rectP(740, 70, 440, 50)), 1.2),
    ];
  });
  return (
    <Camera keys={[{ f: 0, z: 0.98 }, { f: 75, z: 1.14, y: -20 }]} handheld={3} seed={35}>
      <Layer depth={0.5}>
        <g transform="translate(960 540) scale(3.2) translate(-760 -760)">
          <MapBase cues={{ border: -999, sea: -999, land: -999, original: -999, louisiana: -999, rivers: -999, labels: -999, allFilled: false }} showCartouche={false} />
        </g>
        <rect x={-400} y={-400} width={2720} height={1900} fill={pal.paper} opacity={0.55} />
      </Layer>
      <Layer depth={1}>
        <defs>
          <clipPath id={`${uid}c`}>
            <path d={polyD(ellipseP(960, 520, 662, 407, 90))} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${uid}c)`}>
          <rect x={200} y={0} width={1600} height={1100} fill={pal.paper} />
          <EngravedSky x={200} y={90} w={1600} h={740} dark={0.35} seed="alsky" />
          <Clouds speed={1.8} span={[100, 1900]} clouds={[{ x: 400, y: 200, w: 380, h: 100, seed: "ac1" }, { x: 1200, y: 170, w: 300, h: 90, seed: "ac2" }]} />
          <path d={groundHatch(200, 1800, 740, 960, "algnd")} stroke={pal.ink} strokeWidth={1} opacity={0.6} />
          <InkDraw items={alamo} start={0} dur={40} overlap={0.2} hatchAt={22} washAt={26} />
          <Smoke x={1700} y={560} rate={0.3} life={90} size={90} vx={-6} vy={-0.6} spread={1.2} shade={0.75} seed="alsmoke" opacity={0.8} />
          <Smoke x={1800} y={760} rate={0.25} life={90} size={110} vx={-7} vy={-0.4} spread={1.2} shade={0.85} seed="alsmoke2" opacity={0.7} />
          <Embers x={1200} y={900} w={900} count={40} rise={2.5} seed="alemb" />
        </g>
        <InkDraw items={frame} start={0} dur={20} />
        <text x={960} y={107} textAnchor="middle" fontFamily={DISPLAY_FAMILY} fontWeight={800} fontSize={32} letterSpacing={7} fill={pal.ink} opacity={ramp(f, 14, 26)}>
          THE ALAMO · MDCCCXXXVI
        </text>
      </Layer>
      <Layer depth={1.4}>
        <Dust count={30} seed="aldust" speed={0.4} />
      </Layer>
    </Camera>
  );
};

// G. Wagons roll west: turning wheels, plodding oxen, dust trailing behind
const WagonShot: React.FC = () => {
  const f = useCurrentFrame();
  const pal = usePalette();
  const geo = memo("md:wagons", () => {
    const peaks = Array.from({ length: 26 }, (_, i) => ({ px: -600 + i * 125 + hash(i, 51) * 80, h: 90 + hash(i, 52) * 230, sl: 0.9 + hash(i, 53) * 0.8 }));
    const mount: Pt[] = [[-600, 560]];
    for (let x = -600; x <= 2600; x += 18) {
      let ridge = 0;
      for (const pk of peaks) ridge = Math.max(ridge, pk.h - Math.abs(x - pk.px) * pk.sl);
      mount.push([x, 500 - ridge + noise2(x / 30, 1, 3) * 8]);
    }
    mount.push([2600, 560]);
    const snow: string[] = [];
    for (let i = 1; i < mount.length - 2; i++) {
      const [x, y] = mount[i];
      if (y < 300 && i % 2 === 0) snow.push(`M${x - 22} ${y + 30}L${x - 8} ${y + 18}L${x} ${y + 26}L${x + 10} ${y + 16}L${x + 24} ${y + 34}`);
    }
    const prairie: Pt[] = [[-600, 1400], [-600, 500]];
    for (let x = -600; x <= 2600; x += 60) prairie.push([x, 500 + Math.sin(x / 300) * 16]);
    prairie.push([2600, 1400]);
    return {
      mount: [F(polyD(mount), "skyDeep", 0.35), HT(hatch([mount], { angle: 70, spacing: 3.6, tone: (x, y) => 0.25 + (y - 200) / 500 + (Math.sin(x / 60) > 0 ? 0.25 : 0), threshold: 0.45, seed: "mt" }), 1, 0.65), L(polyD(mount.slice(1, -1), false), 1.8), L(snow.join(""), 3, { color: "paper" })],
      prairie: [F(polyD(prairie), "sand", 0.6), HT(groundHatch(-600, 2600, 510, 1300, "pr", 7), 1, 0.6), L(smoothD(prairie.slice(2, -1)), 2)],
      ruts: L("M-600 745C200 735 900 755 2600 745M-600 775C200 765 900 785 2600 775", 2.2, { op: 0.7 }),
      wagon: wagonBody(),
      bigWheel: wheel(62, 14),
      smallWheel: wheel(46, 12),
      ox: oxBody(),
      person: pioneerBody(),
      fgrass: grass(-600, 2600, 1000, "fgr", 0.08, 70),
    };
  });
  const speed = 4.2;
  const dist = f * speed;
  const wagons = [0, 1, 2].map((i) => {
    const s = 1.2 - i * 0.3;
    const baseX = 860 + i * 620 - dist * s;
    const y = 760 - i * 90;
    const bob = Math.sin(f / 5 + i) * 2;
    return (
      <g key={i} transform={`translate(${baseX} ${y + bob}) scale(${s})`}>
        <Smoke x={220} y={-10} rate={0.35} life={40} size={60} vx={1.5} vy={-0.8} spread={1.2} shade={0.1} color="sand" outline={1} seed={`wd${i}`} opacity={0.75} />
        {[-120, 120].map((wx, k) => (
          <g key={k} transform={`translate(${wx} ${wx > 0 ? -62 : -46}) rotate(${(-dist / (wx > 0 ? 62 : 46)) * 57.3})`}>
            <InkDraw items={wx > 0 ? geo.bigWheel : geo.smallWheel} start={-10} dur={4} washAt={0} washDur={2} />
          </g>
        ))}
        <InkDraw items={geo.wagon} start={-2 + i * 3} dur={14} hatchAt={8} washAt={8} />
        {[-420, -640].map((ox, k) => (
          <g key={k} transform={`translate(${ox} 0)`}>
            {[0, 1, 2, 3].map((leg) => {
              const lx = [-110, -80, 70, 100][leg];
              const sw = Math.sin(f * 0.35 + leg * Math.PI * 0.5 + k) * 16;
              return <path key={leg} d={`M${lx} -60l${Math.sin((sw * Math.PI) / 180) * 50} 58`} stroke={pal.ink} strokeWidth={9} strokeLinecap="round" />;
            })}
            <InkDraw items={geo.ox} start={i * 3} dur={12} />
          </g>
        ))}
        {i === 0 && (
          <g transform={`translate(-260 ${Math.abs(Math.sin(f / 4)) * -4})`}>
            {[0, 1].map((leg) => (
              <path key={leg} d={`M0 -40l${Math.sin(f * 0.35 + leg * Math.PI) * 14} 40`} stroke={pal.ink} strokeWidth={6} strokeLinecap="round" />
            ))}
            <InkDraw items={geo.person} start={0} dur={10} />
          </g>
        )}
      </g>
    );
  });
  return (
    <Camera keys={[{ f: 0, z: 1.08, x: 80 }, { f: 70, z: 1.12, x: -120 }]} handheld={4} seed={36}>
      <Layer depth={0.1}>
        <Paper />
        <EngravedSky h={900} y={-300} dark={0.28} />
        <Clouds speed={1} clouds={[{ x: 100, y: 60, w: 520, h: 140, seed: "wc1" }, { x: 1000, y: 110, w: 420, h: 110, seed: "wc2" }, { x: 1700, y: 30, w: 380, h: 100, seed: "wc3" }]} />
      </Layer>
      <Layer depth={0.25}>
        <InkDraw items={geo.mount} start={0} dur={14} />
      </Layer>
      <Layer depth={0.6}>
        <InkDraw items={geo.prairie} start={0} dur={10} />
        <InkDraw items={[geo.ruts]} start={2} dur={10} />
      </Layer>
      <Layer depth={1}>{wagons.slice().reverse()}</Layer>
      <Layer depth={1.7}>
        <g transform={`translate(${((f * speed * 1.7) % 400) - 200} 0)`}>
          <path d={geo.fgrass} fill="none" stroke={pal.ink} strokeWidth={2.4} strokeLinecap="round" opacity={0.85} />
        </g>
        <Dust count={40} speed={1.5} color="inkSoft" seed="wdust" size={2.6} />
      </Layer>
    </Camera>
  );
};

const m0 = () => getUSMap();
const at = (k: keyof typeof PLACES) => m0().proj(PLACES[k]);

export const manifest: SceneDef = {
  id: "manifest",
  seedBase: 30,
  shots: [
    {
      from: 0,
      dur: c(2.5),
      el: <MapShot at={0} cam={(sf) => ({ x: lerp(30, -10, easeInOut(clamp(sf / 75))), y: 10, z: lerp(0.97, 1.06, easeInOut(clamp(sf / 75))) })} />,
      enter: "burn",
      origin: [1500, 900],
      name: "map wide",
    },
    {
      from: c(2.5),
      dur: c(5) - c(2.5),
      el: (
        <MapShot
          at={c(2.5)}
          cam={(sf, canoe) => {
            const t = easeInOut(clamp((sf - c(2.5)) / 75));
            const stl = at("stLouis");
            const k = clamp(t * 1.6);
            const p = { x: lerp(stl[0] - 60, canoe.x, k), y: lerp(stl[1] + 40, canoe.y, k) };
            return centerOn(p, lerp(1.9, 2.7, t));
          }}
        />
      ),
      enter: "punch",
      name: "louisiana + canoe",
    },
    {
      from: c(5),
      dur: c(7) - c(5),
      el: (
        <MapShot
          at={c(5)}
          waves
          cam={(sf, canoe) => {
            const t = easeInOut(clamp((sf - c(5)) / 60));
            return centerOn({ x: canoe.x + 60, y: canoe.y + 30 }, lerp(2.3, 1.7, t));
          }}
        />
      ),
      enter: "whip",
      name: "fly west",
    },
    { from: c(7), dur: c(9) - c(7), el: <PacificShot />, enter: "ink", origin: [300, 700], name: "pacific" },
    { from: c(9), dur: c(10.5) - c(9), el: <CrashShot />, enter: "punch", name: "crash" },
    { from: c(10.5), dur: c(13) - c(10.5), el: <AlamoShot />, enter: "burn", origin: [1700, 200], name: "alamo" },
    { from: c(13), dur: c(15) - c(13), el: <WagonShot />, enter: "morph", name: "wagons" },
    {
      from: c(15),
      dur: c(17) - c(15),
      el: (
        <MapShot
          at={c(15)}
          oregon
          waves
          cam={(sf) => {
            const t = easeInOut(clamp((sf - c(15)) / 60));
            return { x: lerp(420, -420, t), y: lerp(-40, 0, t), z: lerp(1.7, 1.25, t) };
          }}
        />
      ),
      enter: "whip",
      name: "states fill west",
    },
  ],
  hits: [
    { f: c(0.5), amp: 16, dur: 14, punch: 0.03 },
    { f: c(9) + 24, amp: 18, dur: 14 },
  ],
  Overlay: () => (
    <>
      <YearSlam text="1805" startFrame={c(0.5) - 5} fontSize={300} display scrim={0.8} exitAt={c(2.2)} />
      <Quote {...QUOTES.clark} start={c(7)} end={c(10.5)} framesPerWord={3} />
      <Quote {...QUOTES.alamo} start={c(10.5) + 4} end={c(13)} framesPerWord={3} />
      <Quote {...QUOTES.osullivan} start={c(13)} end={c(17)} framesPerWord={3} />
    </>
  ),
};

