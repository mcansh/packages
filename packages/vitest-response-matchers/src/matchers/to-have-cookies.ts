import { SetCookie } from "@mjackson/headers";
import type { MatcherResult } from "./matcher";

export function toHaveCookies(
  response: Response | ResponseInit,
  cookies: Array<string>,
  options?: { strict?: boolean },
): MatcherResult {
  let headers =
    response.headers instanceof Headers
      ? response.headers
      : new Headers(response.headers);

  let responseCookies = headers.get("set-cookie");

  if (!responseCookies) {
    return {
      pass: false,
      message: () => {
        return `Expected "Set-Cookie" header to be present, but it was not found`;
      },
    };
  }

  // normalize formatting of cookies
  let cookiesArray = responseCookies
    .split(",")
    .map((cookie) => new SetCookie(cookie.trim()).toString());

  let pass = options?.strict
    ? cookiesArray.every((cookie) => cookies.includes(cookie))
    : cookiesArray.some((cookie) => cookies.includes(cookie));

  return {
    pass,
    message: () => {
      return `Expected response to have cookies: ${responseCookies}`;
    },
    expected: cookies,
    actual: cookiesArray.map((cookie) => cookie.toString()),
  };
}

if (import.meta.vitest) {
  let { expect, it } = import.meta.vitest;

  expect.extend({ toHaveCookies });

  it("toHaveCookies matcher", () => {
    let headers = new Headers();
    headers.append("set-cookie", "sessionId=abc123; Path=/");
    headers.append("set-cookie", "userId=xyz789; Path=/");
    headers.append("set-cookie", "anotherId=def456;Path=/;httpOnly");
    let response = new Response("Hello, world!", { headers });
    expect(response).toHaveCookies(["sessionId=abc123; Path=/"]);
  });

  it.fails("toHaveCookies matcher - negative case", () => {
    let response = new Response("Hello, world!", {
      headers: { "set-cookie": "sessionId=abc123; Path=/" },
    });
    expect(response).toHaveCookies(["sessionId=wrongValue"]);
  });

  it.fails("strict mode ensures all cookies are accounted for", () => {
    let headers = new Headers();
    headers.append("set-cookie", "sessionId=abc123; Path=/");
    headers.append("set-cookie", "userId=xyz789; Path=/");
    let response = new Response("Hello, world!", { headers });
    expect(response).toHaveCookies(["sessionId=abc123; Path=/"], {
      strict: true,
    });
  });

  it("strict mode ensures all cookies are accounted for", () => {
    let headers = new Headers();
    headers.append("set-cookie", "sessionId=abc123; Path=/");
    headers.append("set-cookie", "userId=xyz789; Path=/");
    let response = new Response("Hello, world!", { headers });
    expect(response).toHaveCookies(
      ["sessionId=abc123; Path=/", "userId=xyz789; Path=/"],
      {
        strict: true,
      },
    );
  });
}
