import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  dts: true,
  format: ["esm"],
  tsconfig: "tsconfig.json",
  sourcemap: true,
  clean: true,
  exports: true,
  publint: true,
  attw: { profile: "node16" },
  skipNodeModulesBundle: true,
  platform: "node",
  define: {
    "import.meta.vitest": "undefined",
  },
});
