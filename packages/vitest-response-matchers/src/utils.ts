import type { ExpectStatic } from "vitest";

export interface MatcherResult {
  pass: boolean;
  message(): string;
  actual?: unknown;
  expected?: unknown;
}

export type ExpectationResult = MatcherResult | Promise<MatcherResult>;

export interface MatcherFn<T extends MatcherState = MatcherState> {
  (this: T, received: any, expected: any, options?: any): ExpectationResult;
}

export type MatcherState = ReturnType<ExpectStatic["getState"]>;

export type InferredMatcher<T extends MatcherFn, R> = (
  ...args: T extends (first: any, ...rest: infer P) => any ? P : never
) => R;

export function isResponse(response: unknown): response is Response {
  return response instanceof Response;
}

export function expectedResponseError(response: unknown): MatcherResult {
  return {
    message: () => `Expected a Response, but received ${typeof response}`,
    pass: false,
    actual: response,
  };
}

if (import.meta.vitest) {
  let { expect, it } = import.meta.vitest;

  it("should ensure response is a Response", () => {
    let result = isResponse(new Response());
    expect(result).toBe(true);
  });

  it("should fail when not a Response", () => {
    let result = expectedResponseError({ status: 200, statusText: "OK" });
    expect(result).toEqual({
      message: expect.any(Function),
      pass: false,
      actual: { status: 200, statusText: "OK" },
    });
  });
}
