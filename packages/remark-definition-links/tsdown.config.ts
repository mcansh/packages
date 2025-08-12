import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  attw: true,
  publint: true,
  clean: true,
  format: "esm",
  dts: true,
  exports: true,
  outDir: "dist",
  nodeProtocol: true,
  platform: "neutral",
  skipNodeModulesBundle: true,
  sourcemap: true,
  treeshake: true,
  tsconfig: "./tsconfig.json",
  unused: true,
});
