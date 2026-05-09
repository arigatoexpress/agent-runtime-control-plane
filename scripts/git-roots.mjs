#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  writeFileSync
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const writeIndex = args.indexOf("--write");
const writePath = writeIndex >= 0 ? args[writeIndex + 1] : undefined;
const root = valueAfter("--root") ?? "/Users/aribs/Code";

const report = {
  schema: "aribs.git_repo_map.v1",
  generatedAt: new Date().toISOString(),
  root,
  safety: {
    mode: "read-only",
    ignoresBackupRoots: true,
    mutatesRepos: false
  },
  repos: findGitRoots(root).map(describeRepo)
};

report.families = groupFamilies(report.repos);

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

function findGitRoots(start) {
  if (!existsSync(start)) return [];
  const roots = [];
  walk(start, roots);
  return roots.sort();
}

function walk(dir, roots) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (shouldSkip(entry.name)) continue;
    const path = join(dir, entry.name);
    if (!entry.isDirectory()) continue;
    if (existsSync(join(path, ".git"))) {
      roots.push(path);
      continue;
    }
    walk(path, roots);
  }
}

function shouldSkip(name) {
  return new Set([
    ".Trash",
    ".git",
    ".next",
    ".venv",
    "__pycache__",
    "_cleanup_backups",
    "node_modules",
    "Library"
  ]).has(name);
}

function describeRepo(path) {
  const name = path.split("/").pop() ?? path;
  const status = git(path, ["status", "--porcelain=v1", "-b"]);
  const branchLine = status.split("\n")[0] ?? "";
  const changeLines = status.split("\n").slice(1).filter(Boolean);
  return {
    name,
    path,
    family: familyFor(name),
    branch: parseBranch(branchLine),
    dirtyCount: changeLines.length,
    statusSummary: summarizeStatus(changeLines),
    guidance: guidanceFor(name, path, changeLines.length)
  };
}

function git(path, args) {
  try {
    return execFileSync("git", ["-C", path, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
  } catch {
    return "";
  }
}

function parseBranch(line) {
  return line.replace(/^##\s*/, "") || "unknown";
}

function summarizeStatus(lines) {
  const summary = {};
  for (const line of lines) {
    const code = line.slice(0, 2);
    summary[code] = (summary[code] ?? 0) + 1;
  }
  return summary;
}

function familyFor(name) {
  if (/^Sapphire($|-)/.test(name) || /^sapphire/i.test(name)) return "sapphire";
  if (/^Project-Go-Forward/.test(name)) return "project-go-forward";
  if (/tradingview/i.test(name)) return "tradingview";
  if (/polymarket|polybot|prediction-market/i.test(name)) return "prediction-markets";
  if (/hermes|openclaw|NemoClaw|claw/i.test(name)) return "agent-runtime";
  if (/wildfire/i.test(name)) return "wildfire";
  if (/cyber/i.test(name)) return "cyber";
  if (/megaeth|sentinel|0guard/i.test(name)) return "hackathon";
  if (/agent-opportunity-exchange/.test(name)) return "x402-product";
  return "other";
}

function guidanceFor(name, path, dirtyCount) {
  if (name === "Sapphire") return "canonical command repo; keep clean and use worktrees for PRs";
  if (name === "agent-opportunity-exchange") return "canonical x402 product kernel";
  if (name === "Project-Go-Forward") return "protected THO repo; no edits unless explicitly opened";
  if (/^Sapphire-/.test(name)) {
    return dirtyCount > 0
      ? "Sapphire clone with WIP; preserve patch before archive/quarantine"
      : "Sapphire clone candidate for archive/quarantine after confirming no dependency";
  }
  if (/^Project-Go-Forward-/.test(name) || path.includes("/_worktrees/pgf-")) {
    return "PGF clone/worktree candidate for archive after PR dependency check";
  }
  if (path.includes("/_worktrees/")) return "worktree; confirm owner before pruning";
  return "classify during focused cleanup pass";
}

function groupFamilies(repos) {
  const families = {};
  for (const repo of repos) {
    const family = families[repo.family] ?? {
      repoCount: 0,
      dirtyCount: 0,
      repos: []
    };
    family.repoCount += 1;
    if (repo.dirtyCount > 0) family.dirtyCount += 1;
    family.repos.push({
      name: repo.name,
      path: repo.path,
      branch: repo.branch,
      dirtyCount: repo.dirtyCount,
      guidance: repo.guidance
    });
    families[repo.family] = family;
  }
  return families;
}

function printSummary(value) {
  console.log(`${value.schema} ${value.generatedAt}`);
  console.log(`root: ${value.root}`);
  console.log(`repos: ${value.repos.length}`);
  for (const [family, summary] of Object.entries(value.families)) {
    console.log(`- ${family}: ${summary.repoCount} repos, ${summary.dirtyCount} dirty`);
  }
}

