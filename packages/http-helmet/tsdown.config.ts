import { defineConfig } from "tsdown";
import pkgJson from "./package.json" with { type: "json" };

let external = Object.keys(pkgJson.dependencies || {});

export default defineConfig({
  shims: true,
  entry: ["src/index.ts", "src/react.tsx"],
  sourcemap: true,
  external,
  tsconfig: "./tsconfig.json",
  dts: true,
  format: ["cjs", "esm"],
  platform: "neutral",
  copy() {
    return ["../../LICENSE", { from: "../../LICENSE", to: "LICENSE" }];
  },
});
