import { AbsoluteFill } from "remotion";
import { Flashes, Shake } from "../components/Effects";
import { Shots } from "../components/Shots";
import type { SceneDef } from "./types";

export const SceneView: React.FC<{ def: SceneDef }> = ({ def }) => {
  const { Overlay } = def;
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Shake hits={def.hits ?? []}>
        <Shots shots={def.shots} seedBase={def.seedBase ?? 0} />
      </Shake>
      <Flashes flashes={def.flashes ?? []} />
      {Overlay && <Overlay />}
    </AbsoluteFill>
  );
};

// Composition entry: props must be serializable, so pass the scene id.
export const SceneById: React.FC<{ id: string }> = ({ id }) => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const def = SCENE_LOOKUP(id);
  return def ? <SceneView def={def} /> : null;
};

let lookup: ((id: string) => SceneDef | undefined) | null = null;
export const registerSceneLookup = (fn: (id: string) => SceneDef | undefined) => {
  lookup = fn;
};
const SCENE_LOOKUP = (id: string) => (lookup ? lookup(id) : undefined);
