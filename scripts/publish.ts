#!/usr/bin/env node

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import * as semver from "verkit";
import { getRepoRoot } from "./get-repo-root.ts";

let ROOT_DIR = await getRepoRoot();

let packages = fs.globSync("./packages/*", { cwd: ROOT_DIR }).map((pkg) => {
  return path.join(ROOT_DIR, pkg);
});

function getTaggedVersion() {
  let output = execSync("git tag --list --points-at HEAD").toString().trim();
  return output.replace(/^v/g, "");
}

function publish(dir: string, tag: string) {
  execSync(`npm publish --access public --tag ${tag} ${dir}`, {
    stdio: "inherit",
  });
}

async function run() {
  // Make sure there's a current tag
  let taggedVersion = getTaggedVersion();
  if (taggedVersion === "") {
    console.error("Missing release version. Run the version script first.");
    process.exit(1);
  }

  let prerelease = semver.getPrerelease(taggedVersion);
  let prereleaseTag = prerelease ? String(prerelease[0]) : undefined;
  let tag = prereleaseTag
    ? prereleaseTag.includes("nightly")
      ? "nightly"
      : prereleaseTag.includes("experimental")
        ? "experimental"
        : prereleaseTag
    : "latest";

  for (let name of packages) {
    publish(name, tag);
  }
}

run().then(
  () => {
    process.exit(0);
  },
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
