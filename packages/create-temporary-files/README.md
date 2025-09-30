# @mcansh/create-temporary-files

easily create temporary files and directories for testing purposes, which are automatically cleaned up after the test is complete.

```ts
import { createTemporaryFiles } from "@mcansh/create-temporary-files";

await using tmp = await createTemporaryFiles(
  {
    filePath: "file.txt",
    contents: "Hello, world!",
  },
  {
    contents: "Nested file",
    filePath: "some/nested/file.txt",
  },
);
```
