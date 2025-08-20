import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { INPUT_DIR, processFile } from "./run";

let spies = {
  log: vi.spyOn(console, "log").mockImplementation(() => {}),
  error: vi.spyOn(console, "error").mockImplementation(() => {}),
};

afterEach(vi.clearAllMocks);

describe("process markdown files", () => {
  it("should process markdown file", async () => {
    let file = path.join(INPUT_DIR, "index.md");
    await processFile(file);
    expect(spies.log).toHaveBeenCalledWith(`Processed ${file}`);
    expect(spies.error).not.toHaveBeenCalled();
  });

  /** @param {string} file  */
  function createFileNotFoundError(file) {
    let notFoundError = new Error(
      `ENOENT: no such file or directory, open '${file}'`,
    );
    notFoundError.errno = -2;
    notFoundError.code = "ENOENT";
    notFoundError.syscall = "open";
    notFoundError.path = file;
    return notFoundError;
  }

  it("should handle errors gracefully", async () => {
    let file = path.join(INPUT_DIR, "invalid.md");
    await processFile(file);
    expect(spies.log).not.toHaveBeenCalled();
    expect(spies.error).toHaveBeenCalledWith(`Failed to process ${file}`);
    expect(spies.error).toHaveBeenCalledWith(createFileNotFoundError(file));
  });
});
