# HTTP Helmet

easily add CSP and other security headers to your web application.

## Install

```sh
# npm
npm i @mcansh/http-helmet
```

## Usage

basic example using [`@remix-run/node-fetch-server`](https://github.com/remix-run/remix/tree/main/packages/node-fetch-server)

```js
import * as http from "node:http";
import { createRequestListener } from "@remix-run/node-fetch-server";
import { html } from "@remix-run/html-template";
import { createNonce, createSecureHeaders } from "@mcansh/http-helmet";

let handler = (request) => {
  let nonce = createNonce();
  let headers = createSecureHeaders({
    "Content-Security-Policy": {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", `'nonce-${nonce}'`],
    },
  });

  headers.append("content-type", "text/html");

  return new Response(
    html`
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <title>Hello World</title>
        </head>
        <body>
          <h1>Hello World</h1>

          <script nonce="${nonce}">
            console.log("nonce configured");
          </script>

          <script>
            alert("nonce not configured");
          </script>
        </body>
      </html>
    `,
    { headers },
  );
};

let server = http.createServer(createRequestListener(handler));

server.listen(3000);

console.log("✅ app ready: http://localhost:3000");
```

## Remix middleware

The `./remix-middleware` subpath exports a middleware factory for Remix's fetch
router. `setCSPNonce` stores the nonce on the async request context and installs
it as `context.cspNonce`.

```ts
function securityHeaders(options: SecurityHeadersOptions): Middleware;

function securityHeaders(
  createHeaders: SecurityHeadersFactory,
  options?: SecurityHeadersFactoryOptions,
): Middleware;
```

```ts
import { asyncContext } from "@remix-run/async-context-middleware";
import { createRouter } from "@remix-run/fetch-router";
import {
  createNonce,
  NONCE,
  securityHeaders,
  SELF,
  setCSPNonce,
} from "@mcansh/http-helmet/remix-middleware";

let router = createRouter({
  middleware: [
    asyncContext(),
    async (_context, next) => {
      setCSPNonce(createNonce());
      return next();
    },
    securityHeaders((context) => {
      if (!context.cspNonce) {
        throw new Error("Expected CSP nonce to be set");
      }

      return {
        "Content-Security-Policy": {
          defaultSrc: [SELF],
          scriptSrc: [SELF, NONCE(context.cspNonce)],
        },
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
      };
    }),
  ],
});
```
