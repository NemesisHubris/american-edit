// Applies to `remotion studio` and `remotion render` (not the Node.js APIs).
// https://www.remotion.dev/docs/config
import { Config } from "@remotion/cli/config";

// Serve assets/ as the static folder: staticFile("clips/foo.mp4") -> assets/clips/foo.mp4
Config.setPublicDir("./assets");
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);

// Remotion's esbuild loader can't read tsconfig.json with TypeScript 7, so it
// would fall back to classic JSX (React.createElement). Force the automatic
// runtime so JSX works everywhere, including at module level.
Config.overrideWebpackConfig((config) => ({
  ...config,
  module: {
    ...config.module,
    rules: (config.module?.rules ?? []).map((rule) => {
      if (!rule || typeof rule !== "object" || !Array.isArray(rule.use)) return rule;
      return {
        ...rule,
        use: rule.use.map((u) =>
          u && typeof u === "object" && typeof u.loader === "string" && u.loader.includes("esbuild-loader")
            ? { ...u, options: { ...(u.options as object), jsx: "automatic" } }
            : u,
        ),
      };
    }),
  },
}));
