import {
  expectedResponseError,
  isResponse,
  type MatcherResult,
} from "../utils";

export function toHaveStatus(
  response: Response,
  status?: number,
  statusText?: string,
): MatcherResult {
  if (!isResponse(response)) {
    return expectedResponseError(response);
  }

  if (typeof status === "undefined") {
    status = 200;
  }

  if (status && statusText) {
    return {
      pass: response.status === status && response.statusText === statusText,
      message: () => {
        return `Expected Response with a status code of ${status} and status text of ${statusText}, but received status ${response.status} and status text of ${response.statusText}`;
      },
      expected: { status, statusText },
      actual: { status: response.status, statusText: response.statusText },
    };
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

  it("toHaveStatus", () => {
    let response = new Response("Hello, world!", {
      status: 200,
      statusText: "OK",
    });
    expect(response).toHaveStatus(200);
  });

  it("defaults to status 200", () => {
    let response = new Response("Hello, world!");
    expect(response).toHaveStatus();
  });

  it.fails.each([{}, null, 1, [], Error, "lol"])(
    "fails when passed %s",
    (input) => {
      expect(input).toHaveStatus();
    },
  );

  it.fails("fails when status does not match", () => {
    let response = new Response("Hello, world!", {
      status: 404,
      statusText: "Not Found",
    });
    expect(response).toHaveStatus(200);
  });

  it("allows checking for status and status text", () => {
    let response = new Response("Hello, world!", {
      status: 404,
      statusText: "Not Found",
    });
    expect(response).toHaveStatus(404, "Not Found");
  });

  it.fails("fails when status and status text do not match", () => {
    let response = new Response("Hello, world!", {
      status: 404,
      statusText: "Not Found",
    });
    expect(response).toHaveStatus(200, "OK");
  });
}
