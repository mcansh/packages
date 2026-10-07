import { expect, expectTypeOf } from "vitest";
import "../dist/client";

let response = new Response();
expectTypeOf(expect(response).toHaveStatus(200)).toEqualTypeOf<void>();
expectTypeOf(expect(response).toHaveJsonBody({ count: 2 })).toEqualTypeOf<
  Promise<void>
>();
expectTypeOf(expect(response).toHaveJsonBody(42)).toEqualTypeOf<
  Promise<void>
>();
expectTypeOf(expect(response).toHaveJsonBody(null)).toEqualTypeOf<
  Promise<void>
>();
expectTypeOf(expect(response).toHaveTextBody(null)).toEqualTypeOf<
  Promise<void>
>();
expectTypeOf(expect(response).not.toHaveTextBody("")).toEqualTypeOf<
  Promise<void>
>();

// @ts-expect-error Status codes must be numbers.
expect(response).toHaveStatus("200");
