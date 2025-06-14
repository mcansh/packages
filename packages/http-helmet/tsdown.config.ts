import { defineConfig } from "tsdown";
import pkgJson from "./package.json" with { type: "json" };

let external = Object.keys(pkgJson.dependencies || {});

export default defineConfig({
  entry: ["src/index.ts", "src/react.tsx"],
  dts: true,
  format: ["cjs", "esm"],
  tsconfig: "./tsconfig.json",
  sourcemap: true,
  clean: true,
  publint: true,
  attw: true,
  external,
  platform: "neutral",
  copy() {
    return ["../../LICENSE", { from: "../../LICENSE", to: "LICENSE" }];
  },
});
