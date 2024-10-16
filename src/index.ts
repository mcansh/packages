import * as Cp from "node:child_process";
import * as Fs from "node:fs";
import * as Path from "node:path";
import * as vault from "node-vault";

export class Vault {
  private kvCredsPath: string;

  private localAgentAddress: string | undefined;

  private client: vault.client | undefined;

  constructor({
    vaultAddress,
    kvCredsPath,
    tokenPath,
    localAgentAddress,
  }: {
    vaultAddress: string;
    kvCredsPath: string;
    tokenPath: string;
    localAgentAddress?: string;
  }) {
    this.kvCredsPath = kvCredsPath;
    let token: string;
    let fullTokenPath = Path.join(process.cwd(), tokenPath);

    if (Fs.existsSync(fullTokenPath)) {
      console.log(`Attempting to read token at '${tokenPath}'`);
      let rawToken = Fs.readFileSync(fullTokenPath, "utf8");
      token = rawToken.trim();
    } else if (localAgentAddress) {
      this.localAgentAddress = localAgentAddress;
      // using fetch was 404ing
      // so using curl and `--write-out` to append the status code to the response
      // then we can split the response at the `-` and check if the status code is 200
      let result = Cp.execSync(
        `curl --silent --write-out ' - %{http_code}' ${localAgentAddress}`,
        { encoding: "utf-8", stdio: "pipe" },
      );

      let [rawToken, statusCode] = result.split(" - ");

      if (statusCode !== "200" || !rawToken) {
        throw new VaultError(tokenPath, localAgentAddress);
      }

      token = rawToken.trim();
    } else if (process.env.NODE_ENV === "development") {
      throw new VaultError(tokenPath, localAgentAddress);
    } else {
      return;
    }

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
  }

  async getSecrets<T>(
    secretMap: Record<keyof T, string>,
  ): Promise<Record<keyof T, string>> {
    if (!this.client) {
      if (process.env.NODE_ENV === "development") {
        throw new VaultError(this.kvCredsPath, this.localAgentAddress);
      }

      // @ts-expect-error - vault isnt running
      return {};
    }

    let response = await this.client.read(this.kvCredsPath);
    let secrets = response.data.data;

    return this.validateSecrets(secretMap, secrets);
  }

  private validateSecrets<T>(
    secretMap: Record<keyof T, string>,
    secrets: Record<string, string>,
  ): Record<keyof T, string> {
    let errors: Array<string> = [];
    let finalSecrets: Partial<Record<keyof T, string>> = {};

    for (let finalKey in secretMap) {
      let secretKey = secretMap[finalKey];
      let value = secrets[secretKey];
      if (!value) {
        errors.push(`Secret "${secretKey}" not found in vault`);
        continue;
      }
      finalSecrets[finalKey] = value;
    }

    if (errors.length > 0) {
      throw new Error(errors.join("\n"));
    }

    // @ts-expect-error - we're validating above
    return finalSecrets;
  }
}

class VaultError extends Error {
  constructor(tokenPath: string, url: string = "local vault agent") {
    super();
    this.name = "VaultError";
    this.message = `Couldn't find a vault token at ${tokenPath} or at ${url}, is the VaultAgent running?`;
    this.stack = "";
  }
}
