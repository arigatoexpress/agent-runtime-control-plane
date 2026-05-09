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

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const writeIndex = args.indexOf("--write");
const writePath = writeIndex >= 0 ? args[writeIndex + 1] : undefined;
const writeSummaryIndex = args.indexOf("--write-summary");
const writeSummaryPath = writeSummaryIndex >= 0 ? args[writeSummaryIndex + 1] : undefined;
const configPath = valueAfter("--config") ?? join(repoRoot, "config/repos.json");
const config = JSON.parse(readFileSync(configPath, "utf8"));

const report = {
  schema: "aribs.telegram_surface_catalog.v1",
  generatedAt: new Date().toISOString(),
  safety: {
    mode: "read-only",
    storesSourceLines: false,
    storesSecretValues: false,
    sendsTelegram: false,
    mutatesRuntime: false,
    recipientValuesRedacted: true,
    tokenValuesRedacted: true
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
    schema: "aribs.telegram_surface_catalog_summary.v1",
    generatedAt: report.generatedAt,
    safety: report.safety,
    summary: report.summary,
    nextSteps: [
      "Promote one command family into a dry-run adapter first.",
      "Keep recipient ids and token values in their original secret stores.",
      "Do not send Telegram messages for verification."
    ],
    topSurfaces: prioritizeSurfaces(report.surfaces).slice(0, 80)
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
  return walk(repo.path).flatMap((path) => {
    if (!isInspectableFile(path)) return [];
    const text = safeRead(path);
    if (!isTelegramSurface(path, text)) return [];
    return [describeSurface(repo, path, text)];
  });
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
    ".build",
    ".claude",
    ".git",
    ".github",
    ".hypothesis",
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
  if (base === ".coverage") return false;
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

function safeRead(path) {
  const stat = statSync(path);
  if (stat.size > 512 * 1024) return "";
  try {
    return readFileSync(path, "utf8");
  } catch {
    return "";
  }
}

function isTelegramSurface(path, text) {
  return /telegram|telegraf|python-telegram-bot|sendMessage|api\.telegram\.org|CHAT_ID|BOT_TOKEN|ALLOWED_USER_IDS/i.test(`${path}\n${text}`);
}

function describeSurface(repo, path, text) {
  const relativePath = relative(repo.path, path);
  const kinds = surfaceKinds(relativePath, text);
  const envVariableKeys = extractEnvKeys(text);
  const commandTokens = extractCommandTokens(text);
  const sendPosture = classifySendPosture(relativePath, text);
  return {
    repo: repo.name,
    repoPath: repo.path,
    path: relativePath,
    kinds,
    sendPosture,
    migrationPosture: migrationPostureFor(repo.name, kinds, sendPosture),
    envVariableKeys,
    recipientConfigKeysPresent: envVariableKeys.filter((key) => /CHAT|USER|RECIPIENT|CHANNEL/i.test(key)),
    tokenConfigKeysPresent: envVariableKeys.filter((key) => /TOKEN/i.test(key)),
    commandTokens,
    hasTelegramApiUrl: /api\.telegram\.org/i.test(text),
    hasExplicitDryRunGuard: /dry[-_ ]?run|simulate|SAPPHIRE_PUBLISH_LIVE|NO_REAL_SEND|TELEGRAM_SEND_ENABLED|externalSideEffectsAllowed\s*[:=]\s*false/i.test(text)
  };
}

function surfaceKinds(path, text) {
  const haystack = `${path}\n${text}`;
  const kinds = new Set();
  if (/pm[_-]?bot|telegram-bot|operator|command/i.test(haystack)) kinds.add("operator-bot");
  if (/telegram_intel|intel.*telegram|history_export|reader|channel/i.test(haystack)) kinds.add("intel-ingestion");
  if (/digest|brief|notify|publisher|sendMessage/i.test(haystack)) kinds.add("notifier");
  if (/test|fixture|mock|fake/i.test(path)) kinds.add("test-fixture");
  if (/\.(md|yaml|yml|json|plist)$/.test(path)) kinds.add("config-or-runbook");
  if (kinds.size === 0) kinds.add("telegram-code");
  return [...kinds].sort();
}

function extractEnvKeys(text) {
  const keys = new Set();
  const patterns = [
    /\b[A-Z][A-Z0-9_]*(?:TELEGRAM|BOT_TOKEN|CHAT_ID|ALLOWED_USER_IDS|CHANNEL_ID)[A-Z0-9_]*\b/g,
    /\b(?:TELEGRAM|BOT_TOKEN|CHAT_ID|ALLOWED_USER_IDS|CHANNEL_ID)[A-Z0-9_]*\b/g,
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      keys.add(match[0]);
    }
  }
  return [...keys].sort();
}

function extractCommandTokens(text) {
  const tokens = new Set();
  if (!/telegram|bot command|command handler|pm[_-]?bot/i.test(text)) return [];
  for (const match of text.matchAll(/(?<![\w/])\/[a-z][a-z0-9_]{1,32}\b/g)) {
    const token = match[0];
    if (["/api", "/docs", "/health", "/start", "/help"].includes(token) || /^\/v\d+$/.test(token)) continue;
    tokens.add(token);
  }
  return [...tokens].sort().slice(0, 40);
}

function classifySendPosture(path, text) {
  const haystack = `${path}\n${text}`;
  const hasSendCall = /sendMessage|send_message|api\.telegram\.org\/bot|\.send\(/i.test(haystack);
  const hasDryRun = /dry[-_ ]?run|simulate|fake|mock|SAPPHIRE_PUBLISH_LIVE|NO_REAL_SEND|TELEGRAM_SEND_ENABLED|externalSideEffectsAllowed\s*[:=]\s*false/i.test(haystack);
  if (hasSendCall && hasDryRun) return "send-call-with-dry-run-guard";
  if (hasSendCall) return "explicit-send-call";
  if (hasDryRun) return "dry-run-or-disabled";
  if (/\.(md|yaml|yml|json|plist)$/.test(path)) return "documented-or-configured";
  return "unknown";
}

function migrationPostureFor(repoName, kinds, sendPosture) {
  if (repoName === "Project-Go-Forward") return "protected-read-only";
  if (sendPosture === "explicit-send-call") return "must-wrap-in-dry-run-adapter-before-migration";
  if (kinds.includes("operator-bot")) return "extract-command-contract-first";
  if (kinds.includes("intel-ingestion")) return "extract-read-only-ingestion-contract-first";
  if (kinds.includes("notifier")) return "extract-notification-template-and-dry-run-renderer-first";
  return "preserve-as-reference-until-owner-assigned";
}

function summarize(surfaces) {
  const summary = {
    total: surfaces.length,
    byRepo: {},
    byKind: {},
    bySendPosture: {},
    withRecipientConfigKeys: 0,
    withTokenConfigKeys: 0,
    withCommandTokens: 0,
    withExplicitDryRunGuard: 0
  };
  for (const surface of surfaces) {
    summary.byRepo[surface.repo] = (summary.byRepo[surface.repo] ?? 0) + 1;
    for (const kind of surface.kinds) {
      summary.byKind[kind] = (summary.byKind[kind] ?? 0) + 1;
    }
    summary.bySendPosture[surface.sendPosture] = (summary.bySendPosture[surface.sendPosture] ?? 0) + 1;
    if (surface.recipientConfigKeysPresent.length > 0) summary.withRecipientConfigKeys += 1;
    if (surface.tokenConfigKeysPresent.length > 0) summary.withTokenConfigKeys += 1;
    if (surface.commandTokens.length > 0) summary.withCommandTokens += 1;
    if (surface.hasExplicitDryRunGuard) summary.withExplicitDryRunGuard += 1;
  }
  return summary;
}

function prioritizeSurfaces(surfaces) {
  return [...surfaces]
    .filter((surface) => !surface.kinds.includes("test-fixture"))
    .filter((surface) => surface.sendPosture !== "documented-or-configured" || surface.envVariableKeys.length > 0)
    .sort((a, b) => surfacePriority(b) - surfacePriority(a));
}

function surfacePriority(surface) {
  let score = 0;
  if (surface.sendPosture === "explicit-send-call") score += 100;
  if (surface.sendPosture === "send-call-with-dry-run-guard") score += 90;
  if (surface.kinds.includes("operator-bot")) score += 40;
  if (surface.kinds.includes("notifier")) score += 30;
  if (surface.kinds.includes("intel-ingestion")) score += 20;
  if (surface.envVariableKeys.length > 0) score += 10;
  if (surface.hasExplicitDryRunGuard) score += 5;
  return score;
}

function printSummary(report) {
  console.log(`${report.schema} ${report.generatedAt}`);
  console.log(`telegram surfaces: ${report.summary.total}`);
  for (const [repo, count] of Object.entries(report.summary.byRepo)) {
    console.log(`- ${repo}: ${count}`);
  }
  console.log("send posture:");
  for (const [posture, count] of Object.entries(report.summary.bySendPosture)) {
    console.log(`- ${posture}: ${count}`);
  }
}
