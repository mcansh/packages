export async function toHaveTextBody(
  response: Response,
  expected: string | null,
) {
  if (!(response instanceof Response)) {
    return {
      message: () => `Expected a Response, but received ${typeof response}`,
      pass: false,
    };
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

  it("toHaveBody matcher", async () => {
    let response = new Response("Hello, world!");
    expect(response).toHaveTextBody("Hello, world!");
  });

  it.fails("when passed something that is not a Response", async () => {
    await expect({}).rejects.toHaveTextBody("lol");
  });
}
