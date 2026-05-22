#!/usr/bin/env node
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync
} from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const writePath = valueAfter("--write");
const writeJsonPath = valueAfter("--write-json");

const candidates = [
  {
    name: "sapphire-sentinel",
    path: "/Users/aribs/Code/sapphire-sentinel",
    productLane: "x402/MegaETH safety consumer",
    preferredNext: "Keep as the first standalone x402/MCP consumer demo; add contracts before visual churn."
  },
  {
    name: "megaeth-agent-guard",
    path: "/Users/aribs/Code/megaeth-agent-guard",
    productLane: "MegaETH agent-domain guard",
    preferredNext: "Keep standalone and add repeatable browser smoke around the blocked decision flow."
  },
  {
    name: "0guard",
    path: "/Users/aribs/Code/0guard",
    productLane: "0G / crypto-hack guard",
    preferredNext: "Extract public demo from docs/index.html and quarantine send/deploy scripts behind dry-run contracts before promotion."
  },
  {
    name: "AgenticArigato",
    path: "/Users/aribs/Code/AgenticArigato",
    productLane: "BD analytics agent prototype",
    preferredNext: "Treat as backend/agent source material; add a frontend only after the analytics API contract is clear."
  }
];

const report = {
  schema: "aribs.hackathon_demo_inventory.v1",
  generatedAt: new Date().toISOString(),
  safety: {
    mode: "read-only",
    storesSourceLines: false,
    storesSecretValues: false,
    mutatesRuntime: false,
    sendsTelegram: false,
    deploys: false,
    movesMoney: false
  },
  repos: candidates.map(scanCandidate)
};
report.summary = summarize(report.repos);
report.refactorOrder = buildRefactorOrder(report.repos);

const markdown = renderMarkdown(report);

