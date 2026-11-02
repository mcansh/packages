import { Application, ReflectionKind } from "typedoc";
import { describe, expect, it } from "vitest";
import { CloudflareKindRouter } from "./plugin.js";

describe("CloudflareKindRouter", () => {
  it("keeps function docs off Cloudflare's reserved /functions path", async () => {
    let app = await Application.bootstrap();
    let router = new CloudflareKindRouter(app);
    expect(router.directories.get(ReflectionKind.Function)).toBe("funcs");
    expect(router.directories.get(ReflectionKind.Module)).toBe("modules");
  });
});
