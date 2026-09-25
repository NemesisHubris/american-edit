// 5. AMERICAN INGENUITY — 1869. Faster cuts: locomotive charging at camera,
// golden spike, Edison's lamp, Wright Flyer, Model T line, Hoover Dam,
// Golden Gate in fog, the Empire State Building rising.
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Camera, Layer } from "../components/Camera";
import { InkDraw } from "../components/InkDraw";
import { Paper } from "../components/Parchment";
import { Dust, Fog, Smoke, Sparks } from "../components/Particles";
import { Birds, Clouds, EngravedSky, Sun } from "../components/Sky";
import { InkSea, Pour } from "../components/Water";
import { BlueprintGrid, BlueprintMorph } from "../components/Blueprint";
import { YearSlam } from "../components/YearSlam";
import { Quote } from "../components/WordPop";
import { QUOTES } from "../quotes";
import { Loco3D, stackTop } from "../art/Loco3D";
import { Flyer3D } from "../art/Flyer3D";
import { bulbGeo, damItems, empireItems, ESB, ggTower, maulItems, modelTBody, modelTWheel, railScene, spikeItems } from "../art/ingenuity";
import { F, grass, groundHatch, HT, L } from "../art/kit";
import { hatch, polyD, Pt, rectP, smoothD } from "../lib/engrave";
import { clamp, easeIn, easeInOut, easeOut, lerp, memo, ramp, TAU } from "../lib/math";
import { usePalette } from "../lib/palette";
import { hash } from "../lib/random";
import { DEFAULT_CAM, path3, Pose } from "../lib/three";
import { useUid } from "../lib/uid";
import { sceneClock } from "../timeline";
import type { SceneDef } from "./types";

const c = sceneClock("ingenuity");

// A. Steam locomotive charging at the camera
const locoPose = (f: number): Pose => {
  const t = clamp(f / 62);
  const z = 30 - 27.2 * Math.pow(t, 1.15);
  return { pos: [-2.2, -1.75, z], yaw: 0.03 };
};

const LocoShot: React.FC = () => {
  const f = useCurrentFrame();
  const pal = usePalette();
  const at = locoPose(f);
  const dist = 30 - at.pos[2];
  const cam = DEFAULT_CAM;
  const rails: string[] = [];
  const ties: string[] = [];
  const poles: React.ReactNode[] = [];
  for (const x of [-3.12, -1.68]) rails.push(path3([[x, -1.75, 0.5], [x, -1.75, 200]], cam));
  const tieOff = (dist * 1.0) % 0.8;
  for (let z = 0.6 - tieOff + 0.8; z < 120; z += 0.8) ties.push(path3([[-3.6, -1.76, z], [-1.2, -1.76, z]], cam));
  for (let i = 0; i < 14; i++) {
    const z = 8 + i * 22 - ((f * 0.5) % 22);
    const top = path3([[3.2, -1.75, z], [3.2, 5, z]], cam);
    const arm = path3([[2.4, 4.6, z], [4.0, 4.6, z]], cam);
    poles.push(<path key={i} d={top + arm} stroke={pal.ink} strokeWidth={Math.max(1, 30 / z)} fill="none" />);
  }
  const wire = path3(Array.from({ length: 30 }, (_, i) => [2.6, 4.5 - Math.sin((i % 3) / 3) * 0.1, 4 + i * 10] as [number, number, number]), cam);
  const geo = memo("ing:plain", () => {
    const mount: Pt[] = [[-400, 560]];
    for (let x = -400; x <= 2400; x += 30) mount.push([x, 540 - Math.max(0, Math.sin(x / 150) * 70 + Math.sin(x / 61) * 20 + Math.sin(x / 400) * 40)]);
    mount.push([2400, 560]);
    return [F(polyD(mount), "skyDeep", 0.3), HT(hatch([mount], { angle: 70, spacing: 4, seed: "lm" }), 1, 0.45), L(smoothD(mount.slice(1, -1)), 1.6)];
  });
  const st = stackTop(at, cam);
  return (
    <Camera keys={[{ f: 0, z: 1.0 }]} handheld={3 + clamp(f / 60) * 6} seed={51}>
      <Layer depth={0.05}>
        <Paper />
        <EngravedSky h={900} y={-300} dark={0.35} />
        <Sun x={1500} y={330} r={60} spin={0.2} />
        <Clouds speed={1.5} clouds={[{ x: 100, y: 60, w: 520, h: 130, seed: "lc1" }, { x: 1100, y: 20, w: 420, h: 110, seed: "lc2" }]} />
        <InkDraw items={geo} start={-6} dur={8} />
      </Layer>
      <Layer depth={1}>
        <rect x={-400} y={540} width={2720} height={900} fill={pal.sand} opacity={0.55} />
        <path d={groundHatch(-400, 2320, 548, 1300, "lg", 7)} stroke={pal.ink} strokeWidth={1} opacity={0.6} fill="none" />
        <path d={ties.join("")} stroke={pal.wood} strokeWidth={4} fill="none" />
        <path d={ties.join("")} stroke={pal.ink} strokeWidth={1.2} fill="none" opacity={0.8} />
        <path d={rails.join("")} stroke={pal.ink} strokeWidth={5} fill="none" />
        <path d={wire} stroke={pal.ink} strokeWidth={1.2} fill="none" />
        {poles}
        <Smoke x={0} y={0} emitterAt={(fr) => stackTop(locoPose(fr), cam) ?? [0, 0]} rate={0.9} life={36} size={46 + clamp(f / 60) * 70} vx={2} vy={-5} spread={2} wind={4} shade={0.6} seed="lsmk" />
        <Loco3D at={at} wheelAngle={-dist / 0.87} cam={cam} lamp={0.9 + 0.1 * Math.sin(f)} />
        {st && <Sparks x={st[0]} y={st[1]} t0={Math.floor(f / 8) * 8} count={10} speed={10} life={14} gravity={-0.2} seed={`ls${Math.floor(f / 8)}`} />}
      </Layer>
      <Layer depth={1.6}>
        <Dust count={50} speed={3} color="inkSoft" seed="ldust" size={2.5} />
      </Layer>
    </Camera>
  );
};

