import { SetCookie } from "@mjackson/headers";
import {
  expectedResponseError,
  isResponse,
  type MatcherResult,
} from "../utils";

export function toHaveCookies(
  response: Response,
  cookies: Array<string>,
  options?: { strict?: boolean },
): MatcherResult {
  if (!isResponse(response)) {
    return expectedResponseError(response);
  }

  let responseCookies = response.headers.get("set-cookie");

  if (!responseCookies) {
    return {
      pass: false,
      actual: responseCookies,
      expected: cookies,
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

  it("toHaveCookies", () => {
    let headers = new Headers();
    headers.append("set-cookie", "sessionId=abc123; Path=/");
    headers.append("set-cookie", "userId=xyz789; Path=/");
    headers.append("set-cookie", "anotherId=def456;Path=/;httpOnly");
    let response = new Response("Hello, world!", { headers });
    expect(response).toHaveCookies(["sessionId=abc123; Path=/"]);
  });

  it.fails("fails if no cookies are present", () => {
    let response = new Response("Hello, world!");
    expect(response).toHaveCookies(["sessionId=abc123; Path=/"]);
  });

  it.fails("fails when cookie value does not match", () => {
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

  it.fails.each([{}, null, 1, [], Error, "lol"])(
    "fails when passed %s",
    (input) => {
      expect(input).toHaveCookies([]);
    },
  );
}
