import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "url",
    includeSource: ["./src/**/*.{js,ts}"],
  },
});
