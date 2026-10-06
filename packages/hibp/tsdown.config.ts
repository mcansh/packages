import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  dts: true,
  format: "esm",
  platform: "neutral",
  clean: true,
  publint: true,
  attw: { profile: "esm-only" },
  sourcemap: true,
});
