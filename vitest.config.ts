import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: ["./packages/*"],
    include: ["./packages/*/src/**/*.{js,ts,tsx}"],
    exclude: [
      ...configDefaults.exclude,
      "**/build/**",
      "**/dist/**",
      "./apps/**/*",
      "./scripts/**/*",
    ],
    reporters: process.env.CI ? ["junit"] : [],
    outputFile: process.env.CI ? "./coverage/test-report.junit.xml" : undefined,
    coverage: {
      exclude: [
        ...(configDefaults.coverage.exclude ?? []),
        "**/build/**",
        "**/dist/**",
        "./apps/**/*",
        "./scripts/**/*",
      ],
    },
  },
});
