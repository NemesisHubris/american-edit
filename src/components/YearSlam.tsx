import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { SERIF_FAMILY } from "../fonts";

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

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          transform: `translate(${shakeX}px, ${shakeY + moveY}px)`,
        }}
      >
        <div
          style={{
            fontFamily: SERIF_FAMILY,
            fontWeight: 700,
            fontSize,
            lineHeight: 1,
            color: "white",
            opacity: fallOpacity,
            transform: `scale(${fallScale * moveScale})`,
            textShadow: "0 8px 40px rgba(0, 0, 0, 0.6)",
          }}
        >
          {text}
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: "white", opacity: flash }} />
    </AbsoluteFill>
  );
};
