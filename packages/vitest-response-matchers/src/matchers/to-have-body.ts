import type { MatcherResult } from "./matcher";

export function toHaveBody(response: Response): MatcherResult {
  if (!(response instanceof Response)) {
    return {
      message: () => `Expected a Response, but received ${typeof response}`,
      pass: false,
    };
  }

  return {
    message: () => `Expected response to have body`,
    pass: response.body !== null,
  };
}

if (import.meta.vitest) {
  let { expect, it } = import.meta.vitest;

  expect.extend({ toHaveBody });

  it("toHaveBody matcher", () => {
    let response = new Response("Hello, world!");
    expect(response).toHaveBody();
  });

  it.fails("fails when body is null", () => {
    let response = new Response(null);
    expect(response).toHaveBody();
  });

  it.fails("when passed something that is not a Response", () => {
    expect(Error).toHaveBody();
  });
}
