# HTTP Helmet

easily add CSP and other security headers to your web application.

## Install

```sh
# npm
npm i @mcansh/http-helmet
```

## Usage

basic example using [`@mjackson/node-fetch-server`](https://github.com/mjackson/remix-the-web/tree/main/packages/node-fetch-server)

```js
import * as http from "node:http";
import { createRequestListener } from "@mjackson/node-fetch-server";
import { createNonce, createSecureHeaders } from "@mcansh/http-helmet";

let html = String.raw;

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

## Remove Insecure Headers

`removeInsecureHeaders` returns a copy of a `Headers` object with every
server-identifying, framework, and diagnostic header in the [OWASP Secure
Headers Project](https://owasp.org/www-project-secure-headers/) list removed,
leaving the original untouched.

```js
import { removeInsecureHeaders } from "@mcansh/http-helmet";

let headers = removeInsecureHeaders(responseHeaders);
```

This is opt-in, so existing behavior is unchanged. Every entry in the list is
removed — there's no per-header allowlist — so don't use it if your app relies
on a removed header like `X-B3-*` or `X-Datadog-*` for observability.
