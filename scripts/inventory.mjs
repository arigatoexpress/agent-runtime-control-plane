#!/usr/bin/env node
import { execFileSync } from "node:child_process";
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
import { classifyText, SIGNALS } from "../src/classifier.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const writeIndex = args.indexOf("--write");
const writePath = writeIndex >= 0 ? args[writeIndex + 1] : undefined;
const configPath = valueAfter("--config") ?? join(repoRoot, "config/repos.json");

const config = JSON.parse(readFileSync(configPath, "utf8"));
const generatedAt = new Date().toISOString();
const report = {
  schema: "aribs.runtime_inventory.v1",
  generatedAt,
  safety: {
    mode: "read-only",
    storesSourceLines: false,
    storesSecretValues: false,
    mutatesRuntime: false,
    sendsTelegram: false
  },
  signals: Object.keys(SIGNALS),
  repos: config.repos.map(scanRepo)
};

if (writePath) {
  const out = resolve(repoRoot, writePath);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Wrote ${out}`);
} else {
  printSummary(report);
}

function valueAfter(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

function scanRepo(repo) {
  const root = repo.path;
  const exists = existsSync(root);
  const result = {
    ...repo,
    exists,
    git: exists ? gitStatus(root) : null,
    scannedFiles: 0,
    skippedLargeFiles: 0,
    signalCounts: Object.fromEntries(Object.keys(SIGNALS).map((signal) => [signal, 0])),
    filesBySignal: Object.fromEntries(Object.keys(SIGNALS).map((signal) => [signal, []]))
  };

  if (!exists) return result;

  for (const filePath of walk(root)) {
    if (!isInspectableFile(filePath)) continue;
    const stat = statSync(filePath);
    if (stat.size > 512 * 1024) {
      result.skippedLargeFiles += 1;
      continue;
    }
    let text = "";
    try {
      text = readFileSync(filePath, "utf8");
    } catch {
      continue;
    }
    result.scannedFiles += 1;
    const matches = classifyText(text);
    const repoRelativePath = relative(root, filePath);
    for (const signal of Object.keys(matches)) {
      result.signalCounts[signal] += 1;
      if (result.filesBySignal[signal].length < 80) {
        result.filesBySignal[signal].push(repoRelativePath);
      }
    }
  }

  result.recommendation = recommend(result);
  return result;
}

function gitStatus(root) {
  try {
    const status = execFileSync("git", ["-C", root, "status", "--short", "--branch"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
    return status || "clean";
  } catch {
    return "git status unavailable";
  }
}

function walk(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (shouldSkipEntry(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(path));
    } else if (entry.isFile()) {
      files.push(path);
    }
  }
  return files;
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
    ".css",
    ".html",
    ".js",
    ".json",
    ".jsx",
    ".md",
    ".mjs",
    ".plist",
    ".ps1",
    ".py",
    ".sh",
    ".sql",
    ".ts",
    ".tsx",
    ".txt",
    ".yaml",
    ".yml"
  ]).has(ext);
}

function recommend(result) {
  if (!result.exists) return "missing";
  const counts = result.signalCounts;
  if (result.name === "agent-opportunity-exchange") {
    return "keep as x402 product kernel; do not absorb Telegram or local-machine runtime control";
  }
  if (result.name === "Project-Go-Forward") {
    return "protected; avoid migration edits unless Ari explicitly opens THO scope";
  }
  if (counts.telegram || counts.hermes || counts.localRuntime || counts.windowsRuntime || counts.edgeRuntime) {
    return "candidate for runtime-control extraction into this repo after shadow inventory and rollback plan";
  }
  if (counts.x402) {
    return "candidate for standalone x402 consumer or artifact pack integration";
  }
  return "low immediate migration pressure";
}

function printSummary(value) {
  console.log(`${value.schema} ${value.generatedAt}`);
  for (const repo of value.repos) {
    const active = Object.entries(repo.signalCounts)
      .filter(([, count]) => count > 0)
      .map(([signal, count]) => `${signal}:${count}`)
      .join(", ");
    console.log(`- ${repo.name}: ${repo.exists ? active || "no signals" : "missing"} | ${repo.recommendation}`);
  }
}

