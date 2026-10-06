import { Result } from "better-result";
import { lookup } from "./lookup.ts";
import type { PwnedPasswordOptions } from "./types.ts";
import { HibpError } from "./types.ts";

/**
 * Return the number of known exposures, or 0 when absent from the dataset.
 * Return an Err on lookup failure. Never send the password or its complete hash.
 */
export async function pwnedPassword(
  password: string,
  options: PwnedPasswordOptions = {},
): Promise<Result<number, HibpError>> {
  options = { ...options };
  return Result.tryPromise({
    try: () => lookup(password, options),
    catch: (error) => {
      if (HibpError.is(error)) return error;
      if (options.signal?.aborted) {
        return new HibpError({
          reason: "cancelled",
          message: "Password lookup cancelled",
        });
      }
      if (error instanceof Error && error.name === "TimeoutError") {
        return new HibpError({
          reason: "timeout",
          message: "Password lookup timed out",
        });
      }
      return new HibpError({
        reason: "unavailable",
        message: "Password lookup unavailable",
      });
    },
  }).then(Result.flatten);
}
