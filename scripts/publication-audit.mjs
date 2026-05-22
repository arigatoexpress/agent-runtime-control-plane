#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TEXT_READ_LIMIT_BYTES = 1024 * 1024;
const PRIVATE_KEY_PREFIX = "-----BEGIN";
const PRIVATE_KEY_SUFFIX = "PRIVATE KEY-----";

export const GENERATED_DATA_ALLOWLIST = Object.freeze(new Set(["data/README.md"]));
export const ALLOWED_FIXTURE_VALUES = Object.freeze(
  new Set(["9999999999:abcdefghijklmnopqrstuvwxyzABCDE"])
);

export const SECRET_VALUE_PATTERNS = Object.freeze([
  {
    name: "private-key-block",
    regex: new RegExp(`${PRIVATE_KEY_PREFIX} (?:RSA |OPENSSH |EC |DSA )?${PRIVATE_KEY_SUFFIX}`, "g")
  },
  {
    name: "telegram-token-value",
    regex: /\b\d{7,12}:[A-Za-z0-9_-]{20,}\b/g
  },
  {
    name: "openai-api-key-value",
    regex: /\bsk-[A-Za-z0-9_-]{20,}\b/g
  },
  {
    name: "github-token-value",
    regex: /\bgh[pousr]_[A-Za-z0-9_]{30,}\b/g
  },
  {
    name: "aws-access-key-id",
    regex: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g
  },
  {
    name: "google-service-account-private-key-json",
    regex: new RegExp(`"private_key"\\s*:\\s*"${PRIVATE_KEY_PREFIX} ${PRIVATE_KEY_SUFFIX}`, "g")
  }
]);

export function listTrackedFiles(root = repoRoot) {
  const output = execFileSync("git", ["ls-files"], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
  return output.split("\n").filter(Boolean);
}

export function isGeneratedDataPath(relativePath) {
  return relativePath.startsWith("data/") && !GENERATED_DATA_ALLOWLIST.has(relativePath);
}

export function auditPublication(options = {}) {
  const root = resolve(options.repoRoot ?? repoRoot);
  const trackedFiles = options.trackedFiles ?? listTrackedFiles(root);
  const readText = options.readText ?? ((relativePath) => readTrackedText(root, relativePath));
  const violations = [];

  for (const relativePath of trackedFiles) {
    if (isGeneratedDataPath(relativePath)) {
      violations.push({
        kind: "generated-data-tracked",
        path: relativePath,
        message: "Generated runtime inventory belongs in ignored local data outputs, not tracked source."
      });
      continue;
    }

    const text = readText(relativePath);
    if (typeof text !== "string") continue;
    for (const pattern of SECRET_VALUE_PATTERNS) {
      pattern.regex.lastIndex = 0;
      for (const match of text.matchAll(pattern.regex)) {
        const value = match[0];
        if (ALLOWED_FIXTURE_VALUES.has(value)) continue;
        violations.push({
          kind: "secret-shaped-value",
          path: relativePath,
          pattern: pattern.name,
          message: `Tracked source contains a ${pattern.name} match. Store only key names, hashes, or redacted fixtures.`
        });
      }
    }
  }

  return {
    schema: "aribs.agent_runtime_publication_audit.v1",
    generatedAt: new Date().toISOString(),
    safety: {
      mutatesRuntime: false,
      readsSecretValues: false,
      scansTrackedSourceOnly: true
    },
    summary: {
      trackedFileCount: trackedFiles.length,
      violationCount: violations.length
    },
    violations
  };
}

function readTrackedText(root, relativePath) {
  const path = resolve(root, relativePath);
  if (!path.startsWith(`${root}/`) || !existsSync(path)) return null;
  const stat = statSync(path);
  if (!stat.isFile() || stat.size > TEXT_READ_LIMIT_BYTES) return null;
  const buffer = readFileSync(path);
  if (buffer.includes(0)) return null;
  return buffer.toString("utf8");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = auditPublication();
  if (report.violations.length > 0) {
    console.error(JSON.stringify(report, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify(report, null, 2));
}
