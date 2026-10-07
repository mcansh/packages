#!/usr/bin/env node

import { execFileSync } from "node:child_process"
import path from "node:path"
import { pathToFileURL } from "node:url"

import semver from "semver"

import {
  assertPackageVersions,
  getPublishablePackages,
} from "./release-packages.js"

const rootDir = path.join(import.meta.dirname, "..")

export async function run(args, directory = rootDir) {
  if (args.some((arg) => arg !== "--dry-run")) {
    throw new Error("Usage: node scripts/publish.js [--dry-run]")
  }
  let tags = execFileSync("git", ["tag", "--list", "--points-at", "HEAD"], {
    cwd: directory,
    encoding: "utf8",
  })
  let versions = [
    ...new Set(
      tags
        .trim()
        .split("\n")
        .map((tag) => semver.valid(tag.replace(/^v/, "")))
        .filter(Boolean),
    ),
  ]
  if (versions.length !== 1) {
    throw new Error(
      "Expected exactly one release version at HEAD. Run the version script first.",
    )
  }
  let version = versions[0]
  let packages = await getPublishablePackages(directory)
  // Check every package before publishing any of them, avoiding a partial release.
  assertPackageVersions(packages, version)
  let prerelease = semver.prerelease(version)
  let label = prerelease ? String(prerelease[0]) : "latest"
  let tag = label.includes("nightly")
    ? "nightly"
    : label.includes("experimental")
      ? "experimental"
      : label
  for (let pkg of packages) {
    let command = ["publish", "--access", "public", "--tag", tag]
    if (args.includes("--dry-run"))
      command.push("--dry-run", "--ignore-scripts")
    command.push(pkg.directory)
    execFileSync("npm", command, { cwd: directory, stdio: "inherit" })
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  run(process.argv.slice(2)).catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
