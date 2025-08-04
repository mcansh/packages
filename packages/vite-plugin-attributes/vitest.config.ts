import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "vite-plugin-attributes",
    includeSource: ["./src/**/*.{js,ts}"],
  },
});
