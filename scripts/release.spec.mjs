import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { test } from "node:test"

import { run as publish } from "./publish.js"
import {
  assertPackageVersions,
  getPublishablePackages,
  updatePackageVersions,
} from "./release-packages.js"
import { run as version } from "./version.js"

async function fixture(t) {
  let directory = await mkdtemp(path.join(os.tmpdir(), "release fixture "))
  t.after(() => rm(directory, { recursive: true, force: true }))
  let names = [
    "create-temporary-files",
    "http-helmet",
    "url",
    "vitest-response-matchers",
  ]
  for (let name of [...names, "internal"]) {
    let cwd = path.join(directory, "packages", name)
    await mkdir(cwd, { recursive: true })
    let manifest = {
      name: `@mcansh/${name}`,
      version: "1.0.0",
      private: name === "internal",
      files: ["index.js"],
    }
    if (name === "http-helmet") {
      manifest.dependencies = { "@mcansh/url": "^1.0.0" }
      manifest.devDependencies = {
        "@mcansh/create-temporary-files": "workspace:^",
      }
      manifest.optionalDependencies = {
        "@mcansh/vitest-response-matchers": "~1.0.0",
      }
      manifest.peerDependencies = { "@mcansh/url": "^1.0.0" }
    }
    await writeFile(
      path.join(cwd, "package.json"),
      JSON.stringify(manifest, null, 2) + "\n",
    )
    await writeFile(path.join(cwd, "index.js"), "module.exports = {}\n")
  }
  await writeFile(
    path.join(directory, "package.json"),
    JSON.stringify({ private: true, packageManager: "pnpm@12.9.1" }) + "\n",
  )
  await writeFile(
    path.join(directory, "pnpm-workspace.yaml"),
    "packages:\n  - packages/*\n\nlinkWorkspacePackages: true\npreferWorkspacePackages: true\nstoreDir: ./node_modules/.pnpm-store\n",
  )
  await writeFile(path.join(directory, ".gitignore"), "node_modules/\n")
  await writeFile(
    path.join(directory, "packages", ".DS_Store"),
    "not a package",
  )
  return directory
}

function git(directory, ...args) {
  return execFileSync("git", args, { cwd: directory, encoding: "utf8" }).trim()
}

async function initializeRepository(directory) {
  git(directory, "init", "--quiet")
  git(directory, "config", "user.name", "Release fixture")
  git(directory, "config", "user.email", "fixture@example.invalid")
  git(directory, "config", "commit.gpgsign", "false")
  git(directory, "config", "tag.gpgsign", "false")
  let hooks = path.join(directory, "empty-hooks")
  await mkdir(hooks)
  git(directory, "config", "core.hooksPath", hooks)
  execFileSync(
    "pnpm",
    ["install", "--lockfile-only", "--ignore-scripts", "--offline"],
    { cwd: directory, stdio: "pipe" },
  )
  git(directory, "add", ".")
  git(directory, "commit", "--quiet", "-m", "Fixture")
}

test("discovers all public packages with native glob and skips private packages and files", async (t) => {
  let directory = await fixture(t)
  let packages = await getPublishablePackages(directory)
  assert.deepEqual(
    packages.map((pkg) => pkg.manifest.name),
    [
      "@mcansh/create-temporary-files",
      "@mcansh/http-helmet",
      "@mcansh/url",
      "@mcansh/vitest-response-matchers",
    ],
  )
})

test("versions every public package and updates internal dependency ranges", async (t) => {
  let directory = await fixture(t)
  let packages = await getPublishablePackages(directory)
  let release = "0.0.0-experimental-abc1234"
  await updatePackageVersions(packages, release)
  let updated = await getPublishablePackages(directory)
  assertPackageVersions(updated, release)
  let helmet = updated.find(
    (pkg) => pkg.manifest.name === "@mcansh/http-helmet",
  ).manifest
  assert.equal(helmet.dependencies["@mcansh/url"], `^${release}`)
  assert.equal(helmet.peerDependencies["@mcansh/url"], `^${release}`)
  assert.equal(
    helmet.optionalDependencies["@mcansh/vitest-response-matchers"],
    `~${release}`,
  )
  assert.equal(
    helmet.devDependencies["@mcansh/create-temporary-files"],
    `^${release}`,
  )
  let internal = JSON.parse(
    await readFile(
      path.join(directory, "packages/internal/package.json"),
      "utf8",
    ),
  )
  assert.equal(internal.version, "1.0.0")
})

test("experimental versioning commits and tags every package with a CI-compatible lockfile", async (t) => {
  let directory = await fixture(t)
  await initializeRepository(directory)
  let hash = git(directory, "rev-parse", "--short", "HEAD")
  let release = `0.0.0-experimental-${hash}`
  await version(["experimental", "--skip-prompt"], directory)
  assertPackageVersions(await getPublishablePackages(directory), release)
  assert.equal(git(directory, "tag", "--points-at", "HEAD"), `v${release}`)
  assert.equal(git(directory, "status", "--porcelain"), "")
  execFileSync(
    "pnpm",
    [
      "install",
      "--frozen-lockfile",
      "--strict-peer-dependencies",
      "--ignore-scripts",
      "--offline",
    ],
    { cwd: directory, stdio: "pipe" },
  )
  assert.equal(git(directory, "status", "--porcelain"), "")
})

test("rejects mismatched versions before any publish command runs", async (t) => {
  let directory = await fixture(t)
  await initializeRepository(directory)
  git(directory, "tag", "v0.0.0-experimental-mismatch")
  await assert.rejects(
    publish(["--dry-run"], directory),
    /Packages must match release/,
  )
})

test("rejects a missing release tag before publishing", async (t) => {
  let directory = await fixture(t)
  await initializeRepository(directory)
  await assert.rejects(
    publish(["--dry-run"], directory),
    /Expected exactly one release version/,
  )
})

test("rejects invalid versions without changing package manifests", async (t) => {
  let directory = await fixture(t)
  let packages = await getPublishablePackages(directory)
  await assert.rejects(
    updatePackageVersions(packages, "not-semver"),
    /Invalid release version/,
  )
  assertPackageVersions(await getPublishablePackages(directory), "1.0.0")
})

test("dry-run publishing succeeds for all consistently versioned public packages", async (t) => {
  let directory = await fixture(t)
  let release = "0.0.0-experimental-dryrun"
  await updatePackageVersions(await getPublishablePackages(directory), release)
  await initializeRepository(directory)
  git(directory, "tag", "-a", "-m", "Dry run", `v${release}`)
  await publish(["--dry-run"], directory)
  assertPackageVersions(await getPublishablePackages(directory), release)
  assert.equal(git(directory, "status", "--porcelain"), "")
})

test("dirty repositories are rejected before versioning or tagging", async (t) => {
  let directory = await fixture(t)
  await initializeRepository(directory)
  await writeFile(path.join(directory, "packages/url/index.js"), "changed\n")
  await assert.rejects(
    version(["experimental", "--skip-prompt"], directory),
    /Working directory is not clean/,
  )
  assertPackageVersions(await getPublishablePackages(directory), "1.0.0")
  assert.equal(git(directory, "tag", "--list"), "")
})
