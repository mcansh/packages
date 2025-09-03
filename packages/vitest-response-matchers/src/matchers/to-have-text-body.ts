import {
  expectedResponseError,
  isResponse,
  type MatcherResult,
} from "#src/utils.ts";

export async function toHaveTextBody(
  response: Response,
  expected: string | null,
): Promise<MatcherResult> {
  if (!isResponse(response)) {
    return expectedResponseError(response);
  }

  let body = await response.clone().text();

  return {
    message: () => `Expected response to have body "${expected}"`,
    pass: body === expected,
    actual: body,
    expected: expected,
  };
}

if (import.meta.vitest) {
  let { expect, it } = import.meta.vitest;

  expect.extend({ toHaveTextBody });

  it("toHaveTextBody", async () => {
    let response = new Response("Hello, world!");
    await expect(response).toHaveTextBody("Hello, world!");
  });

  it.fails("fails when body does not match expected text", async () => {
    let response = new Response("Hello, world!");
    await expect(response).toHaveTextBody("Goodbye, world!");
  });

  it.fails.each([{}, null, 1, [], Error, "lol"])(
    "fails when passed %s",
    async (input) => {
      await expect(input).toHaveTextBody("lol");
    },
  );
}
