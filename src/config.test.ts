import Path from "node:path";
import { expect, it } from "vitest";
import { z } from "zod";
import { parseConfigFiles } from "./config";
import { createTemporaryFiles } from "./test-utils";

it("works when there are no config files", async () => {
  let schema = z.object({});
  let result = await parseConfigFiles({ schema, env: "nonexistent" });
  expect(result).toEqual({});
});

it("works when there is a default dotenv file", async () => {
  let schema = z.object({ HELLO: z.string() });
  await using env = await createTemporaryFiles({
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

  await using env = await createTemporaryFiles(
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

it("allows using a custom config directory", async () => {
  let schema = z.object({ HELLO: z.string(), SOMETHING_ELSE: z.string() });

  await using env = await createTemporaryFiles(
    {
      filePath: "some-other-directory/default.json",
      contents: JSON.stringify({ HELLO: "WORLD" }),
    },
    {
      filePath: "some-other-directory/test.json",
      contents: JSON.stringify({ SOMETHING_ELSE: "VALUE" }),
    },
  );

  let result = await parseConfigFiles({
    schema,
    env: "test",
    directory: Path.resolve(env.directory, "some-other-directory"),
  });

  expect(result).toEqual({ HELLO: "WORLD", SOMETHING_ELSE: "VALUE" });
});
