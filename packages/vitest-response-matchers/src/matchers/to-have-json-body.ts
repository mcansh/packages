import type { Matcher } from "./matcher";

export async function toHaveJsonBody(
  this: ThisParameterType<Matcher>,
  response: Response,
  expected: unknown,
) {
  if (!(response instanceof Response)) {
    return {
      message: () => `Expected a Response, but received ${typeof response}`,
      pass: false,
    };
  }

  let body = await response.clone().json();

  return {
    message: () =>
      `Expected response to have JSON body ${this.utils.printExpected(expected)}`,
    pass: this.equals(body, expected, this.customTesters),
    actual: body,
    expected,
  };
}

if (import.meta.vitest) {
  let { expect, it } = import.meta.vitest;

  expect.extend({ toHaveJsonBody });

  it("toHaveJsonBody matcher", async () => {
    let response = Response.json({ message: "Hello, world!" });
    await expect(response).toHaveJsonBody({ message: "Hello, world!" });
  });

  it("compares nested objects independently of key order", async () => {
    let response = Response.json({ a: 1, nested: { b: 2, c: 3 } });
    await expect(response).toHaveJsonBody({ nested: { c: 3, b: 2 }, a: 1 });
    expect(response.bodyUsed).toBe(false);
    await expect(response.json()).resolves.toEqual({
      a: 1,
      nested: { b: 2, c: 3 },
    });
  });

  it.each([null, true, 42, "hello", [1, 2]])(
    "matches JSON value %j",
    async (value) => {
      await expect(Response.json(value)).toHaveJsonBody(value);
    },
  );

  it("uses Vitest asymmetric equality", async () => {
    await expect(Response.json({ count: 2 })).toHaveJsonBody({
      count: expect.any(Number),
    });
  });

  it("rejects different values and array order", async () => {
    await expect(Response.json({ count: 2 })).not.toHaveJsonBody({ count: 3 });
    await expect(Response.json([1, 2])).not.toHaveJsonBody([2, 1]);
    await expect(
      expect(Response.json({ count: 2 })).toHaveJsonBody({ count: 3 }),
    ).rejects.toThrow();
  });
}
