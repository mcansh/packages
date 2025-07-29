import type { MatcherResult } from "./matcher";

export function toHaveStatusText(
  response: Response,
  statusText?: string,
): MatcherResult {
  if (!(response instanceof Response)) {
    return {
      message: () => `Expected a Response, but received ${typeof response}`,
      pass: false,
    };
  }

  if (typeof statusText === "undefined") {
    return {
      pass: false,
      message: () => "Response status text is not defined",
    };
  }

  return {
    pass: response.statusText === statusText,
    message: () => {
      return `Expected status text "${statusText}", but received "${response.statusText}"`;
    },
    actual: response.statusText,
    expected: statusText,
  };
}

if (import.meta.vitest) {
  let { describe, expect, it } = import.meta.vitest;

  expect.extend({ toHaveStatusText });

  describe("toHaveStatusText matcher", () => {
    it.fails.each([
      new Response(null, { status: 200 }),
      new Response(null, { status: 404 }),
      new Response(null, { status: 500 }),
    ])("fails when missing statusText", (response) => {
      expect(response).toHaveStatusText();
    });

    it.fails("fails when statusText does not match", () => {
      let response = new Response(null, { status: 200, statusText: "OK" });
      expect(response).toHaveStatusText("Not Found");
    });

    it.each([
      new Response(null, { status: 200, statusText: "OK" }),
      new Response(null, { status: 404, statusText: "Not Found" }),
      new Response(null, { status: 500, statusText: "Internal Server Error" }),
    ])("passes when statusText matches $statusText", (response) => {
      expect(response).toHaveStatusText(response.statusText);
    });
  });
}
