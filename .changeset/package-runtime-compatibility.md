---
"@mcansh/create-temporary-files": patch
"@mcansh/http-helmet": minor
"@mcansh/url": patch
"@mcansh/vitest-response-matchers": minor
---

Verify published package entry points on their minimum Node.js runtimes.

- Correct create-temporary-files' Node.js requirement to >=20.4.0, the first release providing the Symbol.asyncDispose hook needed for cleanup.
- Bundle change-case into http-helmet's ESM and CommonJS builds so require() works on Node.js 20.0.0, and declare Node.js >=20 support. Upgrade type-fest to v5, which requires TypeScript 5.9 or newer for consumers of the public declarations.
- Refresh url's build tooling while preserving URL validation and builder behavior.
- Add Vitest 5 peer support to vitest-response-matchers, broaden JSON assertions to accept all JSON values, and retain failure details when a callback does not throw a Response.
