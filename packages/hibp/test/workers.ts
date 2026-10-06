import { build } from "esbuild";
import { Miniflare, Response } from "miniflare";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const { outputFiles } = await build({
  entryPoints: [fileURLToPath(new URL("./worker.ts", import.meta.url))],
  bundle: true,
  format: "esm",
  platform: "browser",
  write: false,
});
assert(outputFiles[0], "worker bundle emitted");

const requests: string[] = [];
const worker = new Miniflare({
  modules: true,
  script: outputFiles[0].text,
  compatibilityDate: "2025-10-01",
  cf: false,
  // Intercept all outbound traffic: no HIBP calls or followed redirects.
  outboundService(request) {
    requests.push(request.url);
    assert.equal(request.method, "GET");
    assert.equal(request.headers.get("Add-Padding"), "true");
    assert.equal(request.headers.get("Authorization"), null);
    assert.equal(request.headers.get("Cookie"), null);
    assert.equal(request.body, null);
    if (request.url === "https://api.pwnedpasswords.com/range/80452") {
      return new Response("C69099DAA225E4B202EBCDA64C59F54FCC9:42");
    }
    assert.equal(request.url, "https://api.pwnedpasswords.com/range/A9993");
    return new Response(null, {
      status: 302,
      headers: { Location: "https://redirect.invalid/" },
    });
  },
});
try {
  const response = await worker.dispatchFetch("http://localhost/");
  const body = await response.text();
  assert.equal(response.status, 200, body);
  assert.deepEqual(requests, [
    "https://api.pwnedpasswords.com/range/80452",
    "https://api.pwnedpasswords.com/range/A9993",
  ]);
  console.log(body);
} finally {
  await worker.dispose();
}
