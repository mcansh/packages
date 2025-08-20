import { glob } from "glob";
import cp from "node:child_process";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { remark } from "remark";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import { read } from "to-vfile";
import { remarkDefinitionLinks } from "./dist/index.js";

export const root = cp
  .execSync("git rev-parse --show-toplevel", { encoding: "utf-8" })
  .trim();

export const project = path.join(root, "packages", "remark-definition-links");
export const FIXTURES_DIR = path.join(project, "fixtures");
export const INPUT_DIR = path.join(FIXTURES_DIR, "before");
export const OUTPUT_DIR = path.join(FIXTURES_DIR, "after");

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

/**
 *  @param {string} file
 * @returns {Promise<string>}
 */
export async function processFile(file) {
  try {
    let content = await read(file);
    let result = await remark()
      .use({
        settings: {
          fences: true,
          listItemIndent: "one",
          tightDefinitions: true,
        },
      })
      .use(remarkDefinitionLinks)
      .use(remarkGfm)
      .use(remarkFrontmatter, ["yaml", "toml"])
      .process(content);

    console.log(`Processed ${file}`);

    return result.toString();
  } catch (error) {
    console.error(`Failed to process ${file}`);
    console.error(error);
  }
}

export async function main() {
  let files = await glob("./**/*.md", {
    absolute: true,
    cwd: INPUT_DIR,
    ignore: ["**/node_modules/**"],
  });

  await Promise.all(
    files.map(async (file) => {
      let result = await processFile(file);

      let output = path.join(OUTPUT_DIR, path.relative(INPUT_DIR, file));
      let dirname = path.dirname(output);

      await fsp.mkdir(dirname, { recursive: true });
      await fsp.writeFile(output, result.toString());
    }),
  );
}
