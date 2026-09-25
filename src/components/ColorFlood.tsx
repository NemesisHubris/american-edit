// Sepia -> full colour: the colour version floods outward from `origin`
// through an ink-edged blob, with a bright rim riding the edge.
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { easeOut, clamp } from "../lib/math";
import { COLOR, PaletteContext, SEPIA } from "../lib/palette";
import { blobD } from "./Shots";

export const ColorFlood: React.FC<{ at: number; dur?: number; origin: [number, number]; children: React.ReactNode }> = ({
  at,
  dur = 16,
  origin,
  children,
}) => {
  const f = useCurrentFrame();
  const p = clamp((f - at) / dur);
  if (p <= 0)
    return (
      <PaletteContext.Provider value={SEPIA}>
        <AbsoluteFill>{children}</AbsoluteFill>
      </PaletteContext.Provider>
    );
  if (p >= 1)
    return (
      <PaletteContext.Provider value={COLOR}>
        <AbsoluteFill>{children}</AbsoluteFill>
      </PaletteContext.Provider>
    );
  const R = easeOut(p) * 2400 + 20;
  const d = blobD(origin[0], origin[1], R, 3, 0.2, 6, 96, 0.04);
  return (
    <AbsoluteFill>
      <PaletteContext.Provider value={SEPIA}>
        <AbsoluteFill>{children}</AbsoluteFill>
      </PaletteContext.Provider>
      <PaletteContext.Provider value={COLOR}>
        <AbsoluteFill style={{ clipPath: `path('${d}')` }}>{children}</AbsoluteFill>
      </PaletteContext.Provider>
      <AbsoluteFill>
        <svg width={1920} height={1080}>
          <path d={d} fill="none" stroke="#ffe7a0" strokeWidth={40 * (1 - p) + 6} opacity={0.55 * (1 - p)} />
          <path d={d} fill="none" stroke="#fff" strokeWidth={8 * (1 - p) + 2} opacity={0.9 * (1 - p)} />
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
