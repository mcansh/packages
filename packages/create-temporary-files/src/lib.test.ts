import fsp from "node:fs/promises";
import path from "node:path";
import { expect, it } from "vitest";
import { createTemporaryFiles } from "./lib";

it("creates temporary files", async () => {
  const tmp = await createTemporaryFiles({
    filePath: "file.txt",
    contents: "Hello, world!",
  });

  const fileContents = await fsp.readFile(
    path.join(tmp.directory, "file.txt"),
    "utf8",
  );

  expect(fileContents).toBe("Hello, world!");

  await tmp[Symbol.asyncDispose]();
});
