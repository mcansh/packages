import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import {
  appendFileSync,
  copyFileSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"

import semver from "semver"

const root = path.resolve(import.meta.dirname, "../..")
const output = path.resolve(process.argv[2] ?? ".package-engines")
const tarballs = path.join(output, "tarballs")
mkdirSync(tarballs, { recursive: true })

const packages = readdirSync(path.join(root, "packages"), {
  withFileTypes: true,
})
  .filter((entry) => entry.isDirectory())
  .map((entry) => {
    let cwd = path.join(root, "packages", entry.name)
    let manifest = JSON.parse(
      readFileSync(path.join(cwd, "package.json"), "utf8"),
    )
    let engine = manifest.engines?.node
    assert.ok(
      engine,
      `${manifest.name} must declare its supported Node.js range`,
    )
    let minimum = semver.minVersion(engine)
    assert.ok(minimum, `${manifest.name} needs a valid Node.js engine range`)
    let packed = JSON.parse(
      execFileSync(
        "npm",
        ["pack", "--ignore-scripts", "--json", "--pack-destination", tarballs],
        { cwd, encoding: "utf8" },
      ),
    )[0]
    return {
      name: manifest.name,
      engine,
      minimum: minimum.version,
      filename: packed.filename,
    }
  })

const versions = [...new Set(packages.map((pkg) => pkg.minimum))].sort(
  semver.compare,
)
const workspaceVitest = JSON.parse(
  readFileSync(path.join(root, "node_modules/vitest/package.json"), "utf8"),
)

for (let version of versions) {
  let directory = path.join(output, version)
  let packagesDirectory = path.join(directory, "packages")
  mkdirSync(packagesDirectory, { recursive: true })
  let dependencies = {}
  for (let pkg of packages) {
    if (!semver.satisfies(version, pkg.engine)) continue
    copyFileSync(
      path.join(tarballs, pkg.filename),
      path.join(packagesDirectory, pkg.filename),
    )
    dependencies[pkg.name] = `file:./packages/${pkg.filename}`
  }

  let modernVitest = semver.satisfies(version, workspaceVitest.engines.node)
  dependencies.vitest = modernVitest ? workspaceVitest.version : "3.2.4"
  // Pin Vitest 3's Vite peer to a release that supports early Node 20.
  if (!modernVitest) dependencies.vite = "6.4.3"
  dependencies.react = "18.3.1"
  dependencies["react-dom"] = "18.3.1"
  writeFileSync(
    path.join(directory, "package.json"),
    JSON.stringify(
      {
        name: "package-engine-tests",
        private: true,
        type: "module",
        dependencies,
      },
      null,
      2,
    ) + "\n",
  )
  for (let fixture of ["runtime.test.mjs", "registration.test.mjs"]) {
    copyFileSync(
      path.join(import.meta.dirname, fixture),
      path.join(directory, fixture),
    )
  }
  console.log(
    `Prepared Node ${version}: ${Object.keys(dependencies)
      .filter((name) => name.startsWith("@mcansh/"))
      .join(", ")}`,
  )
}

writeFileSync(path.join(output, "matrix.json"), JSON.stringify(versions) + "\n")
if (process.env.GITHUB_OUTPUT) {
  appendFileSync(
    process.env.GITHUB_OUTPUT,
    `node=${JSON.stringify(versions)}\n`,
  )
}
console.log(
  `Run npm install --ignore-scripts --engine-strict and the two test commands inside each ${output}/<version> directory.`,
)
