import type { JsonValue } from "./matcher"

export async function toHaveJsonBody(response: Response, expected: JsonValue) {
  if (!(response instanceof Response)) {
    return {
      message: () => `Expected a Response`,
      actual: response,
      pass: false,
    }
  }

  let body = await response.clone().json()

  let expectedJson = JSON.stringify(expected)

  return {
    message: () => `Expected response to have body "${expectedJson}"`,
    pass: JSON.stringify(body) === expectedJson,
    actual: body,
    expected,
  }
}

if (import.meta.vitest) {
  let { expect, it } = import.meta.vitest

  expect.extend({ toHaveJsonBody })

  it.each([null, true, 42, "hello", [1, "two", null]])(
    "matches JSON values: %j",
    async (expected) => {
      await expect(Response.json(expected)).toHaveJsonBody(expected)
    },
  )

  it("toHaveJsonBody matcher", async () => {
    let response = Response.json({ message: "Hello, world!" })
    await expect(response).toHaveJsonBody({ message: "Hello, world!" })
  })
}
