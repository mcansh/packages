import { glob } from "glob";
import cp from "node:child_process";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { remark } from "remark";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import { read } from "to-vfile";

function getRootDirectory() {
  return cp
    .execSync("git rev-parse --show-toplevel", { encoding: "utf-8" })
    .trim();
}

let root = getRootDirectory();

export let FIXTURES_DIR = path.join(
  root,
  "packages",
  "remark-definition-links",
  "fixtures",
);
export let INPUT_DIR = path.join(FIXTURES_DIR, "before");
export let OUTPUT_DIR = path.join(FIXTURES_DIR, "after");

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

async function main() {
  const { remarkDefinitionLinks } = await import("./dist/index.js");
  
  let files = await glob("./**/*.md", {
    absolute: true,
    cwd: INPUT_DIR,
    ignore: ["**/node_modules/**"],
  });

  for (let file of files) {
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

      let output = path.join(OUTPUT_DIR, path.relative(INPUT_DIR, file));

      let dirname = path.dirname(output);

      await fsp.mkdir(dirname, { recursive: true });

      await fsp.writeFile(output, result.toString());

      console.log(`Processed ${file}`);
    } catch (error) {
      console.error(`Failed to process ${file}`);
      console.error(error);
    }
  }
}
