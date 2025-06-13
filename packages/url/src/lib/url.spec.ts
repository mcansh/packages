import { describe, expect, it } from "vitest";
import { urlString } from "./url.js";

describe("invalid", () => {
  it("not passed a url", () => {
    expect(() => urlString`hello world`).toThrow(
      new TypeError('Invalid URL: "hello world"'),
    );
  });

  it("empty string", () => {
    expect(() => urlString``).toThrow(new TypeError('Invalid URL: ""'));
  });

  it("called as function", () => {
    expect(() => urlString("")).toThrow(
      new TypeError(`function must be used as template string`),
    );
  });
});

/**
 * note that the URL constructor will add a trailing slash
 * to the url for certain protocols
 */
const cases = [
  [`ssh://site.com`, "ssh://site.com"],
  [`data://site.com`, "data://site.com"],
  [`mailto://site.com`, "mailto://site.com"],
  [`tel://site.com`, "tel://site.com"],
  [`http://site.com`, "http://site.com/"],
  [`https://site.com`, "https://site.com/"],
  [`https://site.com?hello`, "https://site.com/"],
  [`ftp://site.com`, "ftp://site.com/"],
  [`ws://site.com`, "ws://site.com/"],
  [`wss://site.com`, "wss://site.com/"],
  [`file://site.com`, "file://site.com/"],
] as const;

describe("basic urls", () => {
  it.each(cases)("`%s` -> `%s`", (input, expected) => {
    expect(urlString`${input}`).toBe(expected);
  });
});

it("non-interpolated url", () => {
  expect(urlString`https://site.com/path`).toBe("https://site.com/path");
});

it("interpolated url with values", () => {
  let q = "my search";
  let actual = urlString`https://site.com/path?q=${q}`;
  expect(actual).toBe("https://site.com/path?q=my+search");
});

it("interpolated url with only undefined/null values", () => {
  let filter = undefined;
  let user = null;
  let q = undefined;
  let actual = urlString`https://site.com/path?q=${q}&user=${user}&filter=${filter}`;
  expect(actual).toBe("https://site.com/path");
});

it("interpolated url with valid, and undefined/null values", () => {
  let filter = undefined;
  let user = null;
  let q = "my search";
  let actual = urlString`https://site.com/path?q=${q}&user=${user}&filter=${filter}`;
  expect(actual).toBe("https://site.com/path?q=my+search");
});

it("static url with valid, and undefined/null values", () => {
  let actual = urlString`https://site.com/path?q=my+search&user=null&filter=undefined`;
  expect(actual).toBe("https://site.com/path?q=my+search");
});

it.each([
  {
    filter: undefined,
    user: null,
    q: "my search",
    expected: "https://user:pass@site.com:8080/path?q=my+search#hash",
  },
  {
    filter: undefined,
    user: "1",
    q: null,
    expected: "https://user:pass@site.com:8080/path?user=1#hash",
  },
])("url with auth, port, query, hash", ({ expected, filter, q, user }) => {
  let actual = urlString`https://user:pass@site.com:8080/path?q=${q}&user=${user}&filter=${filter}#hash`;
  expect(actual).toBe(expected);
});
