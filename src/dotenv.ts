import dotenv from "dotenv";
import { err, ok, ResultAsync } from "neverthrow";
import Fsp from "node:fs/promises";
import Path from "node:path";
import type { z } from "zod";

async function parseDotenvFile(filePath: string) {
  return ResultAsync.fromPromise(Fsp.readFile(filePath, "utf-8"), (error) => {
    if (error instanceof Error) {
      return err(error.message);
    }
    return err(`Error reading file: ${filePath}`);
  }).andThen((contents) => {
    return ok(dotenv.parse(contents));
  });
}

export async function parseDotenvFiles<Schema extends z.ZodTypeAny>({
  directory = process.cwd(),
  env,
  schema,
}: {
  directory?: string;
  env: string;
  schema: Schema;
}): Promise<z.infer<Schema>> {
  let defaultEnvFilePath = Path.join(directory, ".env");
  let envSpecificFilePath = Path.join(directory, `.env.${env}`);

  let defaultEnv = await parseDotenvFile(defaultEnvFilePath);
  let envSpecific = await parseDotenvFile(envSpecificFilePath);

  let result: Record<string, string> = {};

  if (defaultEnv.isOk()) {
    result = { ...result, ...defaultEnv.value };
  } else {
    console.error(
      `failed to parse ${Path.relative(process.cwd(), defaultEnvFilePath)}`,
    );
  }

  if (envSpecific.isOk()) {
    result = { ...result, ...envSpecific.value };
  } else {
    console.error(
      `failed to parse ${Path.relative(process.cwd(), envSpecificFilePath)}`,
    );
  }

  return schema.parse(result);
}
