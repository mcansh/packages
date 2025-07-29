import type { MatcherResult } from "./matcher";

export function toMatchResponse(
  received: Response,
  expected: { status: number; statusText: string },
): MatcherResult {
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
    actual: {
      status: received.status,
      statusText: received.statusText,
    },
    expected: {
      status: expected.status,
      statusText: expected.statusText,
    },
  };
}

if (import.meta.vitest) {
  let { expect, it } = import.meta.vitest;

  expect.extend({ toMatchResponse });

  it("should match the response status and statusText", () => {
    const received = new Response(null, { status: 200, statusText: "OK" });
    const expected = { status: 200, statusText: "OK" };
    expect(received).toMatchResponse(expected);
  });

  it.fails("fails when passing a non response", () => {
    const received = { status: 200, statusText: "OK" };
    const expected = { status: 200, statusText: "OK" };
    expect(received).toMatchResponse(expected);
  });

  it.fails("fails when passing no match", () => {
    const received = new Response(null, { status: 200, statusText: "OK" });
    const expected = { status: 404, statusText: "Not Found" };
    expect(received).toMatchResponse(expected);
  });
}
