import * as assert from "node:assert/strict";
import { describe, test } from "node:test";
import { urlString } from "./url.js";

describe("invalid", () => {
  test("not passed a url", () => {
    assert.throws(() => urlString`hello world`, {
      name: "TypeError",
      message: 'Invalid URL: "hello world"',
    });
  });

  test("empty string", () => {
    assert.throws(() => urlString``, {
      name: "TypeError",
      message: `Invalid URL: ""`,
    });
  });

  test("called as function");
  assert.throws(() => urlString(""), {
    name: "TypeError",
    message: `function must be used as template string`,
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
  for (let [input, expected] of cases) {
    test(`${input} -> ${expected}`, () => {
      assert.equal(urlString`${input}`, expected);
    });
  }
});

test("non-interpolated url", () => {
  assert.equal(urlString`https://site.com/path`, "https://site.com/path");
});

test("interpolated url with values", () => {
  let q = "my search";
  let actual = urlString`https://site.com/path?q=${q}`;
  assert.equal(actual, "https://site.com/path?q=my+search");
});

test("interpolated url with only undefined/null values", () => {
  let filter = undefined;
  let user = null;
  let q = undefined;
  let actual = urlString`https://site.com/path?q=${q}&user=${user}&filter=${filter}`;
  assert.equal(actual, "https://site.com/path");
});

test("interpolated url with valid, and undefined/null values", () => {
  let filter = undefined;
  let user = null;
  let q = "my search";
  let actual = urlString`https://site.com/path?q=${q}&user=${user}&filter=${filter}`;
  assert.equal(actual, "https://site.com/path?q=my+search");
});

test("static url with valid, and undefined/null values", () => {
  let actual = urlString`https://site.com/path?q=my+search&user=null&filter=undefined`;
  assert.equal(actual, "https://site.com/path?q=my+search");
});

test("url with auth, port, query, hash", () => {
  let filter = undefined;
  let user = null;
  let q = "my search";
  let actual = urlString`https://user:pass@site.com:8080/path?q=${q}&user=${user}&filter=${filter}#hash`;
  assert.equal(actual, "https://user:pass@site.com:8080/path?q=my+search#hash");
});

test("url with auth, port, query, hash", () => {
  let filter = undefined;
  let user = "1";
  let q = null;
  let actual = urlString`https://user:pass@site.com:8080/path?q=${q}&user=${user}&filter=${filter}#hash`;
  assert.equal(actual, "https://user:pass@site.com:8080/path?user=1#hash");
});
