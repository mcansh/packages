import { asyncContext } from "@remix-run/async-context-middleware";
import { RequestContext } from "@remix-run/fetch-router";
import { describe, expect, it } from "vitest";
import { NONCE, securityHeaders, setCSPNonce } from "./remix-middleware.js";

function createContext() {
  return new RequestContext(new Request("https://example.com/"));
}

describe("securityHeaders", () => {
  it("adds security headers to the downstream response", async () => {
    let middleware = securityHeaders({
      "Content-Security-Policy": {
        defaultSrc: ["'self'"],
      },
      "X-Frame-Options": "DENY",
    });

    let response = await middleware(createContext(), async () => {
      return new Response("Hello", {
        status: 201,
        statusText: "Created",
        headers: {
          "Content-Type": "text/plain",
        },
      });
    });

    expect(response.status).toBe(201);
    expect(response.statusText).toBe("Created");
    expect(await response.text()).toBe("Hello");
    expect(response.headers.get("Content-Type")).toBe("text/plain");
    expect(response.headers.get("Content-Security-Policy")).toBe(
      "default-src 'self'",
    );
    expect(response.headers.get("X-Frame-Options")).toBe("DENY");
  });

  it("skips adding headers when the skip option resolves true", async () => {
    let downstreamResponse = new Response("Hello", {
      headers: {
        "Content-Type": "text/plain",
      },
    });

    let middleware = securityHeaders({
      "X-Frame-Options": "DENY",
      skip: async () => true,
    });

    let response = await middleware(createContext(), async () => {
      return downstreamResponse;
    });

    expect(response).toBe(downstreamResponse);
    expect(response.headers.get("Content-Type")).toBe("text/plain");
    expect(response.headers.has("X-Frame-Options")).toBe(false);
  });

  it("can create headers from the request context", async () => {
    let context = createContext();

    await asyncContext()(context, async () => {
      setCSPNonce("test-nonce");

      let middleware = securityHeaders((context) => {
        if (!context.cspNonce) {
          throw new Error("Expected cspNonce to be set");
        }

        return {
          "Content-Security-Policy": {
            scriptSrc: [NONCE(context.cspNonce)],
          },
        };
      });

      let response = await middleware(context, async () => new Response());

      expect(response.headers.get("Content-Security-Policy")).toBe(
        "script-src 'nonce-test-nonce'",
      );

      return new Response();
    });
  });
});

describe("CSP nonce context", () => {
  it("stores the nonce in the Remix async request context", async () => {
    let middleware = asyncContext();
    let context = createContext();

    await middleware(context, async () => {
      expect("cspNonce" in context).toBe(false);

      setCSPNonce("test-nonce");

      expect((context as typeof context & { cspNonce: string }).cspNonce).toBe(
        "test-nonce",
      );

      return new Response();
    });
  });
});
