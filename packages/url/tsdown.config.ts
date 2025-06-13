import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  experimentalDts: true,
  format: ["esm"],
  tsconfig: "tsconfig.json",
  sourcemap: true,
  clean: true,
  copy() {
    return ["../../LICENSE", { from: "../../LICENSE", to: "LICENSE" }];
  },
});
