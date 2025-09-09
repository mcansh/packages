import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "logger",
    includeSource: ["./src/**/*.{js,ts}"],
  },
});
