import { describe, expect, it } from "vitest";
import { createSecureHeaders } from "./helmet";
import { mergeHeaders } from "./utils";
import { SecurityHeaders } from "./v2";

describe("mergeHeaders", () => {
  it("merges headers", () => {
    let secureHeaders = createSecureHeaders({
      "Content-Security-Policy": { "default-src": ["'self'"] },
    });

    let responseHeaders = new Headers({
      "Content-Type": "text/html",
      "x-foo": "bar",
    });

    let merged = mergeHeaders(responseHeaders, secureHeaders);

    expect(merged.get("Content-Type")).toBe("text/html");
    expect(merged.get("x-foo")).toBe("bar");
    expect(merged.get("Content-Security-Policy")).toBe("default-src 'self'");
  });

  it("throws if the argument is not an object", () => {
    // @ts-expect-error
    expect(() => mergeHeaders("foo")).toThrowErrorMatchingInlineSnapshot(
      `[TypeError: All arguments must be of type object]`,
    );
  });

  it("overrides existing headers", () => {
    let secureHeaders = createSecureHeaders({
      "Content-Security-Policy": { "default-src": ["'self'"] },
    });

    let responseHeaders = new Headers({
      "Content-Security-Policy": "default-src 'none'",
    });

    let merged1 = mergeHeaders(responseHeaders, secureHeaders);
    let merged2 = mergeHeaders(secureHeaders, responseHeaders);

    expect(merged1.get("Content-Security-Policy")).toBe("default-src 'self'");
    expect(merged2.get("Content-Security-Policy")).toBe("default-src 'none'");
  });

  it('keeps all "Set-Cookie" headers', () => {
    let headers1 = new Headers({ "Set-Cookie": "foo=bar" });
    let headers2 = new Headers({ "Set-Cookie": "baz=qux" });

    let merged = mergeHeaders(headers1, headers2);

    expect(merged.getSetCookie()).toStrictEqual(["foo=bar", "baz=qux"]);
  });

  it("allows using just one argument", () => {
    let headers = new Headers({ "Content-Type": "text/plain" });

    let merged = mergeHeaders(headers);

    expect(merged.get("Content-Type")).toBe("text/plain");
  });

  it("merges headers when using SecurityHeaders class", () => {
    let secureHeaders = new SecurityHeaders({
      "Content-Security-Policy": { "default-src": ["'self'"] },
    });

    let responseHeaders = new Headers({
      "Content-Type": "text/html",
      "x-foo": "bar",
    });

    let merged = mergeHeaders(responseHeaders, secureHeaders.toHeaders());

    expect(merged.get("Content-Type")).toBe("text/html");
    expect(merged.get("x-foo")).toBe("bar");
    expect(merged.get("Content-Security-Policy")).toBe("default-src 'self'");
  });
});
