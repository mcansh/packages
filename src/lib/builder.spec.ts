import * as assert from "node:assert/strict";
import test, { describe, it } from "node:test";
import { UrlBuilder } from "./builder.ts";

describe("UrlBuilder", () => {
  it("should build a basic URL", () => {
    const builder = new UrlBuilder();
    const url = builder.protocol("https").domain("example.com").build();
    assert.equal(url, "https://example.com/");
  });

  it("should build a URL with path", () => {
    const builder = new UrlBuilder();
    const url = builder
      .protocol("https")
      .domain("example.com")
      .path("/test")
      .build();
    assert.equal(url, "https://example.com/test");
  });

  it("should build a URL with query parameters", () => {
    const builder = new UrlBuilder();
    const url = builder
      .protocol("https")
      .domain("example.com")
      .param("key", "value")
      .build();
    assert.equal(url, "https://example.com/?key=value");
  });

  it("should build a URL with hash", () => {
    const builder = new UrlBuilder();
    const url = builder
      .protocol("https")
      .domain("example.com")
      .hash("section")
      .build();
    assert.equal(url, "https://example.com/#section");
  });

  it("should build a URL with mutliple hashs", () => {
    const builder = new UrlBuilder();
    const url = builder
      .protocol("https")
      .domain("example.com")
      .hash("section")
      .hash("another")
      .build();
    assert.equal(url, "https://example.com/#section#another");
  });

  it("should build a URL with username and password", () => {
    const builder = new UrlBuilder();
    const url = builder
      .protocol("https")
      .domain("example.com")
      .username("user")
      .password("pass")
      .build();
    assert.equal(url, "https://user:pass@example.com/");
  });

  it("should build a URL with port", () => {
    const builder = new UrlBuilder();
    const url = builder
      .protocol("https")
      .domain("example.com")
      .port(8080)
      .build();
    assert.equal(url, "https://example.com:8080/");
  });

  it("should return the correct href", () => {
    const builder = new UrlBuilder();
    builder.protocol("https").domain("example.com").path("/test");
    assert.equal(builder.href, "https://example.com/test");
  });

  it("should return a URL object", () => {
    const builder = new UrlBuilder();
    const url = builder
      .protocol("https")
      .domain("example.com")
      .path("/test")
      .toURL();
    assert.ok(url instanceof URL);
    assert.equal(url.href, "https://example.com/test");
  });

  /**
   * note that the URL constructor will add a trailing slash
   * to the url for certain protocols
   */
  const cases = [
    [`ssh`, "ssh://site.com"],
    [`data`, "data://site.com"],
    [`mailto`, "mailto://site.com"],
    [`tel`, "tel://site.com"],
    [`http`, "http://site.com/"],
    [`https`, "https://site.com/"],
    [`ftp`, "ftp://site.com/"],
    [`ws`, "ws://site.com/"],
    [`wss`, "wss://site.com/"],
    [`file`, "file://site.com/"],
  ] as const;

  test(
    "should build a URL with a non https? protocol",
    { concurrency: true },
    (t) => {
      for (let [input, expected] of cases) {
        t.test(`${input} -> ${expected}`, () => {
          let url = new UrlBuilder().protocol(input).domain("site.com").build();
          assert.equal(url, expected);
        });
      }
    },
  );
});