// B. The golden spike is hammered home, sparks flying
const SpikeShot: React.FC<{ hits: number[] }> = ({ hits }) => {
  const f = useCurrentFrame();
  const pal = usePalette();
  const rail = memo("ing:rail", railScene);
  const spike = memo("ing:spike", spikeItems);
  const maul = memo("ing:maul", maulItems);
  let ang = -48;
  let sink = 0;
  for (const h of hits) {
    const a = f - h;
    if (a >= -5 && a < 0) ang = lerp(-48, 0, easeIn((a + 5) / 5));
    else if (a >= 0 && a < 12) ang = lerp(0, -48, easeInOut(clamp((a - 2) / 10)));
    if (a >= 0) sink += 16;
  }
  const spikeY = 520 + sink;
  return (
    <Camera keys={[{ f: 0, z: 1.12, y: 20 }, { f: 45, z: 1.2, y: 0 }]} handheld={4} seed={52}>
      <Layer depth={0.15}>
        <Paper />
        <EngravedSky h={700} y={-300} dark={0.3} />
        <g opacity={0.8}>
          {[340, 1560].map((x, i) => (
            <g key={i} transform={`translate(${x} 380) scale(${i ? -0.5 : 0.5})`}>
              <path d="M-160 0H200V-60H120V-160H60V-70H-60V-100H-120V-40H-160Z" fill={pal.ink} />
              <circle cx={-80} cy={10} r={36} fill="none" stroke={pal.ink} strokeWidth={6} />
              <circle cx={40} cy={10} r={46} fill="none" stroke={pal.ink} strokeWidth={6} />
              <path d="M200 20L260 -10V30Z" fill={pal.ink} />
            </g>
          ))}
          <path d={Array.from({ length: 36 }, (_, i) => `M${540 + i * 24} 420a12 12 0 1 1 0.1 0`).join("")} fill={pal.inkSoft} />
        </g>
      </Layer>
      <Layer depth={1}>
        <InkDraw items={rail} start={-4} dur={10} hatchAt={2} washAt={2} />
        <defs>
          <clipPath id="spikeclip">
            <rect x={0} y={0} width={1920} height={712} />
          </clipPath>
        </defs>
        <g clipPath="url(#spikeclip)">
          <g transform={`translate(1040 ${spikeY}) scale(1.5)`}>
            <InkDraw items={spike} start={-2} dur={8} washAt={0} washDur={4} />
          </g>
        </g>
        {hits.map((h, i) => (
          <Sparks key={i} x={1040} y={spikeY - 10} t0={h} count={50} speed={24} gravity={0.9} life={20} spread={Math.PI * 1.1} seed={`gs${i}`} />
        ))}
        <g transform={`translate(1880 ${spikeY - 80}) rotate(${ang}) scale(1.35)`}>
          <InkDraw items={maul} start={-2} dur={8} washAt={0} washDur={4} />
        </g>
      </Layer>
      <Layer depth={1.4}>
        <Dust count={30} speed={1} color="gold" seed="gdust" />
      </Layer>
    </Camera>
  );
};

