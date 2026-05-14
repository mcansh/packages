import { getContext } from "@remix-run/async-context-middleware";
import type { Middleware } from "@remix-run/fetch-router";
import { createContextKey } from "@remix-run/fetch-router";
import type { CreateSecureHeaders } from "./index.ts";
import { createSecureHeaders, mergeHeaders } from "./index.ts";

export {
  createNonce,
  HASH,
  mergeHeaders,
  NONCE,
  NONE,
  REPORT_SAMPLE,
  SELF,
  STRICT_DYNAMIC,
  UNSAFE_EVAL,
  UNSAFE_HASHES,
  UNSAFE_INLINE,
  WASM_UNSAFE_EVAL,
} from "./utils";

let NONCE_KEY = createContextKey<string>();

export function getCSPNonce(): string {
  return getContext().get(NONCE_KEY);
}

export function setCSPNonce(nonce: string): void {
  getContext().set(NONCE_KEY, nonce);
}

type Context = Parameters<Middleware>[0];

export type SecurityHeadersOptions = CreateSecureHeaders & {
  skip?: (context: Context) => boolean | Promise<boolean>;
};

export function securityHeaders({
  skip,
  ...options
}: SecurityHeadersOptions): Middleware {
  return async (context, next) => {
    let response = await next();
    if (skip?.(context)) return response;

    let secureHeaders = createSecureHeaders(options);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: mergeHeaders(response.headers, secureHeaders),
    });
  };
}
