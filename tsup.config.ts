import { defineConfig } from "tsup";
import packageJson from "./package.json";

let external = [
  ...Object.keys(packageJson.peerDependencies),
  ...Object.keys(packageJson.devDependencies),
];

export default defineConfig({
  entry: ["./src/index.ts"],
  outDir: "./dist",
  target: "node20",
  external,
  format: "esm",
  splitting: true,
  clean: true,
  dts: true,
  platform: "node",
  tsconfig: "./tsconfig.json",
});
