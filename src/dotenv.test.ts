import Fsp from "node:fs/promises";
import Path from "node:path";
import { expect, it } from "vitest";
import { z } from "zod";
import { parseDotenvFiles } from "./dotenv";

async function createTemporaryDotenvFiles(
  ...files: Array<{ filePath: string; contents: string }>
) {
  let directory = await Fsp.mkdtemp("tmp");

  for (let file of files) {
    await Fsp.writeFile(Path.join(directory, file.filePath), file.contents);
  }

  return {
    directory,
    [Symbol.asyncDispose]: async () => {
      await Fsp.rm(directory, { recursive: true });
    },
  };
}

it("works when there are no dotenv files", async () => {
  let schema = z.object({});
  let result = await parseDotenvFiles({ schema, env: "nonexistent" });
  expect(result).toEqual({});
});

it("works when there is a default dotenv file", async () => {
  let schema = z.object({ HELLO: z.string() });
  await using env = await createTemporaryDotenvFiles({
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
  await using env = await createTemporaryDotenvFiles(
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
