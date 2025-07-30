import {
  expectedResponseError,
  isResponse,
  type MatcherResult,
} from "#src/utils.ts";
import { SuperHeaders } from "@mjackson/headers";

function formatHeaders(headers: HeadersInit): string[] {
  return new SuperHeaders(headers)
    .toString()
    .split("\n")
    .map((line) => line.trim());
}

export function toMatchResponse(
  response: Response,
  expected: ResponseInit,
): MatcherResult {
  if (!isResponse(response)) {
    return expectedResponseError(response);
  }

  if (expected.headers) {
    for (const [name, value] of Object.entries(expected.headers)) {
      if (response.headers.get(name) !== value) {
        return {
          pass: false,
          actual: {
            status: response.status,
            statusText: response.statusText,
            headers: formatHeaders(response.headers),
          },
          expected: {
            status: expected.status,
            statusText: expected.statusText,
            headers: formatHeaders(expected.headers),
          },
          message() {
            return `Expected response to have (status: ${expected.status}, statusText: "${expected.statusText}"), but received (status: ${response.status}, statusText: "${response.statusText}")`;
          },
        };
      }
    }
  }

  return {
    pass:
      response.status === expected.status &&
      response.statusText === expected.statusText,
    actual: {
      status: response.status,
      statusText: response.statusText,
    },
    expected: {
      status: expected.status,
      statusText: expected.statusText,
    },
    message() {
      return `Expected response to have (status: ${expected.status}, statusText: "${expected.statusText}"), but received (status: ${response.status}, statusText: "${response.statusText}")`;
    },
  };
}

if (import.meta.vitest) {
  let { expect, it } = import.meta.vitest;

  expect.extend({ toMatchResponse });

  it("should match the response status and statusText", () => {
    const received = new Response(null, { status: 200, statusText: "OK" });
    const expected = { status: 200, statusText: "OK" };
    expect(received).toMatchResponse(expected);
  });

  it.fails.each([{}, null, 1, [], Error, "lol"])(
    "fails when passed %s",
    (input) => {
      expect(input).toMatchResponse(new Response());
    },
  );

  it.fails("fails when passing a non response", () => {
    const received = { status: 200, statusText: "OK" };
    const expected = { status: 200, statusText: "OK" };
    expect(received).toMatchResponse(expected);
  });

  it.fails("fails when passing no match", () => {
    const received = new Response(null, { status: 200, statusText: "OK" });
    const expected = { status: 404, statusText: "Not Found" };
    expect(received).toMatchResponse(expected);
  });

  it.fails("fails when headers do not match", () => {
    const received = new Response(null, {
      status: 200,
      statusText: "OK",
      headers: { "x-custom-header": "value", "x-another-header": "value" },
    });
    const expected = {
      status: 200,
      statusText: "OK",
      headers: { "x-custom-header": "foo" },
    };
    expect(received).toMatchResponse(expected);
  });
}
