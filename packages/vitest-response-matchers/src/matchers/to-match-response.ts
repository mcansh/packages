export function toMatchResponse(
  received: Response,
  expected: { status: number; statusText: string },
) {
  if (!(received instanceof Response)) {
    return {
      message: () => `Expected a Response, but received ${typeof received}`,
      pass: false,
    };
  }

  return {
    message() {
      return `Expected response to have (status: ${expected.status}, statusText: "${expected.statusText}"), but received (status: ${received.status}, statusText: "${received.statusText}")`;
    },
    pass:
      received instanceof Response &&
      received.status === expected.status &&
      received.statusText === expected.statusText,
  };
}

if (import.meta.vitest) {
  let { describe, expect, it } = import.meta.vitest;

  expect.extend({ toMatchResponse });

  describe("toMatchResponse", () => {
    it("should match the response status and statusText", () => {
      const response = new Response(null, { status: 200, statusText: "OK" });
      expect(response).toMatchResponse({ status: 200, statusText: "OK" });
    });
  });
}