// C. Edison's lamp: blueprint -> engraving, filament brightens until it flares
const BulbShot: React.FC = () => {
  const f = useCurrentFrame();
  const bulb = memo("ing:bulb", bulbGeo);
  const glow = ramp(f, 12, 38, easeIn);
  const flare = ramp(f, 36, 44, easeOut);
  const Inner: React.FC = () => {
    const pal = usePalette();
    const uid = useUid("blb");
    return (
      <Camera keys={[{ f: 0, z: 1.0 }, { f: 45, z: 1.14 }]} handheld={3} seed={53}>
        <Layer depth={0.3}>
          <Paper tint={pal.mode === "blueprint" ? undefined : pal.night} />
          <BlueprintGrid label="ELECTRIC LAMP" sub="No. 223,898 — T. A. EDISON" />
          {pal.mode !== "blueprint" && <path d={hatch([rectP(-400, -400, 2720, 1900)], { angle: 40, spacing: 5, seed: "lab" })} stroke={pal.ink} strokeWidth={1} opacity={0.6} />}
        </Layer>
        <Layer depth={1}>
          <defs>
            <radialGradient id={uid}>
              <stop offset="0" stopColor="#fffdf2" stopOpacity={1} />
              <stop offset="0.3" stopColor={pal.glow} stopOpacity={0.8} />
              <stop offset="1" stopColor={pal.flame} stopOpacity={0} />
            </radialGradient>
          </defs>
          <g transform="translate(960 470) scale(1.35)">
            {pal.mode !== "blueprint" && <circle cx={0} cy={-60} r={140 + glow * 360 + flare * 600} fill={`url(#${uid})`} opacity={glow} />}
            <InkDraw items={bulb.items} start={-2} dur={8} washAt={0} washDur={4} />
            <path d={bulb.filament} fill="none" stroke={pal.mode === "blueprint" ? pal.ink : glow > 0.3 ? "#fffdf2" : pal.ink} strokeWidth={4 + glow * 3} />
            {pal.mode === "blueprint" && (
              <g stroke={pal.ink} fill={pal.ink} fontFamily="monospace" fontSize={16}>
                <path d="M-240 -200V300M-250 -200H-230M-250 300H-230" strokeWidth={1.5} fill="none" />
                <text x={-300} y={60} stroke="none" transform="rotate(-90 -300 60)">
                  120 mm
                </text>
                <path d="M-190 330H190M-190 320V340M190 320V340" strokeWidth={1.5} fill="none" />
                <text x={-30} y={360} stroke="none">
                  ⌀ 70
                </text>
              </g>
            )}
            {pal.mode !== "blueprint" &&
              glow > 0.4 &&
              Array.from({ length: 16 }, (_, i) => {
                const a = (i / 16) * TAU + f * 0.02;
                const r0 = 230;
                const r1 = 230 + (glow - 0.4) * 500 + flare * 400;
                return <line key={i} x1={Math.cos(a) * r0} y1={-60 + Math.sin(a) * r0} x2={Math.cos(a) * r1} y2={-60 + Math.sin(a) * r1} stroke={pal.glow} strokeWidth={3} opacity={0.5} />;
              })}
          </g>
        </Layer>
      </Camera>
    );
  };
  return (
    <AbsoluteFill>
      <BlueprintMorph from={4} to={16}>
        <Inner />
      </BlueprintMorph>
      <AbsoluteFill style={{ backgroundColor: "#fffdf2", opacity: flare * 0.9 }} />
    </AbsoluteFill>
  );
};

