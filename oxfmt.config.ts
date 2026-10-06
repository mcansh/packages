import { defineConfig } from "oxfmt"

import { IGNORE_PATTERNS } from "./oxlint.config.ts"

export default defineConfig({
  printWidth: 80,
  ignorePatterns: IGNORE_PATTERNS,
  sortImports: true,
  sortPackageJson: true,
  sortTailwindcss: true,
  semi: false,
})
