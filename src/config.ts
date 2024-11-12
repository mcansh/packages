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
  }).andThen((contents) => {
    return contents ? ok(JSON.parse(contents)) : err("No contents");
  });
}

export async function parseConfigFiles<Schema extends z.ZodTypeAny>({
  env,
  directory = process.cwd(),
  schema,
}: {
  directory?: string;
  env: string;
  schema: Schema;
}) {
  let defaultConfigFilePath = Path.resolve(directory, "default.json");
  let configSpecificFilePath = Path.resolve(directory, `${env}.json`);

  let defaultEnv = await parseConfigFile(defaultConfigFilePath);
  let envSpecific = await parseConfigFile(configSpecificFilePath);

  let result: Record<string, string> = {};

  if (defaultEnv.isOk()) {
    result = { ...result, ...defaultEnv.value };
  }

  if (envSpecific.isOk()) {
    result = { ...result, ...envSpecific.value };
  }

  return schema.parse(result);
}
