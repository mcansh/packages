import {
  expectedResponseError,
  isResponse,
  type MatcherResult,
} from "../utils";

export function toHaveBody(response: Response): MatcherResult {
  if (!isResponse(response)) {
    return expectedResponseError(response);
  }

  return {
    message: () => `Expected response to have body`,
    pass: response.body !== null,
  };
}

if (import.meta.vitest) {
  let { expect, it } = import.meta.vitest;

  expect.extend({ toHaveBody });

  it("toHaveBody", () => {
    let response = new Response("Hello, world!");
    expect(response).toHaveBody();
  });

  it.fails("fails when body is null", () => {
    let response = new Response(null);
    expect(response).toHaveBody();
  });

  it.fails.each([{}, null, 1, [], Error, "lol"])(
    "fails when passed %s",
    (input) => {
      expect(input).toHaveBody();
    },
  );
}
