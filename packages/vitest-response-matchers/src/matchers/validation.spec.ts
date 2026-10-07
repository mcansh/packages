import { expect, it } from "vitest"

import {
  toHaveJsonBody,
  toHaveStatus,
  toHaveStatusText,
  toHaveStrictStatusText,
  toHaveTextBody,
  toThrowResponse,
} from "./index.ts"

it.each([toHaveStatus, toHaveStatusText, toHaveStrictStatusText])(
  "rejects response-shaped objects with a useful diagnostic",
  async (matcher) => {
    let received = { status: 200, statusText: "OK" }
    // @ts-expect-error -- Exercise the public JavaScript input boundary.
    let result = await matcher(received)
    expect(result.pass).toBe(false)
    expect(result.actual).toBe(received)
    expect(result.message()).toBe("Expected a Response")
  },
)

it("rejects non-Response JSON inputs with a useful diagnostic", async () => {
  let received = { body: '{"ok":true}' }
  // @ts-expect-error -- Exercise the public JavaScript input boundary.
  let result = await toHaveJsonBody(received, { ok: true })
  expect(result.pass).toBe(false)
  expect(result.actual).toBe(received)
  expect(result.message()).toBe("Expected a Response")
})

it("preserves both bodies and failure details for mismatched JSON", async () => {
  let response = Response.json({ ok: false })
  let result = await toHaveJsonBody(response, { ok: true })
  expect(result).toMatchObject({
    pass: false,
    actual: { ok: false },
    expected: { ok: true },
  })
  expect(result.message()).toContain('{"ok":true}')
  expect(response.bodyUsed).toBe(false)
})

it("rejects non-Response text inputs with a useful diagnostic", async () => {
  let received = { body: "hello" }
  // @ts-expect-error -- Exercise the public JavaScript input boundary.
  let result = await toHaveTextBody(received, "hello")
  expect(result.pass).toBe(false)
  expect(result.actual).toBe(received)
  expect(result.message()).toBe("Expected a Response")
})

it("preserves both bodies and failure details for mismatched text", async () => {
  let response = new Response("actual")
  let result = await toHaveTextBody(response, "expected")
  expect(result).toMatchObject({
    pass: false,
    actual: "actual",
    expected: "expected",
  })
  expect(result.message()).toContain('"expected"')
  expect(response.bodyUsed).toBe(false)
})

it("retains the diagnostic when the callback does not throw", async () => {
  let result = await toThrowResponse(() => new Response(), { status: 404 })
  expect(result).toMatchObject({
    pass: false,
    actual: null,
    expected: "[Response]",
  })
  expect(result.message()).toBe("Did not throw a Response")
})
