import { Result } from "better-result";
import { afterEach, describe, expect, it, vi } from "vitest";
import { pwnedPassword } from "./hibp.ts";
import { lookup } from "./lookup.ts";
import { HibpError } from "./types.ts";

vi.mock("./lookup.ts");

const mockLookup = vi.mocked(lookup);

afterEach(() => {
  vi.resetAllMocks();
});

describe("pwnedPassword", () => {
  it.each([0, 42])("returns Ok(%i) for a successful lookup", async (count) => {
    mockLookup.mockResolvedValue(Result.ok(count));

    await expect(pwnedPassword("password")).resolves.toEqual(Result.ok(count));
    expect(mockLookup).toHaveBeenCalledExactlyOnceWith("password", {});
  });

  it("passes a copy of caller options so lookup defaults cannot mutate them", async () => {
    const signal = new AbortController().signal;
    const fetch = vi.fn<typeof globalThis.fetch>();
    const options = Object.freeze({ signal, fetch });
    mockLookup.mockImplementation(async (_password, lookupOptions) => {
      expect(lookupOptions).toEqual(options);
      expect(lookupOptions).not.toBe(options);
      lookupOptions.timeoutMs ??= 5_000;
      return Result.ok(0);
    });

    await expect(pwnedPassword("password", options)).resolves.toEqual(
      Result.ok(0),
    );
    expect(options).toEqual({ signal, fetch });
  });

  it("forwards an explicit timeout", async () => {
    mockLookup.mockResolvedValue(Result.ok(0));

    await pwnedPassword("password", { timeoutMs: 123 });
    expect(mockLookup).toHaveBeenCalledExactlyOnceWith("password", {
      timeoutMs: 123,
    });
  });

  it.each([
    new HibpError({ reason: "invalid-input", message: "Invalid input" }),
    new HibpError({ reason: "http", message: "HTTP failure", status: 429 }),
    new HibpError({ reason: "invalid-response", message: "Invalid response" }),
  ])("preserves a lookup HibpError ($reason)", async (error) => {
    mockLookup.mockRejectedValue(error);

    const result = await pwnedPassword("password");
    expect(result.isErr()).toBe(true);
    if (result.isErr()) expect(result.error).toBe(error);
  });

  it("preserves an Err returned by lookup", async () => {
    const error = new HibpError({
      reason: "invalid-input",
      message: "Invalid timeout",
    });
    const expected = Result.err(error);
    mockLookup.mockResolvedValue(expected);

    await expect(pwnedPassword("password")).resolves.toBe(expected);
  });

  it("preserves a HibpError even when the caller signal is aborted", async () => {
    const error = new HibpError({
      reason: "invalid-input",
      message: "Invalid input",
    });
    mockLookup.mockRejectedValue(error);

    const result = await pwnedPassword("password", {
      signal: AbortSignal.abort(),
    });
    expect(result.isErr()).toBe(true);
    if (result.isErr()) expect(result.error).toBe(error);
  });

  it("classifies caller cancellation ahead of a timeout error", async () => {
    const controller = new AbortController();
    mockLookup.mockImplementation(async () => {
      controller.abort();
      throw new DOMException("sensitive transport detail", "TimeoutError");
    });

    const result = await pwnedPassword("password", {
      signal: controller.signal,
    });
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(HibpError);
      expect(result.error).toMatchObject({
        reason: "cancelled",
        message: "Password lookup cancelled",
      });
    }
  });

  it("classifies timeout errors", async () => {
    mockLookup.mockRejectedValue(
      new DOMException("sensitive transport detail", "TimeoutError"),
    );

    const result = await pwnedPassword("password");
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(HibpError);
      expect(result.error).toMatchObject({
        reason: "timeout",
        message: "Password lookup timed out",
      });
    }
  });

  it.each([
    new TypeError("sensitive transport detail"),
    new DOMException(
      "transport aborted without caller cancellation",
      "AbortError",
    ),
    "non-Error rejection",
    { name: "TimeoutError" },
    null,
  ])(
    "classifies unknown rejection %j as unavailable without exposing details",
    async (error) => {
      mockLookup.mockRejectedValue(error);

      const result = await pwnedPassword("password");
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(HibpError);
        expect(result.error).toMatchObject({
          reason: "unavailable",
          message: "Password lookup unavailable",
        });
      }
    },
  );
});
