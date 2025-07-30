import "vitest";

declare namespace matchers {
  interface CustomResponseMatchers<E, R> {
    toHaveBody(): R;
    toHaveCookies(cookies: Array<string>, options?: { strict?: boolean }): R;
    toHaveHeader(headerName: string, expected?: string): R
    toHaveJsonBody(expected: object | null): R;
    toHaveStatus(status?: number): R;
    toHaveStatusText(statusText?: string): R;
    toHaveStrictStatusText(): R;
    toHaveTextBody(expected: string | null): R;
    toMatchResponse(expected: { status: number; statusText: string }): R;
    toThrowResponse(expected: Response | ResponseInit): R;
  }
}

declare module "vitest" {
  interface Assertion<T = any>
    extends matchers.CustomResponseMatchers<any, T> {}
  interface AsymmetricMatchersContaining
    extends matchers.CustomResponseMatchers<any, any> {}
}
