export default {
  $schema: "https://typedoc.org/schema.json",
  entryPoints: ["./src/**/*.{ts,js}"],
  excludeExternals: true,
  exclude: [
    "**/{node_modules,test,book,doc,dist}/**/*",
    "**/{pages,components}/**",
  ],
  skipErrorChecking: true,
  projectDocuments: ["../docs/**/*.md"],
  tsconfig: "./tsconfig.json",
};
