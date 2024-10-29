import { MockAgent, setGlobalDispatcher } from "undici";
import { expect, test } from "vitest";
import { z } from "zod";
import { Vault } from "./index.js";

let vaultAddress = "https://vault.dev.uwm.com";
let kvCredsPath = "dev/ui-mortgagematchup/kv/data/api";
let vaultSecretPath = `/v1/${kvCredsPath}`;

let mockAgent = new MockAgent();
mockAgent.disableNetConnect();
const mockClient = mockAgent.get(vaultAddress);
setGlobalDispatcher(mockAgent);

test("it throws an error when it cant reach vault", () => {
  expect(() => {
    new Vault({
      vaultAddress,
      tokenAddress: "http://localhost:3000/token",
    });
  }).toThrowErrorMatchingInlineSnapshot(
    `[VaultError: Couldn't find a vault token at http://localhost:3000/token, is the VaultAgent running?]`,
  );
});

test("it gets data from vault", async () => {
  mockClient.intercept({ path: vaultSecretPath, method: "GET" }).reply(
    200,
    JSON.stringify({
      data: { data: { gautocomplete: "some-google-api-key" } },
    }),
  );

  let vault = new Vault({
    vaultAddress,
    tokenAddress: "http://localhost:9876/token",
  });

  let secrets = await vault.getSecrets(
    kvCredsPath,
    z.object({ gautocomplete: z.string() }),
  );
  expect(secrets.gautocomplete).toBe("some-google-api-key");
});

test("allows remapping of the secrets", async () => {
  let vault = new Vault({
    vaultAddress,
    tokenAddress: "http://localhost:9876/token",
  });

  mockClient.intercept({ path: vaultSecretPath, method: "GET" }).reply(
    200,
    JSON.stringify({
      data: { data: { gautocomplete: "some-google-api-key" } },
    }),
  );

  let secrets = await vault.getSecrets(
    kvCredsPath,
    z.object({ gautocomplete: z.string() }).transform((values) => {
      return { GOOGLE_API_KEY: values.gautocomplete };
    }),
  );

  expect(secrets.GOOGLE_API_KEY).toBe("some-google-api-key");
});

test("it throws an error when the schema is invalid", async () => {
  let vault = new Vault({
    vaultAddress,
    tokenAddress: "http://localhost:9876/token",
  });

  mockClient.intercept({ path: vaultSecretPath, method: "GET" }).reply(
    200,
    JSON.stringify({
      data: { data: { gautocomplete: "some-google-api-key" } },
    }),
  );

  expect(() => {
    return vault.getSecrets(
      kvCredsPath,
      z.object({ gautocomplete: z.number() }),
    );
  }).rejects.toThrowError();
});

test("it throws an error if vault returns a 404", async () => {
  let vault = new Vault({
    vaultAddress,
    tokenAddress: "http://localhost:9876/token",
  });

  mockClient.intercept({ path: vaultSecretPath, method: "GET" }).reply(
    404,
    JSON.stringify({
      errors: ["path not found"],
    }),
  );

  expect(() => {
    return vault.getSecrets(
      kvCredsPath,
      z.object({ gautocomplete: z.string() }),
    );
  }).rejects.toThrowError();
});
