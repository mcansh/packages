import { describe, expect, it } from "vitest";
import { UrlBuilder } from "./builder.js";

describe("UrlBuilder", () => {
  it("should build a basic URL", () => {
    const builder = new UrlBuilder();
    const url = builder.protocol("https").domain("example.com").build();
    expect(url).toBe("https://example.com/");
  });

  it("should build a URL with path", () => {
    const builder = new UrlBuilder();
    const url = builder
      .protocol("https")
      .domain("example.com")
      .path("/test")
      .build();
    expect(url).toBe("https://example.com/test");
  });

  it("should build a URL with query parameters", () => {
    const builder = new UrlBuilder();
    const url = builder
      .protocol("https")
      .domain("example.com")
      .param("key", "value")
      .build();
    expect(url).toBe("https://example.com/?key=value");
  });

  it("should build a URL with hash", () => {
    const builder = new UrlBuilder();
    const url = builder
      .protocol("https")
      .domain("example.com")
      .hash("section")
      .build();
    expect(url).toBe("https://example.com/#section");
  });

  it("should build a URL with mutliple hashs", () => {
    const builder = new UrlBuilder();
    const url = builder
      .protocol("https")
      .domain("example.com")
      .hash("section")
      .hash("another")
      .build();
    expect(url).toBe("https://example.com/#section#another");
  });

  it("should build a URL with username and password", () => {
    const builder = new UrlBuilder();
    const url = builder
      .protocol("https")
      .domain("example.com")
      .username("user")
      .password("pass")
      .build();
    expect(url).toBe("https://user:pass@example.com/");
  });

  it("should build a URL with port", () => {
    const builder = new UrlBuilder();
    const url = builder
      .protocol("https")
      .domain("example.com")
      .port(8080)
      .build();
    expect(url).toBe("https://example.com:8080/");
  });

  it("should return the correct href", () => {
    const builder = new UrlBuilder();
    builder.protocol("https").domain("example.com").path("/test");
    expect(builder.href).toBe("https://example.com/test");
  });

  it("should return a URL object", () => {
    const builder = new UrlBuilder();
    const url = builder
      .protocol("https")
      .domain("example.com")
      .path("/test")
      .toURL();
    expect(url).toBeInstanceOf(URL);
    expect(url.href).toBe("https://example.com/test");
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

  it.each(cases)("`%s` -> `%s`", (input, expected) => {
    let url = new UrlBuilder().protocol(input).domain("site.com").build();
    expect(url).toBe(expected);
  });
});
