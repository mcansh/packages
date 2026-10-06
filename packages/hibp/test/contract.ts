import type { Err, Result } from "better-result";
import { HibpError, pwnedPassword } from "../dist/index.js";

export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function ok(result: Result<number, HibpError>, count: number) {
  assert(result.isOk(), "expected Ok");
  assert(result.value === count, `expected count ${count}`);
}

function err(
  result: Result<number, HibpError>,
  reason: HibpError["reason"],
): asserts result is Err<number, HibpError> {
  assert(result.isErr(), "expected Err");
  assert(HibpError.is(result.error), "expected HibpError");
  assert(result.error.reason === reason, `expected reason ${reason}`);
}

const password = "h3770_w0rld";
const suffix = "C69099DAA225E4B202EBCDA64C59F54FCC9";
const other = "0".repeat(35);
const response =
  (body: string, status = 200): typeof globalThis.fetch =>
  async () =>
    new Response(body, { status });

// Keep the event loop alive in Node (AbortSignal.timeout uses an unref'ed timer),
// and fail promptly if a runtime never delivers the abort event.
function waitForAbort(signal: AbortSignal) {
  return new Promise<never>((_resolve, reject) => {
    const guard = setTimeout(
      () => reject(new Error("abort was not delivered")),
      1_000,
    );
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(guard);
        reject(signal.reason);
      },
      { once: true },
    );
    if (signal.aborted) {
      clearTimeout(guard);
      reject(signal.reason);
    }
  });
}

