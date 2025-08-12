import { glob } from "glob";
import fsp from "node:fs/promises";
import path from "node:path";
import { remark } from "remark";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import { read } from "to-vfile";
import { remarkDefinitionLinks } from "./dist/index.js";

let FIXTURES_DIR = path.join(process.cwd(), "fixtures");
let INPUT_DIR = path.join(FIXTURES_DIR, "before");
let OUTPUT_DIR = path.join(FIXTURES_DIR, "after");

main();

async function main() {
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
