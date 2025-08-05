// https://github.com/vitejs/vite-plugin-react/blob/3c5de797c015a9c8edbdf47e5bae3a28c3e24a8b/packages/plugin-react/tests/rolldown.test.ts
import path from "node:path";
import { rolldown, type Plugin } from "rolldown";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  removeAttributeFromFile as handler,
  removeAttributes,
  type PluginOptions,
} from "./plugin";

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

it("returns code as is when attributes is an empty array", () => {
  expect(
    handler(`<h1 data-testid="welcome-message">hello</h1>`, "test.tsx", {
      // @ts-expect-error - testing error case
      attributes: [],
    }),
  ).toEqual({
    code: `<h1 data-testid="welcome-message">hello</h1>`,
    map: null,
  });
});

describe("plugin", () => {
  afterEach(vi.unstubAllEnvs);

  it("removes attributes when using the plugin", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { output } = await bundleWithRolldown({});

    expect(output[0].code).not.toContain("data-testid");
  });

  it("keeps attributes when using the plugin and its not enabled", async () => {
    const { output } = await bundleWithRolldown({ enabled: false });

    expect(output[0].code).toContain("data-testid");
  });

  it("removes attributes when using the plugin and force enabling it", async () => {
    const { output } = await bundleWithRolldown({ enabled: true });

    expect(output[0].code).not.toContain("data-testid");
  });

  it("removes attributes when supplying custom attributes", async () => {
    const { output } = await bundleWithRolldown({
      files: {
        "/App.tsx": /* tsx */ `
      export default function App() {
        return <div data-testid="msg" custom="false">Hello World</div>
      }
    `,
      },
      enabled: true,
      attributes: ["custom"],
    });

    expect(output[0].code).toContain("data-testid");
    expect(output[0].code).not.toContain("custom");
  });
});

type BundleWithRolldownOptions = PluginOptions & {
  files?: {
    [filepath: string]: string;
  };
};

async function bundleWithRolldown({
  files = {
    "/App.tsx": /* tsx */ `
      export default function App() {
        return <div data-testid="msg">Hello World</div>
      }
    `,
  },
  ...options
}: BundleWithRolldownOptions) {
  const ENTRY = "/entry.tsx";
  const virtualFiles: Record<string, string> = {
    [ENTRY]: /* tsx */ `
      import React from "react"
      import { hydrateRoot } from "react-dom/client"
      import App from "./App.tsx"

      const container = document.getElementById("root");
      hydrateRoot(container, <App />);
    `,
    ...files,
  };

  const bundle = await rolldown({
    input: ENTRY,
    plugins: [virtualFilesPlugin(virtualFiles), removeAttributes(options)],
    external: [/^react(\/|$)/, /^react-dom(\/|$)/],
  });
  return await bundle.generate({ format: "esm" });
}

function virtualFilesPlugin(files: Record<string, string>): Plugin {
  return {
    name: "virtual-files",
    resolveId(id, importer) {
      const baseDir = importer ? path.posix.dirname(importer) : "/";
      const result = path.posix.resolve(baseDir, id);
      if (result in files) {
        return result;
      }
    },
    load(id) {
      if (id in files) {
        return files[id];
      }
    },
  };
}
