import "vitest";

declare namespace matchers {
  interface CustomResponseMatchers<E, R> {
    toHaveBody(): R;
    toHaveCookies(cookies: Array<string>, options?: { strict?: boolean }): R;
    toHaveHeader(headerName: string, headerValue?: string): R;
    toHaveStatus(status?: number, statusText?: string): R;
    toHaveStatusText(statusText?: string): R;
    toHaveStrictStatusText(): R;
    toMatchResponse(expected: ResponseInit): R;
    toHaveJsonBody(expected: object | null): Promise<R>;
    toHaveTextBody(expected: string | null): Promise<R>;
    toThrowResponse(expected: Response | ResponseInit): Promise<R>;
  }
}

declare module "vitest" {
  interface Assertion<T = any>
    extends matchers.CustomResponseMatchers<any, T> {}
  interface AsymmetricMatchersContaining
    extends matchers.CustomResponseMatchers<any, any> {}
}
