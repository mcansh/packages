import { defineConfig } from "tsdown";
import { defaultBuildConfig } from "./src/build.ts";

export default defineConfig({
  ...defaultBuildConfig,
  entry: { index: "./src/index.ts" },
});
