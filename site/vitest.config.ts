import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "docs-seo",
    include: ["./**/*.spec.ts"],
  },
});
