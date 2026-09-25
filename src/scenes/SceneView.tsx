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
