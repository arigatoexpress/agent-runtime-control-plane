#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const writeIndex = args.indexOf("--write");
const writePath = writeIndex >= 0 ? args[writeIndex + 1] : undefined;
const repoMapPath = valueAfter("--repo-map") ?? resolve(repoRoot, "data/repo-map.json");
const repoMap = JSON.parse(readFileSync(repoMapPath, "utf8"));

const dirtyPreserve = repoMap.repos.filter((repo) => needsPreserve(repo));
const archiveCandidates = repoMap.repos.filter((repo) => isArchiveCandidate(repo));
const content = renderPlan(dirtyPreserve, archiveCandidates);

if (writePath) {
  const out = resolve(repoRoot, writePath);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, content);
  console.log(`Wrote ${out}`);
} else {
  console.log(content);
}

function valueAfter(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

function needsPreserve(repo) {
  return repo.dirtyCount > 0 && (repo.family === "sapphire" || repo.family === "project-go-forward" || repo.path.includes("/_worktrees/"));
}

function isArchiveCandidate(repo) {
  if (repo.dirtyCount > 0) return false;
  if (repo.name === "Sapphire" || repo.name === "Project-Go-Forward" || repo.name === "agent-opportunity-exchange") return false;
  if (repo.family === "sapphire" && repo.name.startsWith("Sapphire-")) return true;
  if (repo.family === "project-go-forward" && repo.name.startsWith("Project-Go-Forward-")) return true;
  return false;
}

function renderPlan(dirtyRepos, archiveRepos) {
  const lines = [
    "# Quarantine Plan",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "This is a non-destructive plan. It does not move, delete, stash, reset, or patch any source repo.",
    "",
    "## Hard Stops",
    "",
    "- Do not delete source repos from this plan.",
    "- Do not run destructive git commands.",
    "- Do not preserve diffs that may contain secrets without scanning/review.",
    "- Do not touch PGF/THO production behavior.",
    "- Do not unload LaunchAgents, mutate cloud, send Telegram, trade, or move money.",
    "",
    "## Dirty Repos To Preserve Before Any Archive",
    "",
  ];

  if (dirtyRepos.length === 0) {
    lines.push("No dirty preserve candidates found.");
  } else {
    lines.push("| Repo | Path | Branch | Dirty Count | Guidance |");
    lines.push("| --- | --- | --- | ---: | --- |");
    for (const repo of dirtyRepos) {
      lines.push(`| ${repo.name} | \`${repo.path}\` | \`${repo.branch}\` | ${repo.dirtyCount} | ${repo.guidance} |`);
    }
  }

  lines.push(
    "",
    "Suggested preservation commands for a reviewed repo:",
    "",
    "```bash",
    "mkdir -p /Users/aribs/Code/_cleanup_backups/runtime-pivot-$(date +%Y%m%dT%H%M%S)",
    "git -C <repo> status --porcelain=v1 -b > <backup-dir>/<repo-name>.status.txt",
    "git -C <repo> diff --stat > <backup-dir>/<repo-name>.diffstat.txt",
    "# Only after confirming the diff contains no secrets:",
    "git -C <repo> diff --binary > <backup-dir>/<repo-name>.tracked.patch",
    "git -C <repo> ls-files --others --exclude-standard > <backup-dir>/<repo-name>.untracked.txt",
    "```",
    "",
    "## Clean Archive Candidates",
    "",
  );

  if (archiveRepos.length === 0) {
    lines.push("No clean archive candidates found.");
  } else {
    lines.push("| Repo | Path | Branch | Guidance |");
    lines.push("| --- | --- | --- | --- |");
    for (const repo of archiveRepos) {
      lines.push(`| ${repo.name} | \`${repo.path}\` | \`${repo.branch}\` | ${repo.guidance} |`);
    }
  }

  lines.push(
    "",
    "## Archive Procedure",
    "",
    "1. Confirm there is no open PR, automation, LaunchAgent, or active terminal depending on the repo.",
    "2. Preserve dirty state first when dirty count is nonzero.",
    "3. Move clean inactive clones to a dated archive directory rather than deleting them.",
    "4. Rerun `npm run repo-map:write` and `npm run quarantine-plan` after every archive move.",
    ""
  );

  return `${lines.join("\n")}\n`;
}

