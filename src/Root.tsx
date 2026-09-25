import { Composition } from "remotion";
import { DURATION_IN_FRAMES, FPS, HEIGHT, WIDTH } from "./constants";
import { HistoryEdit } from "./HistoryEdit";
import { Test1776 } from "./Test1776";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="HistoryEdit"
        component={HistoryEdit}
        durationInFrames={DURATION_IN_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="Test1776"
        component={Test1776}
        durationInFrames={5 * FPS}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    </>
  );
};
