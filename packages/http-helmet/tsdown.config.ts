import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "./src/index.ts",
    react: "./src/react.tsx",
    "remix-middleware": "./src/remix-middleware.ts",
  },
  dts: true,
  format: ["cjs", "esm"],
  tsconfig: "./tsconfig.json",
  sourcemap: true,
  exports: true,
  clean: true,
  publint: true,
  attw: { profile: "node16" },
  platform: "neutral",
  define: {
    "import.meta.vitest": "undefined",
  },
});
