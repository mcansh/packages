import { mergeBuildConfig } from "@mcansh/config";
import { defineConfig } from "tsdown";

export default defineConfig(
  mergeBuildConfig({
    entry: {
      index: "./src/index.ts",
      react: "./src/react.tsx",
    },
    format: ["cjs", "esm"],
  }),
);
