import { mergeBuildConfig } from "@mcansh/config";
import { defineConfig } from "tsdown";

export default defineConfig(
  mergeBuildConfig({
    entry: {
      index: "./src/index.ts",
      client: "./src/client.ts",
      matchers: "./src/matchers/index.ts",
    },
    platform: "node",
  }),
);
