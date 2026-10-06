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

  try {
    await Promise.all(
      files.map(async (file) => {
        let destination = Path.join(directory, file.filePath);
        await Fsp.mkdir(Path.dirname(destination), { recursive: true });
        await Fsp.writeFile(destination, file.contents);
      }),
    );
  } catch (error) {
    await Fsp.rm(directory, { recursive: true });
    throw error;
  }

  return {
    directory,
    files: files.map((file) => Path.join(directory, file.filePath)),
    [Symbol.asyncDispose]: async () => {
      await Fsp.rm(directory, { recursive: true });
    },
  };
}
