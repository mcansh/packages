import Fsp from "node:fs/promises";
import Path from "node:path";
import { expect, it } from "vitest";
import { createTemporaryFiles } from "./lib";

it("creates temporary files and cleans them up", async () => {
  let directoryPath: string;

  {
    await using tmp = await createTemporaryFiles(
      {
        filePath: "file.txt",
        contents: "Hello, world!",
      },
      {
        filePath: "nested/dir/file.txt",
        contents: "Nested file",
      },
    );

    directoryPath = tmp.directory;

    const fileContents = await Fsp.readFile(
      Path.join(tmp.directory, "file.txt"),
      "utf8",
    );
    expect(fileContents).toBe("Hello, world!");

    const nestedFileContents = await Fsp.readFile(
      Path.join(tmp.directory, "nested/dir/file.txt"),
      "utf8",
    );
    expect(nestedFileContents).toBe("Nested file");

    await expect(Fsp.stat(directoryPath)).resolves.toBeDefined();
  }

  await expect(Fsp.stat(directoryPath)).rejects.toThrow();
});
