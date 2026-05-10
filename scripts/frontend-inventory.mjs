#!/usr/bin/env node
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const configPath = valueAfter("--config") ?? join(repoRoot, "config/repos.json");
const writePath = valueAfter("--write");
const writeJsonPath = valueAfter("--write-json");
const config = JSON.parse(readFileSync(configPath, "utf8"));

const report = {
  schema: "aribs.frontend_inventory.v1",
  generatedAt: new Date().toISOString(),
  safety: {
    mode: "read-only",
    storesSourceLines: false,
    storesSecretValues: false,
    mutatesRuntime: false,
    sendsTelegram: false
  },
  repos: config.repos.map(scanRepo)
};
report.summary = summarize(report.repos);

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

function scanRepo(repo) {
  const result = {
    name: repo.name,
    path: repo.path,
    role: repo.role,
    posture: repo.posture,
    exists: existsSync(repo.path),
    frontendStatus: "missing",
    risk: "unknown",
    frameworks: [],
    packageSurfaces: [],
    surfaces: {
      stringFrontends: [],
      reactOrNext: [],
      templates: [],
      staticAssets: [],
      serverEntrypoints: [],
      tests: []
    },
    counts: {
      frontendFiles: 0,
      packageFiles: 0,
      templates: 0,
      staticAssets: 0,
      tests: 0
    },
    recommendation: "repo missing"
  };

  if (!result.exists) return result;

  const files = walk(repo.path);
  for (const filePath of files) {
    const repoPath = relative(repo.path, filePath);
    if (isFrontendFile(repoPath)) result.counts.frontendFiles += 1;
    if (repoPath.endsWith("package.json")) {
      result.counts.packageFiles += 1;
      inspectPackage(repo.path, repoPath, result);
    }
    if (isStringFrontend(repoPath)) result.surfaces.stringFrontends.push(summarizeFile(repo.path, repoPath));
    if (isReactOrNextSurface(repoPath)) result.surfaces.reactOrNext.push(repoPath);
    if (isTemplate(repoPath)) {
      result.counts.templates += 1;
      result.surfaces.templates.push(repoPath);
    }
    if (isStaticAsset(repoPath)) {
      result.counts.staticAssets += 1;
      result.surfaces.staticAssets.push(repoPath);
    }
    if (isServerEntrypoint(repoPath)) result.surfaces.serverEntrypoints.push(repoPath);
    if (isFrontendTest(repoPath)) {
      result.counts.tests += 1;
      result.surfaces.tests.push(repoPath);
    }
  }

  trimLists(result);
  classifyRepo(result);
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

function inspectPackage(root, repoPath, result) {
  let pkg;
  try {
    pkg = JSON.parse(readFileSync(join(root, repoPath), "utf8"));
  } catch {
    return;
  }
  const deps = {
    ...pkg.dependencies,
    ...pkg.devDependencies
  };
  const frameworks = [];
  for (const [name, label] of [
    ["next", "Next.js"],
    ["react", "React"],
    ["vite", "Vite"],
    ["@vitejs/plugin-react", "Vite React"],
    ["tailwindcss", "Tailwind"],
    ["hono", "Hono"],
    ["@hono/node-server", "Hono Node"],
    ["vitest", "Vitest"],
    ["playwright", "Playwright"]
  ]) {
    if (deps[name]) frameworks.push(label);
  }
  for (const framework of frameworks) {
    if (!result.frameworks.includes(framework)) result.frameworks.push(framework);
  }
  result.packageSurfaces.push({
    path: repoPath,
    name: pkg.name ?? null,
    scripts: Object.keys(pkg.scripts ?? {}).filter((script) => /dev|build|test|start|preview|verify/i.test(script)).sort(),
    frameworks
  });
}

function isFrontendFile(repoPath) {
  return /(^|\/)(frontend|templates|static|public|pages|components|app)\//i.test(repoPath) ||
    /(^|\/)src\/frontend\.(ts|tsx|js|jsx)$/i.test(repoPath) ||
    /\.(html|css|tsx|jsx)$/i.test(repoPath);
}

function isStringFrontend(repoPath) {
  return /(^|\/)src\/frontend\.(ts|js)$/i.test(repoPath);
}

function isReactOrNextSurface(repoPath) {
  return /(^|\/)(app|pages|components|src)\/.*\.(tsx|jsx)$/i.test(repoPath) ||
    /(^|\/)(vite|next)\.config\.(js|mjs|ts)$/i.test(repoPath);
}

function isTemplate(repoPath) {
  return /(^|\/)templates\/.*\.html$/i.test(repoPath) || /\.html$/i.test(repoPath);
}

function isStaticAsset(repoPath) {
  return /(^|\/)(static|public)\/.*\.(css|js|svg|png|jpg|jpeg|webp|json)$/i.test(repoPath);
}

function isServerEntrypoint(repoPath) {
  return /(^|\/)(app|server|main)\.(py|ts|js)$/i.test(repoPath) ||
    /(^|\/)src\/.*\/app\.py$/i.test(repoPath);
}

function isFrontendTest(repoPath) {
  return /frontend.*test|test.*frontend|dashboard.*test|__tests__\/.*\.(jsx|tsx|js|ts)$/i.test(repoPath);
}

function summarizeFile(root, repoPath) {
  const absolute = join(root, repoPath);
  const stat = statSync(absolute);
  let lineCount = null;
  if (stat.size < 512 * 1024) {
    lineCount = readFileSync(absolute, "utf8").split(/\r?\n/).length;
  }
  return { path: repoPath, bytes: stat.size, lineCount };
}

function trimLists(result) {
  for (const key of Object.keys(result.surfaces)) {
    result.surfaces[key] = result.surfaces[key].slice(0, 18);
  }
  result.packageSurfaces = result.packageSurfaces.slice(0, 8);
  result.frameworks.sort();
}

function classifyRepo(result) {
  if (result.name === "Project-Go-Forward") {
    result.frontendStatus = "protected-retail-react-app";
    result.risk = "protected";
    result.recommendation = "Do not fold into the x402/runtime cleanup. Treat as its own THO retail app with a focused, separately reviewed frontend track.";
    return;
  }

  if (result.surfaces.stringFrontends.length > 0) {
    result.frontendStatus = "single-file-hono-workbench";
    result.risk = "high";
    result.recommendation = "Refactor first in place: preserve Hono simplicity, make the UI a buyer workbench, and keep route/readiness/source proof visible.";
    return;
  }

  if (result.frameworks.includes("Next.js")) {
    result.frontendStatus = "next-dashboard";
    result.risk = "medium";
    result.recommendation = "Useful scaffold/reference. Keep standalone and connect only through explicit API contracts.";
    return;
  }

  if (result.frameworks.includes("React") || result.frameworks.includes("Vite")) {
    result.frontendStatus = "react-vite-app";
    result.risk = "medium";
    result.recommendation = "Already has a modern app shell. Audit with browser smoke before any rewrite; avoid product-boundary churn.";
    return;
  }

  if (result.counts.templates > 0 && result.counts.staticAssets > 0) {
    result.frontendStatus = "server-rendered-template-app";
    result.risk = result.counts.tests > 0 ? "medium" : "high";
    result.recommendation = "Good standalone candidate, but likely needs an operator-grade workbench pass and production browser regression tests.";
    return;
  }

  if (result.counts.templates > 0) {
    result.frontendStatus = "thin-server-rendered-demo";
    result.risk = "high";
    result.recommendation = "Keep demo isolated; rebuild only after the product contract is clear.";
    return;
  }

  if (result.counts.frontendFiles === 0) {
    result.frontendStatus = "no-dedicated-frontend";
    result.risk = "low";
    result.recommendation = "No frontend refactor pressure. Add UI later only if it becomes a control-plane product surface.";
    return;
  }

  result.frontendStatus = "mixed-or-unclear";
  result.risk = "medium";
  result.recommendation = "Inspect manually before changing; preserve source repo boundaries.";
}

function summarize(repos) {
  const byStatus = {};
  const byRisk = {};
  for (const repo of repos) {
    byStatus[repo.frontendStatus] = (byStatus[repo.frontendStatus] ?? 0) + 1;
    byRisk[repo.risk] = (byRisk[repo.risk] ?? 0) + 1;
  }
  return { repoCount: repos.length, byStatus, byRisk };
}

function renderMarkdown(value) {
  const rows = value.repos.map((repo) => {
    const surface = summarizeSurface(repo);
    const framework = repo.frameworks.length ? repo.frameworks.join(", ") : "none detected";
    return `| ${escapeCell(repo.name)} | ${escapeCell(repo.frontendStatus)} | ${escapeCell(repo.risk)} | ${escapeCell(framework)} | ${escapeCell(surface)} | ${escapeCell(repo.recommendation)} |`;
  });

  return `# Frontend Inventory

Generated: ${value.generatedAt}

Safety posture: read-only filename/package inventory. No source lines, secret values, runtime mutations, Telegram sends, trading, or money movement.

## Summary

- Repos scanned: ${value.summary.repoCount}
- Status counts: ${formatCounts(value.summary.byStatus)}
- Risk counts: ${formatCounts(value.summary.byRisk)}

## Repo Frontend Status

| Repo | Status | Risk | Frameworks | Main surfaces | Autonomy recommendation |
| --- | --- | --- | --- | --- | --- |
${rows.join("\n")}

## Refactor Order

1. agent-opportunity-exchange: fix the x402 buyer workbench first because it is the active product kernel and the UI is contained in one tested Hono surface.
2. wildfire-watch and regional-intel-workbench: keep standalone, then refactor as operational workbenches after the AOE product contract is stable.
3. Sapphire: treat as production-adjacent and split public/admin work carefully in a dedicated worktree before visual changes.
4. org-platform: keep as a reference Next dashboard scaffold, not a merge target.
5. Project-Go-Forward: protected THO retail scope; only change with explicit THO authorization.
6. hackathon satellites: preserve as standalone demos unless they become x402 consumers with clear contracts.
`;
}

function summarizeSurface(repo) {
  const surfaces = [];
  if (repo.surfaces.stringFrontends.length) {
    surfaces.push(repo.surfaces.stringFrontends.map((entry) => `${entry.path} (${entry.lineCount ?? "?"} lines)`).join("; "));
  }
  if (repo.surfaces.reactOrNext.length) surfaces.push(`${repo.surfaces.reactOrNext.length} React/Next files`);
  if (repo.counts.templates) surfaces.push(`${repo.counts.templates} templates`);
  if (repo.counts.staticAssets) surfaces.push(`${repo.counts.staticAssets} static assets`);
  if (repo.counts.tests) surfaces.push(`${repo.counts.tests} frontend/dashboard tests`);
  return surfaces.join("; ") || "none";
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
