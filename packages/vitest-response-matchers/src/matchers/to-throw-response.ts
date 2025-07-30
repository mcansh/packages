import {
  expectedResponseError,
  isResponse,
  type MatcherResult,
} from "../utils";

export async function toThrowResponse(
  received: () => Response | Promise<Response>,
  expected: Response | ResponseInit,
): Promise<MatcherResult> {
  let error: unknown = null;

  try {
    await received();
  } catch (caught) {
    error = caught;
  }

  if (!isResponse(error)) {
    return expectedResponseError(error);
  }

  if (expected.status && expected.statusText) {
    return {
      pass:
        error.status === expected.status &&
        error.statusText === expected.statusText,
      actual: { status: error.status, statusText: error.statusText },
      expected: { status: expected.status, statusText: expected.statusText },
      message: () => `Expected to throw a Response`,
    };
  }

  return {
    pass: error.status === expected.status,
    actual: { status: error.status },
    expected: { status: expected.status },
    message: () => `Expected to throw a Response`,
  };
}

if (import.meta.vitest) {
  let { expect, it } = import.meta.vitest;
  expect.extend({ toThrowResponse });

  it("should throw a Response with the expected status and statusText", async () => {
    function syncThrow() {
      throw new Response("Not Found", { status: 404 });
    }

    await expect(() => syncThrow()).toThrowResponse({ status: 404 });
  });

  it("should throw a Response with the expected status and statusText when using an async function", async () => {
    async function asyncThrow() {
      throw new Response("Not Found", { status: 404 });
    }

    await expect(() => asyncThrow()).toThrowResponse({ status: 404 });
  });

  it("should throw a Response with the expected status and statusText when using ResponseInit", async () => {
    let expected = { status: 404, statusText: "Not Found" };
    await expect(() => {
      throw new Response("Not Found", expected);
    }).toThrowResponse(expected);
  });

  it.fails.each([{ status: 200, statusText: "OK" }, null, 1, [], Error, "lol"])(
    "fails when thrown object is not a Response",
    async (input) => {
      function syncThrow() {
        throw input;
      }

      await expect(() => syncThrow()).toThrowResponse({
        status: 200,
        statusText: "OK",
      });
    },
  );

  it.fails(
    "should not throw a Response with different status or statusText",
    async () => {
      let expected = new Response("Not Found", { status: 404 });
      await expect(() => {
        throw new Response("Internal Server Error", { status: 500 });
      }).toThrowResponse(expected);
    },
  );
}
