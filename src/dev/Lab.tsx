// Dev playground for the component library.
import { useCurrentFrame } from "remotion";
import { Camera, Layer } from "../components/Camera";
import { Paper } from "../components/Parchment";
import { InkDraw, InkItem } from "../components/InkDraw";
import { Dust, Embers, Fireworks, Fog, Smoke } from "../components/Particles";
import { CrashWave, InkSea, Pour } from "../components/Water";
import { Flag } from "../components/Cloth";
import { Birds, Clouds, EngravedSky, Moon, Stars, Sun } from "../components/Sky";
import { engrave, ellipseP, polyD, rectP, tones } from "../lib/engrave";
import { memo } from "../lib/math";
import { SceneView } from "../scenes/SceneView";
import { MapBase, Ship } from "../components/MapScene";
import type { SceneDef } from "../scenes/types";

const column = (): InkItem[] => {
  const x = 1300;
  const w = 120;
  const top = 380;
  const bot = 900;
  const items: InkItem[] = [];
  const body = rectP(x - w / 2, top, w, bot - top);
  engrave([body], tones.cylinder(x, w / 2, -0.5), { angle: 90, spacing: 5, levels: [0.3, 0.6, 0.85], angles: [90, 20, 160], seed: "col" }).forEach((l) =>
    items.push({ d: l.d, kind: "hatch", w: l.w }),
  );
  items.push({ d: polyD(body), kind: "fill", fill: "stone", op: 0.6 });
  for (let k = -3; k <= 3; k++) {
    const fx = x + (k / 3.5) * (w / 2);
    items.push({ d: `M${fx} ${top + 30}L${fx} ${bot - 30}`, w: 1.4 });
  }
  items.push({ d: polyD(body), w: 3 });
  items.push({ d: polyD(rectP(x - w * 0.75, top - 40, w * 1.5, 40)), w: 3 });
  items.push({ d: polyD(rectP(x - w * 0.8, bot, w * 1.6, 36)), w: 3 });
  const ball = ellipseP(700, 600, 150, 150, 64);
  engrave([ball], tones.sphere(700, 600, 150), { angle: 30, spacing: 5, seed: "ball" }).forEach((l) => items.push({ d: l.d, kind: "hatch", w: l.w }));
  items.push({ d: polyD(ball), w: 3 });
  return items;
};

const ShotA: React.FC = () => {
  const items = memo("lab:col", column);
  const f = useCurrentFrame();
  return (
    <Camera keys={[{ f: 0, z: 1 }, { f: 90, z: 1.15, x: 60 }]} handheld={6}>
      <Layer depth={0.2}>
        <Paper />
        <EngravedSky h={760} dark={0.3} />
        <Sun x={1500} y={330 - f * 1.2} r={70} />
        <Clouds clouds={[{ x: 200, y: 200, w: 520, h: 140, seed: "a" }, { x: 1100, y: 140, w: 400, h: 110, seed: "b" }]} />
        <Birds x0={-100} y0={300} x1={2000} y1={200} dur={90} />
      </Layer>
      <Layer depth={0.6}>
        <InkSea top={720} speed={1} />
        <CrashWave x={400} y={900} period={70} />
      </Layer>
      <Layer depth={1}>
        <InkDraw items={items} start={0} dur={30} />
        <Smoke x={1300} y={340} rate={0.35} life={70} size={50} rise={1} wind={1.2} />
      </Layer>
      <Layer depth={1.5}>
        <Fog y={950} h={200} />
        <Dust count={50} />
      </Layer>
    </Camera>
  );
};

const ShotB: React.FC = () => (
  <Camera keys={[{ f: 0, z: 1.1 }, { f: 80, z: 1.0 }]} handheld={5}>
    <Layer depth={0.3}>
      <Paper />
      <EngravedSky h={1300} dark={0.2} />
    </Layer>
    <Layer depth={1}>
      <rect x={290} y={180} width={16} height={900} fill="#5a3a1a" />
      <Flag x={300} y={200} w={1300} h={680} />
    </Layer>
    <Layer depth={1.4}>
      <Dust count={40} />
    </Layer>
  </Camera>
);

const ShotC: React.FC = () => (
  <Camera keys={[{ f: 0, z: 1 }, { f: 80, z: 1.08 }]} handheld={5}>
    <Layer depth={0.1}>
      <rect x={-300} y={-300} width={2520} height={1700} fill="#1b120a" />
      <Stars />
      <Moon x={1500} y={260} r={130} />
      <Fireworks bursts={[{ x: 600, y: 300, t0: 20, launchFrom: 900 }, { x: 1100, y: 250, t0: 38, color: "fire" }]} />
    </Layer>
    <Layer depth={1}>
      <Pour x={200} y={500} w={400} h={500} bulge={60} />
      <Embers x={1100} y={1000} w={600} />
    </Layer>
  </Camera>
);

const MapTest: React.FC = () => (
  <Camera keys={[{ f: 0, z: 1 }]}>
    <Layer depth={1}>
      <MapBase cues={{ border: 0, sea: 0, land: 10, original: 40, louisiana: 60, westStart: 100, westDur: 60, rivers: 50, labels: 70, compass: 5 }} />
      <Ship x={200} y={500} />
      <Ship x={1700} y={300} seed={3} dir={-1} />
    </Layer>
  </Camera>
);

export const LAB_DEF: SceneDef = {
  id: "coldOpen",
  shots: [
    { from: 0, dur: 80, el: <ShotA /> },
    { from: 80, dur: 80, el: <ShotB />, enter: "ink", palette: "color" },
    { from: 160, dur: 80, el: <ShotC />, enter: "burn" },
    { from: 240, dur: 200, el: <MapTest />, enter: "ink" },
  ],
};

export const Lab: React.FC = () => <SceneView def={LAB_DEF} />;
