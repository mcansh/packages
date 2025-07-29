export async function toHaveJsonBody(
  response: Response,
  expected: object | null,
) {
  let body = await response.clone().json();

  let expectedJson = JSON.stringify(expected);

  return {
    message: () => `Expected response to have body "${expectedJson}"`,
    pass: JSON.stringify(body) === expectedJson,
  };
}

if (import.meta.vitest) {
  let { expect, it } = import.meta.vitest;

  expect.extend({ toHaveJsonBody });

  it("toHaveBody matcher", () => {
    let response = Response.json({ message: "Hello, world!" });
    expect(response).toHaveJsonBody({ message: "Hello, world!" });
  });
}
