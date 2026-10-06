# @mcansh/hibp

Check passwords against [Have I Been Pwned's Pwned Passwords API](https://haveibeenpwned.com/API/v3#SearchingPwnedPasswordsByRange) from Node, Deno, Bun, and Cloudflare Workers. ESM with TypeScript declarations and explicit `better-result` error handling.

```sh
npm install @mcansh/hibp
```

```ts
import { pwnedPassword } from "@mcansh/hibp";

const result = await pwnedPassword(password);
if (result.isErr()) {
  // The lookup failed. Handle result.error.reason; don't accept the password.
} else if (result.value > 0) {
  // Reject this password and ask the user to choose another.
}
```

In Deno, use `import { pwnedPassword } from "npm:@mcansh/hibp"` and grant network access to `api.pwnedpasswords.com`. Bun uses the same import as Node. Workers can bundle the package directly; no `nodejs_compat` flag is needed. Call it inside a request handler, not at module initialization.

## API

`pwnedPassword(password: string, options?: PwnedPasswordOptions): Promise<Result<number, HibpError>>`

Returns `Result.ok(count)` with the number of exposures in the dataset. Zero means the password was not found, including padded entries with count zero; it does **not** prove a password is secure. Empty strings and Unicode are hashed exactly as supplied, without trimming or normalization. Apply your own length and strength requirements.

Options:

| Option      | Default            | Purpose                                         |
| ----------- | ------------------ | ----------------------------------------------- |
| `signal`    | none               | Cancel a lookup using an `AbortSignal`          |
| `timeoutMs` | `5000`             | Limit the request and response body consumption |
| `fetch`     | `globalThis.fetch` | Inject a trusted transport or test double       |

Unsuccessful lookups return `Result.err(HibpError)`. The error has `_tag: "HibpError"`, a `reason` (`invalid-input`, `http`, `invalid-response`, `cancelled`, `timeout`, or `unavailable`), a safe `message`, and an optional HTTP `status`. Handle these separately from a zero result. Custom transports must honor the supplied abort signal. There are no automatic retries. Exceptions deliberately marked as a `better-result` Panic still propagate according to that library's contract.

## Privacy

SHA-1 is computed locally using Web Crypto. Only its first five hexadecimal characters are sent over HTTPS; the full hash and password are never transmitted by this package. Matching happens locally. Response padding is always enabled, redirects are not followed, and credentials are omitted. There is no logging, caching, telemetry, or API key requirement. Raw transport errors are not attached to the public error, preventing custom transports from exposing credentials through error messages.

HIBP still receives a hash prefix and connection metadata. This is privacy preservation through k-anonymity, not complete anonymity. Check completed passwords on submission, rather than sending a prefix for each keystroke. SHA-1 is used only for this lookup protocol; use a dedicated password hashing algorithm for storage.

## Runtime support contract

| Runtime            | Supported baseline                       | Verification                                                               |
| ------------------ | ---------------------------------------- | -------------------------------------------------------------------------- |
| Node.js            | 22+                                      | CI runs Node 22 and 24                                                     |
| Deno               | Current Deno 2                           | CI runs the latest Deno 2                                                  |
| Bun                | Current stable Bun                       | CI runs the latest stable Bun                                              |
| Cloudflare Workers | Compatibility date `2025-10-01` or newer | CI runs the workspace's Wrangler/workerd engine without Node compatibility |

All four execute the **same contract suite against the built JavaScript**, testing known SHA-1 vectors, UTF-8, request privacy, response parsing, padding, errors, cancellation, and timeouts. The package uses only Web APIs: `fetch`, Web Crypto, `TextEncoder`, `AbortSignal.timeout`, and `AbortSignal.any`. New runtime releases are supported once validated; the matrix is the compatibility promise. Availability of HIBP and network access is outside that promise.

The Changesets release workflow requires this runtime matrix to pass before publishing. Workers also tests its native fetch against intercepted success and redirect responses, with all outbound traffic intercepted. Locally verified versions: Node 22.23.3 and 24.15.0, Deno 2.9.7, Bun 1.4.3, and workerd 1.20250927.0.

## Development

From the workspace root:

```sh
pnpm --filter @mcansh/hibp build
pnpm --filter @mcansh/hibp typecheck
node packages/hibp/test/run.ts
deno run packages/hibp/test/run.ts
bun packages/hibp/test/run.ts
node packages/hibp/test/workers.ts
```

The TypeScript runners execute directly in each runtime; `typecheck` checks both the library and the runtime tests against the built declarations. Build before typechecking. The shared suite runs 29 tests; Workers adds native fetch success and redirect checks without `nodejs_compat`.

Tests use synthetic passwords and mocked HTTP responses, requiring no network calls to HIBP. Workers tests run in Miniflare's real workerd engine, which requires permission to start a local server. The build verifies exports and declarations with publint and Are The Types Wrong before testing.
