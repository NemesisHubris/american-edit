// Texture sources rendered once with `npm run textures` into assets/textures.
import { AbsoluteFill } from "remotion";
import { rng } from "../lib/random";

const brown = "0 0 0 0 0.42  0 0 0 0 0.27  0 0 0 0 0.12";

export const TexPaper: React.FC = () => {
  const r = rng("foxing");
  const spots = Array.from({ length: 40 }, () => ({
    x: r() * 1920,
    y: r() * 1080,
    rr: 1 + r() * r() * 9,
    o: 0.06 + r() * 0.16,
  }));
  return (
    <AbsoluteFill style={{ backgroundColor: "#fffaf0" }}>
      <svg width={1920} height={1080}>
        <defs>
          <filter id="blot" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.0014 0.0018" numOctaves={4} seed={7} />
            <feColorMatrix values={`${brown}  0 0 0 0.85 -0.4`} />
          </filter>
          <filter id="mottle" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves={3} seed={11} />
            <feColorMatrix values={`${brown}  0 0 0 0.5 -0.22`} />
          </filter>
          <filter id="fiber" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.5 0.035" numOctaves={2} seed={3} />
            <feColorMatrix values={`${brown}  0 0 0 0.55 -0.24`} />
          </filter>
          <filter id="speck" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={1} seed={5} />
            <feColorMatrix values={`${brown}  0 0 0 2.4 -1.62`} />
          </filter>
          <filter id="ring">
            <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves={2} seed={9} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={26} />
            <feGaussianBlur stdDeviation={1.2} />
          </filter>
          <filter id="soft">
            <feGaussianBlur stdDeviation={1.5} />
          </filter>
        </defs>
        <rect width={1920} height={1080} filter="url(#blot)" />
        <rect width={1920} height={1080} filter="url(#mottle)" />
        <rect width={1920} height={1080} filter="url(#fiber)" />
        <rect width={1920} height={1080} filter="url(#speck)" />
        <g filter="url(#soft)" fill="#6b4520">
          {spots.map((s, i) => (
            <circle key={i} cx={s.x} cy={s.y} r={s.rr} opacity={s.o} />
          ))}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export const TexGrain: React.FC<{ seed: number }> = ({ seed }) => (
  <AbsoluteFill style={{ backgroundColor: "#808080" }}>
    <svg width={512} height={512}>
      <filter id="g" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves={2} seed={seed} stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
        <feComponentTransfer>
          <feFuncA type="linear" slope={0} intercept={1} />
        </feComponentTransfer>
      </filter>
      <rect width={512} height={512} filter="url(#g)" />
    </svg>
  </AbsoluteFill>
);
