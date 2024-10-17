import * as vault from "node-vault";
import * as cp from "node:child_process";
import { z } from "zod";

type VaultOptions = {
  vaultAddress: string;
  kvCredsPath: string;
  localAgentAddress?: string;
};

export class Vault {
  private kvCredsPath: string;
  private client: vault.client;

  constructor({ vaultAddress, kvCredsPath, localAgentAddress }: VaultOptions) {
    this.kvCredsPath = kvCredsPath;

    if (!localAgentAddress) {
      throw new Error("No local agent address provided");
    }

    try {
      // using fetch was 404ing
      // so using curl and `--write-out` to append the status code to the response
      // then we can split the response at the `-` and check if the status code is 200
      let result = cp.execSync(
        `curl --silent --write-out ' - %{http_code}' ${localAgentAddress}`,
        { encoding: "utf-8", stdio: "pipe" },
      );

      let [rawToken, statusCode] = result.split(" - ");

      if (statusCode !== "200" || !rawToken) {
        throw new VaultError(localAgentAddress);
      }

      let token = rawToken.trim();

      let disableSSL = process.env.NODE_TLS_REJECT_UNAUTHORIZED !== "0";

      this.client = vault.default({
        apiVersion: "v1",
        endpoint: vaultAddress,
        token,
        requestOptions: {
          rejectUnauthorized: disableSSL,
          strictSSL: disableSSL,
        },
      });
    } catch (error) {
      throw new VaultError(localAgentAddress);
    }
  }

  async getSecrets<Schema extends z.ZodTypeAny>(
    schema: Schema,
  ): Promise<z.infer<Schema>> {
    let secrets = await this.client.read(this.kvCredsPath);
    let validatedSecrets = schema.parse(secrets.data.data);
    return validatedSecrets;
  }
}

class VaultError extends Error {
  constructor(url: string) {
    super();
    this.name = "VaultError";
    this.message = `Couldn't find a vault token at ${url}, is the VaultAgent running?`;
    this.stack = "";
  }
}
