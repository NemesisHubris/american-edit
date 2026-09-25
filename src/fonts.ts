import { cancelRender, continueRender, delayRender, staticFile } from "remotion";

// To swap the serif, drop a new font into assets/fonts/ and change these two lines.
const SERIF_FILE = "fonts/LiberationSerif-Bold.ttf";
export const SERIF_FAMILY = "EditSerif";

const handle = delayRender(`Loading font ${SERIF_FILE}`);
const font = new FontFace(SERIF_FAMILY, `url('${staticFile(SERIF_FILE)}')`, {
  weight: "700",
});

font
  .load()
  .then(() => {
    document.fonts.add(font);
    continueRender(handle);
  })
  .catch((err) => cancelRender(err));
