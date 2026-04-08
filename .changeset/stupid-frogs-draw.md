---
"@mcansh/http-helmet": patch
---

adds support for remix middleware

```ts
import {
  securityHeaders,
  NONCE,
  getCSPNonce,
  setCSPNonce,
} from "@mcansh/http-helmet/remix-middleware";
import { createRouter } from "remix/fetch-router";
import { asyncContext } from "@remix-run/async-context-middleware";

let nonce = createNonce();
setCSPNonce(nonce);

let router = createRouter({
  middleware: [
    asyncContext(),
    securityHeaders({
      "Content-Security-Policy": {
        "default-src": ["'self'"],
        "script-src": ["'self'", NONCE(nonce)],
      },
    }),
  ],
});
```

// then in your controller you can get the nonce from the context and use it in your templates to add a nonce to your script tags

```ts
export const home = {
  handler() {
    let nonce = getCSPNonce();

    return render(
      `<script nonce="${nonce}">console.log("hello world")</script>`,
    );
  },
} satisfies BuildAction;
```
