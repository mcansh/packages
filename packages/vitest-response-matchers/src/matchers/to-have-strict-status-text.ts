import { STATUS_CODES } from "node:http";
import type { MatcherResult } from "./matcher";

export function toHaveStrictStatusText(response: Response): MatcherResult {
  if (!(response instanceof Response)) {
    return {
      message: () => `Expected a Response, but received ${typeof response}`,
      pass: false,
    };
  }

  let found = STATUS_CODES[response.status];

  if (!found) {
    return {
      pass: false,
      message: () => {
        return `Received status code ${response.status} does not have a valid status text`;
      },
      actual: response.statusText,
      expected: found,
    };
  }

  return {
    pass: found === response.statusText,
    message: () => {
      return `Received status text "${response.statusText}" was not valid, should be "${found}"`;
    },
    actual: response.statusText,
    expected: found,
  };
}

if (import.meta.vitest) {
  let { describe, expect, it } = import.meta.vitest;

  expect.extend({ toHaveStrictStatusText });

  describe("toHaveStatus matcher", () => {
    it.fails("when status code does not exist", () => {
      let response = new Response("Hello, world!", {
        status: 599,
        statusText: "Unknown",
      });

      expect(response).toHaveStrictStatusText();
    });

    it.fails(
      "when statusText on response is not what the http spec expects",
      () => {
        let response = new Response("Hello, world!", {
          status: 200,
          statusText: "Not OK",
        });
        expect(response).toHaveStrictStatusText();
      },
    );

    it.each([
      [200, "OK"],
      [204, "No Content"],
      [302, "Found"],
      [404, "Not Found"],
      [500, "Internal Server Error"],
    ])(
      "passes when statusText matches the http spec for '%d'",
      (status, statusText) => {
        let response = new Response(null, { status, statusText });
        expect(response).toHaveStrictStatusText();
      },
    );
  });
}
