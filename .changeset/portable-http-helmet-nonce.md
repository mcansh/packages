---
"@mcansh/http-helmet": patch
---

Remove the Node.js Buffer dependency from createNonce by using native Uint8Array Base64 encoding when available, with a btoa fallback for older runtimes.
