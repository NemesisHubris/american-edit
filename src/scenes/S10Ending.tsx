// 10. ENDING — silence. The flag ripples in slow motion at sunrise, sun rays
// sweeping across it; title card "AMERICA" / "EST. 1776"; hold; cut to black.
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Camera, Layer } from "../components/Camera";
import { Paper } from "../components/Parchment";
import { Dust, Embers } from "../components/Particles";
import { Clouds, EngravedSky, Sun } from "../components/Sky";
import { Flag } from "../components/Cloth";
import { DISPLAY_FAMILY } from "../fonts";
import { clamp, easeOut, ramp } from "../lib/math";
import { usePalette } from "../lib/palette";
import { useUid } from "../lib/uid";
import { sceneClock } from "../timeline";
import type { SceneDef } from "./types";

const c = sceneClock("ending");

const SunriseFlag: React.FC<{ wide?: boolean; t0: number }> = ({ wide, t0 }) => {
  const f = useCurrentFrame();
  const pal = usePalette();
  const uid = useUid("sweep");
  const T = f + t0;
  const sweepX = -600 + ((T * 9) % 3400);
  const fx = wide ? 520 : 300;
  const fy = wide ? 250 : 170;
  const fw = wide ? 1000 : 1440;
  const fh = wide ? 540 : 780;
  return (
    <>
      <Layer depth={0.05}>
        <Paper />
        <EngravedSky h={1500} y={-400} dark={0.3} wash="dawn" />
        <Sun x={1560} y={760 - easeOut(clamp(T / 220)) * 260} r={110} rays={44} spin={0.18} rayLen={2200} />
      </Layer>
      <Layer depth={0.2}>
        <Clouds speed={0.8} clouds={[{ x: 0, y: 700, w: 700, h: 160, seed: "ec1" }, { x: 1100, y: 820, w: 600, h: 140, seed: "ec2" }, { x: 600, y: 120, w: 520, h: 130, seed: "ec3" }]} />
      </Layer>
      <Layer depth={1}>
        <defs>
          <linearGradient id={uid} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff3c4" stopOpacity={0} />
            <stop offset="0.5" stopColor="#fff3c4" stopOpacity={0.55} />
            <stop offset="1" stopColor="#fff3c4" stopOpacity={0} />
          </linearGradient>
          <clipPath id={`${uid}c`}>
            <rect x={fx - 40} y={fy - 80} width={fw + 200} height={fh + 200} />
          </clipPath>
        </defs>
        <line x1={fx - 8} y1={fy - 30} x2={fx - 8} y2={1300} stroke={pal.ink} strokeWidth={wide ? 16 : 22} />
        <line x1={fx - 11} y1={fy - 30} x2={fx - 11} y2={1300} stroke={pal.gold} strokeWidth={wide ? 7 : 10} />
        <circle cx={fx - 8} cy={fy - 40} r={wide ? 18 : 26} fill={pal.gold} stroke={pal.ink} strokeWidth={3} />
        <Flag x={fx} y={fy} w={fw} h={fh} amp={1.1} speed={0.32} waves={1.5} stars={50} t={T} />
        <g clipPath={`url(#${uid}c)`} style={{ mixBlendMode: "screen" }}>
          <path d={`M${sweepX} ${fy - 100}L${sweepX + 260} ${fy - 100}L${sweepX - 140} ${fy + fh + 200}L${sweepX - 400} ${fy + fh + 200}Z`} fill={`url(#${uid})`} />
        </g>
      </Layer>
      <Layer depth={1.4}>
        <Dust count={60} speed={0.3} color="glow" size={3} seed="edust" />
      </Layer>
    </>
  );
};

// A. Close on the flag at sunrise, slow motion
const FlagShot: React.FC = () => (
  <Camera keys={[{ f: 0, z: 1.12, x: 80, y: 20 }, { f: 120, z: 1.0, x: -20, y: 0 }]} handheld={2} seed={101}>
    <SunriseFlag t0={0} />
  </Camera>
);

// B. Title card over the flag: AMERICA / EST. 1776, then hold
const TitleShot: React.FC = () => {
  const f = useCurrentFrame();
  const letters = "AMERICA".split("");
  const shine = -30 + ((f - 30) / 50) * 140;
  const est = ramp(f, 24, 40, easeOut);
  return (
    <Camera keys={[{ f: 0, z: 1.0 }, { f: 108, z: 1.08, y: -10 }]} handheld={2} seed={102}>
      <SunriseFlag wide t0={120} />
      <Layer depth={0} html>
        <AbsoluteFill style={{ background: "radial-gradient(ellipse 70% 55% at 50% 52%, rgba(6,10,28,0.72), rgba(6,10,28,0.25) 70%, rgba(6,10,28,0) 100%)" }} />
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column" }}>
          <div style={{ display: "flex", fontFamily: DISPLAY_FAMILY, fontWeight: 900, fontSize: 230, letterSpacing: 26, lineHeight: 1 }}>
            {letters.map((ch, i) => {
              const p = easeOut(clamp((f - 2 - i * 3) / 14));
              return (
                <span
                  key={i}
                  style={{
                    display: "inline-block",
                    opacity: p,
                    transform: `translateY(${(1 - p) * 60}px) scale(${1.25 - 0.25 * p})`,
                    filter: `blur(${(1 - p) * 12}px)`,
                    backgroundImage: `linear-gradient(100deg, #b8862a 0%, #f7dc8a ${Math.max(0, shine - 12)}%, #fffbe8 ${shine}%, #f7dc8a ${shine + 12}%, #b8862a 100%)`,
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                    WebkitTextStroke: "2px rgba(40,24,6,0.9)",
                    textShadow: "0 10px 40px rgba(0,0,0,0.5)",
                  }}
                >
                  {ch}
                </span>
              );
            })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 30, marginTop: 30, opacity: est, transform: `translateY(${(1 - est) * 20}px)` }}>
            <div style={{ width: 220 * est, height: 3, background: "linear-gradient(90deg, rgba(247,220,138,0), #f7dc8a)" }} />
            <span style={{ color: "#f7dc8a", fontSize: 40 }}>★</span>
            <span style={{ fontFamily: DISPLAY_FAMILY, fontWeight: 700, fontSize: 64, letterSpacing: 18, color: "#fbf1d4", textShadow: "0 4px 18px rgba(0,0,0,0.7)" }}>EST. 1776</span>
            <span style={{ color: "#f7dc8a", fontSize: 40 }}>★</span>
            <div style={{ width: 220 * est, height: 3, background: "linear-gradient(90deg, #f7dc8a, rgba(247,220,138,0))" }} />
          </div>
        </AbsoluteFill>
      </Layer>
      <Layer depth={1.2}>
        <Embers x={960} y={1120} w={1900} count={40} rise={2} seed="tembers" size={2.4} />
      </Layer>
    </Camera>
  );
};

const Black: React.FC = () => <AbsoluteFill style={{ backgroundColor: "#000" }} />;

export const ending: SceneDef = {
  id: "ending",
  seedBase: 100,
  shots: [
    { from: 0, dur: c(4), el: <FlagShot />, enter: "ink", origin: [960, 500], palette: "color", name: "flag at sunrise" },
    { from: c(4), dur: c(7.5) - c(4), el: <TitleShot />, enter: "morph", palette: "color", name: "title card" },
    { from: c(7.5), dur: c(8) - c(7.5), el: <Black />, enter: "cut", palette: "color", overlay: { texture: 0, vignette: 0, grain: 0 }, name: "cut to black" },
  ],
};

