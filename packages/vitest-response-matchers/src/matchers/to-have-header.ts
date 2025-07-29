export function toHaveHeader(
  response: Response | ResponseInit,
  header: string,
  expected?: string,
) {
  let headers =
    response.headers instanceof Headers
      ? response.headers
      : new Headers(response.headers);

  if (expected == undefined) {
    return {
      pass: headers.has(header),
      message: () =>
        `Expected response header "${header}" to be absent, but it was found`,
    };
  }

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

  it("only checks for presence of header", () => {
    let response = new Response("Hello, world!", {
      headers: { "x-custom-header": "custom-value" },
    });
    expect(response).toHaveHeader("x-custom-header");
  });
}
