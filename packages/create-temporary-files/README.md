# @mcansh/create-temporary-files

easily create temporary files and directories for testing purposes, which are automatically cleaned up after the test is complete.

Requires Node.js 20.4.0 or newer for `Symbol.asyncDispose`. On runtimes without native `await using` syntax, transpile the example with TypeScript or another compatible compiler.

```ts
import { createTemporaryFiles } from "@mcansh/create-temporary-files"

await using tmp = await createTemporaryFiles(
  {
    filePath: "file.txt",
    contents: "Hello, world!",
  },
  {
    contents: "Nested file",
    filePath: "some/nested/file.txt",
  },
)
```
