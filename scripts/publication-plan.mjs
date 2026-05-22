#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { auditPublication } from "./publication-audit.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const GENERATED_DATA_PREFIX = "data/";
const GENERATED_DATA_README = "data/README.md";

export function buildPublicationPlan(options = {}) {
  const root = resolve(options.repoRoot ?? repoRoot);
  const packageJson = options.packageJson ?? readPackageJson(root);
  const auditReport = options.auditReport ?? auditPublication({ repoRoot: root });
  const ignoredGeneratedFiles = options.ignoredGeneratedFiles ?? listIgnoredGeneratedFiles(root);
  const generatedOutputs = ignoredGeneratedFiles.map((path) => describeGeneratedOutput(root, path));
  const generatedTrackedViolations = auditReport.violations.filter((violation) => violation.kind === "generated-data-tracked");
  const secretViolations = auditReport.violations.filter((violation) => violation.kind === "secret-shaped-value");
  const blocked = auditReport.summary.violationCount > 0;

  return {
    schema: "aribs.agent_runtime_publication_plan.v1",
    generatedAt: new Date().toISOString(),
    service: "agent-runtime-control-plane",
    safety: {
      mutatesRuntime: false,
      readsSecretValues: false,
      publishesRepo: false,
      scansTrackedSourceOnlyForSecrets: true,
      generatedDataContentRead: false
    },
    repository: {
      packagePrivate: packageJson.private === true,
      remote: options.remote ?? currentRemote(root),
      visibilityCheck: "verify GitHub visibility with gh repo view before changing repository access"
    },
    readiness: {
      publicExportBlocked: blocked,
      trackedSourceReady: !blocked,
      auditViolationCount: auditReport.summary.violationCount,
      generatedTrackedViolationCount: generatedTrackedViolations.length,
      secretViolationCount: secretViolations.length,
      ignoredGeneratedOutputCount: generatedOutputs.length
    },
    exportPolicy: {
      include: ["tracked source after publication:audit passes", GENERATED_DATA_README],
      exclude: ["ignored data outputs", "local inventory snapshots", "secret values", "runtime payloads", "customer or message bodies"],
      requiresHumanApprovalBeforePublicVisibilityChange: true
    },
    generatedOutputs,
    requiredChecks: ["npm run verify:ci", "npm run publication:plan", "gh repo view --json nameWithOwner,isPrivate,url"],
    hardStops: [
      "do not publish generated data outputs",
      "do not broaden repo visibility without explicit approval",
      "do not print, copy, rotate, or embed secrets",
      "do not mutate LaunchAgents, Telegram, cloud runtimes, wallets, or payment rails"
    ],
    violations: auditReport.violations
  };
}

function readPackageJson(root) {
  return JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
}

function currentRemote(root) {
  try {
    return execFileSync("git", ["remote", "get-url", "origin"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
  } catch {
    return null;
  }
}

function listIgnoredGeneratedFiles(root) {
  let output = "";
  try {
    output = execFileSync("git", ["ls-files", "--others", "--ignored", "--exclude-standard", GENERATED_DATA_PREFIX], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    });
  } catch {
    return [];
  }
  return output
    .split("\n")
    .map((path) => path.trim())
    .filter((path) => path && path.startsWith(GENERATED_DATA_PREFIX) && path !== GENERATED_DATA_README)
    .sort();
}

function describeGeneratedOutput(root, path) {
  const fullPath = resolve(root, path);
  const safeRelativePath = relative(root, fullPath);
  if (safeRelativePath.startsWith("..") || safeRelativePath === "") {
    return { path, bytes: null, publishAction: "exclude" };
  }
  const bytes = existsSync(fullPath) ? statSync(fullPath).size : null;
  return {
    path,
    bytes,
    publishAction: "exclude"
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(buildPublicationPlan(), null, 2));
}
