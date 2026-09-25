import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { DISPLAY_FAMILY, SERIF_FAMILY } from "../fonts";
import { clamp, TAU } from "../lib/math";
import { hash } from "../lib/random";

const FALL_FRAMES = 5;
const FLASH_FRAMES = 12;
const SHAKE_FRAMES = 12;
const SHAKE_PX = 18;

type Props = {
  text: string;
  startFrame: number;
  fontSize?: number;
  // Optional move after landing, e.g. up and smaller to make room for a quote
  moveFrom?: number;
  moveFrames?: number;
  moveToY?: number;
  moveToScale?: number;
  display?: boolean; // engraved Cinzel instead of the serif
  exitAt?: number; // frame the year bursts away
  splatter?: boolean; // ink splatter on impact
  scrim?: number; // dark halo behind the year (0..1)
  flash?: boolean;
};

// Big text that falls from oversized into place, with a white flash and screen shake on impact
export const YearSlam: React.FC<Props> = ({
  text,
  startFrame,
  fontSize = 300,
  moveFrom,
  moveFrames = 15,
  moveToY = 0,
  moveToScale = 1,
  display = false,
  exitAt,
  splatter = false,
  scrim = 0,
  flash: showFlash = true,
}) => {
  const frame = useCurrentFrame();
  const impact = startFrame + FALL_FRAMES;

  if (frame < startFrame) {
    return null;
  }

  const fallScale = interpolate(frame, [startFrame, impact], [3.5, 1], {
    easing: Easing.in(Easing.cubic),
    extrapolateRight: "clamp",
  });
  const fallOpacity = interpolate(frame, [startFrame, startFrame + 2], [0, 1], {
    extrapolateRight: "clamp",
  });

  const flash = interpolate(frame, [impact, impact + FLASH_FRAMES], [1, 0], {
    easing: Easing.out(Easing.quad),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const shakeAmount = interpolate(frame, [impact, impact + SHAKE_FRAMES], [SHAKE_PX, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const shakeX = Math.sin(frame * 2.7) * shakeAmount;
  const shakeY = Math.cos(frame * 3.3) * shakeAmount;

  const moveProgress =
    moveFrom === undefined
      ? 0
      : interpolate(frame, [moveFrom, moveFrom + moveFrames], [0, 1], {
          easing: Easing.inOut(Easing.cubic),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
  const moveY = moveProgress * moveToY;
  const moveScale = 1 + moveProgress * (moveToScale - 1);

  // Exit: the year punches forward and bleeds away
  const ex = exitAt === undefined ? 0 : clamp((frame - exitAt) / 8);
  if (ex >= 1) return null;
  const exScale = 1 + Easing.in(Easing.cubic)(ex) * 0.6;
  // Slow settle drift while holding so the year never sits dead still
  const hold = Math.max(0, frame - impact);
  const drift = 1 + hold * 0.0025;

  const splats: React.ReactNode[] = [];
  if (splatter && frame >= impact) {
    const a = frame - impact;
    const grow = Easing.out(Easing.cubic)(clamp(a / 6));
    for (let i = 0; i < 38; i++) {
      const ang = hash(i, 3) * TAU;
      const dist = (fontSize * 0.9 + hash(i, 4) * fontSize * 1.6) * grow;
      const r = 3 + hash(i, 5) * hash(i, 6) * 26;
      splats.push(
        <circle
          key={i}
          cx={960 + Math.cos(ang) * dist * 1.5}
          cy={540 + Math.sin(ang) * dist * 0.75}
          r={r * (0.6 + 0.4 * grow)}
          fill="#1d1208"
          opacity={0.85 * (1 - ex)}
        />,
      );
    }
  }

  return (
    <AbsoluteFill>
      {scrim > 0 && (
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse 50% 42% at 50% 50%, rgba(10,6,2,${0.75 * scrim}), rgba(10,6,2,0) 75%)`,
            opacity: fallOpacity * (1 - ex),
          }}
        />
      )}
      {splats.length > 0 && (
        <AbsoluteFill style={{ transform: `translate(${shakeX}px, ${shakeY}px)` }}>
          <svg width={1920} height={1080}>{splats}</svg>
        </AbsoluteFill>
      )}
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          transform: `translate(${shakeX}px, ${shakeY + moveY}px)`,
        }}
      >
        <div
          style={{
            fontFamily: display ? DISPLAY_FAMILY : SERIF_FAMILY,
            fontWeight: display ? 800 : 700,
            fontSize,
            lineHeight: 1,
            color: "white",
            letterSpacing: display ? fontSize * 0.02 : 0,
            opacity: fallOpacity * (1 - ex),
            filter: ex > 0 ? `blur(${ex * 14}px)` : undefined,
            transform: `scale(${fallScale * moveScale * exScale * drift})`,
            textShadow: "0 8px 40px rgba(0, 0, 0, 0.6), 0 0 4px rgba(0,0,0,0.5)",
          }}
        >
          {text}
        </div>
      </AbsoluteFill>
      {showFlash && <AbsoluteFill style={{ backgroundColor: "white", opacity: flash }} />}
    </AbsoluteFill>
  );
};
