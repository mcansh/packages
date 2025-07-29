import type { MatcherResult } from "./matcher";

export function toHaveStatus(
  response: Response,
  status?: number,
): MatcherResult {
  if (!(response instanceof Response)) {
    return {
      message: () => `Expected a Response, but received ${typeof response}`,
      pass: false,
    };
  }

  if (typeof status === "undefined") {
    status = 200;
  }

  return {
    pass: response.status === status,
    message: () => {
      return `Expected status ${status}, but received ${response.status}`;
    },
    expected: status,
    actual: response.status,
  };
}

if (import.meta.vitest) {
  let { expect, it } = import.meta.vitest;

  expect.extend({ toHaveStatus });

  it("toHaveStatus matcher", () => {
    let response = new Response("Hello, world!", { status: 200 });
    expect(response).toHaveStatus(200);
    expect(response).not.toHaveStatus(404);
  });

  it("defaults to status 200", () => {
    let response = new Response("Hello, world!");
    expect(response).toHaveStatus();
  });

  it.fails("fails when status does not match", () => {
    let response = new Response("Hello, world!", { status: 404 });
    expect(response).toHaveStatus();
  });
}
