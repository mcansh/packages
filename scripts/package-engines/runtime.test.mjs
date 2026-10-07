import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { readFile, rm, access } from "node:fs/promises"
import { createRequire } from "node:module"
import { test } from "node:test"
const require = createRequire(import.meta.url)
const consumer = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8"),
)

console.log(`Testing packed libraries on ${process.version}`)

test("url: public exports, URL templates, builder and validation", async () => {
  const { url, urlString, UrlBuilder } = await import("@mcansh/url")
  assert.equal(
    urlString`https://example.com/path?q=${"hello world"}&missing=${undefined}`,
    "https://example.com/path?q=hello+world",
  )
  assert.ok(url`https://example.com` instanceof URL)
  assert.throws(() => urlString`invalid`, TypeError)
  assert.equal(
    new UrlBuilder()
      .protocol("https")
      .domain("example.com")
      .path("docs")
      .param("page", 2).href,
    "https://example.com/docs?page=2",
  )
})

test(
  "create-temporary-files: nested writes, async disposal and error cleanup",
  {
    skip: !Object.hasOwn(
      consumer.dependencies,
      "@mcansh/create-temporary-files",
    ),
  },
  async () => {
    const { createTemporaryFiles } =
      await import("@mcansh/create-temporary-files")
    const tmp = await createTemporaryFiles({
      filePath: "nested/file.txt",
      contents: "hello",
    })
    try {
      assert.equal(await readFile(tmp.files[0], "utf8"), "hello")
      assert.ok(
        Symbol.asyncDispose,
        "This runtime must provide Symbol.asyncDispose",
      )
      await tmp[Symbol.asyncDispose]()
      await assert.rejects(access(tmp.directory))
    } finally {
      await rm(tmp.directory, { recursive: true, force: true })
    }
    await assert.rejects(
      createTemporaryFiles({
        filePath: ".",
        contents: "cannot write to a directory",
      }),
    )
  },
)

async function checkHelmet(helmet) {
  assert.throws(() => require.resolve("change-case"), {
    code: "MODULE_NOT_FOUND",
  })
  assert.equal(
    helmet.createContentSecurityPolicy({ defaultSrc: [helmet.SELF] }),
    "default-src 'self'",
  )
  assert.equal(
    helmet.createPermissionsPolicy({ camera: ["self"] }),
    "camera=(self)",
  )
  assert.equal(
    helmet.createStrictTransportSecurity({ maxAge: 60 }),
    "max-age=60",
  )
  const headers = helmet.createSecureHeaders({
    "Content-Security-Policy": { defaultSrc: [helmet.SELF] },
    "X-Content-Type-Options": "nosniff",
  })
  assert.equal(headers.get("X-Content-Type-Options"), "nosniff")
  assert.equal(
    helmet.mergeHeaders(headers, { "X-Test": "value" }).get("X-Test"),
    "value",
  )
  const nonce = helmet.createNonce()
  assert.ok(
    Buffer.from(nonce, "base64")
      .toString()
      .match(/^[a-f0-9-]{36}$/),
  )
}

test("http-helmet: ESM public exports and header generation", async () =>
  checkHelmet(await import("@mcansh/http-helmet")))
test("http-helmet: CommonJS public exports and header generation", async () =>
  checkHelmet(require("@mcansh/http-helmet")))

test("http-helmet/react: both entry formats render the nonce context with React 18", async () => {
  const React = require("react")
  const { renderToStaticMarkup } = require("react-dom/server")
  for (const api of [
    await import("@mcansh/http-helmet/react"),
    require("@mcansh/http-helmet/react"),
  ]) {
    function Child() {
      return React.createElement("span", null, api.useNonce())
    }
    assert.equal(
      renderToStaticMarkup(
        React.createElement(
          api.NonceProvider,
          { nonce: "test-nonce" },
          React.createElement(Child),
        ),
      ),
      "<span>test-nonce</span>",
    )
  }
})

test("vitest-response-matchers: every standalone matcher", async () => {
  const m = await import("@mcansh/vitest-response-matchers/matchers")
  assert.equal(m.toHaveBody(new Response("body")).pass, true)
  assert.equal(
    m.toHaveStatus(new Response(null, { status: 201 }), 201).pass,
    true,
  )
  assert.equal(
    m.toHaveStatusText(new Response(null, { statusText: "OK" }), "OK").pass,
    true,
  )
  assert.equal(
    m.toHaveStrictStatusText(
      new Response(null, { status: 200, statusText: "OK" }),
    ).pass,
    true,
  )
  assert.equal(
    m.toHaveHeader({ headers: { "X-Test": "yes" } }, "X-Test", "yes").pass,
    true,
  )
  assert.equal(
    m.toHaveCookies({ headers: { "Set-Cookie": "session=abc; Path=/" } }, [
      "session=abc; Path=/",
    ]).pass,
    true,
  )
  assert.equal(
    (await m.toHaveTextBody(new Response("hello"), "hello")).pass,
    true,
  )
  assert.equal(
    (await m.toHaveJsonBody(Response.json({ ok: true }), { ok: true })).pass,
    true,
  )
  assert.equal(
    m.toMatchResponse(new Response(null, { status: 200, statusText: "OK" }), {
      status: 200,
      statusText: "OK",
    }).pass,
    true,
  )
  assert.equal(
    m.toThrowResponse(
      () => {
        throw new Response(null, { status: 404 })
      },
      { status: 404 },
    ).pass,
    true,
  )
})