// D. Wright Flyer lifts off the dunes and banks past the camera
const flyerPose = (f: number): Pose => {
  const t = clamp(f / 62);
  const z = lerp(46, 3.5, Math.pow(t, 1.35));
  const x = lerp(-9, 5.5, Math.pow(t, 1.5));
  const lift = clamp((t - 0.18) / 0.8);
  const y = -1.5 + easeIn(lift) * 3.2;
  return { pos: [x, y, z], yaw: -0.35 + t * 0.2, roll: -easeInOut(clamp((t - 0.45) / 0.55)) * 0.55, pitch: -lift * 0.1 };
};

const FlyerShot: React.FC = () => {
  const f = useCurrentFrame();
  const geo = memo("ing:dunes", () => {
    const d1: Pt[] = [[-400, 1300], [-400, 600], ...Array.from({ length: 30 }, (_, i) => [-400 + i * 100, 580 - Math.max(0, Math.sin(i * 0.4) * 60)] as Pt), [2600, 600], [2600, 1300]];
    const d2: Pt[] = [[-400, 1300], [-400, 880], [300, 800], [800, 830], [1400, 900], [2000, 860], [2600, 900], [2600, 1300]];
    return {
      far: [F(polyD(d1), "sand", 0.7), HT(hatch([d1], { angle: 8, spacing: 5, tone: (x, y) => 0.3 + (y - 540) / 500 + Math.sin(x / 200) * 0.2, threshold: 0.45, seed: "d1" }), 1, 0.6), L(smoothD(d1.slice(2, -2)), 2)],
      near: [F(smoothD(d2, true), "sand", 0.85), HT(hatch([d2], { angle: -8, spacing: 4.5, tone: (x, y) => 0.25 + (y - 800) / 400, threshold: 0.4, seed: "d2" }), 1, 0.7), L(smoothD(d2.slice(1, -1)), 2.4), HT(grass(-300, 2500, (x) => 860 + Math.sin(x / 300) * 40, "dg", 0.05, 40), 1.6, 0.9)],
    };
  });
  const Inner: React.FC = () => {
    const pal = usePalette();
    const rail = path3([[-9, -1.62, 46], [-9, -1.62, 80]], DEFAULT_CAM);
    return (
      <Camera keys={[{ f: 0, z: 1.0 }]} handheld={4} seed={54}>
        <Layer depth={0.1}>
          <Paper />
          <BlueprintGrid label="FLYING MACHINE" sub="O. & W. WRIGHT — 1903" />
          <EngravedSky h={900} y={-300} dark={0.25} />
          <Clouds speed={2} clouds={[{ x: 200, y: 80, w: 500, h: 130, seed: "fc1" }, { x: 1200, y: 30, w: 420, h: 110, seed: "fc2" }]} />
          <Birds x0={2000} y0={200} x1={-100} y1={260} dur={80} count={5} seed="gl" />
        </Layer>
        <Layer depth={0.4}>
          <InkDraw items={geo.far} start={-6} dur={8} />
          <path d={rail} stroke={pal.wood} strokeWidth={4} />
        </Layer>
        <Layer depth={1}>
          <Flyer3D at={flyerPose(f)} prop={f * 0.9} />
          {f < 20 && <Smoke x={0} y={0} emitterAt={(fr) => [960 + (1100 * flyerPose(fr).pos[0]) / flyerPose(fr).pos[2], 540 + 1100 * 1.6 / flyerPose(fr).pos[2]]} rate={0.5} end={20} life={30} size={30} shade={0.1} color="sand" outline={1} seed="fsand" />}
        </Layer>
        <Layer depth={1.3}>
          <InkDraw items={geo.near} start={-6} dur={8} />
        </Layer>
      </Camera>
    );
  };
  return (
    <BlueprintMorph from={2} to={14}>
      <Inner />
    </BlueprintMorph>
  );
};

