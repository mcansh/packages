import { glob } from "glob";
import path from "node:path";
import { remark } from "remark";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import { read } from "to-vfile";
import { describe, expect, test } from "vitest";
import { remarkDefinitionLinks } from "./index.ts";

let FIXTURES_DIR = path.join(process.cwd(), "fixtures");
let INPUT_DIR = path.join(FIXTURES_DIR, "before");
let OUTPUT_DIR = path.join(FIXTURES_DIR, "after");

let files = await glob("./**/*.md", {
  cwd: INPUT_DIR,
  ignore: ["**/node_modules/**"],
});

describe("converts inline links to definitions", () => {
  test.each(files)("%s", async (filename) => {
    let beforeFile = path.join(INPUT_DIR, filename);
    let afterFile = path.join(OUTPUT_DIR, filename);

    let [before, after] = await Promise.all([
      read(beforeFile),
      read(afterFile),
    ]);

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
      .process(before);

    // windows has new line endings of `\r\n`, unix has `\n`
    // lets normalize them..
    let normalizedResult = result.toString().replace(/\r\n/g, "\n");
    let normalizedAfter = after.toString().replace(/\r\n/g, "\n");

    expect(normalizedResult).toEqual(normalizedAfter);
  });
});
