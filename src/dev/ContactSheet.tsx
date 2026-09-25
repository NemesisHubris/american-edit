// Dev tool: several frames of a scene in one still, for fast visual checks.
import { AbsoluteFill, Freeze } from "remotion";
import { SceneView } from "../scenes/SceneView";
import { SCENE_DEFS } from "../scenes";
import { LAB_DEF } from "./Lab";
import { HistoryEdit } from "../HistoryEdit";

export const ContactSheet: React.FC<{ scene: string; frames: number[] }> = ({ scene, frames }) => {
  const def = scene === "lab" ? LAB_DEF : SCENE_DEFS.find((d) => d.id === scene);
  const cols = frames.length <= 4 ? 2 : 3;
  const rows = Math.ceil(frames.length / cols);
  const s = Math.min(1 / cols, 1 / rows);
  const w = 1920 * s;
  const h = 1080 * s;
  const oy = (1080 - rows * h) / 2;
  return (
    <AbsoluteFill style={{ backgroundColor: "#222" }}>
      {frames.map((fr, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: (i % cols) * w,
            top: oy + Math.floor(i / cols) * h,
            width: 1920,
            height: 1080,
            transform: `scale(${s})`,
            transformOrigin: "0 0",
            overflow: "hidden",
          }}
        >
          <Freeze frame={fr}>{scene === "full" || !def ? <HistoryEdit /> : <SceneView def={def} />}</Freeze>
          <div style={{ position: "absolute", left: 16, top: 12, color: "#0f0", fontSize: 44, fontFamily: "monospace", textShadow: "0 0 6px #000" }}>
            {fr}
          </div>
        </div>
      ))}
    </AbsoluteFill>
  );
};
