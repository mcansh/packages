import { mergeBuildConfig } from "@mcansh/config";
import { defineConfig } from "tsdown";

export default defineConfig(mergeBuildConfig({ entry: ["src/index.ts"] }));
