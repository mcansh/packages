import { SELF } from "#src/utils.ts";
import { expect, it } from "vitest";
import { ContentSecurityPolicy } from "./content-security-policy";

it("creates a CSP policy with a single directive", () => {
  let csp = new ContentSecurityPolicy();
  csp.set("default-src", [SELF]);
  expect(csp.toString()).toBe("default-src 'self'");
});

it("creates a CSP policy with no directives", () => {
  let csp = new ContentSecurityPolicy();
  expect(csp.toString()).toBe("");
});

it("creates a CSP policy with multiple directives", () => {
  let csp = new ContentSecurityPolicy();
  csp.set("default-src", [SELF]);
  csp.set("script-src", ["https://example.com"]);
  expect(csp.toString()).toBe(
    "default-src 'self'; script-src https://example.com",
  );
});

it("creates a CSP policy with multiple values in a directive", () => {
  let csp = new ContentSecurityPolicy();
  csp.set("script-src", [SELF, "https://example.com"]);
  expect(csp.toString()).toBe("script-src 'self' https://example.com");
});

it("can parse a CSP string", () => {
  let csp = new ContentSecurityPolicy();
  csp.parse("default-src 'self'; script-src https://example.com");
  expect(csp.get("default-src")).toEqual(["'self'"]);
  expect(csp.get("script-src")).toEqual(["https://example.com"]);
});

it("handles `upgrade-insecure-requests` directive", () => {
  let csp = new ContentSecurityPolicy();
  csp.set("upgrade-insecure-requests", []);
  expect(csp.toString()).toBe("upgrade-insecure-requests");
});

it("handles upgradeInsecureRequests method", () => {
  let csp = new ContentSecurityPolicy();
  csp.upgradeInsecureRequests();
  expect(csp.toString()).toBe("upgrade-insecure-requests");
});

it("can call `append` multiple times for the same key", () => {
  let csp = new ContentSecurityPolicy();
  csp.append("default-src", [SELF]);
  csp.append("default-src", ["https://example.com"]);
  expect(csp.toString()).toBe("default-src 'self' https://example.com");
});

it("can create csp with predefined directives", () => {
  let csp = new ContentSecurityPolicy({
    "default-src": [SELF],
    "script-src": ["https://example.com"],
  });
  expect(csp.toString()).toBe(
    "default-src 'self'; script-src https://example.com",
  );
});

it("can create csp with predefined policy string", () => {
  let csp = new ContentSecurityPolicy(
    "default-src 'self'; script-src https://example.com",
  );
  expect(csp.toString()).toBe(
    "default-src 'self'; script-src https://example.com",
  );
});

it("allows and filters out `undefined` values", () => {
  let csp = new ContentSecurityPolicy({
    "connect-src": [undefined, "'self'", undefined],
  });

  expect(csp.toString()).toMatchInlineSnapshot(`"connect-src 'self'"`);
});

it("allows there to be no define values for a csp key", () => {
  let csp = new ContentSecurityPolicy({
    "base-uri": [undefined],
    "default-src": ["'none'"],
  });
  expect(csp.toString()).toBe("default-src 'none'");
});

it("throws an error if the value is reserved, but not properly quoted", () => {
  expect(
    () =>
      new ContentSecurityPolicy({
        "default-src": ["self", "https://example.com"],
      }),
  ).toThrowErrorMatchingInlineSnapshot(
    `[ContentSecurityPolicyError: reserved keyword self must be quoted.]`,
  );
});