// E. Model T rolls down the assembly line
const ModelTShot: React.FC = () => {
  const f = useCurrentFrame();
  const body = memo("ing:mtb", modelTBody);
  const wheelI = memo("ing:mtw", modelTWheel);
  const factory = memo("ing:factory", () => {
    const items = [F(polyD(rectP(-400, -400, 2720, 1300)), "stone", 0.35)];
    const wins: string[] = [];
    for (let x = -300; x < 2300; x += 260) wins.push(polyD(rectP(x, 60, 180, 420)));
    items.push(F(wins.join(""), "glow", 0.6), L(wins.join(""), 2.4));
    const mull: string[] = [];
    for (let x = -300; x < 2300; x += 260) for (let k = 1; k < 4; k++) mull.push(`M${x + k * 45} 60V480`);
    for (let x = -300; x < 2300; x += 260) for (let k = 1; k < 6; k++) mull.push(`M${x} ${60 + k * 70}H${x + 180}`);
    items.push(L(mull.join(""), 1.4));
    items.push(HT(hatch([rectP(-400, -400, 2720, 1300)], { angle: 45, spacing: 6, tone: (x) => 0.45 + Math.sin(x / 130) * 0.1, threshold: 0.45, seed: "fw" }), 1, 0.45));
    const truss: string[] = [];
    for (let x = -400; x < 2400; x += 200) truss.push(`M${x} -40L${x + 100} -140L${x + 200} -40M${x} -40H${x + 200}M${x + 100} -140V-40`);
    items.push(L(truss.join(""), 2));
    return items;
  });
  const Inner: React.FC = () => {
    const pal = usePalette();
    const move = f * 4.5;
    const cars = [-1, 0, 1, 2].map((i) => {
      const x = 200 + i * 1050 + move;
      const roll = (-move / 96) * 57.3;
      return (
        <g key={i} transform={`translate(${x} 830) scale(0.9)`}>
          {[-260, 250].map((wx, k) => (
            <g key={k} transform={`translate(${wx} -96) rotate(${-roll})`}>
              <InkDraw items={wheelI} start={-10} dur={4} washAt={0} washDur={2} />
            </g>
          ))}
          <InkDraw items={body} start={-4} dur={10} washAt={0} washDur={4} />
        </g>
      );
    });
    const hoistY = lerp(-220, 380, easeInOut(clamp(f / 40)));
    return (
      <Camera keys={[{ f: 0, z: 1.08, x: -40 }, { f: 45, z: 1.14, x: 60 }]} handheld={3} seed={55}>
        <Layer depth={0.3}>
          <Paper />
          <BlueprintGrid label="MODEL T" sub="FORD MOTOR CO. — 1913" />
          <InkDraw items={factory} start={-6} dur={8} hatchAt={0} washAt={0} washDur={3} />
        </Layer>
        <Layer depth={0.8}>
          <path d={`M-400 850H2400M-400 880H2400`} stroke={pal.ink} strokeWidth={3} />
          <path d={`M-400 865H2400`} stroke={pal.ink} strokeWidth={10} strokeDasharray="14 18" strokeDashoffset={-move * 1.0} />
          <path d="M-400 120H2400M-400 140H2400" stroke={pal.ink} strokeWidth={4} />
          <path d={`M700 130V${hoistY - 300}M1000 130V${hoistY - 300}`} stroke={pal.ink} strokeWidth={2} />
          <g transform={`translate(860 ${hoistY - 200}) scale(0.6)`} opacity={0.9}>
            <InkDraw items={body.slice(0, 3)} start={-10} dur={4} washAt={0} washDur={2} />
          </g>
          {cars}
        </Layer>
        <Layer depth={1.25}>
          {[0, 1].map((k) => {
            const x = 180 + k * 1300;
            const arm = Math.sin(f / 5 + k) * 20;
            return (
              <g key={k} fill={pal.ink}>
                <path d={`M${x - 28} 1080L${x - 22} 800Q${x} 770 ${x + 22} 800L${x + 28} 1080Z`} />
                <circle cx={x} cy={765} r={26} />
                <path d={`M${x - 30} 760Q${x} 730 ${x + 30} 760Z`} />
                <path d={`M${x + 16} 820L${x + 110} ${800 + arm}`} stroke={pal.ink} strokeWidth={16} strokeLinecap="round" />
              </g>
            );
          })}
          <Sparks x={1600} y={790} t0={Math.floor(f / 10) * 10} count={20} speed={14} life={14} seed={`mt${Math.floor(f / 10)}`} />
        </Layer>
      </Camera>
    );
  };
  return (
    <BlueprintMorph from={2} to={12}>
      <Inner />
    </BlueprintMorph>
  );
};

