import { verifyResponse } from "#src/utils.ts";
import type { MatcherResult } from "./types";

export function toHaveBody(response: Response): MatcherResult {
  verifyResponse(response);

  return {
    message: () => `Expected response to have body`,
    pass: typeof response.body !== "undefined",
  };
}

if (import.meta.vitest) {
  let { expect, it } = import.meta.vitest;

  expect.extend({ toHaveBody });

  it("toHaveBody matcher", () => {
    let response = new Response("Hello, world!");
    expect(response).toHaveBody();
  });

  it("allows body to be null", () => {
    let response = new Response(null);
    expect(response).toHaveBody();
  });

  it.fails("when passed something that is not a Response", () => {
    expect(Error).toHaveBody();
  });
}
