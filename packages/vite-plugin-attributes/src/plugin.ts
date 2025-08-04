import MagicString from "magic-string";
import type { Plugin, TransformResult } from "vite";

type PluginOptions = {
  attributes: Array<string>;
  enabled?: boolean;
};

export function handler(
  code: string,
  id: string,
  options?: PluginOptions,
): TransformResult {
  options ??= { attributes: ["data-testid"] };
  options.attributes ??= ["data-testid"];

  let s = new MagicString(code);
  // make a regex out of all the options.attributes
  let regexp = options.attributes.reduce<Array<string>>((acc, attr) => {
    return [...acc, `\\s${attr}(=["'](.*?)["'])?`];
  }, []);

  s.replaceAll(new RegExp(regexp.join("|"), "g"), "");

  return { code: s.toString(), map: s.generateMap({ source: id }) };
}

if (import.meta.vitest) {
  let { it, expect } = import.meta.vitest;

  it.each([
    `<h1 data-testid="foobar">hello</h1>`,
    `<h1 data-testid="">hello</h1>`,
    `<h1 data-testid>hello</h1>`,
    `<h1 data-testid="">hello</h1>`,
  ])("should remove data-testid from %s", async (input) => {
    expect(handler(input, "test.tsx")).toEqual({
      code: `<h1>hello</h1>`,
      map: expect.any(Object),
    });
  });

  it("should not remove other attributes", async () => {
    expect(
      handler(
        `<h1 data-testid="foo" id="bar" className="text-lg" data-foo="bar">hello</h1>`,
        "test.tsx",
      ),
    ).toEqual({
      code: `<h1 id="bar" className="text-lg" data-foo="bar">hello</h1>`,
      map: expect.any(Object),
    });
  });

  it("should default to removing data-testid", async () => {
    expect(handler(`<h1 data-testid="foo">hello</h1>`, "test.tsx")).toEqual({
      code: `<h1>hello</h1>`,
      map: expect.any(Object),
    });
  });

  it("should allow custom attributes to be removed", async () => {
    expect(
      handler(`<h1 custom="foo">hello</h1>`, "test.tsx", {
        attributes: ["custom"],
      }),
    ).toEqual({
      code: `<h1>hello</h1>`,
      map: expect.any(Object),
    });
  });

  it("should allow removing multiple custom attributes", async () => {
    expect(
      handler(
        `<div custom="foo"><h1 another-custom="bar">hello</h1></div>`,
        "test.tsx",
        { attributes: ["custom", "another-custom"] },
      ),
    ).toEqual({
      code: `<div><h1>hello</h1></div>`,
      map: expect.any(Object),
    });
  });
}

export function removeAttributesPlugin({
  attributes = ["data-testid"],
  enabled = process.env.NODE_ENV === "production",
}: PluginOptions): Plugin[] {
  return [
    {
      name: "vite-plugin-attributes",

      transform: {
        filter: { id: /.*\.(tsx|jsx)$/ },
        handler(code, id) {
          if (!enabled) return;
          return handler(code, id, { attributes });
        },
      },
    },
  ];
}
