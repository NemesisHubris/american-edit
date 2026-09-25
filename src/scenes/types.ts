import type { FlashSpec, Hit } from "../components/Effects";
import type { ShotSpec } from "../components/Shots";
import type { SceneId } from "../timeline";

// A scene is a list of beat-snapped shots plus hits (shake/punch), flashes and
// an overlay (years, quotes) — all in scene-local frames.
export type SceneDef = {
  id: SceneId;
  shots: ShotSpec[];
  hits?: Hit[];
  flashes?: FlashSpec[];
  Overlay?: React.FC;
  seedBase?: number;
};
