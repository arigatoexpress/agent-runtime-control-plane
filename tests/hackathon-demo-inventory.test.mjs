import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const cwd = "/Users/aribs/Code/agent-runtime-control-plane";

test("hackathon demo inventory reports standalone demo lanes without source snippets", () => {
  execFileSync("node", ["--check", "scripts/hackathon-demo-inventory.mjs"], {
    cwd,
    stdio: "pipe"
  });

  const output = execFileSync("node", ["scripts/hackathon-demo-inventory.mjs"], {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });

  assert.match(output, /Hackathon Demo Inventory/);
  assert.match(output, /sapphire-sentinel/);
  assert.match(output, /megaeth-agent-guard/);
  assert.match(output, /0guard/);
  assert.match(output, /AgenticArigato/);
  assert.match(output, /No source lines, secret values/);
  assert.doesNotMatch(output, /BEGIN RSA PRIVATE KEY|telegram_token|BOT_TOKEN/i);
});

test("hackathon demo inventory emits JSON with safety posture and refactor order", () => {
  const dir = mkdtempSync(join(tmpdir(), "hackathon-demo-inventory-"));
  const out = join(dir, "report.json");
  execFileSync("node", ["scripts/hackathon-demo-inventory.mjs", "--write-json", out], {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
  const report = JSON.parse(readFileSync(out, "utf8"));

  assert.equal(report.schema, "aribs.hackathon_demo_inventory.v1");
  assert.equal(report.safety.sendsTelegram, false);
  assert.equal(report.safety.deploys, false);
  assert.equal(report.refactorOrder[0].name, "sapphire-sentinel");
  assert.ok(report.summary.externalActionScriptRepos.includes("0guard"));
});
