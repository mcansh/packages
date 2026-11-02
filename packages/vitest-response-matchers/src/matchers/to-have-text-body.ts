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

  let body = response.body === null ? null : await response.clone().text();

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

  it("toHaveTextBody matcher", async () => {
    let response = new Response("Hello, world!");
    await expect(response).toHaveTextBody("Hello, world!");
    expect(response.bodyUsed).toBe(false);
    await expect(response.text()).resolves.toBe("Hello, world!");
  });

  it("reports a non-Response", async () => {
    await expect(expect({}).toHaveTextBody("lol")).rejects.toThrow(
      "Expected a Response",
    );
  });

  it("distinguishes absent and empty bodies", async () => {
    await expect(new Response(null)).toHaveTextBody(null);
    await expect(new Response(null)).not.toHaveTextBody("");
    await expect(new Response("")).toHaveTextBody("");
    await expect(new Response("")).not.toHaveTextBody(null);
  });

  it("rejects a different text body", async () => {
    await expect(new Response("hello")).not.toHaveTextBody("goodbye");
    await expect(
      expect(new Response("hello")).toHaveTextBody("goodbye"),
    ).rejects.toThrow();
  });
}
