import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

import { buildPublicationPlan } from "../scripts/publication-plan.mjs";
import { repoRoot } from "./support/repo-root.mjs";

test("publication plan script parses and emits a non-mutating readiness plan", () => {
  execFileSync("node", ["--check", "scripts/publication-plan.mjs"], {
    cwd: repoRoot,
    stdio: "pipe"
  });

  const output = execFileSync("node", ["scripts/publication-plan.mjs"], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
  const plan = JSON.parse(output);

  assert.equal(plan.schema, "aribs.agent_runtime_publication_plan.v1");
  assert.equal(plan.safety.mutatesRuntime, false);
  assert.equal(plan.safety.readsSecretValues, false);
  assert.equal(plan.safety.publishesRepo, false);
  assert.equal(plan.safety.generatedDataContentRead, false);
  assert.equal(plan.readiness.auditViolationCount, 0);
  assert.equal(plan.readiness.publicExportBlocked, false);
  assert.ok(plan.exportPolicy.requiresHumanApprovalBeforePublicVisibilityChange);
});

test("publication plan excludes ignored generated data without blocking tracked source", () => {
  const plan = buildPublicationPlan({
    packageJson: { private: true },
    remote: "https://github.com/example/private-runtime.git",
    ignoredGeneratedFiles: ["data/latest-inventory.json", "data/runtime-surfaces.json"],
    auditReport: {
      summary: { violationCount: 0 },
      violations: []
    }
  });

  assert.equal(plan.repository.packagePrivate, true);
  assert.equal(plan.readiness.publicExportBlocked, false);
  assert.equal(plan.readiness.trackedSourceReady, true);
  assert.equal(plan.readiness.ignoredGeneratedOutputCount, 2);
  assert.deepEqual(
    plan.generatedOutputs.map((output) => [output.path, output.publishAction]),
    [
      ["data/latest-inventory.json", "exclude"],
      ["data/runtime-surfaces.json", "exclude"]
    ]
  );
});

test("publication plan blocks public export when audit finds tracked generated data or secrets", () => {
  const plan = buildPublicationPlan({
    packageJson: { private: true },
    remote: null,
    ignoredGeneratedFiles: [],
    auditReport: {
      summary: { violationCount: 2 },
      violations: [
        { kind: "generated-data-tracked", path: "data/latest-inventory.json" },
        { kind: "secret-shaped-value", path: "scripts/example.mjs" }
      ]
    }
  });

  assert.equal(plan.readiness.publicExportBlocked, true);
  assert.equal(plan.readiness.trackedSourceReady, false);
  assert.equal(plan.readiness.generatedTrackedViolationCount, 1);
  assert.equal(plan.readiness.secretViolationCount, 1);
  assert.ok(plan.hardStops.includes("do not broaden repo visibility without explicit approval"));
});