// F. Water thunders through Hoover Dam
const DamShot: React.FC = () => {
  const f = useCurrentFrame();
  const pal = usePalette();
  const dam = memo("ing:dam", damItems);
  const jets = [
    { x: 560, y: 560, dir: 1 },
    { x: 540, y: 640, dir: 1 },
    { x: 1360, y: 560, dir: -1 },
    { x: 1380, y: 640, dir: -1 },
  ];
  return (
    <Camera keys={[{ f: 0, z: 1.02, y: 20 }, { f: 60, z: 1.16, y: -20 }]} handheld={6} seed={56}>
      <Layer depth={0.1}>
        <Paper />
        <EngravedSky h={600} y={-300} dark={0.3} />
      </Layer>
      <Layer depth={0.7}>
        <InkDraw items={dam} start={-4} dur={24} overlap={0.3} hatchAt={10} washAt={10} />
        <Pour x={1560} y={-120} w={90} h={900} bulge={-60} lines={24} speed={30} seed="spill" />
        {jets.map((j, i) => {
          const d = `M${j.x} ${j.y}Q${j.x + j.dir * 260} ${j.y - 60} ${j.x + j.dir * 420} ${j.y + 300}`;
          return (
            <g key={i}>
              <path d={d} fill="none" stroke={pal.water} strokeWidth={46} opacity={0.6} />
              <path d={d} fill="none" stroke={pal.foam} strokeWidth={30} strokeDasharray="60 30" strokeDashoffset={-f * 26} />
              <path d={d} fill="none" stroke={pal.ink} strokeWidth={2} strokeDasharray="30 50" strokeDashoffset={-f * 26} />
            </g>
          );
        })}
        <Smoke x={960} y={940} rate={1} life={50} size={160} vx={0} vy={-2.5} spread={6} shade={0} color="foam" outline={1} seed="mist" opacity={0.8} />
      </Layer>
      <Layer depth={1}>
        <InkSea top={880} rows={24} amp={16} speed={3} drift={3} seed="river" />
      </Layer>
      <Layer depth={1.5}>
        <Fog y={950} h={260} speed={3} opacity={0.6} color="foam" seed="dfog" />
        {Array.from({ length: 30 }, (_, i) => {
          const x = hash(i, 1) * 1920;
          const y = ((hash(i, 2) * 1080 - f * (6 + hash(i, 3) * 6)) % 1080 + 1080) % 1080;
          return <circle key={i} cx={x} cy={y} r={2 + hash(i, 4) * 4} fill={pal.foam} opacity={0.7} />;
        })}
      </Layer>
    </Camera>
  );
};

