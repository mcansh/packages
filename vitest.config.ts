import { configDefaults, defineConfig } from "vitest/config";

let exclude = [
  "**/build/**",
  "**/dist/**",
  "**/apps/**",
  "**/scripts/**",
  "**/tsdown.config.ts",
];

export default defineConfig({
  test: {
    projects: ["./packages/*"],
    include: ["./packages/*/src/**/*.{js,ts,tsx}"],
    exclude: [...configDefaults.exclude, ...exclude],
    reporters: process.env.CI ? ["junit"] : [],
    outputFile: process.env.CI ? "./coverage/test-report.junit.xml" : undefined,
    coverage: {
      exclude: [...(configDefaults.coverage.exclude ?? []), ...exclude],
    },
  },
});
