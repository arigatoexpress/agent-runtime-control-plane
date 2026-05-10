import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const cwd = "/Users/aribs/Code/agent-runtime-control-plane";

test("contract inventory reports integration contracts without source snippets", () => {
  execFileSync("node", ["--check", "scripts/contract-inventory.mjs"], {
    cwd,
    stdio: "pipe"
  });

  const output = execFileSync("node", ["scripts/contract-inventory.mjs"], {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });

  assert.match(output, /Integration Contract Inventory/);
  assert.match(output, /agent-opportunity-exchange/);
  assert.match(output, /regional-intel-workbench/);
  assert.match(output, /\/v1\/contracts/);
  assert.match(output, /\/api\/intel\/contracts/);
  assert.match(output, /Browser-smoke ready repos/);
  assert.match(output, /npm run browser:smoke|python scripts\/browser_smoke\.py/);
  assert.match(output, /No source lines, secret values/);
  assert.doesNotMatch(output, /BEGIN RSA PRIVATE KEY|telegram_token|BOT_TOKEN/i);
});

test("contract inventory emits JSON with safety and readiness counts", () => {
  const dir = mkdtempSync(join(tmpdir(), "contract-inventory-"));
  const out = join(dir, "report.json");
  execFileSync("node", ["scripts/contract-inventory.mjs", "--write-json", out], {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
  const report = JSON.parse(readFileSync(out, "utf8"));

  assert.equal(report.schema, "aribs.integration_contract_inventory.v1");
  assert.equal(report.safety.sendsTelegram, false);
  assert.equal(report.safety.deploys, false);
  assert.equal(report.safety.movesMoney, false);
  assert.ok(report.summary.contractReadyCount >= 4);
  assert.equal(report.summary.detectedContractCount, report.summary.expectedContractCount);
  assert.ok(report.summary.browserSmokeReadyCount >= 4);

  const aoe = report.repos.find((repo) => repo.name === "agent-opportunity-exchange");
  const regional = report.repos.find((repo) => repo.name === "regional-intel-workbench");
  const sentinel = report.repos.find((repo) => repo.name === "sapphire-sentinel");
  const megaeth = report.repos.find((repo) => repo.name === "megaeth-agent-guard");
  const zeroGuard = report.repos.find((repo) => repo.name === "0guard");
  assert.equal(aoe.readiness, "contract-ready");
  assert.equal(regional.readiness, "contract-ready");
  assert.ok(aoe.detectedSchemas.includes("aoe.contract_bundle.v1"));
  assert.ok(regional.detectedSchemas.includes("regional_intel.route_readiness.v1"));
  assert.equal(aoe.browserSmoke.command, "npm run browser:smoke");
  assert.equal(aoe.browserSmoke.ready, true);
  assert.equal(sentinel.browserSmoke.command, "python scripts/browser_smoke.py");
  assert.equal(sentinel.browserSmoke.ready, true);
  assert.equal(megaeth.browserSmoke.ready, true);
  assert.equal(zeroGuard.browserSmoke.ready, true);
  assert.equal(zeroGuard.browserSmoke.ciIntegrated, true);
  assert.ok(zeroGuard.browserSmoke.assertedDisabledCapabilities.includes("moneyMovementEnabled"));
});
