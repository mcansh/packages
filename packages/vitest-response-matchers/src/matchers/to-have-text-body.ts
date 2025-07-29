export async function toHaveTextBody(
  response: Response,
  expected: string | null,
) {
  let body = await response.clone().text();

  return {
    message: () => `Expected response to have body "${expected}"`,
    pass: body === expected,
  };
}

if (import.meta.vitest) {
  let { expect, it } = import.meta.vitest;

  expect.extend({ toHaveTextBody });

  it("toHaveBody matcher", () => {
    let response = new Response("Hello, world!");
    expect(response).toHaveTextBody("Hello, world!");
  });
}
