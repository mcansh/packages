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
