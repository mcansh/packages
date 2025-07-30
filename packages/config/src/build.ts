import { merge } from "ts-deepmerge";
import type { UserConfig, UserConfigFn } from "tsdown";

export const defaultBuildConfig = {
  dts: true,
  format: "esm",
  tsconfig: "./tsconfig.json",
  sourcemap: true,
  exports: true,
  clean: true,
  publint: true,
  attw: { profile: "node16" },
  skipNodeModulesBundle: true,
  platform: "neutral",
  define: {
    "import.meta.vitest": "undefined",
  },
} satisfies UserConfig;

export function mergeBuildConfig(
  userConfig?: UserConfig | UserConfigFn,
): UserConfig {
  if (typeof userConfig === "undefined") return defaultBuildConfig;
  let config =
    typeof userConfig === "function"
      ? userConfig(defaultBuildConfig)
      : userConfig;
  return merge(defaultBuildConfig, config);
}

if (import.meta.vitest) {
  let { describe, expect, it } = import.meta.vitest;

  describe("mergeBuildConfig", () => {
    it("returns default config when no input is provided", () => {
      let config = mergeBuildConfig();
      expect(config).toEqual(defaultBuildConfig);
    });

    it("returns default config when empty object is provided", () => {
      let config = mergeBuildConfig({});
      expect(config).toEqual(defaultBuildConfig);
    });

    it("returns default config when function returns empty object", () => {
      let config = mergeBuildConfig(() => ({}));
      expect(config).toEqual(defaultBuildConfig);
    });

    it("merges user config when using function", () => {
      let config = mergeBuildConfig((config) => {
        config.dts = false;
        return {};
      });

      expect(config).toEqual({
        ...defaultBuildConfig,
        dts: false,
      });
    });

    it.each([
      { dts: false },
      { format: "cjs" },
      { sourcemap: false },
      { format: ["cjs", "esm"] },
      { define: { __DEV__: "true" } },
    ] satisfies UserConfig[])("merges configs", (input) => {
      let config = mergeBuildConfig(input);
      expect(config).toEqual({
        ...defaultBuildConfig,
        ...input,
        define: {
          ...defaultBuildConfig.define,
          ...input.define,
        },
      });
    });
  });
}
