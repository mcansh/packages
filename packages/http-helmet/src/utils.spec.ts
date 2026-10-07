import { describe, expect, it } from "vitest";
import { removalHeaders } from "./removal-headers.js";
import { removeInsecureHeaders } from "./utils.js";

describe("removeInsecureHeaders", () => {
  it("removes every configured insecure header", () => {
    let responseHeaders = new Headers();

    for (let header of removalHeaders) {
      responseHeaders.set(header, "exposed");
    }

    let headers = removeInsecureHeaders(responseHeaders);
    let remainingInsecureHeaders = removalHeaders.filter((header) =>
      headers.has(header),
    );

    expect(removalHeaders.length).toBeGreaterThan(0);
    expect(remainingInsecureHeaders).toStrictEqual([]);
  });

  it("preserves headers that are not configured for removal", () => {
    let responseHeaders = new Headers({
      "Cache-Control": "max-age=60",
      "Content-Type": "text/html; charset=utf-8",
      Server: "example",
    });

    let headers = removeInsecureHeaders(responseHeaders);

    expect(headers.get("Cache-Control")).toBe("max-age=60");
    expect(headers.get("Content-Type")).toBe("text/html; charset=utf-8");
    expect(headers.has("Server")).toBe(false);
  });

  it("does not mutate the original headers", () => {
    let responseHeaders = new Headers({
      Server: "example",
    });

    let headers = removeInsecureHeaders(responseHeaders);

    expect(headers).not.toBe(responseHeaders);
    expect(headers.has("Server")).toBe(false);
    expect(responseHeaders.get("Server")).toBe("example");
  });
});
