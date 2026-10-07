import { glob, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

import semver from "semver"

export async function getPublishablePackages(rootDir) {
  let packages = []
  for await (let file of glob("packages/*/package.json", { cwd: rootDir })) {
    let manifestPath = path.join(rootDir, file)
    let manifest = JSON.parse(await readFile(manifestPath, "utf8"))
    if (manifest.private) continue
    packages.push({
      directory: path.dirname(manifestPath),
      manifestPath,
      manifest,
    })
  }
  if (packages.length === 0) throw new Error("No publishable packages found")
  return packages.sort((a, b) => a.manifest.name.localeCompare(b.manifest.name))
}

export async function updatePackageVersions(packages, version) {
  if (!semver.valid(version))
    throw new Error(`Invalid release version: ${version}`)
  let names = new Set(packages.map((pkg) => pkg.manifest.name))
  for (let pkg of packages) {
    pkg.manifest.version = version
    for (let field of [
      "dependencies",
      "devDependencies",
      "optionalDependencies",
      "peerDependencies",
    ]) {
      for (let [name, range] of Object.entries(pkg.manifest[field] ?? {})) {
        if (!names.has(name)) continue
        // npm publish does not rewrite workspace protocol ranges.
        let specifier = range.replace(/^workspace:/, "")
        let prefix = specifier.startsWith("^")
          ? "^"
          : specifier.startsWith("~")
            ? "~"
            : ""
        pkg.manifest[field][name] = `${prefix}${version}`
      }
    }
    await writeFile(
      pkg.manifestPath,
      JSON.stringify(pkg.manifest, null, 2) + "\n",
    )
  }
}

export function assertPackageVersions(packages, version) {
  let mismatches = packages.filter((pkg) => pkg.manifest.version !== version)
  if (mismatches.length > 0) {
    throw new Error(
      `Packages must match release ${version}: ${mismatches.map((pkg) => `${pkg.manifest.name}@${pkg.manifest.version}`).join(", ")}`,
    )
  }
}
