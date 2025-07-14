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
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        ...(configDefaults.coverage.exclude ?? []),
        "**/build/**",
        "**/dist/**",
        "./apps/**/*",
      ],
    },
  },
});
