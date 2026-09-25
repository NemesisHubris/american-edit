import { cancelRender, continueRender, delayRender, staticFile } from "remotion";

// Quote text: bold serif. Attributions: italic. Years and titles: Cinzel.
export const SERIF_FAMILY = "EditSerif";
export const ITALIC_FAMILY = "EditSerifItalic";
export const DISPLAY_FAMILY = "EditDisplay";

const FONTS: [string, string, FontFaceDescriptors][] = [
  [SERIF_FAMILY, "fonts/LiberationSerif-Bold.ttf", { weight: "700" }],
  [ITALIC_FAMILY, "fonts/LiberationSerif-Italic.ttf", { weight: "400", style: "normal" }],
  [ITALIC_FAMILY, "fonts/LiberationSerif-BoldItalic.ttf", { weight: "700", style: "normal" }],
  [DISPLAY_FAMILY, "fonts/Cinzel.ttf", { weight: "400 900" }],
];

const handle = delayRender("Loading fonts");
Promise.all(
  FONTS.map(([family, file, desc]) => {
    const face = new FontFace(family, `url('${staticFile(file)}')`, desc);
    return face.load().then(() => document.fonts.add(face));
  }),
)
  .then(() => continueRender(handle))
  .catch((err) => cancelRender(err));
