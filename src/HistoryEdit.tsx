import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { Flashes, Shake } from "./components/Effects";
import { Shots } from "./components/Shots";
import { SCENE_DEFS } from "./scenes";
import { MUSIC, sceneInfo, TRACK_OFFSET } from "./timeline";
import { FPS } from "./constants";

// The full 1:45 edit: every scene's beat-snapped shots on one timeline so
// transitions can cross scene boundaries.
export const HistoryEdit: React.FC = () => {
  const placed = SCENE_DEFS.map((def) => ({ def, info: sceneInfo(def.id) }));
  const shots = placed.flatMap(({ def, info }) => def.shots.map((s) => ({ ...s, from: s.from + info.from })));
  const hits = placed.flatMap(({ def, info }) => (def.hits ?? []).map((h) => ({ ...h, f: h.f + info.from })));
  const flashes = placed.flatMap(({ def, info }) => (def.flashes ?? []).map((fl) => ({ ...fl, f: fl.f + info.from })));
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Shake hits={hits}>
        <Shots shots={shots} />
      </Shake>
      <Flashes flashes={flashes} />
      {placed.map(({ def, info }) =>
        def.Overlay ? (
          <Sequence key={def.id} from={info.from} durationInFrames={info.durationInFrames} name={`${def.id} overlay`}>
            <def.Overlay />
          </Sequence>
        ) : null,
      )}
      {MUSIC &&
        (TRACK_OFFSET >= 0 ? (
          <Audio src={staticFile(MUSIC)} startFrom={Math.round(TRACK_OFFSET * FPS)} />
        ) : (
          <Sequence from={Math.round(-TRACK_OFFSET * FPS)}>
            <Audio src={staticFile(MUSIC)} />
          </Sequence>
        ))}
    </AbsoluteFill>
  );
};