export async function runContract() {
  const tests: [string, () => Promise<void>][] = [];
  const test = (name: string, run: () => Promise<void>) =>
    tests.push([name, run]);

  const vectors: [string, string][] = [
    ["", "DA39A3EE5E6B4B0D3255BFEF95601890AFD80709"],
    ["abc", "A9993E364706816ABA3E25717850C26C9CD0D89D"],
    [password, `80452${suffix}`],
    [
      "abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq",
      "84983E441C3BD26EBAAE4AA1F95129E5E54670F1",
    ],
    ["pässwörd", "F517DDF1D32A112FF1AD55C66D1B12CB38E7E8F7"],
    ["🔐", "0E524B4DA8A9E64C1380ACAAAF3CB03FAC830CDB"],
    ["é", "BF15BE717AC1B080B4F1C456692825891FF5073D"],
    ["e\u0301", "7E3FBCF1B6A69221CD8EEF7442EF3B51A253BB49"],
    [" password ", "E6EE5DBAB4167ECE69097D192D7EE8B3B5AA5292"],
    ["pass\0word", "726CCDBD77CC9BB88DB6CC320E5326531304E721"],
  ];
  for (const [input, hash] of vectors) {
    test(`SHA-1 ${JSON.stringify(input)}`, async () => {
      let calls = 0;
      ok(
        await pwnedPassword(input, {
          fetch: async (url, init) => {
            calls++;
            assert(init, "request options provided");
            assert(
              url ===
                `https://api.pwnedpasswords.com/range/${hash.slice(0, 5)}`,
              "prefix-only URL",
            );
            assert(
              new Headers(init.headers).get("Add-Padding") === "true",
              "padding enabled",
            );
            assert(init.redirect === "manual", "redirects disabled");
            assert(init.credentials === "omit", "credentials omitted");
            assert(init.body === undefined, "no password in request body");
            assert(
              init.signal instanceof AbortSignal,
              "request has abort signal",
            );
            return new Response(`${hash.slice(5)}:42`);
          },
        }),
        42,
      );
      assert(calls === 1, "one request, no retries");
    });
  }

  const responses: [string, number][] = [
    [`${other}:12`, 0],
    [`${suffix}:0`, 0],
    [`\r\n${suffix.toLowerCase()}:42\r\n${other}:0\r\n`, 42],
    [`${suffix}:2\n${suffix}:42\n${suffix}:3`, 42],
    [`${suffix}:${Number.MAX_SAFE_INTEGER}`, Number.MAX_SAFE_INTEGER],
  ];
  for (const [body, count] of responses) {
    test(`parse ${JSON.stringify(body)}`, async () => {
      ok(await pwnedPassword(password, { fetch: response(body) }), count);
    });
  }

  for (const body of [
    "",
    `${suffix}:42\ninvalid`,
    `${suffix}:9007199254740992`,
  ]) {
    test(`invalid response ${JSON.stringify(body)}`, async () => {
      err(
        await pwnedPassword(password, { fetch: response(body) }),
        "invalid-response",
      );
    });
  }

  for (const status of [302, 429, 500]) {
    test(`HTTP ${status}`, async () => {
      const result = await pwnedPassword(password, {
        fetch: response("", status),
      });
      err(result, "http");
      assert(result.error.status === status, "HTTP status preserved");
    });
  }

  test("invalid input does not fetch", async () => {
    const fetch = () => {
      throw new Error("unexpected request");
    };
    // @ts-expect-error Exercise invalid input from JavaScript consumers.
    err(await pwnedPassword(null, { fetch }), "invalid-input");
    err(
      await pwnedPassword(password, { fetch, timeoutMs: 0 }),
      "invalid-input",
    );
  });
  test("transport errors are sanitized", async () => {
    const result = await pwnedPassword(password, {
      fetch: () => {
        throw new Error("sensitive transport detail");
      },
    });
    err(result, "unavailable");
    assert(
      !JSON.stringify(result.error).includes("sensitive"),
      "transport detail not exposed",
    );
  });
  test("body read failure", async () => {
    err(
      await pwnedPassword(password, {
        fetch: async () =>
          new Response(
            new ReadableStream({
              start(controller) {
                controller.error(new Error("body failed"));
              },
            }),
          ),
      }),
      "unavailable",
    );
  });
  test("already cancelled", async () => {
    let calls = 0;
    err(
      await pwnedPassword(password, {
        signal: AbortSignal.abort(),
        fetch: () => {
          calls++;
          throw new Error("unexpected request");
        },
      }),
      "cancelled",
    );
    assert(calls === 0, "cancelled lookup does not fetch");
  });
  test("cancellation reaches request", async () => {
    const controller = new AbortController();
    err(
      await pwnedPassword(password, {
        signal: controller.signal,
        fetch: async (_url, init) => {
          assert(init?.signal, "combined signal provided");
          controller.abort();
          init.signal.throwIfAborted();
          return new Response();
        },
      }),
      "cancelled",
    );
  });
  test("request timeout", async () => {
    err(
      await pwnedPassword(password, {
        timeoutMs: 10,
        fetch: (_url, init) => {
          assert(init?.signal, "timeout signal provided");
          return waitForAbort(init.signal);
        },
      }),
      "timeout",
    );
  });
  test("timeout covers body consumption and combined signals", async () => {
    err(
      await pwnedPassword(password, {
        signal: new AbortController().signal,
        timeoutMs: 10,
        fetch: async (_url, init) => {
          assert(init?.signal, "combined timeout signal provided");
          const signal = init.signal;
          return new Response(
            new ReadableStream({
              start(controller) {
                waitForAbort(signal).catch((error) => controller.error(error));
              },
            }),
          );
        },
      }),
      "timeout",
    );
  });
  test("default global transport", async () => {
    globalThis.fetch = response(`${suffix}:42`);
    ok(await pwnedPassword(password), 42);
  });

  const nativeFetch = globalThis.fetch;
  // Never allow an accidental external request from the shared contract.
  globalThis.fetch = () => {
    throw new Error("unexpected external request");
  };
  try {
    for (const [name, run] of tests) {
      try {
        await run();
      } catch (error) {
        throw new Error(`Contract failed: ${name}`, { cause: error });
      }
    }
    return tests.length;
  } finally {
    globalThis.fetch = nativeFetch;
  }
}
