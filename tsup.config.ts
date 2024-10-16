import { defineConfig } from "tsup";
import packageJson from "./package.json";

let external = [
  ...Object.keys(packageJson.peerDependencies),
  ...Object.keys(packageJson.devDependencies),
];

console.log({ external });

export default defineConfig({
  entry: ["./src/index.ts"],
  outDir: "./dist",
  target: "node20",
  external,
  format: "esm",
  splitting: true,
});
