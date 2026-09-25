import { AbsoluteFill, useCurrentFrame } from "remotion";
import { clamp, easeOut, ramp } from "../lib/math";
import { hash, noise1 } from "../lib/random";

export type Hit = { f: number; amp?: number; dur?: number; punch?: number };

// Camera shake + zoom punch on beat hits (wraps the whole picture).
export const Shake: React.FC<{ hits: Hit[]; children: React.ReactNode }> = ({ hits, children }) => {
  const f = useCurrentFrame();
  let x = 0;
  let y = 0;
  let r = 0;
  let punch = 0;
  let maxAmp = 0;
  hits.forEach((h, i) => {
    const dur = h.dur ?? 14;
    const a = f - h.f;
    if (a < 0 || a > dur) return;
    const amp = h.amp ?? 14;
    const env = Math.exp(-a / (dur * 0.35)) * (1 - a / dur);
    x += amp * env * noise1(f * 0.85, i * 7 + 1);
    y += amp * env * noise1(f * 0.85, i * 7 + 4);
    r += amp * env * 0.03 * noise1(f * 0.6, i * 7 + 9);
    punch += (h.punch ?? 0) * Math.exp(-a / 4);
    maxAmp = Math.max(maxAmp, amp * env);
  });
  const s = 1 + maxAmp / 700 + punch;
  return (
    <AbsoluteFill style={{ transform: `translate(${x}px, ${y}px) rotate(${r}deg) scale(${s})` }}>{children}</AbsoluteFill>
  );
};

export type FlashSpec = { f: number; dur?: number; color?: string; peak?: number };

export const Flashes: React.FC<{ flashes: FlashSpec[] }> = ({ flashes }) => {
  const f = useCurrentFrame();
  return (
    <>
      {flashes.map((fl, i) => {
        const a = f - fl.f;
        const dur = fl.dur ?? 10;
        if (a < 0 || a > dur) return null;
        const op = (fl.peak ?? 1) * Math.pow(1 - a / dur, 1.6);
        return <AbsoluteFill key={i} style={{ backgroundColor: fl.color ?? "#fffdf6", opacity: op }} />;
      })}
    </>
  );
};

// Warm drifting light leaks (screen blended).
export const LightLeak: React.FC<{ seed?: number; intensity?: number; color?: string; color2?: string }> = ({
  seed = 1,
  intensity = 0.5,
  color = "255,170,80",
  color2 = "255,220,150",
}) => {
  const f = useCurrentFrame();
  const x1 = 20 + noise1(f / 70, seed) * 30 + hash(seed, 1) * 30;
  const y1 = 30 + noise1(f / 80, seed + 1) * 25;
  const x2 = 70 + noise1(f / 60, seed + 2) * 25;
  const y2 = 60 + noise1(f / 90, seed + 3) * 25;
  const pulse = 0.75 + 0.25 * Math.sin(f / 23 + seed);
  return (
    <AbsoluteFill
      style={{
        mixBlendMode: "screen",
        opacity: intensity * pulse,
        background: `radial-gradient(ellipse 45% 55% at ${x1}% ${y1}%, rgba(${color},0.55), rgba(${color},0) 70%), radial-gradient(ellipse 35% 40% at ${x2}% ${y2}%, rgba(${color2},0.45), rgba(${color2},0) 70%)`,
      }}
    />
  );
};

// Soft glow disc for light sources (candles, bulbs, sun).
export const glowOpacity = (f: number, seed: number, base = 0.85, amt = 0.15) =>
  clamp(base + amt * (noise1(f / 3, seed) * 0.6 + noise1(f / 1.3, seed + 5) * 0.4));

export const fadeUp = (f: number, a: number, d = 10) => ramp(f, a, a + d, easeOut);
