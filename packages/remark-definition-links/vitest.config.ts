import { defaultExclude, defineProject } from "vitest/config";

export default defineProject({
  test: {
    includeSource: ["./src/**/*.{js,ts}"],
    name: "remark-definition-links",
    exclude: [...defaultExclude, "./run.js"],
  },
});
