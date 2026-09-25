import { Composition, Folder } from "remotion";
import { FPS, HEIGHT, WIDTH } from "./constants";
import { HistoryEdit } from "./HistoryEdit";
import { Test1776 } from "./Test1776";
import { TexGrain, TexPaper } from "./dev/Textures";
import { ContactSheet } from "./dev/ContactSheet";
import { Lab } from "./dev/Lab";
import { SCENE_DEFS } from "./scenes";
import { SceneView } from "./scenes/SceneView";
import { sceneInfo, SCENES, TOTAL_FRAMES } from "./timeline";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="HistoryEdit"
        component={HistoryEdit}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Folder name="Scenes">
        {SCENE_DEFS.map((def) => {
          const n = SCENES.findIndex((s) => s.id === def.id) + 1;
          return (
            <Composition
              key={def.id}
              id={`S${String(n).padStart(2, "0")}-${def.id}`}
              component={SceneView}
              defaultProps={{ def }}
              durationInFrames={sceneInfo(def.id).durationInFrames}
              fps={FPS}
              width={WIDTH}
              height={HEIGHT}
            />
          );
        })}
      </Folder>
      <Folder name="Dev">
        <Composition
          id="Sheet"
          component={ContactSheet}
          defaultProps={{ scene: "lab", frames: [0, 30, 60, 89] }}
          durationInFrames={TOTAL_FRAMES}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition id="Lab" component={Lab} durationInFrames={240} fps={FPS} width={WIDTH} height={HEIGHT} />
        <Composition
          id="Test1776"
          component={Test1776}
          durationInFrames={5 * FPS}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
      </Folder>
      <Folder name="Textures">
        <Composition id="TexPaper" component={TexPaper} durationInFrames={1} fps={FPS} width={WIDTH} height={HEIGHT} />
        {[0, 1, 2, 3].map((s) => (
          <Composition
            key={s}
            id={`TexGrain${s}`}
            component={TexGrain}
            defaultProps={{ seed: s * 17 + 1 }}
            durationInFrames={1}
            fps={FPS}
            width={512}
            height={512}
          />
        ))}
      </Folder>
    </>
  );
};
