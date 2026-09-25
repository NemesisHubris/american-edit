import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { hash } from "../lib/random";
import { usePalette } from "../lib/palette";

// Base paper colour, drawn as the back layer of a shot.
export const Paper: React.FC<{ tint?: string; x?: number; y?: number; w?: number; h?: number }> = ({
  tint,
  x = -400,
  y = -400,
  w = 2720,
  h = 1880,
}) => {
  const pal = usePalette();
  return <rect x={x} y={y} width={w} height={h} fill={tint ?? pal.paper} />;
};

// Screen-space finishing pass: paper texture (multiply), vignette, film grain
// and a faint exposure flicker. `seed` shifts the texture so each shot differs.
export const PaperOverlay: React.FC<{
  seed?: number;
  texture?: number;
  vignette?: number;
  grain?: number;
  flicker?: number;
}> = ({ seed = 0, texture = 0.55, vignette = 0.5, grain = 0.12, flicker = 0.035 }) => {
  const f = useCurrentFrame();
  const ox = Math.round(hash(seed, 1) * 240 - 120);
  const oy = Math.round(hash(seed, 2) * 140 - 70);
  const flip = hash(seed, 3) > 0.5 ? -1 : 1;
  const g = f % 4;
  const gx = Math.floor(hash(f, 7) * 512);
  const gy = Math.floor(hash(f, 8) * 512);
  const fl = (hash(Math.floor(f / 2), 9) - 0.5) * flicker;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {texture > 0 && (
        <AbsoluteFill style={{ mixBlendMode: "multiply", opacity: texture, overflow: "hidden" }}>
          <Img
            src={staticFile("textures/paper.jpg")}
            style={{
              position: "absolute",
              left: -160 + ox,
              top: -90 + oy,
              width: 2240,
              height: 1260,
              transform: `scaleX(${flip})`,
            }}
          />
        </AbsoluteFill>
      )}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 75% 70% at 50% 48%, rgba(40,24,10,0) 55%, rgba(40,24,10,${vignette * 0.55}) 85%, rgba(30,16,6,${vignette}) 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: `url(${staticFile(`textures/grain${g}.png`)})`,
          backgroundPosition: `${gx}px ${gy}px`,
          backgroundSize: "512px 512px",
          mixBlendMode: "overlay",
          opacity: grain,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundColor: fl > 0 ? "#fff6e0" : "#1a0f05",
          opacity: Math.abs(fl),
        }}
      />
    </AbsoluteFill>
  );
};
