import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";
import { repoRoot } from "./support/repo-root.mjs";

const cwd = repoRoot;

test("frontend inventory script parses and reports AOE without source snippets", () => {
  execFileSync("node", ["--check", "scripts/frontend-inventory.mjs"], {
    cwd,
    stdio: "pipe"
  });

  const output = execFileSync("node", ["scripts/frontend-inventory.mjs"], {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });

  assert.match(output, /Frontend Inventory/);
  assert.match(output, /agent-opportunity-exchange/);
  assert.match(output, /single-file-hono-workbench/);
  assert.doesNotMatch(output, /BEGIN RSA PRIVATE KEY|telegram_token|BOT_TOKEN/i);
});
