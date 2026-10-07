# Published package runtime checks

These tests install npm tarballs into isolated consumer projects and exercise the public entry points on each package's minimum declared Node.js version. They cover ESM and CommonJS loading, React rendering, file disposal, URL construction, response matchers, and Vitest registration.

Prepare the fixtures using the repository's build runtime:

```sh
pnpm run build:packages
pnpm run test:engines:prepare
```

The preparation command prints each generated runtime directory. Switch to that exact Node.js version, enter its directory under `.package-engines`, and run:

```sh
npm install --ignore-scripts --engine-strict --no-audit --no-fund
node --test runtime.test.mjs
node node_modules/vitest/vitest.mjs run registration.test.mjs
```

CI runs these commands on Linux, macOS, and Windows after downloading the packed fixtures from the build job. Packages whose engines exclude a runtime are omitted from that consumer. The consumer uses Vitest 3 on early Node 20, where Vitest 5 cannot run.
