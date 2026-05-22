import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

import { auditPublication, isGeneratedDataPath } from "../scripts/publication-audit.mjs";
import { repoRoot } from "./support/repo-root.mjs";

const cwd = repoRoot;

test("publication audit script parses and passes current tracked source", () => {
  execFileSync("node", ["--check", "scripts/publication-audit.mjs"], {
    cwd,
    stdio: "pipe"
  });

  const output = execFileSync("node", ["scripts/publication-audit.mjs"], {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
  const report = JSON.parse(output);

  assert.equal(report.schema, "aribs.agent_runtime_publication_audit.v1");
  assert.equal(report.safety.mutatesRuntime, false);
  assert.equal(report.safety.readsSecretValues, false);
  assert.equal(report.summary.violationCount, 0);
});

test("publication audit blocks generated data from tracked source", () => {
  const report = auditPublication({
    trackedFiles: ["data/latest-inventory.json", "data/README.md"],
    readText: () => "{}"
  });

  assert.equal(isGeneratedDataPath("data/latest-inventory.json"), true);
  assert.equal(isGeneratedDataPath("data/README.md"), false);
  assert.equal(report.summary.violationCount, 1);
  assert.equal(report.violations[0].kind, "generated-data-tracked");
});

test("publication audit blocks secret-shaped values but permits explicit fixtures", () => {
  const report = auditPublication({
    trackedFiles: ["scripts/example.mjs", "tests/fixture.test.mjs"],
    readText: (path) =>
      path.includes("fixture")
        ? `process.env.SAPPHIRE_PM_BOT_TOKEN = "${telegramTokenFixture("9999999999")}";`
        : `const leaked = "${telegramTokenFixture("1234567890")}";`
  });

  assert.equal(report.summary.violationCount, 1);
  assert.equal(report.violations[0].kind, "secret-shaped-value");
  assert.equal(report.violations[0].path, "scripts/example.mjs");
});

function telegramTokenFixture(prefix) {
  return `${prefix}:abcdefghijklmnopqrstuvwxyzABCDE`;
}
