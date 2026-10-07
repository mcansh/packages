---
"@mcansh/http-helmet": minor
---

Verify published package entry points on their minimum Node.js runtimes.

Bundle change-case into http-helmet's ESM and CommonJS builds so require() works on Node.js 20.0.0, and declare Node.js >=20 support. Upgrade type-fest to v5, which requires TypeScript 5.9 or newer for consumers of the public declarations.
