import type { MatcherResult } from "./matcher";

export function toThrowResponse(
  received: () => Response,
  expected: Response | ResponseInit,
): MatcherResult {
  let error: unknown = null;

  try {
    received();
  } catch (e: unknown) {
    error = e;
  }

  if (!(error instanceof Response)) {
    return {
      message: () => `Did not throw a Response`,
      pass: false,
      actual: error,
      expected: `[Response]`,
    };
  }

  let expectedResponse =
    expected instanceof Response ? expected : new Response(null, expected);

  return {
    message: () => `Expected to throw a Response`,
    pass:
      error instanceof Response &&
      error.status === expectedResponse.status &&
      error.statusText === expectedResponse.statusText,
    actual: { status: error.status, statusText: error.statusText },
    expected: { status: expected.status, statusText: expected.statusText },
  };
}

if (import.meta.vitest) {
  let { expect, it } = import.meta.vitest;
  expect.extend({ toThrowResponse });

  it("should throw a Response with the expected status and statusText", () => {
    let expected = new Response("Not Found", { status: 404 });
    expect(() => {
      throw expected;
    }).toThrowResponse(expected);
  });

  it("should throw a Response with the expected status and statusText when using ResponseInit", () => {
    let expected = { status: 404, statusText: "Not Found" };
    expect(() => {
      throw new Response("Not Found", expected);
    }).toThrowResponse(expected);
  });

  it.fails("fails when passing a non response", () => {
    const received = { status: 200, statusText: "OK" };
    const expected = { status: 200, statusText: "OK" };
    expect(() => {
      throw received;
    }).toThrowResponse(expected);
  });

  it.fails(
    "should not throw a Response with different status or statusText",
    () => {
      let expected = new Response("Not Found", { status: 404 });
      expect(() => {
        throw new Response("Internal Server Error", { status: 500 });
      }).toThrowResponse(expected);
    },
  );
}
