import {
  expectedResponseError,
  isResponse,
  type MatcherResult,
} from "#src/utils.ts";

export async function toHaveJsonBody(
  response: Response,
  expected: object | null,
): Promise<MatcherResult> {
  if (!isResponse(response)) {
    return expectedResponseError(response);
  }

  let body = await response.clone().json();

  let expectedJson = JSON.stringify(expected);

  return {
    pass: JSON.stringify(body) === expectedJson,
    actual: body,
    expected,
    message: () => `Expected response to have body "${expectedJson}"`,
  };
}

if (import.meta.vitest) {
  let { expect, it } = import.meta.vitest;

  expect.extend({ toHaveJsonBody });

  it("toHaveBody", async () => {
    let response = Response.json({ message: "Hello, world!" });
    await expect(response).toHaveJsonBody({ message: "Hello, world!" });
  });

  it.fails.each([{}, null, 1, [], Error, "lol"])(
    "fails when passed %s",
    async (input) => {
      await expect(input).toHaveJsonBody({ message: "Hello, world!" });
    },
  );

  it.fails("when body does not match expected JSON", async () => {
    let response = Response.json({ message: "Hello, world!" });
    await expect(response).toHaveJsonBody({ message: "Goodbye, world!" });
  });
}
