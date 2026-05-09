#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const writeIndex = args.indexOf("--write");
const writePath = writeIndex >= 0 ? args[writeIndex + 1] : undefined;
const catalogPath = valueAfter("--catalog") ?? resolve(repoRoot, "data/launchagents-summary.json");
const configPath = valueAfter("--config") ?? resolve(repoRoot, "config/repos.json");

const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
const config = JSON.parse(readFileSync(configPath, "utf8"));
const repoByName = new Map(config.repos.map((repo) => [repo.name, repo]));
const rows = catalog.agents.map((agent) => assess(agent, repoByName.get(agent.repo)));
const report = {
  schema: "aribs.launchagent_readiness.v1",
  generatedAt: new Date().toISOString(),
  safety: {
    mode: "read-only",
    mutatesLaunchctl: false,
    loadsOrUnloadsAgents: false,
    executesAgentCommands: false,
    storesSecretValues: false
  },
  summary: summarize(rows),
  rows
};

const rendered = renderMarkdown(report);
if (writePath) {
  const out = resolve(repoRoot, writePath);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, rendered);
  console.log(`Wrote ${out}`);
} else {
  console.log(rendered);
}

function valueAfter(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

function assess(agent, repo) {
  const repoPath = repo?.path ?? null;
  const sourcePlistPath = repoPath ? join(repoPath, agent.path) : null;
  const sourcePlistExists = Boolean(sourcePlistPath && existsSync(sourcePlistPath));
  const command = assessCommandPath(agent.commandPath, agent.workingDirectory);
  const workingDirectory = assessPath(agent.workingDirectory);
  const issues = [];
  if (!sourcePlistExists) issues.push("source_plist_missing");
  if (command.status === "missing") issues.push("command_path_missing");
  if (command.status === "unknown") issues.push("command_path_unknown");
  if (workingDirectory.status === "missing") issues.push("working_directory_missing");
  if (workingDirectory.status === "unknown") issues.push("working_directory_unknown");
  const readiness = issues.some((issue) => issue.endsWith("_missing"))
    ? "blocked"
    : issues.length > 0
      ? "needs_review"
      : "ready_for_shadow_check";
  return {
    repo: agent.repo,
    path: agent.path,
    label: agent.label,
    categories: agent.categories,
    migrationPosture: agent.migrationPosture,
    sourcePlistExists,
    commandPath: agent.commandPath,
    commandStatus: command.status,
    commandCheckPath: command.checkPath,
    workingDirectory: agent.workingDirectory,
    workingDirectoryStatus: workingDirectory.status,
    readiness,
    issues
  };
}

function assessCommandPath(commandPath, workingDirectory) {
  if (!commandPath) return { status: "unknown", checkPath: null };
  if (isAbsolute(commandPath)) {
    return { status: existsSync(commandPath) ? "ok" : "missing", checkPath: commandPath };
  }
  if (workingDirectory && isAbsolute(workingDirectory)) {
    const candidate = join(workingDirectory, commandPath);
    return { status: existsSync(candidate) ? "ok" : "unknown", checkPath: candidate };
  }
  return { status: "unknown", checkPath: commandPath };
}

function assessPath(path) {
  if (!path) return { status: "unknown" };
  if (!isAbsolute(path)) return { status: "unknown" };
  return { status: existsSync(path) ? "ok" : "missing" };
}

function summarize(rows) {
  const summary = {
    total: rows.length,
    byReadiness: {},
    byIssue: {},
    byCategory: {},
    sourcePlistMissing: 0,
    commandPathMissing: 0,
    workingDirectoryMissing: 0
  };
  for (const row of rows) {
    summary.byReadiness[row.readiness] = (summary.byReadiness[row.readiness] ?? 0) + 1;
    if (!row.sourcePlistExists) summary.sourcePlistMissing += 1;
    if (row.commandStatus === "missing") summary.commandPathMissing += 1;
    if (row.workingDirectoryStatus === "missing") summary.workingDirectoryMissing += 1;
    for (const issue of row.issues) {
      summary.byIssue[issue] = (summary.byIssue[issue] ?? 0) + 1;
    }
    for (const category of row.categories) {
      summary.byCategory[category] = (summary.byCategory[category] ?? 0) + 1;
    }
  }
  return summary;
}

function renderMarkdown(report) {
  const lines = [
    "# LaunchAgent Readiness",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "This is a read-only source-file readiness pass. It does not call `launchctl`, load, unload, start, stop, or execute any LaunchAgent command.",
    "",
    "## Summary",
    "",
    `- total agents: ${report.summary.total}`,
    `- ready for shadow check: ${report.summary.byReadiness.ready_for_shadow_check ?? 0}`,
    `- needs review: ${report.summary.byReadiness.needs_review ?? 0}`,
    `- blocked: ${report.summary.byReadiness.blocked ?? 0}`,
    `- source plist missing: ${report.summary.sourcePlistMissing}`,
    `- command path missing: ${report.summary.commandPathMissing}`,
    `- working directory missing: ${report.summary.workingDirectoryMissing}`,
    "",
    "## Issue Counts",
    "",
    ...Object.entries(report.summary.byIssue).map(([issue, count]) => `- ${issue}: ${count}`),
    "",
    "## Blocked Or Needs Review",
    "",
  ];

  const attention = report.rows.filter((row) => row.readiness !== "ready_for_shadow_check");
  if (attention.length === 0) {
    lines.push("No blocked or review-needed LaunchAgents found.");
  } else {
    lines.push("| Label | Repo | Path | Readiness | Issues |");
    lines.push("| --- | --- | --- | --- | --- |");
    for (const row of attention) {
      lines.push(`| ${row.label} | ${row.repo} | \`${row.path}\` | ${row.readiness} | ${row.issues.join(", ")} |`);
    }
  }

  lines.push(
    "",
    "## Next Safe Step",
    "",
    "For each `ready_for_shadow_check` LaunchAgent, build a dry-run or artifact comparator in this repo before proposing any live runtime cutover.",
    ""
  );
  return `${lines.join("\n")}\n`;
}

