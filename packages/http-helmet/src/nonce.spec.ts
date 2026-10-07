import { expect, it, vi } from "vitest"

import { createNonce } from "./index.ts"

it("generates distinct base64-encoded UUID nonces", () => {
  let first = createNonce()
  let second = createNonce()
  expect(first).not.toBe(second)
  expect(atob(first)).toMatch(
    /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/,
  )
})

it.each([true, false])(
  "encodes a nonce with toBase64 available: %s",
  (available) => {
    let uuid = "00000000-0000-4000-8000-000000000000" as const
    let original = Object.getOwnPropertyDescriptor(
      Uint8Array.prototype,
      "toBase64",
    )
    let toBase64 = vi.fn(function (this: Uint8Array) {
      return btoa(String.fromCharCode(...this))
    })
    Object.defineProperty(Uint8Array.prototype, "toBase64", {
      configurable: true,
      value: available ? toBase64 : undefined,
    })
    let encode = vi.spyOn(TextEncoder.prototype, "encode")
    let randomUUID = vi.spyOn(crypto, "randomUUID").mockReturnValue(uuid)

    try {
      expect(createNonce()).toBe(btoa(uuid))
      expect(encode).toHaveBeenCalledTimes(available ? 1 : 0)
      if (available) expect(encode).toHaveBeenCalledWith(uuid)
      expect(toBase64).toHaveBeenCalledTimes(available ? 1 : 0)
    } finally {
      encode.mockRestore()
      randomUUID.mockRestore()
      if (original) {
        Object.defineProperty(Uint8Array.prototype, "toBase64", original)
      } else {
        Reflect.deleteProperty(Uint8Array.prototype, "toBase64")
      }
    }
  },
)
