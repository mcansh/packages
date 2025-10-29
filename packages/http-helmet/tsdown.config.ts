import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "./src/index.ts",
    react: "./src/react.tsx",
    v2: "./src/v2/index.ts",
    constants: "./src/v2/constants.ts",
  },
  dts: true,
  format: "esm",
  tsconfig: "./tsconfig.json",
  sourcemap: true,
  exports: true,
  clean: true,
  publint: true,
  attw: { profile: "esmOnly" },
  skipNodeModulesBundle: true,
  nodeProtocol: true,
  platform: "neutral",
  define: {
    "import.meta.vitest": "undefined",
  },
});
