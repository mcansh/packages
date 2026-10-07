import { execFileSync } from "node:child_process"
import path from "node:path"
import { pathToFileURL } from "node:url"

import chalk from "chalk"
import Confirm from "prompt-confirm"
import semver from "semver"

import {
  getPublishablePackages,
  updatePackageVersions,
} from "./release-packages.js"

const rootDir = path.join(import.meta.dirname, "..")

export async function run(args, directory = rootDir) {
  let [givenVersion, prereleaseId = "pre"] = args
  if (!givenVersion)
    throw new Error(
      "Usage: node scripts/version.js <version|experimental> [--skip-prompt]",
    )
  let status = execFileSync("git", ["status", "--porcelain"], {
    cwd: directory,
    encoding: "utf8",
  }).trim()
  if (status)
    throw new Error(
      "Working directory is not clean. Please commit or stash your changes.",
    )

  let packages = await getPublishablePackages(directory)
  let current =
    packages.find((pkg) => pkg.manifest.name === "@mcansh/http-helmet") ??
    packages[0]
  let version = semver.valid(givenVersion)
  if (givenVersion === "experimental") {
    let hash = execFileSync("git", ["rev-parse", "--short", "HEAD"], {
      cwd: directory,
      encoding: "utf8",
    }).trim()
    version = `0.0.0-experimental-${hash}`
  } else if (!version) {
    version = semver.inc(
      current.manifest.version,
      givenVersion,
      prereleaseId === "--skip-prompt" ? "pre" : prereleaseId,
    )
  }
  if (!version) throw new Error(`Invalid version specifier: ${givenVersion}`)

  if (!args.includes("--skip-prompt")) {
    let answer = await new Confirm(
      `Version all ${packages.length} packages as ${version}? [Yn] `,
    ).run()
    if (!answer) return
  }

  await updatePackageVersions(packages, version)
  // Updated internal dependency ranges must be reflected in the CI lockfile.
  execFileSync("pnpm", ["install", "--lockfile-only", "--ignore-scripts"], {
    cwd: directory,
    stdio: "inherit",
  })
  let files = [
    ...packages.map((pkg) => path.relative(directory, pkg.manifestPath)),
    "pnpm-lock.yaml",
  ]
  execFileSync("git", ["add", "--", ...files], { cwd: directory })
  execFileSync(
    "git",
    ["commit", "--message", `Version ${version}`, "--", ...files],
    { cwd: directory },
  )
  execFileSync(
    "git",
    ["tag", "-a", "-m", `Version ${version}`, `v${version}`],
    { cwd: directory },
  )
  console.log(chalk.green(`Committed and tagged all packages as ${version}`))
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
