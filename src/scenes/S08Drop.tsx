// 8. THE DROP — engines ignite on the beat; ColorFlood from sepia to full
// colour; the rocket clears the tower; the LM descends; a boot presses into
// lunar dust in slow motion; the flag stands on the Moon.
import { useCurrentFrame } from "remotion";
import { Camera, Layer } from "../components/Camera";
import { InkDraw } from "../components/InkDraw";
import { Paper } from "../components/Parchment";
import { Dust, Smoke, Sparks } from "../components/Particles";
import { EngravedSky, Stars } from "../components/Sky";
import { Flag } from "../components/Cloth";
import { ColorFlood } from "../components/ColorFlood";
import { Quote } from "../components/WordPop";
import { QUOTES } from "../quotes";
import { astronautItems, earthItems, lmItems, saturnVItems, towerItems } from "../art/saturn";
import { bootItems, lunarGround } from "../art/space";
import { Plume } from "../art/Plume";
import { clamp, easeInOut, easeOut, memo, ramp, TAU } from "../lib/math";
import { usePalette } from "../lib/palette";
import { hash } from "../lib/random";
import { sceneClock } from "../timeline";
import type { SceneDef } from "./types";

const c = sceneClock("drop");

// A. Ignition on the beat: flash, plume, billowing smoke, colour floods out
const IgnitionInner: React.FC = () => {
  const f = useCurrentFrame();
  const pal = usePalette();
  const S = 12;
  const rocket = memo("dr:rocket12", () => saturnVItems(S));
  const tower = memo("dr:tower12", () => towerItems(S));
  const g = ramp(f, 0, 5, easeOut);
  const lift = f > 14 ? Math.pow(f - 14, 1.6) * 0.8 : 0;
  const BX = 1000;
  const BY = 690;
  return (
    <Camera keys={[{ f: 0, z: 1.12, y: 40 }, { f: 30, z: 1.0, y: -10 }]} handheld={10} seed={81}>
      <Layer depth={0.1}>
        <Paper />
        <EngravedSky h={1300} y={-300} dark={0.35} wash="dawn" washOp={0.4} />
      </Layer>
      <Layer depth={1}>
        <g transform={`translate(${BX} ${BY})`}>
          <InkDraw items={tower} start={-30} dur={2} washAt={0} washDur={1} />
        </g>
        <g transform={`translate(${BX} ${BY - lift})`}>
          {rocket.engines.map(([x, y], i) => (
            <Plume key={i} x={x} y={y} r={52} len={1000} g={g} seed={i + 3} spread={3.4} />
          ))}
          <InkDraw items={rocket.items} start={-30} dur={2} washAt={0} washDur={1} />
        </g>
        <Sparks x={BX} y={BY + 120} t0={1} count={90} speed={40} angle={Math.PI / 2} spread={Math.PI * 1.4} gravity={0.3} life={22} seed="ign" />
      </Layer>
      <Layer depth={1.3}>
        <Smoke x={BX - 260} y={BY + 260} rate={1.1} start={3} life={40} size={210} vx={-18} vy={-2} spread={5} shade={0.35} seed="igl" />
        <Smoke x={BX + 260} y={BY + 260} rate={1.1} start={3} life={40} size={210} vx={18} vy={-2} spread={5} shade={0.35} seed="igr" />
      </Layer>
      <Layer depth={0} html>
        <div style={{ position: "absolute", inset: 0, background: pal.mode === "color" ? "radial-gradient(ellipse at 50% 80%, rgba(255,160,40,0.35), rgba(255,120,20,0) 60%)" : "none" }} />
      </Layer>
    </Camera>
  );
};

const IgnitionShot: React.FC = () => (
  <ColorFlood at={1} dur={14} origin={[1000, 800]}>
    <IgnitionInner />
  </ColorFlood>
);

