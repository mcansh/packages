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

  let responseCookies = headers.getSetCookie();

  if (responseCookies.length === 0) {
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
    .map((cookie) => new SetCookie(cookie).toString())
    .sort();
  let expectedCookies = cookies
    .map((cookie) => new SetCookie(cookie).toString())
    .sort();

  let pass = options?.strict
    ? cookiesArray.length === expectedCookies.length &&
      cookiesArray.every((cookie, index) => cookie === expectedCookies[index])
    : cookiesArray.some((cookie) => expectedCookies.includes(cookie));

  return {
    pass,
    message: () => {
      return `Expected response to have cookies: ${responseCookies}`;
    },
    expected: cookies,
    actual: cookiesArray,
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

  it("preserves Expires dates and multiple Set-Cookie headers", () => {
    let headers = new Headers();
    headers.append(
      "set-cookie",
      "session=abc; Expires=Wed, 21 Oct 2015 07:28:00 GMT; Path=/",
    );
    headers.append("set-cookie", "user=xyz; Path=/");
    expect({ headers }).toHaveCookies(
      [
        "session=abc; Path=/; Expires=Wed, 21 Oct 2015 07:28:00 GMT",
        "user=xyz; Path=/",
      ],
      { strict: true },
    );
  });

  it("normalizes formatting on both sides", () => {
    expect({
      headers: { "set-cookie": "session=abc; Path=/; HttpOnly" },
    }).toHaveCookies(["session=abc;path=/;httponly"], { strict: true });
  });

  it("strict mode rejects extra expected cookies and duplicate mismatches", () => {
    let response = { headers: { "set-cookie": "session=abc; Path=/" } };
    expect(response).not.toHaveCookies(
      ["session=abc; Path=/", "user=xyz; Path=/"],
      { strict: true },
    );
    expect(response).not.toHaveCookies(
      ["session=abc; Path=/", "session=abc; Path=/"],
      { strict: true },
    );
    let headers = new Headers();
    headers.append("set-cookie", "session=abc; Path=/");
    headers.append("set-cookie", "session=abc; Path=/");
    expect({ headers }).not.toHaveCookies(
      ["session=abc; Path=/", "user=xyz; Path=/"],
      { strict: true },
    );
  });

  it("non-strict mode continues to match any expected cookie", () => {
    expect({ headers: { "set-cookie": "session=abc; Path=/" } }).toHaveCookies([
      "session=abc; Path=/",
      "missing=value",
    ]);
  });
}
