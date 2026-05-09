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
  schema: "aribs.launchagent_catalog.v1",
  generatedAt: new Date().toISOString(),
  safety: {
    mode: "read-only",
    storesSecretValues: false,
    mutatesLaunchctl: false,
    loadsOrUnloadsAgents: false,
    environmentVariableValuesRedacted: true
  },
  agents: config.repos.flatMap(scanRepo)
};

report.summary = summarize(report.agents);

if (writePath) {
  const out = resolve(repoRoot, writePath);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Wrote ${out}`);
} else if (writeSummaryPath) {
  const out = resolve(repoRoot, writeSummaryPath);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, `${JSON.stringify({
    schema: "aribs.launchagent_catalog_summary.v1",
    generatedAt: report.generatedAt,
    safety: report.safety,
    summary: report.summary,
    agents: report.agents.map((agent) => ({
      repo: agent.repo,
      path: agent.path,
      label: agent.label,
      commandPath: agent.commandPath,
      commandArgCount: agent.commandArgCount,
      workingDirectory: agent.workingDirectory,
      schedule: agent.schedule,
      categories: agent.categories,
      migrationPosture: agent.migrationPosture,
      environmentVariableKeys: agent.environmentVariableKeys
    })),
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
  return walk(repo.path)
    .filter((path) => extname(path).toLowerCase() === ".plist")
    .map((path) => describePlist(repo, path))
    .filter(Boolean);
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

function describePlist(repo, path) {
  const plist = parsePlist(path);
  const label = stringValue(plist.Label) ?? labelFromText(path);
  const hasLaunchAgentShape = Boolean(label || plist.Program || plist.ProgramArguments || plist.RunAtLoad || plist.KeepAlive || plist.StartInterval);
  if (!hasLaunchAgentShape) return null;

  const text = safeRead(path);
  const commandArgs = Array.isArray(plist.ProgramArguments) ? plist.ProgramArguments.map(String) : [];
  const commandPath = stringValue(plist.Program) ?? commandArgs[0] ?? null;
  const schedule = {
    runAtLoad: Boolean(plist.RunAtLoad),
    keepAlive: plist.KeepAlive === undefined ? false : true,
    startIntervalSeconds: typeof plist.StartInterval === "number" ? plist.StartInterval : null,
    startCalendarConfigured: plist.StartCalendarInterval !== undefined
  };
  const categories = categoriesFor(path, text);

  return {
    repo: repo.name,
    repoPath: repo.path,
    path: relative(repo.path, path),
    label,
    commandPath,
    commandArgCount: commandArgs.length,
    workingDirectory: stringValue(plist.WorkingDirectory),
    standardOutPath: stringValue(plist.StandardOutPath),
    standardErrorPath: stringValue(plist.StandardErrorPath),
    schedule,
    categories,
    migrationPosture: postureFor(repo.name, categories),
    environmentVariableKeys: plist.EnvironmentVariables && typeof plist.EnvironmentVariables === "object"
      ? Object.keys(plist.EnvironmentVariables).sort()
      : []
  };
}

function parsePlist(path) {
  try {
    const json = execFileSync("plutil", ["-convert", "json", "-o", "-", path], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    });
    return JSON.parse(json);
  } catch {
    return parsePlistFallback(safeRead(path));
  }
}

function parsePlistFallback(text) {
  return {
    Label: text.match(/<key>Label<\/key>\s*<string>([^<]+)<\/string>/)?.[1],
    Program: text.match(/<key>Program<\/key>\s*<string>([^<]+)<\/string>/)?.[1],
    RunAtLoad: /<key>RunAtLoad<\/key>\s*<true\/>/.test(text),
    KeepAlive: /<key>KeepAlive<\/key>/.test(text) ? true : undefined,
    StartInterval: Number(text.match(/<key>StartInterval<\/key>\s*<integer>(\d+)<\/integer>/)?.[1]),
    StartCalendarInterval: /<key>StartCalendarInterval<\/key>/.test(text) ? true : undefined,
    WorkingDirectory: text.match(/<key>WorkingDirectory<\/key>\s*<string>([^<]+)<\/string>/)?.[1],
    StandardOutPath: text.match(/<key>StandardOutPath<\/key>\s*<string>([^<]+)<\/string>/)?.[1],
    StandardErrorPath: text.match(/<key>StandardErrorPath<\/key>\s*<string>([^<]+)<\/string>/)?.[1],
  };
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

function stringValue(value) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function labelFromText(path) {
  return path.split("/").pop()?.replace(/\.plist$/, "") ?? null;
}

function categoriesFor(path, text) {
  const signals = classifyText(`${path}\n${text}`);
  const categories = new Set();
  if (signals.telegram || /telegram|pm[_-]?bot|digest/i.test(path + text)) categories.add("telegram");
  if (signals.hermes || /hermes/i.test(path + text)) categories.add("hermes");
  if (/tradingview|cdp|pine/i.test(path + text)) categories.add("tradingview");
  if (/dashboard|control-plane|openbb/i.test(path + text)) categories.add("operator-ui");
  if (/gcp|foundry|sync/i.test(path + text)) categories.add("cloud-sync");
  if (/threat|security|cyber/i.test(path + text)) categories.add("security-intel");
  if (/alpha|trading|backtest|market/i.test(path + text)) categories.add("markets-research");
  if (signals.edgeRuntime) categories.add("edge-runtime");
  if (categories.size === 0) categories.add("local-runtime");
  return [...categories].sort();
}

function postureFor(repoName, categories) {
  if (repoName === "Project-Go-Forward") return "protected-read-only";
  if (categories.includes("telegram")) return "migrate-to-dry-run-telegram-catalog-first";
  if (categories.includes("tradingview") || categories.includes("markets-research")) return "paper-read-only-shadow-before-any-retirement";
  if (categories.includes("cloud-sync")) return "document-rollback-before-runtime-cutover";
  return "catalog-shadow-then-cutover-plan";
}

function summarize(agents) {
  const summary = {
    total: agents.length,
    byRepo: {},
    byCategory: {},
    withEnvironmentVariableKeys: 0,
    withKeepAlive: 0,
    withRunAtLoad: 0
  };
  for (const agent of agents) {
    summary.byRepo[agent.repo] = (summary.byRepo[agent.repo] ?? 0) + 1;
    for (const category of agent.categories) {
      summary.byCategory[category] = (summary.byCategory[category] ?? 0) + 1;
    }
    if (agent.environmentVariableKeys.length > 0) summary.withEnvironmentVariableKeys += 1;
    if (agent.schedule.keepAlive) summary.withKeepAlive += 1;
    if (agent.schedule.runAtLoad) summary.withRunAtLoad += 1;
  }
  return summary;
}

function printSummary(report) {
  console.log(`${report.schema} ${report.generatedAt}`);
  console.log(`launchagents: ${report.summary.total}`);
  for (const [repo, count] of Object.entries(report.summary.byRepo)) {
    console.log(`- ${repo}: ${count}`);
  }
  console.log("categories:");
  for (const [category, count] of Object.entries(report.summary.byCategory)) {
    console.log(`- ${category}: ${count}`);
  }
}

