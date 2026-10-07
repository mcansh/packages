// https: //github.com/changesets/changesets/blob/c73949ba7b3160a4aa5729223335c190de1528f8/packages/git/src/index.ts#L194

import path from "node:path";
import { exec } from "tinyexec";

export async function getRepoRoot(options: { cwd?: string } = {}) {
  options.cwd ??= process.cwd();

  let { stdout, exitCode, stderr } = await exec(
    "git",
    ["rev-parse", "--show-cdup"],
    {
      nodeOptions: { cwd: options.cwd },
    },
  );

  if (exitCode !== 0) {
    throw new Error(stderr.toString());
  }

  return path.resolve(
    options.cwd,
    stdout.toString().trim().replace(/\n|\r/g, ""),
  );
}
