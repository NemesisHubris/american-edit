import { AbsoluteFill } from "remotion";
import { WordPop } from "./components/WordPop";
import { YearSlam } from "./components/YearSlam";

const QUOTE =
  "We hold these truths to be self-evident, that all men are created equal.";

export const Test1776: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <YearSlam
        text="1776"
        startFrame={8}
        fontSize={300}
        moveFrom={45}
        moveToY={-230}
        moveToScale={0.55}
      />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", top: 170 }}>
        <WordPop text={QUOTE} startFrame={55} framesPerWord={5} fontSize={84} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
