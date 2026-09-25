import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SERIF_FAMILY } from "../fonts";

type Props = {
  text: string;
  startFrame: number;
  framesPerWord?: number;
  fontSize?: number;
  maxWidth?: number;
  style?: React.CSSProperties;
};

// Reveals text one word at a time. Hidden words still take up space so lines never reflow.
export const WordPop: React.FC<Props> = ({
  text,
  startFrame,
  framesPerWord = 5,
  fontSize = 84,
  maxWidth = 1500,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(" ");

  return (
    <div
      style={{
        fontFamily: SERIF_FAMILY,
        fontWeight: 700,
        fontSize,
        lineHeight: 1.25,
        color: "white",
        textAlign: "center",
        maxWidth,
        textShadow: "0 4px 24px rgba(0, 0, 0, 0.7)",
        ...style,
      }}
    >
      {words.map((word, i) => {
        const pop = spring({
          frame: frame - startFrame - i * framesPerWord,
          fps,
          config: { damping: 11, stiffness: 220, mass: 0.6 },
        });
        const scale = interpolate(pop, [0, 1], [0.4, 1]);
        const y = interpolate(pop, [0, 1], [24, 0]);
        const opacity = interpolate(pop, [0, 0.4], [0, 1], { extrapolateRight: "clamp" });

        return (
          <span key={i}>
            <span
              style={{
                display: "inline-block",
                opacity,
                transform: `translateY(${y}px) scale(${scale})`,
              }}
            >
              {word}
            </span>
            {i < words.length - 1 ? " " : null}
          </span>
        );
      })}
    </div>
  );
};
