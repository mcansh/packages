import MagicString from "magic-string";
import type { Plugin, TransformResult } from "vite";

export type PluginOptions = {
  /** Attributes to remove from the HTML elements. Defaults to `["data-testid"]`. */
  attributes?: [string, ...string[]];
  /** Whether the plugin is enabled. Defaults to `true` in production mode. */
  enabled?: boolean;
};

export function removeAttributeFromFile(
  code: string,
  id: string,
  options?: PluginOptions,
): TransformResult {
  options ??= {};
  options.attributes ??= ["data-testid"];

  if (options.attributes.length === 0) {
    return { code, map: null };
  }

  let s = new MagicString(code);

  const regexp = new RegExp(
    options.attributes.map((attr) => `\\s${attr}(=["'](.*?)["'])?`).join("|"),
    "g",
  );

  s.replaceAll(regexp, "");

  return { code: s.toString(), map: s.generateMap({ source: id }) };
}

export function removeAttributes(options?: PluginOptions): Plugin {
  options ??= {};
  options.attributes ??= ["data-testid"];
  options.enabled ??= process.env.NODE_ENV === "production";

  return {
    name: "vite-plugin-attributes",

    transform: {
      filter: { id: /.*\.(tsx|jsx)$/ },
      handler(code, id) {
        if (!options.enabled) return;
        return removeAttributeFromFile(code, id, {
          attributes: options.attributes,
        });
      },
    },
  };
}
