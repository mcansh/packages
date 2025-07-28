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

  describe("toMatchResponse", () => {
    it("should match the response status and statusText", () => {
      const received = new Response(null, { status: 200, statusText: "OK" });
      const expected = { status: 200, statusText: "OK" };
      expect(toMatchResponse(received, expected)).toEqual({
        message: expect.any(Function),
        pass: true,
      });
    });
  });
}
