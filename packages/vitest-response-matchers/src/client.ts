import "vitest";

declare namespace matchers {
  interface CustomResponseMatchers<R> {
    toHaveBody(): R;
    toHaveCookies(cookies: Array<string>, options?: { strict?: boolean }): R;
    toHaveHeader(headerName: string, expected?: string): R;
    toHaveJsonBody(expected: unknown): Promise<void>;
    toHaveStatus(status?: number): R;
    toHaveStatusText(statusText?: string): R;
    toHaveStrictStatusText(): R;
    toHaveTextBody(expected: string | null): Promise<void>;
    toMatchResponse(expected: { status: number; statusText: string }): R;
    toThrowResponse(expected: Response | ResponseInit): R;
  }
}

declare module "vitest" {
  interface Assertion<T = any> extends matchers.CustomResponseMatchers<void> {}
  interface AsymmetricMatchersContaining
    extends matchers.CustomResponseMatchers<any> {}
}
