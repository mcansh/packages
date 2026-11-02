import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "./src/index.ts",
    client: "./src/client.ts",
    matchers: "./src/matchers/index.ts",
  },
  dts: true,
  // Preserve module augmentation that the declaration bundler otherwise removes.
  copy: [{ from: "./src/client.ts", to: "./dist/client.d.ts" }],
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
