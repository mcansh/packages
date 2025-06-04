import Path from "node:path";
import { expect, it } from "vitest";
import { z } from "zod";
import { parseDotenvFiles } from "./dotenv";
import { createTemporaryFiles } from "./test-utils";

it("works when there are no dotenv files", async () => {
  let schema = z.object({});
  let result = await parseDotenvFiles({ schema, env: "nonexistent" });
  expect(result).toEqual({});
});

it("works when there is a default dotenv file", async () => {
  let schema = z.object({ HELLO: z.string() });
  await using env = await createTemporaryFiles({
    filePath: ".env",
    contents: "HELLO=WORLD",
  });
  let result = await parseDotenvFiles({
    schema,
    env: "test",
    directory: env.directory,
  });

  expect(result).toEqual({ HELLO: "WORLD" });
});

it("works when there is a default dotenv file and a environment dotenv file", async () => {
  let schema = z.object({ HELLO: z.string(), SOMETHING_ELSE: z.string() });
  await using env = await createTemporaryFiles(
    { filePath: ".env", contents: "HELLO=WORLD" },
    { filePath: ".env.test", contents: "SOMETHING_ELSE=VALUE" },
  );

  let result = await parseDotenvFiles({
    schema,
    env: "test",
    directory: env.directory,
  });

  expect(result).toEqual({ HELLO: "WORLD", SOMETHING_ELSE: "VALUE" });
});

it("works when using a custom cwd", async () => {
  let schema = z.object({ HELLO: z.string(), SOMETHING_ELSE: z.string() });
  await using env = await createTemporaryFiles(
    { filePath: "config/.env", contents: "HELLO=WORLD" },
    { filePath: "config/.env.test", contents: "SOMETHING_ELSE=VALUE" },
  );

  let result = await parseDotenvFiles({
    schema,
    env: "test",
    directory: Path.resolve(env.directory, "config"),
  });

  expect(result).toEqual({ HELLO: "WORLD", SOMETHING_ELSE: "VALUE" });
});
