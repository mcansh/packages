import { expect, test } from "vitest";
import { z } from "zod";
import { Vault } from "./index.js";

test("it throws an error when it cant reach vault", () => {
  expect(() => {
    new Vault({
      kvCredsPath: "dev/ui-mortgagematchup/kv/data/api",
      vaultAddress: "https://vault.dev.uwm.com",
      tokenAddress: "http://localhost:3000/token",
    });
  }).toThrowErrorMatchingInlineSnapshot(
    `[VaultError: Couldn't find a vault token at http://localhost:3000/token, is the VaultAgent running?]`,
  );
});

test("it gets data from vault", async () => {
  let vault = new Vault({
    kvCredsPath: "dev/ui-mortgagematchup/kv/data/api",
    vaultAddress: "https://vault.dev.uwm.com",
    tokenAddress: "http://localhost:9876/token",
  });

  let secrets = await vault.getSecrets(z.object({ gautocomplete: z.string() }));
  expect(secrets.gautocomplete).toBeDefined();
});

test("allows remapping of the secrets", async () => {
  let vault = new Vault({
    kvCredsPath: "dev/ui-mortgagematchup/kv/data/api",
    vaultAddress: "https://vault.dev.uwm.com",
    tokenAddress: "http://localhost:9876/token",
  });

  let secrets = await vault.getSecrets(
    z.object({ gautocomplete: z.string() }).transform((values) => {
      return { GOOGLE_API_KEY: values.gautocomplete };
    }),
  );

  expect(secrets.GOOGLE_API_KEY).toBeDefined();
});

test("it throws an error when the schema is invalid", async () => {
  let vault = new Vault({
    kvCredsPath: "dev/ui-mortgagematchup/kv/data/api",
    vaultAddress: "https://vault.dev.uwm.com",
    tokenAddress: "http://localhost:9876/token",
  });

  expect(() => {
    return vault.getSecrets(z.object({ gautocomplete: z.number() }));
  }).rejects.toThrowError();
});
