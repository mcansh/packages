---
"@mcansh/hibp": minor
---

Add `@mcansh/hibp`, a Pwned Passwords client for Node.js 22+, Deno, Bun, and Cloudflare Workers using standard Web APIs without Node compatibility flags.

- Return `Result<number, HibpError>` from `pwnedPassword()`, using `better-result` to distinguish exposure counts from typed input, HTTP, response, cancellation, timeout, and availability errors.
- Hash passwords locally with Web Crypto and send only the first five SHA-1 characters. Enable response padding, compare suffixes locally, and never follow redirects or send credentials.
- Support caller cancellation, a configurable timeout (five seconds by default), and an injectable fetch transport.
- Validate the shared runtime contract in Node, Deno, Bun, and Cloudflare workerd, and require the runtime matrix to pass before the Changesets release workflow publishes.
