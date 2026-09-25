// Blueprint -> engraving morph for inventions: the same drawing renders as
// white-on-blue patent linework, then a bright scan line sweeps across and
// leaves the sepia engraving behind it.
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { clamp, easeInOut } from "../lib/math";
import { BLUEPRINT, PaletteContext, usePalette } from "../lib/palette";

export const BlueprintGrid: React.FC<{ label?: string; sub?: string }> = ({ label, sub }) => {
  const pal = usePalette();
  if (pal.mode !== "blueprint") return null;
  const fine: string[] = [];
  const bold: string[] = [];
  for (let x = -400; x <= 2320; x += 40) (x % 200 === 0 ? bold : fine).push(`M${x} -400V1500`);
  for (let y = -400; y <= 1500; y += 40) (y % 200 === 0 ? bold : fine).push(`M-400 ${y}H2320`);
  return (
    <g>
      <rect x={-400} y={-400} width={2720} height={1900} fill={pal.paper} />
      <path d={fine.join("")} stroke={pal.inkSoft} strokeWidth={0.8} opacity={0.35} />
      <path d={bold.join("")} stroke={pal.inkSoft} strokeWidth={1.4} opacity={0.5} />
      {label && (
        <g fill={pal.ink} fontFamily="monospace" opacity={0.85}>
          <rect x={1420} y={890} width={440} height={130} fill="none" stroke={pal.ink} strokeWidth={2} />
          <text x={1440} y={940} fontSize={30} letterSpacing={3}>
            {label}
          </text>
          {sub && (
            <text x={1440} y={990} fontSize={20} letterSpacing={2}>
              {sub}
            </text>
          )}
        </g>
      )}
    </g>
  );
};

export const BlueprintMorph: React.FC<{ from: number; to: number; children: React.ReactNode }> = ({ from, to, children }) => {
  const f = useCurrentFrame();
  const p = easeInOut(clamp((f - from) / Math.max(1, to - from)));
  if (p >= 1) return <AbsoluteFill>{children}</AbsoluteFill>;
  const X = -200 + p * 2500;
  const clip = `polygon(0 0, ${X}px 0, ${X - 300}px 100%, 0 100%)`;
  return (
    <AbsoluteFill>
      <PaletteContext.Provider value={BLUEPRINT}>
        <AbsoluteFill>{children}</AbsoluteFill>
      </PaletteContext.Provider>
      {p > 0 && <AbsoluteFill style={{ clipPath: clip }}>{children}</AbsoluteFill>}
      {p > 0 && (
        <AbsoluteFill>
          <svg width={1920} height={1080}>
            <line x1={X} y1={0} x2={X - 300} y2={1080} stroke="#e8f4ff" strokeWidth={10} opacity={0.9} />
            <line x1={X} y1={0} x2={X - 300} y2={1080} stroke="#8fd0ff" strokeWidth={40} opacity={0.3} />
          </svg>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
