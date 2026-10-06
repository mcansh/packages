import { TaggedError } from "better-result";

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
