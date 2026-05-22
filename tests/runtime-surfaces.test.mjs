import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";
import { repoRoot } from "./support/repo-root.mjs";

test("runtime surface catalog script parses", () => {
  execFileSync("node", ["--check", "scripts/runtime-surfaces.mjs"], {
    cwd: repoRoot,
    stdio: "pipe"
  });
  assert.ok(true);
});
