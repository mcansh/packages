import "vitest";

declare namespace matchers {
  interface CustomResponseMatchers<E, R> {
    toMatchResponse: (expected: Response) => R;
    toHaveStatus: (expected?: number) => R;
    toHaveStatusText: (expected?: string) => R;
    toHaveStrictStatusText: () => R;
    toThrowResponse: (expected: Response | ResponseInit) => R;
  }
}

declare module "vitest" {
  interface Assertion<T = any>
    extends matchers.CustomResponseMatchers<any, T> {}
  interface AsymmetricMatchersContaining
    extends matchers.CustomResponseMatchers<any, any> {}
}
