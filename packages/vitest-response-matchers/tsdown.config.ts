import { defineConfig } from "tsdown"

export default defineConfig({
  entry: {
    index: "./src/index.ts",
    client: "./src/client.ts",
    matchers: "./src/matchers/index.ts",
  },
  dts: true,
  format: "esm",
  tsconfig: "tsconfig.json",
  sourcemap: true,
  clean: true,
  exports: true,
  publint: true,
  attw: { profile: "node16" },
  deps: { neverBundle: true },
  platform: "node",
  define: {
    "import.meta.vitest": "undefined",
  },
})