if (writeJsonPath) {
  const out = resolve(repoRoot, writeJsonPath);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Wrote ${out}`);
}

if (writePath) {
  const out = resolve(repoRoot, writePath);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, markdown);
  console.log(`Wrote ${out}`);
} else if (!writeJsonPath) {
  console.log(markdown);
}

function valueAfter(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

function scanCandidate(candidate) {
  const exists = existsSync(candidate.path);
  const result = {
    name: candidate.name,
    path: candidate.path,
    productLane: candidate.productLane,
    exists,
    git: exists ? gitPosture(candidate.path) : { branch: null, dirty: null },
    frontendClass: "missing",
    readiness: "blocked",
    risk: "unknown",
    surfaces: {
      templates: [],
      staticAssets: [],
      docsPages: [],
      serverEntrypoints: [],
      tests: [],
      sendScripts: [],
      deployOrSigningScripts: [],
      packageFiles: []
    },
    counts: {
      templates: 0,
      staticAssets: 0,
      docsPages: 0,
      serverEntrypoints: 0,
      tests: 0,
      sendScripts: 0,
      deployOrSigningScripts: 0,
      packageFiles: 0
    },
    recommendation: "repo missing"
  };
  if (!exists) return result;

  for (const file of walk(candidate.path)) {
    const repoPath = relative(candidate.path, file);
    if (isTemplate(repoPath)) pushSurface(result, "templates", repoPath);
    if (isStaticAsset(repoPath)) pushSurface(result, "staticAssets", repoPath);
    if (isDocsPage(repoPath)) pushSurface(result, "docsPages", repoPath);
    if (isServerEntrypoint(repoPath)) pushSurface(result, "serverEntrypoints", repoPath);
    if (isTest(repoPath)) pushSurface(result, "tests", repoPath);
    if (isSendScript(repoPath)) pushSurface(result, "sendScripts", repoPath);
    if (isDeployOrSigningScript(repoPath)) pushSurface(result, "deployOrSigningScripts", repoPath);
    if (/(^|\/)(package\.json|pyproject\.toml)$/i.test(repoPath)) {
      pushSurface(result, "packageFiles", repoPath);
    }
  }

  trimSurfaces(result);
  classify(result, candidate.preferredNext);
  return result;
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
    ".mypy_cache",
    ".pytest_cache",
    ".ruff_cache",
    ".venv",
    "__pycache__",
    "build",
    "dist",
    "node_modules",
    "site-packages"
  ]).has(name);
}

function pushSurface(result, key, repoPath) {
  result.counts[key] += 1;
  if (result.surfaces[key].length < 18) {
    result.surfaces[key].push(summarizePath(result.path, repoPath));
  }
}

function summarizePath(root, repoPath) {
  const stat = statSync(join(root, repoPath));
  return { path: repoPath, bytes: stat.size };
}

function trimSurfaces(result) {
  for (const key of Object.keys(result.surfaces)) {
    result.surfaces[key].sort((left, right) => left.path.localeCompare(right.path));
  }
}

function classify(result, preferredNext) {
  const hasSplitAssets = result.counts.templates > 0 && result.counts.staticAssets >= 2;
  const hasDocsOnly = result.counts.docsPages > 0 && result.counts.templates === 0;
  const hasServerTemplates = result.surfaces.serverEntrypoints.some((entry) =>
    /templates\.py$/i.test(entry.path)
  );
  const hasExternalActionScripts =
    result.counts.sendScripts > 0 || result.counts.deployOrSigningScripts > 0;

  if (hasSplitAssets) {
    result.frontendClass = "split-server-rendered-demo";
    result.readiness = result.counts.tests > 0 ? "browser-smoke-ready" : "needs-tests";
    result.risk = hasExternalActionScripts ? "medium" : "low";
  } else if (hasDocsOnly) {
    result.frontendClass = "static-docs-demo";
    result.readiness = "needs-workbench-extraction";
    result.risk = hasExternalActionScripts ? "high" : "medium";
  } else if (hasServerTemplates) {
    result.frontendClass = "server-template-prototype";
    result.readiness = "needs-product-contract";
    result.risk = "medium";
  } else {
    result.frontendClass = "no-dedicated-demo-frontend";
    result.readiness = "backend-source-material";
    result.risk = hasExternalActionScripts ? "high" : "low";
  }

  result.recommendation = preferredNext;
}

function isTemplate(repoPath) {
  return /(^|\/)templates\/.*\.html$/i.test(repoPath);
}

function isStaticAsset(repoPath) {
  return /(^|\/)static\/.*\.(css|js|svg|png|jpg|jpeg|webp|json)$/i.test(repoPath);
}

function isDocsPage(repoPath) {
  return /^docs\/.*\.html$/i.test(repoPath);
}

function isServerEntrypoint(repoPath) {
  return /(^|\/)(app|server|main)\.py$/i.test(repoPath) || /(^|\/)templates\.py$/i.test(repoPath);
}

function isTest(repoPath) {
  return /(^|\/)tests\/.*test.*\.(py|ts|js)$/i.test(repoPath);
}

function isSendScript(repoPath) {
  return /(^|\/)(telegram|x|twitter).*\.py$/i.test(repoPath) ||
    /(^|\/).*_(post|send|bot)\.py$/i.test(repoPath);
}

function isDeployOrSigningScript(repoPath) {
  return /(^|\/)(deploy|sign|mint|anchor).*\.py$/i.test(repoPath) ||
    /(^|\/).*(deploy|sign|mint|anchor).*\.py$/i.test(repoPath);
}

function gitPosture(path) {
  try {
    const branch = execFileSync("git", ["branch", "--show-current"], {
      cwd: path,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
    const status = execFileSync("git", ["status", "--short"], {
      cwd: path,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
    return { branch: branch || "detached", dirty: Boolean(status) };
  } catch {
    return { branch: null, dirty: null };
  }
}

function summarize(repos) {
  return {
    repoCount: repos.length,
    existingRepoCount: repos.filter((repo) => repo.exists).length,
    dirtyRepoCount: repos.filter((repo) => repo.git.dirty).length,
    browserSmokeReadyCount: repos.filter((repo) => repo.readiness === "browser-smoke-ready").length,
    externalActionScriptRepos: repos
      .filter((repo) => repo.counts.sendScripts || repo.counts.deployOrSigningScripts)
      .map((repo) => repo.name),
    byFrontendClass: countBy(repos, "frontendClass"),
    byRisk: countBy(repos, "risk")
  };
}

function countBy(rows, key) {
  return rows.reduce((acc, row) => {
    acc[row[key]] = (acc[row[key]] ?? 0) + 1;
    return acc;
  }, {});
}

function buildRefactorOrder(repos) {
  return [
    "sapphire-sentinel",
    "megaeth-agent-guard",
    "0guard",
    "AgenticArigato"
  ].map((name) => {
    const repo = repos.find((item) => item.name === name);
    return {
      name,
      readiness: repo?.readiness ?? "missing",
      next: repo?.recommendation ?? "repo missing"
    };
  });
}

function renderMarkdown(value) {
  const rows = value.repos.map((repo) => {
    return `| ${escapeCell(repo.name)} | ${escapeCell(repo.frontendClass)} | ${escapeCell(repo.readiness)} | ${escapeCell(repo.risk)} | ${escapeCell(repo.git.branch ?? "missing")} | ${repo.git.dirty ? "yes" : "no"} | ${escapeCell(mainSurface(repo))} | ${escapeCell(repo.recommendation)} |`;
  });
  const order = value.refactorOrder.map((item, index) => {
    return `${index + 1}. ${item.name}: ${item.next}`;
  });

  return `# Hackathon Demo Inventory

Generated: ${value.generatedAt}

Safety posture: read-only metadata scan. No source lines, secret values, runtime mutations, Telegram sends, deploys, trading, wallet actions, or money movement.

## Summary

- Repos scanned: ${value.summary.repoCount}
- Existing repos: ${value.summary.existingRepoCount}
- Dirty repos: ${value.summary.dirtyRepoCount}
- Browser-smoke-ready demos: ${value.summary.browserSmokeReadyCount}
- Repos with nearby send/deploy/sign scripts: ${value.summary.externalActionScriptRepos.join(", ") || "none"}
- Frontend classes: ${formatCounts(value.summary.byFrontendClass)}
- Risk counts: ${formatCounts(value.summary.byRisk)}

## Demo Status

| Repo | Frontend class | Readiness | Risk | Branch | Dirty | Main surfaces | Recommendation |
| --- | --- | --- | --- | --- | --- | --- | --- |
${rows.join("\n")}

## Refactor Order

${order.join("\n")}
`;
}

function mainSurface(repo) {
  const items = [
    ...repo.surfaces.templates.map((entry) => entry.path),
    ...repo.surfaces.staticAssets.map((entry) => entry.path),
    ...repo.surfaces.docsPages.map((entry) => entry.path),
    ...repo.surfaces.serverEntrypoints.map((entry) => entry.path)
  ];
  return items.slice(0, 6).join("; ") || "none";
}

function formatCounts(counts) {
  return Object.entries(counts)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join(", ");
}

function escapeCell(value) {
  return String(value).replace(/\|/g, "\\|").replace(/\n/g, " ");
}
