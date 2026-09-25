import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ITALIC_FAMILY, SERIF_FAMILY } from "../fonts";

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
          config: { damping: 18, stiffness: 190, mass: 0.6, overshootClamping: true },
        });
        // never scales past 1, so neighbouring words can't collide
        const scale = interpolate(pop, [0, 1], [0.8, 1]);
        const y = interpolate(pop, [0, 1], [28, 0]);
        const blur = interpolate(pop, [0, 0.7], [8, 0], { extrapolateRight: "clamp" });
        const opacity = interpolate(pop, [0, 0.45], [0, 1], { extrapolateRight: "clamp" });

        return (
          <span key={i}>
            <span
              style={{
                display: "inline-block",
                opacity,
                transformOrigin: "50% 85%",
                transform: `translateY(${y}px) scale(${scale})`,
                filter: blur > 0.2 ? `blur(${blur}px)` : undefined,
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

// A quote over artwork: soft dark gradient, words popping in, then the speaker
// and year underneath. Exits with a quick ink-bleed dissolve at `end`.
export const Quote: React.FC<{
  text: string;
  by: string;
  start: number;
  end: number;
  framesPerWord?: number;
  fontSize?: number;
  maxWidth?: number;
  position?: "bottom" | "center" | "top";
}> = ({ text, by, start, end, framesPerWord = 4, fontSize = 68, maxWidth = 1500, position = "bottom" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < start - 2 || frame > end) return null;
  const words = text.split(" ");
  const inP = interpolate(frame, [start - 2, start + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const out = interpolate(frame, [end - 8, end], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
  const attrStart = start + words.length * framesPerWord + 3;
  const attr = spring({ frame: frame - attrStart, fps, config: { damping: 16, stiffness: 160, mass: 0.7 } });
  const justify = position === "bottom" ? "flex-end" : position === "top" ? "flex-start" : "center";
  const grad =
    position === "bottom"
      ? "linear-gradient(to top, rgba(12,7,2,0.82) 0%, rgba(12,7,2,0.6) 32%, rgba(12,7,2,0) 62%)"
      : position === "top"
        ? "linear-gradient(to bottom, rgba(12,7,2,0.82) 0%, rgba(12,7,2,0.6) 32%, rgba(12,7,2,0) 62%)"
        : "radial-gradient(ellipse 60% 45% at 50% 50%, rgba(12,7,2,0.75), rgba(12,7,2,0) 80%)";
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: grad, opacity: inP * (1 - out) }} />
      <AbsoluteFill
        style={{
          justifyContent: justify,
          alignItems: "center",
          padding: position === "center" ? 0 : "90px 0",
          opacity: 1 - out,
          filter: out > 0 ? `blur(${out * 10}px)` : undefined,
          transform: `scale(${1 + out * 0.06})`,
        }}
      >
        <WordPop
          text={`“${text}”`}
          startFrame={start}
          framesPerWord={framesPerWord}
          fontSize={fontSize}
          maxWidth={maxWidth}
        />
        <div
          style={{
            marginTop: 22,
            fontFamily: ITALIC_FAMILY,
            fontWeight: 400,
            fontSize: Math.round(fontSize * 0.46),
            letterSpacing: 1.5,
            color: "#f3e3c3",
            opacity: attr,
            transform: `translateY(${(1 - attr) * 16}px)`,
            textShadow: "0 2px 12px rgba(0,0,0,0.8)",
          }}
        >
          {`– ${by}`}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
