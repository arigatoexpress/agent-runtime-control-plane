import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";
import { repoRoot } from "./support/repo-root.mjs";

test("launchagent catalog script parses", () => {
  execFileSync("node", ["--check", "scripts/launchagents.mjs"], {
    cwd: repoRoot,
    stdio: "pipe"
  });
  assert.ok(true);
});
