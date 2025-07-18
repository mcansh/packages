import { configDefaults, defineConfig } from "vitest/config";

// --reporter=junit --outputFile=test-report.junit.xml

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
    reporters: process.env.CI ? ['junit'] : [],
    outputFile: './coverage/test-report.junit.xml',
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
