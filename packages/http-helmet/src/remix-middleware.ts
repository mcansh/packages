import { getContext } from "@remix-run/async-context-middleware";
import type { Middleware } from "@remix-run/fetch-router";
import { createContextKey } from "@remix-run/fetch-router";
import type { CreateSecureHeaders } from "./helmet.js";
import { createSecureHeaders } from "./helmet.js";
import { mergeHeaders } from "./utils.js";

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
} from "./utils.js";

let NONCE_KEY = createContextKey<string>();

export function setCSPNonce(nonce: string): void {
  getContext().set(NONCE_KEY, nonce, { property: "cspNonce" });
}

type Context = Parameters<Middleware>[0];
type MaybePromise<T> = T | Promise<T>;

export type SecurityHeadersContext = Context & {
  cspNonce?: string;
};

type SecurityHeadersSkip = (
  context: SecurityHeadersContext,
) => MaybePromise<boolean>;

export type SecurityHeadersFactory = (
  context: SecurityHeadersContext,
) => MaybePromise<CreateSecureHeaders>;

export type SecurityHeadersOptions = CreateSecureHeaders & {
  skip?: SecurityHeadersSkip;
};

export type SecurityHeadersFactoryOptions = {
  skip?: SecurityHeadersSkip;
};

export function securityHeaders(options: SecurityHeadersOptions): Middleware;
export function securityHeaders(
  createHeaders: SecurityHeadersFactory,
  options?: SecurityHeadersFactoryOptions,
): Middleware;
export function securityHeaders(
  optionsOrCreateHeaders: SecurityHeadersOptions | SecurityHeadersFactory,
  factoryOptions: SecurityHeadersFactoryOptions = {},
): Middleware {
  let createHeaders: SecurityHeadersFactory;
  let skip: SecurityHeadersSkip | undefined;

  if (typeof optionsOrCreateHeaders === "function") {
    createHeaders = optionsOrCreateHeaders;
    skip = factoryOptions.skip;
  } else {
    let { skip: staticSkip, ...options } = optionsOrCreateHeaders;
    createHeaders = () => options as CreateSecureHeaders;
    skip = staticSkip;
  }

  return async (context, next) => {
    let response = await next();
    let securityHeadersContext = context as SecurityHeadersContext;

    if (await skip?.(securityHeadersContext)) return response;

    let secureHeaders = createSecureHeaders(
      await createHeaders(securityHeadersContext),
    );

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: mergeHeaders(response.headers, secureHeaders),
    });
  };
}
