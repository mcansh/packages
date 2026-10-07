import { defineConfig } from "tsdown"

export default defineConfig({
  entry: {
    index: "./src/index.ts",
    react: "./src/react.tsx",
  },
  dts: true,
  format: ["cjs", "esm"],
  tsconfig: "./tsconfig.json",
  sourcemap: true,
  exports: true,
  clean: true,
  publint: true,
  attw: { profile: "node16" },
  deps: {
    alwaysBundle: ["change-case"],
  },
  platform: "neutral",
  define: {
    "import.meta.vitest": "undefined",
  },
})
