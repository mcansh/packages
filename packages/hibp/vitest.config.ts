import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "hibp",
    includeSource: ["./src/**/*.{js,ts}"],
  },
});
