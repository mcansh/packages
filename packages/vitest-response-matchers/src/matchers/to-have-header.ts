export function toHaveHeader(
  response: Response | ResponseInit,
  header: string,
  expected: string | null,
) {
  let headers =
    response.headers instanceof Headers
      ? response.headers
      : new Headers(response.headers);

  let actual = headers.get(header);

  return {
    message: () =>
      `Expected response header "${header}" to be "${expected}", but got "${actual}"`,
    pass: actual === expected,
  };
}

if (import.meta.vitest) {
  let { expect, it } = import.meta.vitest;

  expect.extend({ toHaveHeader });

  it("toHaveHeader matcher", () => {
    let response = new Response("Hello, world!", {
      headers: { "x-custom-header": "custom-value" },
    });
    expect(response).toHaveHeader("x-custom-header", "custom-value");
  });

  it.fails("toHaveHeader matcher - negative case", () => {
    let response = new Response("Hello, world!", {
      headers: { "x-custom-header": "custom-value" },
    });
    expect(response).toHaveHeader("x-custom-header", "wrong-value");
  });
}
