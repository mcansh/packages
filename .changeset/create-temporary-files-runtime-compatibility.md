---
"@mcansh/create-temporary-files": patch
---

Verify published package entry points on their minimum Node.js runtimes.

Correct create-temporary-files' Node.js requirement to >=20.4.0, the first release providing the Symbol.asyncDispose hook needed for cleanup.
