import { Err, Ok, Result, TaggedError } from "better-result";

export class HibpError extends TaggedError("HibpError")<{
  reason:
    | "aborted"
    | "invalid-input"
    | "http"
    | "invalid-response"
    | "cancelled"
    | "timeout"
    | "unavailable";
  message: string;
  status?: number;
}> {}

export interface PwnedPasswordOptions {
  /** Cancel the lookup. */
  signal?: AbortSignal;
  /** Timeout for the request and response body, in milliseconds. Default: 5000. */
  timeoutMs?: number;
  /** Optional transport for testing or a trusted proxy. Receives only the prefix. */
  fetch?: typeof globalThis.fetch;
}

export function assertErr<T, E>(
  result: Result<T, E>,
): asserts result is Err<T, E> {
  if (result.isOk()) {
    throw new Error("expected result to be an error");
  }
}

export function assertOk<T, E>(
  result: Result<T, E>,
): asserts result is Ok<T, E> {
  if (result.isErr()) {
    throw new Error("expected result to be ok");
  }
}
