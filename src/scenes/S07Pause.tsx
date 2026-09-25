// 7. THE PAUSE — near-silent. Saturn V on the pad at dawn, vapor venting,
// the full Moon rising behind it, a slow tilt up the length of the rocket.
import { useCurrentFrame } from "remotion";
import { Camera, Layer } from "../components/Camera";
import { InkDraw } from "../components/InkDraw";
import { Paper } from "../components/Parchment";
import { Dust, Smoke } from "../components/Particles";
import { Birds, EngravedSky, Moon, Stars } from "../components/Sky";
import { InkSea } from "../components/Water";
import { Quote } from "../components/WordPop";
import { QUOTES } from "../quotes";
import { saturnVItems, towerItems } from "../art/saturn";
import { F, grass, HT } from "../art/kit";
import { hatch, polyD, Pt } from "../lib/engrave";
import { clamp, easeInOut, easeOut, memo } from "../lib/math";
import { usePalette } from "../lib/palette";
import { sceneClock } from "../timeline";
import type { SceneDef } from "./types";

const c = sceneClock("pause");

const Vapor: React.FC<{ vents: Pt[]; ox: number; oy: number; size: number; seed: string }> = ({ vents, ox, oy, size, seed }) => (
  <g>
    {vents.map(([x, y], i) => (
      <Smoke key={i} x={ox + x} y={oy + y} rate={0.25} life={90} size={size * (0.7 + (i % 3) * 0.2)} vx={x > 0 ? 1.4 : -1.4} vy={0.4} wind={0.6} spread={0.5} shade={0} color="foam" outline={1} opacity={0.75} seed={`${seed}${i}`} />
    ))}
  </g>
);

// A. Wide: the rocket and tower at dawn, moon rising behind, searchlights
const PadShot: React.FC = () => {
  const f = useCurrentFrame();
  const pal = usePalette();
  const S = 7.2;
  const rocket = memo("ps:rocket7", () => saturnVItems(S));
  const tower = memo("ps:tower7", () => towerItems(S));
  const shore = memo("ps:shore", () => {
    const land: Pt[] = [[-400, 960], [2320, 960], [2320, 1010], [-400, 1010]];
    return [F(polyD(land), "ground", 0.8), HT(hatch([land], { angle: 0, spacing: 4, seed: "shore" }), 1, 0.6), HT(grass(-400, 2320, 960, "marsh", 0.14, 34), 1.6, 0.9)];
  });
  const BX = 1080;
  const BY = 900;
  const moonY = 820 - easeOut(clamp(f / 80)) * 210;
  return (
    <Camera keys={[{ f: 0, z: 1.0, y: 0 }, { f: 80, z: 1.08, y: -20 }]} handheld={2} seed={71}>
      <Layer depth={0.05}>
        <Paper />
        <EngravedSky h={1300} y={-300} dark={0.45} wash="dawn" washOp={0.35} />
        <Stars count={40} h={500} y={-200} seed="pstars" />
      </Layer>
      <Layer depth={0.15}>
        <Moon x={1420} y={moonY} r={230} glow={1.2} />
        <Birds x0={2000} y0={500} x1={-200} y1={420} dur={90} count={5} seed="pb" />
      </Layer>
      <Layer depth={0.8}>
        {[0, 1].map((k) => (
          <path key={k} d={`M${k ? 1700 : 400} 980L${BX - 60 + Math.sin(f / 30 + k) * 30} ${BY - 700}L${BX + 60 + Math.sin(f / 30 + k) * 30} ${BY - 700}Z`} fill={pal.glow} opacity={0.12} />
        ))}
        <g transform={`translate(${BX} ${BY})`}>
          <InkDraw items={tower} start={-2} dur={26} overlap={0.4} />
          <InkDraw items={rocket.items} start={0} dur={30} overlap={0.4} hatchAt={16} washAt={18} />
        </g>
        <Vapor vents={rocket.vents} ox={BX} oy={BY} size={34} seed="pv" />
        <InkDraw items={shore} start={-4} dur={10} />
      </Layer>
      <Layer depth={1.2}>
        <InkSea top={1000} bottom={1300} rows={12} amp={6} speed={0.5} drift={0.3} seed="lagoon" />
        <Dust count={30} speed={0.3} color="glow" seed="pdust" />
      </Layer>
    </Camera>
  );
};

// B. A slow tilt up the length of the rocket; moon behind the top
const TiltShot: React.FC = () => {
  const f = useCurrentFrame();
  const S = 15;
  const rocket = memo("ps:rocket15", () => saturnVItems(S));
  const tower = memo("ps:tower15", () => towerItems(S));
  const t = easeInOut(clamp(f / 78));
  const camY = 120 - t * 1330;
  return (
    <Camera keys={[{ f: 0, z: 1.0, x: 60 }]} offset={{ y: camY }} handheld={2} seed={72}>
      <Layer depth={0.25}>
        <Paper y={-2800} h={4400} />
        <EngravedSky x={-600} y={-2800} w={3200} h={4000} dark={0.4} wash="dawn" washOp={0.3} />
        <Moon x={1330} y={-860 + t * 60} r={300} glow={1.2} />
      </Layer>
      <Layer depth={1}>
        <g transform="translate(1060 1000)">
          <InkDraw items={tower} start={-8} dur={20} overlap={0.4} />
          <InkDraw items={rocket.items} start={-6} dur={24} overlap={0.4} hatchAt={10} washAt={10} />
        </g>
        <Vapor vents={rocket.vents} ox={1060} oy={1000} size={60} seed="tv" />
      </Layer>
      <Layer depth={1.3}>
        <Dust count={40} speed={0.3} color="glow" seed="tdust" y={-1800} h={2800} />
      </Layer>
    </Camera>
  );
};

export const pause: SceneDef = {
  id: "pause",
  seedBase: 70,
  shots: [
    { from: 0, dur: c(2.5), el: <PadShot />, enter: "ink", origin: [1080, 500], name: "pad at dawn" },
    { from: c(2.5), dur: c(5) - c(2.5), el: <TiltShot />, enter: "morph", name: "tilt up" },
  ],
  Overlay: () => <Quote {...QUOTES.kennedy} start={c(0.5) + 6} end={c(5)} framesPerWord={4} />,
};
