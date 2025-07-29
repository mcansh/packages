import "vitest";

declare namespace matchers {
  interface CustomResponseMatchers<E, R> {
    toHaveBody(): R;
    toHaveCookies(cookies: Array<string>): R;
    toHaveHeader(header: string, expected: string | null): R;
    toHaveJsonBody(expected: object | null): R;
    toHaveStatus(expected?: number): R;
    toHaveStatusText(expected?: string): R;
    toHaveStrictStatusText(): R;
    toHaveTextBody(expected: string | null): R;
    toMatchResponse(expected: Response | ResponseInit): R;
    toThrowResponse: (expected: Response | ResponseInit) => R;
  }
}

declare module "vitest" {
  interface Assertion<T = any>
    extends matchers.CustomResponseMatchers<any, T> {}
  interface AsymmetricMatchersContaining
    extends matchers.CustomResponseMatchers<any, any> {}
}
