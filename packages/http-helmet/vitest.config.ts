import { defineProject } from "vitest/config"

export default defineProject({
  test: {
    name: "http-helmet",
    includeSource: ["./src/**/*.{js,ts}"],
    setupFiles: ["./vitest.setup.ts"],
    environment: "happy-dom",
  },
})
