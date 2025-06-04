import { MockAgent, setGlobalDispatcher } from "undici";
import { beforeEach, expect, test } from "vitest";
import { z } from "zod";
import { Vault } from "./vault";

let vaultAddress = "https://vault.com" as const;
let kvCredsPath = "dev/some-service/kv/data/api" as const;
let vaultSecretPath = `/v1/${kvCredsPath}` as const;
let vaultSecretsUrl = new URL(vaultSecretPath, vaultAddress).href;

let tokenAddress = "http://localhost:9876" as const;
let tokenPath = "/token" as const;
let mockedToken = "abc123" as const;

let mockAgent = new MockAgent();
mockAgent.disableNetConnect();

// create a mock client for the vault and token
let mockVaultClient = mockAgent.get(vaultAddress);
let mockTokenClient = mockAgent.get(tokenAddress);
setGlobalDispatcher(mockAgent);

beforeEach(() => {
  mockTokenClient
    .intercept({ path: tokenPath, method: "GET" })
    .reply(200, mockedToken);
});

test("it throws an error when it cant reach vault", () => {
  let invalidTokenAddress = new URL("token", "https://invalid-vault.com").href;

  expect(() => {
    return new Vault({
      vaultAddress,
      tokenAddress: invalidTokenAddress,
    });
  }).toThrowErrorMatchingInlineSnapshot(
    `[VaultError: Couldn't find a vault token at ${invalidTokenAddress}, is the VaultAgent running?]`,
  );
});

test("it gets data from vault", async () => {
  mockVaultClient.intercept({ path: vaultSecretPath, method: "GET" }).reply(
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

  let secrets = await vault.getSecrets({
    path: kvCredsPath,
    schema: z.object({ gautocomplete: z.string() }),
  });
  expect(secrets.gautocomplete).toBe("some-google-api-key");
});

test("allows remapping of the secrets", async () => {
  mockVaultClient.intercept({ path: vaultSecretPath, method: "GET" }).reply(
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

  let secrets = await vault.getSecrets({
    path: kvCredsPath,
    schema: z.object({ gautocomplete: z.string() }).transform((values) => {
      return { GOOGLE_API_KEY: values.gautocomplete };
    }),
  });

  expect(secrets.GOOGLE_API_KEY).toBe("some-google-api-key");
});

test("it throws an error when the schema is invalid", async () => {
  mockVaultClient.intercept({ path: vaultSecretPath, method: "GET" }).reply(
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

  expect(() => {
    return vault.getSecrets({
      path: kvCredsPath,
      schema: z.object({ gautocomplete: z.number() }),
    });
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
    mockVaultClient
      .intercept({ path: vaultSecretPath, method: "GET" })
      .reply(statusCode, JSON.stringify({}), {
        headers: { "Content-Type": "application/json" },
      });

    expect(() =>
      vault.getSecrets({ path: kvCredsPath, schema: z.object({}) }),
    ).rejects.toThrowError(errorRegex);
  }
});
