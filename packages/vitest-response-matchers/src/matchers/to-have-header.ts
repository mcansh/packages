import {
  expectedResponseError,
  isResponse,
  type MatcherResult,
} from "../utils";

export function toHaveHeader(
  response: Response,
  headerName: string,
  headerValue?: string,
): MatcherResult {
  if (!isResponse(response)) {
    return expectedResponseError(response);
  }

  let actual = response.headers.get(headerName);

  if (headerValue == undefined) {
    return {
      pass: response.headers.has(headerName),
      actual,
      expected: headerValue,
      message: () => {
        return `Expected response header "${headerName}" to be found`;
      },
    };
  }

  return {
    pass: actual === headerValue,
    actual,
    expected: headerValue,
    message: () => {
      return `Expected response header "${headerName}" to be "${headerValue}", but got "${actual}"`;
    },
  };
}

if (import.meta.vitest) {
  let { expect, it } = import.meta.vitest;

  expect.extend({ toHaveHeader });

  it("basic", () => {
    let response = new Response("Hello, world!", {
      headers: { "x-custom-header": "custom-value" },
    });
    expect(response).toHaveHeader("x-custom-header", "custom-value");
  });

  it.fails("fails when header value does not match", () => {
    let response = new Response("Hello, world!", {
      headers: { "x-custom-header": "custom-value" },
    });
    expect(response).toHaveHeader("x-custom-header", "wrong-value");
  });

  it("only checks for presence of header", () => {
    let response = new Response("Hello, world!", {
      headers: { "x-custom-header": "custom-value" },
    });
    expect(response).toHaveHeader("x-custom-header");
  });

  it.fails("fails when header is not present", () => {
    let response = new Response("Hello, world!");
    expect(response).toHaveHeader("x-cache-hit");
  });

  it.fails.each([{}, null, 1, [], Error, "lol"])(
    "fails when passed %s",
    (input) => {
      expect(input).toHaveHeader("x-custom-header");
    },
  );
}
