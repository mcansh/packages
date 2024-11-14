import { err, ok, ResultAsync } from "neverthrow";
import Fsp from "node:fs/promises";
import Path from "node:path";
import type { z } from "zod";

async function parseConfigFile(filePath: string) {
  return ResultAsync.fromPromise(Fsp.readFile(filePath, "utf-8"), (error) => {
    if (error instanceof Error) {
      return err(error.message);
    }
    return err(`Error reading file: ${filePath}`);
  }).andThen((result) => {
    return ok(JSON.parse(result));
  });
}

export async function parseConfigFiles<Schema extends z.ZodTypeAny>({
  env,
  directory = Path.join(process.cwd(), "config"),
  schema,
}: {
  directory?: string;
  env: string;
  schema: Schema;
}) {
  let defaultConfigFilePath = Path.resolve(directory, "default.json");
  let envSpecificFilePath = Path.resolve(directory, `${env}.json`);

  let defaultEnv = await parseConfigFile(defaultConfigFilePath);
  let envSpecific = await parseConfigFile(envSpecificFilePath);

  let result: Record<string, string> = {};

  if (defaultEnv.isOk()) {
    result = { ...result, ...defaultEnv.value };
  } else {
    console.error(
      `failed to parse ${Path.relative(process.cwd(), defaultConfigFilePath)}`,
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