// B. The rocket clears the tower; the camera tracks it up
const ClearShot: React.FC = () => {
  const f = useCurrentFrame();
  const S = 9;
  const rocket = memo("dr:rocket9", () => saturnVItems(S));
  const tower = memo("dr:tower9", () => towerItems(S));
  const rise = 200 + Math.pow(f, 1.5) * 9;
  return (
    <Camera keys={[{ f: 0, z: 1.0 }]} handheld={9} seed={82}>
      <Layer depth={0.2}>
        <Paper y={-1000} h={3000} />
        <EngravedSky x={-600} y={-1000} w={3200} h={3000} dark={0.3} wash="sky" washOp={0.55} />
      </Layer>
      <Layer depth={1}>
        <g transform={`translate(1060 ${1180 + rise})`}>
          <InkDraw items={tower} start={-30} dur={2} washAt={0} washDur={1} />
        </g>
        <g transform={`translate(1060 ${860 - f * 2})`}>
          {rocket.engines.map(([x, y], i) => (
            <Plume key={i} x={x} y={y} r={40} len={1300} g={1} seed={i + 7} spread={3.2} />
          ))}
          <InkDraw items={rocket.items} start={-30} dur={2} washAt={0} washDur={1} />
        </g>
        <Smoke x={1060} y={1180 + rise} rate={1} life={40} size={260} vx={0} vy={-1} spread={10} shade={0.3} seed="clr" />
      </Layer>
      <Layer depth={1.5}>
        {Array.from({ length: 30 }, (_, i) => {
          const x = hash(i, 1) * 1920;
          const y = ((hash(i, 2) * 1400 + f * (30 + hash(i, 3) * 30)) % 1400) - 160;
          return <line key={i} x1={x} y1={y} x2={x} y2={y + 60 + hash(i, 4) * 80} stroke="#ffffff" strokeWidth={1.5} opacity={0.4} />;
        })}
      </Layer>
    </Camera>
  );
};

// C. The lunar module descends; dust blasts outward across the surface
const LMShot: React.FC = () => {
  const f = useCurrentFrame();
  const pal = usePalette();
  const lm = memo("dr:lm", () => lmItems(66));
  const earth = memo("dr:earth", () => earthItems(70));
  const ground = memo("dr:lground", () => lunarGround(700, "lmg"));
  const y = 520 + easeOut(clamp(f / 30)) * 190;
  const blast = clamp(1 - (y - 520) / 250 + 0.4);
  return (
    <Camera keys={[{ f: 0, z: 1.05 }, { f: 30, z: 1.12, y: 20 }]} handheld={7} seed={83}>
      <Layer depth={0.05}>
        <rect x={-400} y={-400} width={2720} height={1900} fill={pal.space} />
        <Stars count={120} h={800} y={-200} seed="lmstars" />
        <g transform="translate(1550 220)">
          <InkDraw items={earth} start={-30} dur={2} washAt={0} washDur={1} />
        </g>
      </Layer>
      <Layer depth={0.8}>
        <InkDraw items={ground.items} start={-30} dur={2} hatchAt={0} washAt={0} washDur={1} />
        {Array.from({ length: 40 }, (_, i) => {
          const a = (i / 40) * TAU;
          const k = ((f * 0.06 + hash(i, 1)) % 1 + 1) % 1;
          const r0 = 60 + k * 900;
          const x = 960 + Math.cos(a) * r0;
          const yy = 760 + Math.sin(a) * r0 * 0.18;
          return <line key={i} x1={x} y1={yy} x2={x + Math.cos(a) * 90} y2={yy + Math.sin(a) * 16} stroke={pal.moon} strokeWidth={3} opacity={(1 - k) * 0.9 * blast} />;
        })}
        <Smoke x={760} y={760} rate={1} life={26} size={80} vx={-20} vy={-0.6} spread={3} shade={0.2} color="moon" outline={1} seed="lmdl" />
        <Smoke x={1160} y={760} rate={1} life={26} size={80} vx={20} vy={-0.6} spread={3} shade={0.2} color="moon" outline={1} seed="lmdr" />
      </Layer>
      <Layer depth={1}>
        <path d={`M920 ${y - 90}L1000 ${y - 90}L1060 ${y + 60}L860 ${y + 60}Z`} fill={pal.glow} opacity={0.35} />
        <g transform={`translate(960 ${y})`}>
          <InkDraw items={lm} start={-30} dur={2} washAt={0} washDur={1} />
        </g>
      </Layer>
      <Layer depth={1.4}>
        <Dust count={60} speed={4} color="moon" seed="lmdust" size={3} />
      </Layer>
    </Camera>
  );
};

