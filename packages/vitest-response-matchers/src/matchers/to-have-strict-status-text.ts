import { STATUS_CODES } from "node:http";

export function toHaveStrictStatusText(response: Response) {
  let found = STATUS_CODES[response.status] || "";

  return {
    pass: found === response.statusText,
    message: () => {
      return `Received status text "${response.statusText}" was not valid, should be "${found}"`;
    },
  };
}

if (import.meta.vitest) {
  let { describe, expect, it } = import.meta.vitest;

  expect.extend({ toHaveStrictStatusText });

  describe("toHaveStatus matcher", () => {
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