// G. Golden Gate emerges as the fog rolls away
const BridgeShot: React.FC = () => {
  const f = useCurrentFrame();
  const geo = memo("ing:gg", () => {
    const north = ggTower(520, 700, 30, 1.25);
    const south = ggTower(1560, 640, 260, 0.62);
    const cable = (x0: number, y0: number, x1: number, y1: number, sag: number): Pt[] =>
      Array.from({ length: 41 }, (_, i) => {
        const t = i / 40;
        return [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + sag * 4 * t * (1 - t)] as Pt;
      });
    const main = cable(520, 60, 1560, 280, 420);
    const back = cable(-200, 520, 520, 60, 60);
    const deck = (x: number) => 700 - (x - 520) * 0.058;
    const susp: string[] = [];
    for (const [p] of [[main]])
      for (const [x, y] of p.filter((_, i) => i % 1 === 0)) if (x > 540 && x < 1540) susp.push(`M${x.toFixed(1)} ${y.toFixed(1)}V${deck(x).toFixed(1)}`);
    const headland: Pt[] = [[-400, 1300], [-400, 640], [-100, 600], [200, 660], [420, 760], [560, 900], [620, 1300]];
    const city: Pt[] = [[1600, 700], ...Array.from({ length: 16 }, (_, i) => [1620 + i * 40, 640 - hash(i, 9) * 110] as Pt).flatMap(([x, y]) => [[x, y], [x + 32, y]] as Pt[]), [2300, 700]];
    return {
      towers: [...south, ...north],
      cables: [L(smoothD(main), 4), L(smoothD(back), 4), L(susp.join(""), 1, { op: 0.8 }), L("M-200 710L2300 610", 5), L("M-200 732L2300 632", 2.4), HT(hatch([[[-200, 710], [2300, 610], [2300, 632], [-200, 732]]], { angle: 90, spacing: 8, seed: "deck" }), 1.4, 0.8)],
      headland: [F(polyD(headland), "foliage", 0.8), HT(hatch([headland], { angle: 60, spacing: 3.6, seed: "hd" }), 1, 0.7), L(smoothD(headland.slice(1, -1)), 2.4)],
      city: [F(polyD(city), "stone", 0.5), HT(hatch([city], { angle: 90, spacing: 5, seed: "cty" }), 1, 0.5), L(polyD(city, false), 1.4)],
    };
  });
  const clear = easeInOut(clamp(f / 55));
  return (
    <Camera keys={[{ f: 0, z: 1.12, x: 40 }, { f: 60, z: 1.02, x: -40 }]} handheld={3} seed={57}>
      <Layer depth={0.1}>
        <Paper />
        <EngravedSky h={900} y={-300} dark={0.25} />
        <Sun x={1250} y={250} r={60} spin={0.2} />
      </Layer>
      <Layer depth={0.35}>
        <InkDraw items={geo.city} start={-4} dur={10} />
      </Layer>
      <Layer depth={0.8}>
        <InkSea top={640} rows={34} amp={10} speed={1} drift={0.6} seed="bay" />
        <InkDraw items={geo.towers} start={-2} dur={20} overlap={0.4} />
        <InkDraw items={geo.cables} start={4} dur={20} />
        <Fog y={560} h={420} speed={3 + clear * 8} opacity={1 - clear * 0.85} count={14} seed="ggfog" x0={-700 + clear * 1600} />
      </Layer>
      <Layer depth={1.25}>
        <InkDraw items={geo.headland} start={-4} dur={10} />
        <Fog y={800} h={320} speed={5 + clear * 10} opacity={0.9 - clear * 0.7} count={10} seed="ggfog2" x0={-700 + clear * 2000} />
        <Birds x0={-100} y0={300} x1={2000} y1={200} dur={60} count={5} seed="ggb" />
      </Layer>
    </Camera>
  );
};

