import { defineConfig } from "tsdown";
import pkgJson from "./package.json" with { type: "json" };

let external =
  "dependencies" in pkgJson && pkgJson.dependencies
    ? Object.keys(pkgJson.dependencies)
    : [];

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
  external,
  platform: "neutral",
  define: {
    "import.meta.vitest": "undefined",
  },
});
