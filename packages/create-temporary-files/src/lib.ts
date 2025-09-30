import Fsp from "node:fs/promises";
import Path from "node:path";

export type TemporaryFile = {
  filePath: string;
  contents: string;
};

export async function createTemporaryFiles(
  ...files: [TemporaryFile, ...TemporaryFile[]]
) {
  let directory = await Fsp.mkdtemp("tmp-");

  for (let file of files) {
    let destination = Path.join(directory, file.filePath);
    await Fsp.mkdir(Path.dirname(destination), { recursive: true });
    await Fsp.writeFile(destination, file.contents);
  }

  return {
    directory,
    [Symbol.asyncDispose]: async () => {
      await Fsp.rm(directory, { recursive: true });
    },
  };
}
