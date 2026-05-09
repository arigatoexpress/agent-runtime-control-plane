#!/usr/bin/env node
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync
} from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { classifyText } from "../src/classifier.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const writeIndex = args.indexOf("--write");
const writePath = writeIndex >= 0 ? args[writeIndex + 1] : undefined;
const writeSummaryIndex = args.indexOf("--write-summary");
const writeSummaryPath = writeSummaryIndex >= 0 ? args[writeSummaryIndex + 1] : undefined;
const configPath = valueAfter("--config") ?? join(repoRoot, "config/repos.json");
const config = JSON.parse(readFileSync(configPath, "utf8"));

const report = {
  schema: "aribs.runtime_surfaces.v1",
  generatedAt: new Date().toISOString(),
  safety: {
    mode: "read-only",
    storesSourceLines: false,
    storesSecretValues: false,
    mutatesRuntime: false,
    sendsTelegram: false
  },
  surfaces: config.repos.flatMap(scanRepo)
};

report.summary = summarize(report.surfaces);

if (writePath) {
  const out = resolve(repoRoot, writePath);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Wrote ${out}`);
} else if (writeSummaryPath) {
  const out = resolve(repoRoot, writeSummaryPath);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, `${JSON.stringify({
    schema: "aribs.runtime_surfaces_summary.v1",
    generatedAt: report.generatedAt,
    safety: report.safety,
    summary: report.summary,
    nextSteps: [
      "Inspect the full generated catalog locally when needed.",
      "Promote one runtime category at a time into a dry-run adapter.",
      "Do not retire any source repo surface until shadow comparison and rollback exist."
    ]
  }, null, 2)}\n`);
  console.log(`Wrote ${out}`);
} else {
  printSummary(report);
}

function valueAfter(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

function scanRepo(repo) {
  if (!existsSync(repo.path)) return [];
  const surfaces = [];
  for (const path of walk(repo.path)) {
    if (!isInspectableFile(path)) continue;
    const stat = statSync(path);
    if (stat.size > 512 * 1024) continue;
    let text = "";
    try {
      text = readFileSync(path, "utf8");
    } catch {
      continue;
    }
    const signals = classifyText(text);
    const kinds = surfaceKinds(path, text, signals);
    if (kinds.length === 0) continue;
    surfaces.push({
      repo: repo.name,
      repoPath: repo.path,
      path: relative(repo.path, path),
      kinds,
      ownerPosture: repo.posture,
      migrationPosture: postureFor(repo.name, kinds, path),
      label: safeLaunchLabel(text)
    });
  }
  return surfaces;
}

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (shouldSkipEntry(entry.name)) return [];
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return walk(path);
    if (entry.isFile()) return [path];
    return [];
  });
}

function shouldSkipEntry(name) {
  return new Set([
    ".git",
    ".next",
    ".pytest_cache",
    ".ruff_cache",
    ".venv",
    "__pycache__",
    "build",
    "coverage",
    "dist",
    "node_modules",
    "vendor"
  ]).has(name);
}

function isInspectableFile(filePath) {
  const base = filePath.split("/").pop() ?? "";
  if (/^\.env($|\.)/.test(base)) return false;
  if (/secret|credential|token|keychain/i.test(base)) return false;
  const ext = extname(filePath).toLowerCase();
  return new Set([
    "",
    ".bat",
    ".js",
    ".json",
    ".jsx",
    ".md",
    ".mjs",
    ".plist",
    ".ps1",
    ".py",
    ".sh",
    ".ts",
    ".tsx",
    ".txt",
    ".yaml",
    ".yml"
  ]).has(ext);
}

function surfaceKinds(path, text, signals) {
  const kinds = new Set();
  if (signals.telegram || /telegram/i.test(path)) kinds.add("telegram");
  if (signals.hermes || /hermes/i.test(path)) kinds.add("hermes");
  if (signals.localRuntime || /launchagent|launchd|\.plist$/i.test(path)) kinds.add("local-runtime");
  if (signals.windowsRuntime || /\.(ps1|bat)$/i.test(path)) kinds.add("windows-runtime");
  if (signals.edgeRuntime || /\/pi\/|raspberry|\.service$/i.test(path)) kinds.add("edge-runtime");
  if (/pm[_-]?bot|telegram-bot|operator-console/i.test(path + text)) kinds.add("operator-bot");
  if (/intel|reader|digest/i.test(path) && (signals.telegram || signals.hermes)) kinds.add("intel-ingestion");
  return [...kinds].sort();
}

function postureFor(repoName, kinds, path) {
  if (repoName === "Project-Go-Forward") return "protected-read-only";
  if (kinds.includes("telegram") || kinds.includes("operator-bot")) {
    return "extract-dry-run-adapter-before-retirement";
  }
  if (kinds.includes("local-runtime") || kinds.includes("windows-runtime") || kinds.includes("edge-runtime")) {
    return "catalog-shadow-then-cutover-plan";
  }
  if (/README|docs\//i.test(path)) return "preserve-as-runbook-reference";
  return "classify";
}

function safeLaunchLabel(text) {
  const match = text.match(/<key>Label<\/key>\s*<string>([^<]+)<\/string>/);
  return match?.[1] ?? null;
}

function summarize(surfaces) {
  const summary = {
    total: surfaces.length,
    byRepo: {},
    byKind: {}
  };
  for (const surface of surfaces) {
    summary.byRepo[surface.repo] = (summary.byRepo[surface.repo] ?? 0) + 1;
    for (const kind of surface.kinds) {
      summary.byKind[kind] = (summary.byKind[kind] ?? 0) + 1;
    }
  }
  return summary;
}

function printSummary(value) {
  console.log(`${value.schema} ${value.generatedAt}`);
  console.log(`surfaces: ${value.summary.total}`);
  for (const [repo, count] of Object.entries(value.summary.byRepo)) {
    console.log(`- ${repo}: ${count}`);
  }
  console.log("kinds:");
  for (const [kind, count] of Object.entries(value.summary.byKind)) {
    console.log(`- ${kind}: ${count}`);
  }
}
