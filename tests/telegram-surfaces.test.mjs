import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";
import { repoRoot } from "./support/repo-root.mjs";

test("telegram surface catalog script parses", () => {
  execFileSync("node", ["--check", "scripts/telegram-surfaces.mjs"], {
    cwd: repoRoot,
    stdio: "pipe"
  });
  assert.ok(true);
});
