import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

test("repo map script parses without executing mutations", () => {
  execFileSync("node", ["--check", "scripts/git-roots.mjs"], {
    cwd: "/Users/aribs/Code/agent-runtime-control-plane",
    stdio: "pipe"
  });
  assert.ok(true);
});

