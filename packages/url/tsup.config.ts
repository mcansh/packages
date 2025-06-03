import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  dts: true,
  format: ["esm"],
  tsconfig: "tsconfig.json",
  sourcemap: true,
  clean: true,
});
