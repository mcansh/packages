import Fsp from "node:fs/promises";
import Path from "node:path";
import { styleText } from "node:util";
import { defineConfig } from "tsup";
import packageJson from "./package.json";

let js = String.raw;

let external = [
  ...Object.keys(packageJson.peerDependencies),
  ...Object.keys(packageJson.devDependencies),
];

export default defineConfig({
  entry: ["./src/index.ts", "./src/node.ts"],
  outDir: "./dist",
  target: "node20",
  shims: true,
  external,
  sourcemap: true,
  format: ["esm", "cjs"],
  splitting: false,
  clean: true,
  dts: true,
  platform: "node",
  tsconfig: "./tsconfig.json",
  async onSuccess() {
    async function createEsmReExport(file: string, originalPath: string) {
      let content = js`export * from "${originalPath}";`;
      await Fsp.writeFile(file, content);
      return createBuildLog(file);
    }

    async function createCjsReExport(file: string, originalPath: string) {
      let content = js`module.exports = require("${originalPath}");`;
      await Fsp.writeFile(file, content);
      return createBuildLog(file);
    }

    await Promise.all([
      createEsmReExport("node.js", "./dist/node"),
      createCjsReExport("node.cjs", "./dist/node"),
      createEsmReExport("node.d.ts", "./dist/node"),
      createEsmReExport("node.d.cts", "./dist/node"),
    ]);
  },
});

async function createBuildLog(file: string) {
  let relative = Path.relative(process.cwd(), file);
  let stats = await Fsp.stat(file);
  return console.log(
    `${styleText("bgBlack", styleText("white", "CUS"))} ${styleText("bold", relative)} ${styleText("green", stats.size + " bytes")}`,
  );
}
