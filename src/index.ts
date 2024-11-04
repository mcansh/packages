import * as cp from "node:child_process";
import type { z } from "zod";

type VaultOptions = {
  vaultAddress: string;
  tokenAddress: string;
};

export class Vault {
  private client: {
    read(path: string): Promise<any>;
  };

  constructor({ vaultAddress, tokenAddress }: VaultOptions) {
    try {
      // using fetch was 404ing
      // so using curl and `--write-out` to append the status code to the response
      // then we can split the response at the `-` and check if the status code is 200
      let result = cp.execSync(
        `curl --silent --write-out " - %{http_code}" ${tokenAddress}`,
        { encoding: "utf-8", stdio: "pipe" },
      );

      let [rawToken, statusCode] = result.split(" - ");
      let token = rawToken?.trim();

      if (statusCode !== "200" || !token) {
        throw new VaultError(tokenAddress);
      }

      this.client = {
        async read(path: string) {
          let url = new URL(`/v1/${path}`, vaultAddress).href;
          let response = await fetch(url, {
            headers: { "X-Vault-Token": token },
          });

          if (!response.ok) {
            throw new VaultError(`Failed to fetch ${url}`);
          }

          return response.json();
        },
      };
    } catch (error) {
      throw new VaultError(
        `Couldn't find a vault token at ${tokenAddress}, is the VaultAgent running?`,
      );
    }
  }

  async getSecrets<Schema extends z.ZodTypeAny>({
    path,
    schema,
  }: {
    path: string;
    schema: Schema;
  }): Promise<z.infer<Schema>> {
    let secrets = await this.client.read(path);
    let validatedSecrets = schema.parse(secrets.data.data);
    return validatedSecrets;
  }
}

class VaultError extends Error {
  constructor(message: string) {
    super();
    this.name = "VaultError";
    this.message = message;
    this.stack = "";
  }
}
