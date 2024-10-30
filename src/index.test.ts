import { MockAgent, setGlobalDispatcher } from "undici";
import { expect, test } from "vitest";
import { z } from "zod";
import { Vault } from "./index.js";

let vaultAddress = "https://vault.com";
let kvCredsPath = "dev/some-service/kv/data/api";
let vaultSecretPath = `/v1/${kvCredsPath}`;
let vaultSecretsUrl = new URL(vaultSecretPath, vaultAddress).href;

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
    { headers: { "Content-Type": "application/json" } },
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
    { headers: { "Content-Type": "application/json" } },
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
    { headers: { "Content-Type": "application/json" } },
  );

  expect(() => {
    return vault.getSecrets(
      kvCredsPath,
      z.object({ gautocomplete: z.number() }),
    );
  }).rejects.toThrowErrorMatchingInlineSnapshot(`
    [ZodError: [
      {
        "code": "invalid_type",
        "expected": "number",
        "received": "string",
        "path": [
          "gautocomplete"
        ],
        "message": "Expected number, received string"
      }
    ]]
  `);
});

test("it throws an error if vault returns a non 200 status code", async () => {
  let vault = new Vault({
    vaultAddress,
    tokenAddress: "http://localhost:9876/token",
  });

  let errorRegex = new RegExp(`failed to fetch ${vaultSecretsUrl}`, "i");

  for (let statusCode of [404, 500]) {
    mockClient
      .intercept({ path: vaultSecretPath, method: "GET" })
      .reply(statusCode, JSON.stringify({}), {
        headers: { "Content-Type": "application/json" },
      });

    expect(() =>
      vault.getSecrets(kvCredsPath, z.object({})),
    ).rejects.toThrowError(errorRegex);
  }
});
