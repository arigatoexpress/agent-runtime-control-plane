import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";
import { repoRoot } from "./support/repo-root.mjs";

test("launchagent readiness script parses", () => {
  execFileSync("node", ["--check", "scripts/launchagent-readiness.mjs"], {
    cwd: repoRoot,
    stdio: "pipe"
  });
  assert.ok(true);
});
