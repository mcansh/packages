import Fsp from "node:fs/promises";
import Path from "node:path";
import { expect, it, vi } from "vitest";
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

    expect(tmp.files).toEqual([
      Path.join(tmp.directory, "file.txt"),
      Path.join(tmp.directory, "nested/dir/file.txt"),
    ])

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

  }

  await expect(Fsp.readdir(directoryPath)).rejects.toThrow();
});

it("automatically cleans up in the event of a file write error", async () => {
  vi.spyOn(Fsp, "writeFile").mockRejectedValueOnce(new Error("Mocked error"));

  expect(async () => {
    await createTemporaryFiles({
      filePath: "file.txt",
      contents: "Hello, world!",
    });
  }).rejects.toThrow();
});
