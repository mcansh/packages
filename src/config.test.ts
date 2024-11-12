import Fsp from "node:fs/promises";
import Path from "node:path";
import { expect, it } from "vitest";
import { z } from "zod";
import { parseConfigFiles } from "./config";

async function createTemporaryConfigFiles(
  ...files: Array<{ filePath: string; contents: string }>
) {
  let directory = await Fsp.mkdtemp("tmp-");

  for (let file of files) {
    await Fsp.mkdir(Path.dirname(Path.join(directory, file.filePath)), {
      recursive: true,
    });
    await Fsp.writeFile(Path.join(directory, file.filePath), file.contents);
  }

  return {
    directory,
    [Symbol.asyncDispose]: async () => {
      await Fsp.rm(directory, { recursive: true });
    },
  };
}

it("works when there are no config files", async () => {
  let schema = z.object({});
  let result = await parseConfigFiles({ schema, env: "nonexistent" });
  expect(result).toEqual({});
});

it("works when there is a default dotenv file", async () => {
  let schema = z.object({ HELLO: z.string() });
  await using env = await createTemporaryConfigFiles({
    filePath: "config/default.json",
    contents: JSON.stringify({ HELLO: "WORLD" }),
  });

  let result = await parseConfigFiles({
    schema,
    env: "test",
    directory: Path.resolve(env.directory, "config"),
  });

  expect(result).toEqual({ HELLO: "WORLD" });
});

it("works when there is a default dotenv file and a environment dotenv file", async () => {
  let schema = z.object({ HELLO: z.string(), SOMETHING_ELSE: z.string() });

  await using env = await createTemporaryConfigFiles(
    {
      filePath: "config/default.json",
      contents: JSON.stringify({ HELLO: "WORLD" }),
    },
    {
      filePath: "config/test.json",
      contents: JSON.stringify({ SOMETHING_ELSE: "VALUE" }),
    },
  );

  let result = await parseConfigFiles({
    schema,
    env: "test",
    directory: Path.resolve(env.directory, "config"),
  });

  expect(result).toEqual({ HELLO: "WORLD", SOMETHING_ELSE: "VALUE" });
});