// H. The Empire State Building rises floor by floor, the camera tilting up
const EmpireShot: React.FC = () => {
  const f = useCurrentFrame();
  const pal = usePalette();
  const uid = useUid("esb");
  const esb = memo("ing:esb", empireItems);
  const skyline = memo("ing:sky", () => {
    const items = [];
    const r = { i: 0 };
    for (const [x, w, h] of [
      [-200, 260, 520],
      [100, 200, 760],
      [320, 180, 440],
      [1470, 220, 700],
      [1720, 260, 520],
      [2000, 200, 820],
    ]) {
      const poly = rectP(x, 1000 - h, w, h);
      items.push(F(polyD(poly), "stone", 0.75), HT(hatch([poly], { angle: 90, spacing: 4.5, tone: (px) => 0.3 + (px - x) / w, threshold: 0.55, seed: `sk${r.i++}` }), 1, 0.7), L(polyD(poly), 2));
      const wins: string[] = [];
      for (let yy = 1000 - h + 20; yy < 990; yy += 30) wins.push(`M${x + 16} ${yy}H${x + w - 16}`);
      items.push(L(wins.join(""), 3, { dash: "8 8", op: 0.7 }));
    }
    return items;
  });
  const t = easeInOut(clamp(f / 70));
  const floors = 86 * easeOut(clamp(f / 62));
  const revealY = ESB.ground - floors * ESB.floor - (f > 62 ? (f - 62) * 60 : 0);
  const camY = Math.min(0, revealY - 250) * 0.95;
  const frame: string[] = [];
  if (floors < 86) {
    for (let k = 0; k < 4; k++) frame.push(`M${ESB.cx - 280} ${revealY - k * ESB.floor}H${ESB.cx + 280}`);
    for (let x = ESB.cx - 280; x <= ESB.cx + 280; x += 56) frame.push(`M${x} ${revealY}V${revealY - 3 * ESB.floor}`);
  }
  return (
    <Camera keys={[{ f: 0, z: 1.05 }]} offset={{ y: camY - 60, x: Math.sin(t * 3) * 20 }} handheld={3} seed={58}>
      <Layer depth={0.2}>
        <Paper y={-3600} h={5200} />
        <EngravedSky x={-600} y={-3400} w={3200} h={4200} dark={0.2} />
        <Clouds speed={2} span={[-800, 2700]} clouds={[{ x: 100, y: -600, w: 600, h: 160, seed: "ec1" }, { x: 1300, y: -1400, w: 500, h: 140, seed: "ec2" }, { x: 600, y: -2300, w: 560, h: 150, seed: "ec3" }]} />
      </Layer>
      <Layer depth={0.7}>
        <InkDraw items={skyline} start={-4} dur={12} />
      </Layer>
      <Layer depth={1}>
        <defs>
          <clipPath id={uid}>
            <rect x={-400} y={revealY} width={2720} height={4000} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${uid})`}>
          <InkDraw items={esb.items} start={-20} dur={4} hatchAt={0} washAt={0} washDur={2} />
        </g>
        <path d={frame.join("")} stroke={pal.ink} strokeWidth={3} fill="none" />
        {floors < 86 && (
          <g>
            <path d={`M${ESB.cx + 120} ${revealY - 100}V${revealY}M${ESB.cx + 120} ${revealY - 100}L${ESB.cx - 180} ${revealY - 60}`} stroke={pal.ink} strokeWidth={5} />
            <path d={`M${ESB.cx - 180} ${revealY - 60}V${revealY + 40 + Math.sin(f / 4) * 20}`} stroke={pal.ink} strokeWidth={1.5} />
            <Sparks x={ESB.cx - 120} y={revealY} t0={Math.floor(f / 6) * 6} count={14} speed={10} life={12} seed={`es${Math.floor(f / 6)}`} />
          </g>
        )}
      </Layer>
      <Layer depth={1.2}>
        <Birds x0={-100} y0={revealY - 200} x1={2000} y1={revealY - 300} dur={70} count={6} seed="eb" />
      </Layer>
    </Camera>
  );
};

const SPIKE_HITS = [c(2.5) - c(2), c(3) - c(2)];

export const ingenuity: SceneDef = {
  id: "ingenuity",
  seedBase: 50,
  shots: [
    { from: 0, dur: c(2), el: <LocoShot />, enter: "burn", origin: [1500, 300], name: "locomotive" },
    { from: c(2), dur: c(3.5) - c(2), el: <SpikeShot hits={SPIKE_HITS} />, enter: "whip", name: "golden spike" },
    { from: c(3.5), dur: c(5) - c(3.5), el: <BulbShot />, enter: "punch", name: "light bulb" },
    { from: c(5), dur: c(7) - c(5), el: <FlyerShot />, enter: "flash", name: "wright flyer" },
    { from: c(7), dur: c(8.5) - c(7), el: <ModelTShot />, enter: "whip", name: "model t" },
    { from: c(8.5), dur: c(10.5) - c(8.5), el: <DamShot />, enter: "ink", origin: [960, 600], name: "hoover dam" },
    { from: c(10.5), dur: c(12.5) - c(10.5), el: <BridgeShot />, enter: "whip", name: "golden gate" },
    { from: c(12.5), dur: c(15) - c(12.5), el: <EmpireShot />, enter: "whipUp", name: "empire state" },
  ],
  hits: [
    { f: c(0.5), amp: 16, dur: 14, punch: 0.03 },
    { f: c(1.5), amp: 10, dur: 10 },
    { f: c(2.5), amp: 16, dur: 10, punch: 0.02 },
    { f: c(3), amp: 16, dur: 10, punch: 0.02 },
    { f: c(8.5), amp: 8, dur: 60 },
  ],
  Overlay: () => (
    <>
      <YearSlam text="1869" startFrame={c(0.5) - 5} fontSize={300} display scrim={0.75} exitAt={c(1.6)} />
      <Quote {...QUOTES.wright} start={c(5) + 4} end={c(8.5)} framesPerWord={4} />
    </>
  ),
};

