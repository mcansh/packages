import { defineConfig } from "tsdown";
import pkgJson from "./package.json" with { type: "json" };

let external =
  "dependencies" in pkgJson && pkgJson.dependencies
    ? Object.keys(pkgJson.dependencies)
    : [];

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
  external,
  platform: "neutral",
  define: {
    "import.meta.vitest": "undefined",
  },
});
