// Applies to `remotion studio` and `remotion render` (not the Node.js APIs).
// https://www.remotion.dev/docs/config
import { Config } from "@remotion/cli/config";

// Serve assets/ as the static folder: staticFile("clips/foo.mp4") -> assets/clips/foo.mp4
Config.setPublicDir("./assets");
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
