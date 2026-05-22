import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";
import { repoRoot } from "./support/repo-root.mjs";

test("repo map script parses without executing mutations", () => {
  execFileSync("node", ["--check", "scripts/git-roots.mjs"], {
    cwd: repoRoot,
    stdio: "pipe"
  });
  assert.ok(true);
});
