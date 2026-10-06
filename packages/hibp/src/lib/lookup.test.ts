import { afterEach, describe, expect, it, vi } from "vitest";
import { lookup } from "./lookup.ts";
import { assertErr, assertOk, HibpError } from "./types.ts";

// Known SHA-1 of "h3770_w0rld", independent of the hashing implementation.
const password = "h3770_w0rld";
const suffix = "C69099DAA225E4B202EBCDA64C59F54FCC9";
const otherSuffix = "0".repeat(35);

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("lookup", () => {
  it("sends only the hash prefix with padding and privacy options", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValue(new Response(`${suffix}:42`));

    const result = await lookup(password, { fetch });
    assertOk(result);
    expect(result.value).toBe(42);
    expect(fetch).toHaveBeenCalledExactlyOnceWith(
      "https://api.pwnedpasswords.com/range/80452",
      {
        headers: { "Add-Padding": "true" },
        signal: expect.any(AbortSignal),
        redirect: "manual",
        credentials: "omit",
      },
    );
  });

  it("uses global fetch and a five-second timeout by default", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValue(new Response(`${suffix}:1`));
    vi.stubGlobal("fetch", fetch);
    const timeout = vi.spyOn(AbortSignal, "timeout");

    const result = await lookup(password, {});
    assertOk(result);
    expect(result.value).toBe(1);
    expect(fetch).toHaveBeenCalledOnce();
    expect(timeout).toHaveBeenCalledExactlyOnceWith(5_000);
  });

  it("uses a custom timeout", async () => {
    const timeout = vi.spyOn(AbortSignal, "timeout");
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValue(new Response(`${suffix}:1`));

    const result = await lookup(password, { fetch, timeoutMs: 123 });
    assertOk(result);
    expect(result.value).toBe(1);
    expect(timeout).toHaveBeenCalledExactlyOnceWith(123);
  });

  it.each([
    [`${otherSuffix}:12`, 0],
    [`${suffix}:0`, 0],
    [`${otherSuffix}:0\n${suffix}:42`, 42],
    [`\r\n${suffix.toLowerCase()}:42\r\n${otherSuffix}:0\r\n`, 42],
    [`${suffix}:2\n${suffix}:42\n${suffix}:3`, 42],
    [`${suffix}:${Number.MAX_SAFE_INTEGER}`, Number.MAX_SAFE_INTEGER],
  ])("parses response %j as %i", async (body, count) => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValue(new Response(body));

    const result = await lookup(password, { fetch });
    assertOk(result);
    expect(result.value).toBe(count);
  });

  it.each([[null], [undefined], [123], [{}], [[]]])(
    "rejects non-string password %j before fetching",
    async (input) => {
      const fetch = vi.fn<typeof globalThis.fetch>();

      await expect(
        lookup(input as unknown as string, { fetch }),
      ).rejects.toMatchObject({
        _tag: "HibpError",
        reason: "invalid-input",
        message: "Password must be a string",
      });

      expect(fetch).not.toHaveBeenCalled();
    },
  );

  it.each([0, -1, 1.5, NaN, Infinity, 2_147_483_648])(
    "rejects invalid timeout %s before fetching",
    async (timeoutMs) => {
      const fetch = vi.fn<typeof globalThis.fetch>();

      const result = await lookup(password, { fetch, timeoutMs });
      assertErr(result);
      expect(result.error).toBeInstanceOf(HibpError);
      expect(result.error).toMatchObject({
        _tag: "HibpError",
        reason: "invalid-input",
        message: "timeoutMs must be an integer between 1 and 2147483647",
      });
      expect(fetch).not.toHaveBeenCalled();
    },
  );

  it.each([201, 302, 429, 500])(
    "rejects HTTP %i without reading the body",
    async (status) => {
      const response = new Response(`${suffix}:42`, { status });
      const text = vi.spyOn(response, "text");
      const fetch = vi
        .fn<typeof globalThis.fetch>()
        .mockResolvedValue(response);

      await expect(lookup(password, { fetch })).rejects.toMatchObject({
        _tag: "HibpError",
        reason: "http",
        status,
        message: `Pwned Passwords lookup failed (HTTP ${status})`,
      });
      expect(text).not.toHaveBeenCalled();
    },
  );

  it.each([
    "",
    "not a range response",
    `${"G".repeat(35)}:1`,
    `${suffix.slice(1)}:1`,
    `${suffix}0:1`,
    `${suffix}:-1`,
    `${suffix}:1.5`,
    `${suffix}:`,
    `${suffix}:${Number.MAX_SAFE_INTEGER + 1}`,
    `${suffix}:42\n${otherSuffix}:invalid`,
    `${suffix}:42\n\n${otherSuffix}:0`,
  ])(
    "rejects malformed response %j, including rows after a match",
    async (body) => {
      const fetch = vi
        .fn<typeof globalThis.fetch>()
        .mockResolvedValue(new Response(body));

      const result = lookup(password, { fetch });
      await expect(result).rejects.toBeInstanceOf(HibpError);
      await expect(result).rejects.toMatchObject({
        reason: "invalid-response",
      });
    },
  );

  it("rejects an already-aborted signal before fetching", async () => {
    const reason = new Error("cancelled");
    const fetch = vi.fn<typeof globalThis.fetch>();

    await expect(
      lookup(password, { fetch, signal: AbortSignal.abort(reason) }),
    ).rejects.toBe(reason);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("passes caller cancellation to the request signal", async () => {
    const controller = new AbortController();
    const reason = new Error("cancelled during request");
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockImplementation(async (_url, init) => {
        controller.abort(reason);
        init?.signal?.throwIfAborted();
        return new Response(`${suffix}:42`);
      });

    await expect(
      lookup(password, { fetch, signal: controller.signal }),
    ).rejects.toBe(reason);
  });

  it("checks cancellation after reading the response body", async () => {
    const controller = new AbortController();
    const reason = new Error("cancelled during body read");
    const response = new Response();
    vi.spyOn(response, "text").mockImplementation(async () => {
      controller.abort(reason);
      return `${suffix}:42`;
    });
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(response);

    const result = await lookup(password, { fetch, signal: controller.signal });
    assertErr(result);
    expect(result.error).toBeInstanceOf(HibpError);
    expect(result.error).toMatchObject({
      reason: "aborted",
      message: "Pwned Passwords lookup aborted",
    });
  });

  it("enforces the timeout through the response body read", async () => {
    const controller = new AbortController();
    const reason = new DOMException("timed out", "TimeoutError");
    vi.spyOn(AbortSignal, "timeout").mockReturnValue(controller.signal);
    const response = new Response();
    vi.spyOn(response, "text").mockImplementation(async () => {
      controller.abort(reason);
      return `${suffix}:42`;
    });
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(response);

    const result = await lookup(password, {
      fetch,
      signal: new AbortController().signal,
    });
    assertErr(result);
    expect(result.error).toBeInstanceOf(HibpError);
    expect(result.error).toMatchObject({
      reason: "aborted",
      message: "Pwned Passwords lookup aborted",
    });
  });

  it("propagates transport failures", async () => {
    const reason = new TypeError("network unavailable");
    const fetch = vi.fn<typeof globalThis.fetch>().mockRejectedValue(reason);

    await expect(lookup(password, { fetch })).rejects.toBe(reason);
  });

  it("propagates response body failures", async () => {
    const reason = new Error("body read failed");
    const response = new Response();
    vi.spyOn(response, "text").mockRejectedValue(reason);
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(response);

    await expect(lookup(password, { fetch })).rejects.toBe(reason);
  });
});
