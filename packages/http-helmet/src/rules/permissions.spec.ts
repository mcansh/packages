import { expect, it } from "vitest";
import { createPermissionsPolicy } from "./permissions.ts";

it("handles a single value", () => {
  expect(createPermissionsPolicy({ battery: ["self"] })).toBe("battery=(self)");
});

it("handles multiple values", () => {
  expect(
    createPermissionsPolicy({ battery: ["self", "https://example.com"] }),
  ).toBe('battery=(self "https://example.com")');
});

it("handles wildcard value", () => {
  expect(createPermissionsPolicy({ battery: ["*"] })).toBe("battery=*");
});

it("throws an error when permissions are not strings", () => {
  expect(() =>
    createPermissionsPolicy({
      // @ts-expect-error - testing errors
      accelerometer: [1],
    }),
  ).toThrowError(
    '[createPermissionsPolicy]: The value of "accelerometer" contains a non-string, which is not supported.',
  );
});

it("throws when quoted self", () => {
  expect(() =>
    createPermissionsPolicy({
      payment: ["'self'"],
    }),
  ).toThrowError(
    `[createPermissionsPolicy]: self must not be quoted for "payment".`,
  );
});

it("throws when using wildcard and specific value", () => {
  expect(() =>
    createPermissionsPolicy({
      gyroscope: ["*", "self"],
    }),
  ).toThrowError(
    `[createPermissionsPolicy]: The value of the "gyroscope" feature cannot contain * and other values.`,
  );
});

it("throws when a permission contains duplicates", () => {
  expect(() =>
    createPermissionsPolicy({
      battery: ["test", "test"],
    }),
  ).toThrowError(
    `[createPermissionsPolicy]: The value of "battery" contains duplicates, which it shouldn't.`,
  );
});

it("throws when a permission is not an array", () => {
  expect(() =>
    createPermissionsPolicy({
      // @ts-expect-error - testing errors
      battery: "test",
    }),
  ).toThrowError(
    `[createPermissionsPolicy]: The value of the "battery" feature must be array of strings.`,
  );
});
