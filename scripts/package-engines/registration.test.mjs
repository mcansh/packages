import { expect, test } from "vitest"
import "@mcansh/vitest-response-matchers"
import "@mcansh/vitest-response-matchers/client"
test("packed root export registers matchers against the compatible Vitest peer", async () => {
  expect(new Response("hello")).toHaveStatus(200)
  await expect(Response.json({ ok: true })).toHaveJsonBody({ ok: true })
  expect(() => {
    throw new Response(null, { status: 404 })
  }).toThrowResponse({ status: 404 })
})
