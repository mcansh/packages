export function toHaveBody(response: Response) {
  return {
    message: () => `Expected response to have body`,
    pass: response.body !== null,
  };
}

if (import.meta.vitest) {
  let { expect, it } = import.meta.vitest;

  expect.extend({ toHaveBody });

  it("toHaveBody matcher", () => {
    let response = new Response("Hello, world!");
    expect(response).toHaveBody();
  });

  it.fails("fails when body is null", () => {
    let response = new Response(null);
    expect(response).toHaveBody();
  });
}
