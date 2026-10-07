import { toHaveJsonBody } from "@mcansh/vitest-response-matchers/matchers"
import "@mcansh/vitest-response-matchers/client"
import { expect } from "vitest"

interface Payload {
  ok: boolean
  nested?: { ids: readonly number[] }
}

const payload: Payload = { ok: true, nested: { ids: [1, 2] } }
const items: readonly Payload[] = [payload]
const response = Response.json(payload)

expect(response).toHaveJsonBody(payload)
expect(response).toHaveJsonBody(items)
expect(response).toHaveJsonBody(null)
expect(response).toHaveJsonBody(true)
expect(response).toHaveJsonBody(42)
expect(response).toHaveJsonBody("hello")
void toHaveJsonBody(response, payload)
void toHaveJsonBody(response, items)

// @ts-expect-error -- undefined is not a top-level JSON value.
expect(response).toHaveJsonBody(undefined)
// @ts-expect-error -- bigint cannot be serialized as a JSON value.
expect(response).toHaveJsonBody(1n)
