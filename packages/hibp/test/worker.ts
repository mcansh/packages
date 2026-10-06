import { pwnedPassword } from "../dist/index.js";
import { assert, runContract } from "./contract.ts";

export default {
  async fetch() {
    const count = await runContract();
    const result = await pwnedPassword("h3770_w0rld");
    assert(result.isOk() && result.value === 42, "native fetch returns count");
    const redirect = await pwnedPassword("abc");
    assert(
      redirect.isErr() &&
        redirect.error.reason === "http" &&
        redirect.error.status === 302,
      "native fetch rejects redirect",
    );
    return new Response(`HIBP Workers contract: ${count + 2} checks passed`);
  },
};
