import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

test("launchagent readiness script parses", () => {
  execFileSync("node", ["--check", "scripts/launchagent-readiness.mjs"], {
    cwd: "/Users/aribs/Code/agent-runtime-control-plane",
    stdio: "pipe"
  });
  assert.ok(true);
});

