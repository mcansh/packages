import type { expect } from "vitest"

type MatchersObject = Parameters<typeof expect.extend>[0]

export type Matcher = MatchersObject[keyof MatchersObject]

export type MatcherResult = ReturnType<Matcher>

export type JsonValue =
  | null
  | boolean
  | number
  | string
  // Retain interface, readonly, and custom toJSON payloads accepted by the original object parameter.
  | object
