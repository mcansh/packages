import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "create-temporary-files",
    includeSource: ["./src/**/*.{js,ts}"],
  },
});
