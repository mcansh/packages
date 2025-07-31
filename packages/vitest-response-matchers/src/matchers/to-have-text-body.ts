import { verifyResponse } from "#src/utils.ts";

export async function toHaveTextBody(
  response: Response,
  expected: string | null,
) {
  verifyResponse(response);

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

  it("toHaveBody matcher", async () => {
    let response = new Response("Hello, world!");
    expect(response).toHaveTextBody("Hello, world!");
  });

  it.fails("when passed something that is not a Response", async () => {
    await expect({}).rejects.toHaveTextBody("lol");
  });
}
