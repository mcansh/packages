import { getHeaders } from "#src/utils.ts";
import { SetCookie } from "@mjackson/headers";
import type { MatcherResult } from "./types";

export function toHaveCookies(
  response: Response | { headers?: HeadersInit },
  cookies: Array<string>,
  options?: { strict?: boolean },
): MatcherResult {
  let headers = getHeaders(response);

  let responseCookies = headers.get("set-cookie");

  if (!responseCookies && cookies.length > 0) {
    return {
      pass: false,
      message: () => {
        return `Expected "Set-Cookie" header to be present, but it was not found`;
      },
      actual: headers.get("set-cookie"),
      expected: cookies,
    };
  }

  if (!responseCookies && cookies.length === 0) {
    return {
      pass: true,
      message: () => `Expected no cookies, and none were found.`,
      actual: [],
      expected: cookies,
    };
  }

  if (!responseCookies) {
    return {
      pass: false,
      message: () => {
        return `Expected "Set-Cookie" header to be present, but it was not found`;
      },
      actual: headers.get("set-cookie"),
      expected: cookies,
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

  it.each([new Response("Hello, world!"), {}])(
    "passes when no cookies are expected",
    (responseOrResponseInit) => {
      expect(responseOrResponseInit).toHaveCookies([]);
    },
  );

  it("toHaveCookies matcher with inline headers", () => {
    expect({
      headers: { "Set-Cookie": "sessionId=abc123; Path=/" },
    }).toHaveCookies(["sessionId=abc123; Path=/"]);
  });

  it.fails("fails if no cookies are present", () => {
    let response = new Response("Hello, world!");
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
      { strict: true },
    );
  });
}
