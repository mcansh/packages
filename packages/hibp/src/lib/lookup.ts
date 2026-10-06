import { Result } from "better-result";
import { createHash } from "./hash.ts";
import type { PwnedPasswordOptions } from "./types.ts";
import { HibpError } from "./types.ts";

export async function lookup(
  password: string,
  options: PwnedPasswordOptions,
): Promise<Result<number, HibpError>> {
  options.timeoutMs ??= 5_000;
  options.fetch ??= globalThis.fetch.bind(globalThis);

  if (typeof password !== "string") {
    throw new HibpError({
      reason: "invalid-input",
      message: "Password must be a string",
    });
  }
  if (
    !Number.isSafeInteger(options.timeoutMs) ||
    options.timeoutMs < 1 ||
    options.timeoutMs > 2_147_483_647
  ) {
    return Result.err(
      new HibpError({
        reason: "invalid-input",
        message: "timeoutMs must be an integer between 1 and 2147483647",
      }),
    );
  }

  options.signal?.throwIfAborted();
  const hash = await createHash(password);
  const timeout = AbortSignal.timeout(options.timeoutMs);
  const signal = options.signal
    ? AbortSignal.any([options.signal, timeout])
    : timeout;
  const response = await options.fetch(
    `https://api.pwnedpasswords.com/range/${hash.slice(0, 5)}`,
    {
      headers: { "Add-Padding": "true" },
      signal,
      redirect: "manual",
      credentials: "omit",
    },
  );
  if (response.status !== 200) {
    throw new HibpError({
      reason: "http",
      status: response.status,
      message: `Pwned Passwords lookup failed (HTTP ${response.status})`,
    });
  }

  const body = await response.text();

  if (signal.aborted) {
    return Result.err(
      new HibpError({
        reason: "aborted",
        message: "Pwned Passwords lookup aborted",
      }),
    );
  }

  let count = 0;
  // Validate the entire response before returning, including nonmatching rows.
  const lines = body.trim().split(/\r?\n/);
  for (const line of lines) {
    const match = /^([A-F0-9]{35}):([0-9]+)$/i.exec(line);
    const suffix = match?.[1];
    const exposureCount = Number(match?.[2]);
    if (suffix === undefined || !Number.isSafeInteger(exposureCount)) {
      throw new HibpError({
        reason: "invalid-response",
        message: "Invalid Pwned Passwords response",
      });
    }
    if (suffix.toUpperCase() === hash.slice(5)) {
      count = Math.max(count, exposureCount);
    }
  }

  return Result.ok(count);
}
