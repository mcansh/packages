import { expect, it } from "vitest"

import {
  createContentSecurityPolicy,
  createNonce,
  createSecureHeaders,
  mergeHeaders,
} from "./index.ts"

it("generates distinct base64-encoded UUID nonces", () => {
  let first = createNonce()
  let second = createNonce()
  expect(first).not.toBe(second)
  expect(Buffer.from(first, "base64").toString("utf8")).toMatch(
    /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/,
  )
})

it("removes an existing header when a later source uses the undefined sentinel", () => {
  let headers = mergeHeaders(
    { "X-Test": "old", "X-Keep": "yes" },
    { "X-Test": "undefined" },
  )
  expect(headers.has("X-Test")).toBe(false)
  expect(headers.get("X-Keep")).toBe("yes")
})

it("creates a report-only CSP without an enforcing policy", () => {
  let headers = createSecureHeaders({
    "Content-Security-Policy-Report-Only": { defaultSrc: ["'self'"] },
  })
  expect(headers.get("Content-Security-Policy-Report-Only")).toBe(
    "default-src 'self'",
  )
  expect(headers.has("Content-Security-Policy")).toBe(false)
})

it("rejects unsupported headers from JavaScript callers", () => {
  // @ts-expect-error -- Exercise the public JavaScript input boundary.
  expect(() => createSecureHeaders({ "X-Unsupported": "value" })).toThrow(
    "createSecureHeaders: X-Unsupported was not set",
  )
})

it("rejects unquoted reserved CSP sources", () => {
  expect(() => createContentSecurityPolicy({ defaultSrc: ["self"] })).toThrow(
    "reserved keyword self must be quoted",
  )
})

it("rejects duplicate CSP sources", () => {
  expect(() =>
    createContentSecurityPolicy({ defaultSrc: ["'self'", "'self'"] }),
  ).toThrow('The value of the "default-src" contains duplicates')
})

it("rejects non-array CSP sources from JavaScript callers", () => {
  // @ts-expect-error -- Exercise the public JavaScript input boundary.
  expect(() => createContentSecurityPolicy({ defaultSrc: "'self'" })).toThrow(
    'The value of the "default-src" must be array of strings',
  )
})

it("rejects non-string CSP sources from JavaScript callers", () => {
  // @ts-expect-error -- Exercise the public JavaScript input boundary.
  expect(() => createContentSecurityPolicy({ defaultSrc: [42] })).toThrow(
    'The value of the "default-src" contains a non-string',
  )
})
