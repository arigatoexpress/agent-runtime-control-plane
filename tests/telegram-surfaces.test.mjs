import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

test("telegram surface catalog script parses", () => {
  execFileSync("node", ["--check", "scripts/telegram-surfaces.mjs"], {
    cwd: "/Users/aribs/Code/agent-runtime-control-plane",
    stdio: "pipe"
  });
  assert.ok(true);
});

