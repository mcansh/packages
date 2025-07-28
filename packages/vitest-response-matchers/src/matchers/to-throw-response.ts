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

  return {
    message: () => `Expected to throw a Response`,
    pass:
      error instanceof Response &&
      error.status === expected.status &&
      error.statusText === expected.statusText,
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