// D. A boot presses into lunar dust in slow motion
const BootSlowShot: React.FC = () => {
  const f = useCurrentFrame();
  const pal = usePalette();
  const boot = memo("co:boot", bootItems);
  const ground = memo("co:ground", () => lunarGround(360, "co"));
  const contact = 16;
  const down = f < contact ? -160 * (1 - easeInOut(f / contact)) : Math.min(14, (f - contact) * 0.8);
  const a = f - contact;
  return (
    <Camera keys={[{ f: 0, z: 1.05, y: -10 }, { f: 45, z: 1.16, y: 20 }]} handheld={3} seed={84}>
      <Layer depth={0.15}>
        <rect x={-400} y={-400} width={2720} height={900} fill={pal.space} />
        <Stars count={90} h={700} seed="bstars" />
      </Layer>
      <Layer depth={0.7}>
        <InkDraw items={ground.items} start={-30} dur={2} hatchAt={0} washAt={0} washDur={1} />
      </Layer>
      <Layer depth={1}>
        <g transform={`translate(1000 ${880 + down}) scale(1.05)`}>
          <InkDraw items={boot} start={-30} dur={2} washAt={0} washDur={1} />
        </g>
        {a >= 0 &&
          Array.from({ length: 140 }, (_, i) => {
            const ang = -Math.PI * (0.05 + hash(i, 1) * 0.9);
            const v = 1 + hash(i, 2) * 4;
            const side = i % 2 ? 1 : -1;
            const x = 1000 + side * (240 + Math.cos(ang) * v * a * 1.4);
            const yy = 890 + Math.sin(ang) * v * a + 0.02 * a * a;
            return <circle key={i} cx={x} cy={yy} r={1.5 + hash(i, 3) * 4} fill={pal.moon} stroke={pal.ink} strokeWidth={0.6} opacity={clamp(1 - a / 60)} />;
          })}
        {a >= 0 && <Smoke x={1000} y={890} count={14} start={contact} life={60} size={90} spread={3} vy={-0.6} shade={0.2} color="moon" seed="bslow" />}
      </Layer>
      <Layer depth={1.5}>
        <Dust count={50} speed={0.4} color="moon" size={3} seed="bsdust" />
      </Layer>
    </Camera>
  );
};

// E. The flag stands on the Moon
const MoonFlagShot: React.FC = () => {
  const pal = usePalette();
  const earth = memo("dr:earth2", () => earthItems(90));
  const ground = memo("dr:fground", () => lunarGround(640, "fgm"));
  const astro = memo("dr:astro", () => astronautItems(260));
  const lm = memo("dr:lm2", () => lmItems(40));
  return (
    <Camera keys={[{ f: 0, z: 1.0, x: -30 }, { f: 45, z: 1.08, x: 30 }]} handheld={3} seed={85}>
      <Layer depth={0.05}>
        <rect x={-400} y={-400} width={2720} height={1900} fill={pal.space} />
        <Stars count={140} h={800} y={-200} seed="mfstars" />
        <g transform="translate(420 230)">
          <InkDraw items={earth} start={-30} dur={2} washAt={0} washDur={1} />
        </g>
      </Layer>
      <Layer depth={0.6}>
        <InkDraw items={ground.items} start={-30} dur={2} hatchAt={0} washAt={0} washDur={1} />
        <g transform="translate(1560 700)">
          <InkDraw items={lm} start={-30} dur={2} washAt={0} washDur={1} />
        </g>
      </Layer>
      <Layer depth={1}>
        <line x1={760} y1={880} x2={760} y2={300} stroke={pal.metal} strokeWidth={9} />
        <line x1={760} y1={880} x2={760} y2={300} stroke={pal.ink} strokeWidth={2} />
        <line x1={760} y1={308} x2={1180} y2={308} stroke={pal.metal} strokeWidth={6} />
        <Flag x={766} y={310} w={420} h={240} amp={0.25} speed={0.35} waves={1.2} stars={50} droop={0.05} />
        <g transform="translate(1180 890)">
          <InkDraw items={astro} start={-30} dur={2} washAt={0} washDur={1} />
        </g>
      </Layer>
      <Layer depth={1.4}>
        <Dust count={40} speed={0.3} color="moon" size={2.6} seed="mfdust" />
      </Layer>
    </Camera>
  );
};

export const drop: SceneDef = {
  id: "drop",
  seedBase: 80,
  shots: [
    { from: 0, dur: c(1), el: <IgnitionShot />, enter: "cut", name: "ignition + colour flood" },
    { from: c(1), dur: c(2) - c(1), el: <ClearShot />, enter: "punch", palette: "color", name: "clears the tower" },
    { from: c(2), dur: c(3) - c(2), el: <LMShot />, enter: "whipDown", palette: "color", name: "lunar module" },
    { from: c(3), dur: c(4.5) - c(3), el: <BootSlowShot />, enter: "flash", palette: "color", name: "boot slow motion" },
    { from: c(4.5), dur: c(6) - c(4.5), el: <MoonFlagShot />, enter: "ink", origin: [760, 400], palette: "color", name: "flag on the moon" },
  ],
  hits: [
    { f: 0, amp: 42, dur: 26, punch: 0.07 },
    { f: c(1), amp: 16, dur: 26 },
    { f: c(2), amp: 12, dur: 20 },
    { f: c(3) + 16, amp: 6, dur: 10 },
  ],
  flashes: [{ f: 0, dur: 12, peak: 1 }],
  Overlay: () => <Quote {...QUOTES.armstrong} start={c(2) + 4} end={c(6)} framesPerWord={3} fontSize={64} />,
};

