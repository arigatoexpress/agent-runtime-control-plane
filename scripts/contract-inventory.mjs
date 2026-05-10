#!/usr/bin/env node
import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync
} from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const writePath = valueAfter("--write");
const writeJsonPath = valueAfter("--write-json");

const candidates = [
  {
    name: "agent-opportunity-exchange",
    path: "/Users/aribs/Code/agent-opportunity-exchange",
    productLane: "x402 paid intelligence kernel",
    expectedContracts: [
      {
        id: "aoe-contract-bundle",
        route: "/v1/contracts",
        schema: "aoe.contract_bundle.v1",
        access: "public-discovery",
        files: ["src/app.ts", "src/contracts.ts", "tests/contracts.test.ts"]
      },
      {
        id: "aoe-readiness",
        route: "/v1/readiness",
        schema: "aoe.readiness.v1",
        access: "public-readiness",
        files: ["src/app.ts", "src/readiness.ts", "tests/app.test.ts"]
      },
      {
        id: "aoe-well-known",
        route: "/.well-known/agent-opportunity-exchange.json",
        schema: "aoe.contract_bundle.v1",
        access: "agent-discovery",
        files: ["src/app.ts", "src/contracts.ts", "tests/app.test.ts", "tests/contracts.test.ts"]
      },
      {
        id: "aoe-pay-sh-rail-roadmap",
        route: "/v1/x402/status",
        schema: "aoe.x402.status.v1",
        access: "public-payment-rail-readiness",
        files: [
          "src/app.ts",
          "src/contracts.ts",
          "src/x402-config.ts",
          "tests/contracts.test.ts",
          "tests/x402-config.test.ts",
          "docs/X402_TESTNET.md"
        ]
      }
    ],
    preferredNext: "Keep as the canonical paid API contract source; downstream repos consume it instead of copying x402/payment logic."
  },
  {
    name: "regional-intel-workbench",
    path: "/Users/aribs/Code/regional-intel-workbench",
    productLane: "regional public-source intelligence",
    expectedContracts: [
      {
        id: "regional-route-readiness",
        route: "/api/intel/contracts",
        schema: "regional_intel.route_readiness.v1",
        access: "public-route-contract",
        files: ["app/main.py", "app/route_contracts.py", "tests/test_intel_app.py"]
      },
      {
        id: "regional-openapi",
        route: "/openapi.json",
        schema: "regional_intel.route_readiness.v1",
        access: "openapi-readback",
        files: ["app/main.py", "tests/test_intel_app.py"]
      }
    ],
    preferredNext: "Use as the regional data contract source after PR review; keep analyst local writes separate from public reads."
  },
  {
    name: "sapphire-sentinel",
    path: "/Users/aribs/Code/sapphire-sentinel",
    productLane: "x402/MegaETH safety consumer demo",
    expectedContracts: [
      {
        id: "sentinel-frontend-contract",
        route: "/api/frontend-contract",
        schema: "sapphire_sentinel.frontend_contract.v1",
        access: "browser-smoke-contract",
        files: ["src/sapphire_sentinel/app.py", "tests/test_app.py"]
      },
      {
        id: "sentinel-health",
        route: "/api/health",
        schema: "service-health",
        access: "health-readiness",
        files: ["src/sapphire_sentinel/app.py", "tests/test_app.py"]
      },
      {
        id: "sentinel-packaged-workbench-assets",
        route: "/static/app.js",
        schema: "packaged-frontend-assets",
        access: "browser-smoke-packaged-assets",
        files: [
          "src/sapphire_sentinel/templates/index.html",
          "src/sapphire_sentinel/static/styles.css",
          "src/sapphire_sentinel/static/app.js",
          "pyproject.toml",
          "Dockerfile",
          "tests/test_app.py"
        ]
      }
    ],
    preferredNext: "Keep as a standalone x402 consumer; use the frontend contract for browser-smoke automation before deeper UI polish."
  },
  {
    name: "megaeth-agent-guard",
    path: "/Users/aribs/Code/megaeth-agent-guard",
    productLane: "MegaETH agent-domain guard",
    expectedContracts: [
      {
        id: "megaeth-frontend-contract",
        route: "/api/frontend-contract",
        schema: "megaeth_agent_guard.frontend_contract.v1",
        access: "browser-smoke-contract",
        files: ["src/megaeth_agent_guard/app.py", "tests/test_app.py"]
      },
      {
        id: "megaeth-health",
        route: "/api/health",
        schema: "service-health",
        access: "health-readiness",
        files: ["src/megaeth_agent_guard/app.py", "tests/test_app.py"]
      },
      {
        id: "megaeth-packaged-workbench-assets",
        route: "/static/app.js",
        schema: "packaged-frontend-assets",
        access: "browser-smoke-packaged-assets",
        files: [
          "src/megaeth_agent_guard/templates/index.html",
          "src/megaeth_agent_guard/static/styles.css",
          "src/megaeth_agent_guard/static/app.js",
          "pyproject.toml",
          ".github/workflows/ci.yml",
          "tests/test_app.py"
        ]
      }
    ],
    preferredNext: "Promote the browser-smoke contract into the runtime catalog and keep live scouting as explicit read-only mode."
  },
  {
    name: "0guard",
    path: "/Users/aribs/Code/0guard",
    productLane: "0G / crypto-hack guard",
    expectedContracts: [
      {
        id: "0guard-frontend-contract",
        route: "/api/frontend-contract",
        schema: "0guard.frontend_contract.v1",
        access: "browser-smoke-contract",
        files: ["src/guard0/app.py", "tests/test_app.py"]
      },
      {
        id: "0guard-external-actions",
        route: "/api/external-action-contracts",
        schema: "0guard.external_action_contracts.v1",
        access: "dry-run-action-contract",
        files: ["src/guard0/app.py", "tests/test_app.py"]
      },
      {
        id: "0guard-packaged-workbench-assets",
        route: "/static/app.js",
        schema: "packaged-frontend-assets",
        access: "browser-smoke-packaged-assets",
        files: [
          "src/guard0/templates/index.html",
          "src/guard0/static/styles.css",
          "src/guard0/static/app.js",
          "pyproject.toml",
          "tests/test_app.py"
        ]
      }
    ],
    preferredNext: "Use the external-action contract to quarantine posting/deploy/signing scripts before frontend extraction."
  }
];

const report = {
  schema: "aribs.integration_contract_inventory.v1",
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
    readiness: "missing",
    risk: "unknown",
    browserSmoke: exists ? browserSmokePosture(candidate.path) : emptyBrowserSmokePosture(),
    contracts: [],
    detectedRoutes: [],
    detectedSchemas: [],
    counts: {
      expectedContracts: candidate.expectedContracts.length,
      detectedContracts: 0,
      missingContracts: 0,
      detectedRoutes: 0,
      detectedSchemas: 0,
      evidenceFiles: 0,
      tests: 0
    },
    recommendation: exists ? candidate.preferredNext : "repo missing"
  };
  if (!exists) return result;

  const fileTexts = new Map();
  for (const contract of candidate.expectedContracts) {
    const evidenceFiles = contract.files.map((repoPath) =>
      summarizeEvidenceFile(candidate.path, repoPath)
    );
    const texts = [];
    for (const file of evidenceFiles) {
      if (!file.exists) continue;
      result.counts.evidenceFiles += 1;
      if (/(^|\/)tests?\//i.test(file.path)) result.counts.tests += 1;
      const text = readCachedFile(candidate.path, file.path, fileTexts);
      texts.push(text);
      for (const route of detectRoutes(text)) {
        if (!result.detectedRoutes.includes(route)) result.detectedRoutes.push(route);
      }
      for (const schema of detectSchemas(text)) {
        if (!result.detectedSchemas.includes(schema)) result.detectedSchemas.push(schema);
      }
    }
    const combined = texts.join("\n");
    const routePresent = combined.includes(contract.route);
    const schemaPresent = isMetadataSchema(contract.schema) || combined.includes(contract.schema);
    const detected = routePresent && schemaPresent;
    result.contracts.push({
      id: contract.id,
      route: contract.route,
      schema: contract.schema,
      access: contract.access,
      detected,
      routePresent,
      schemaPresent,
      evidenceFiles
    });
  }

  result.detectedRoutes.sort();
  result.detectedSchemas.sort();
  result.counts.detectedRoutes = result.detectedRoutes.length;
  result.counts.detectedSchemas = result.detectedSchemas.length;
  result.counts.detectedContracts = result.contracts.filter((item) => item.detected).length;
  result.counts.missingContracts = result.counts.expectedContracts - result.counts.detectedContracts;
  classify(result);
  return result;
}

function isMetadataSchema(schema) {
  return schema === "service-health" || schema === "packaged-frontend-assets";
}

function summarizeEvidenceFile(root, repoPath) {
  const absolute = join(root, repoPath);
  if (!existsSync(absolute)) {
    return { path: repoPath, exists: false, bytes: 0 };
  }
  return { path: repoPath, exists: true, bytes: statSync(absolute).size };
}

function emptyBrowserSmokePosture() {
  return {
    ready: false,
    scriptPresent: false,
    command: null,
    ciIntegrated: false,
    evidenceFiles: [],
    assertedDisabledCapabilities: []
  };
}

function browserSmokePosture(root) {
  const evidencePaths = [
    "scripts/browser_smoke.py",
    "browser-smoke/aoe-workbench.spec.ts",
    "playwright.config.ts",
    ".github/workflows/ci.yml",
    "package.json",
    "README.md"
  ];
  const evidenceFiles = evidencePaths
    .map((repoPath) => summarizeEvidenceFile(root, repoPath))
    .filter((file) => file.exists);
  const texts = evidenceFiles.map((file) => readFileSync(join(root, file.path), "utf8"));
  const combined = texts.join("\n");
  const scriptPresent = evidenceFiles.some((file) =>
    file.path === "scripts/browser_smoke.py" || file.path.startsWith("browser-smoke/")
  );
  const command = detectBrowserSmokeCommand(combined);
  const ciIntegrated = /\.github\/workflows\/ci\.yml/.test(
    evidenceFiles.map((file) => file.path).join("\n")
  ) && /browser[-\s:]?smoke|browser_smoke|playwright test/i.test(combined);
  const assertedDisabledCapabilities = detectDisabledCapabilityAssertions(combined);
  return {
    ready: scriptPresent && Boolean(command) && ciIntegrated,
    scriptPresent,
    command,
    ciIntegrated,
    evidenceFiles,
    assertedDisabledCapabilities
  };
}

function detectBrowserSmokeCommand(text) {
  if (/["']browser:smoke["']\s*:\s*["']playwright test["']/.test(text)) {
    return "npm run browser:smoke";
  }
  if (/python(?:3)?\s+scripts\/browser_smoke\.py/.test(text)) {
    return "python scripts/browser_smoke.py";
  }
  if (/scripts\/browser_smoke\.py/.test(text)) {
    return "python scripts/browser_smoke.py";
  }
  return null;
}

function detectDisabledCapabilityAssertions(text) {
  const capabilities = [
    ["liveSettlementEnabled", /liveSettlementEnabled["']?\]?\s*(?:is|===?)\s*False|liveSettlementEnabled["']?: false/i],
    ["executionEnabled", /executionEnabled["']?\]?\s*(?:is|===?)\s*False|executionEnabled["']?: false/i],
    ["telegramSendsEnabled", /telegramSendsEnabled["']?\]?\s*(?:is|===?)\s*False|telegramSendsEnabled["']?: false/i],
    ["moneyMovementEnabled", /moneyMovementEnabled["']?\]?\s*(?:is|===?)\s*False|moneyMovementEnabled["']?: false/i],
    ["transactionSigningEnabled", /transactionSigningEnabled["']?\]?\s*(?:is|===?)\s*False|transactionSigningEnabled["']?: false/i],
    ["workbenchCanTriggerLiveActions", /workbenchCanTriggerLiveActions["']?\]?\s*(?:is|===?)\s*False|workbenchCanTriggerLiveActions["']?: false/i],
    ["liveProviderCredentialsAllowed", /liveProviderCredentialsAllowed=false|liveProviderCredentialsAllowed["']?: false/i],
    ["liveSettlementAllowed", /liveSettlementAllowed=false|liveSettlementAllowed["']?: false/i]
  ];
  return capabilities
    .filter(([, pattern]) => pattern.test(text))
    .map(([name]) => name)
    .sort();
}

function readCachedFile(root, repoPath, cache) {
  if (!cache.has(repoPath)) {
    cache.set(repoPath, readFileSync(join(root, repoPath), "utf8"));
  }
  return cache.get(repoPath);
}

function detectRoutes(text) {
  const routes = new Set();
  for (const match of text.matchAll(/["'`]((?:\/(?:api|v1|\.well-known|healthz)[^"'`\\\s)]*)|\/)["'`]/g)) {
    routes.add(match[1]);
  }
  return [...routes].filter((route) => !route.includes("${")).slice(0, 80);
}

function detectSchemas(text) {
  const schemas = new Set();
  for (const match of text.matchAll(/["'`]([a-z0-9_]+(?:\.[a-z0-9_]+){1,}\.v\d+)["'`]/gi)) {
    schemas.add(match[1]);
  }
  return [...schemas].slice(0, 120);
}

function classify(result) {
  if (result.counts.missingContracts === 0 && result.counts.tests > 0) {
    result.readiness = "contract-ready";
  } else if (result.counts.detectedContracts > 0) {
    result.readiness = "partial-contract";
  } else {
    result.readiness = "needs-contract";
  }

  const hasLocalWrites = result.contracts.some((item) => /action|external/i.test(item.access));
  const hasDirtyWork = result.git.dirty;
  if (hasDirtyWork) {
    result.risk = "review-dirty-worktree";
  } else if (hasLocalWrites) {
    result.risk = "medium";
  } else {
    result.risk = "low";
  }
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
    contractReadyCount: repos.filter((repo) => repo.readiness === "contract-ready").length,
    partialContractCount: repos.filter((repo) => repo.readiness === "partial-contract").length,
    expectedContractCount: repos.reduce((sum, repo) => sum + repo.counts.expectedContracts, 0),
    detectedContractCount: repos.reduce((sum, repo) => sum + repo.counts.detectedContracts, 0),
    dirtyRepoCount: repos.filter((repo) => repo.git.dirty).length,
    browserSmokeReadyCount: repos.filter((repo) => repo.browserSmoke.ready).length,
    byReadiness: countBy(repos, "readiness"),
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
    "agent-opportunity-exchange",
    "regional-intel-workbench",
    "sapphire-sentinel",
    "megaeth-agent-guard",
    "0guard"
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
    const missing = repo.contracts
      .filter((item) => !item.detected)
      .map((item) => item.id)
      .join(", ") || "none";
    const routes = repo.contracts
      .map((item) => `${item.route} (${item.detected ? "ok" : "missing"})`)
      .join("; ");
    const browserSmoke = repo.browserSmoke.ready
      ? `ready (${repo.browserSmoke.command})`
      : "missing";
    return `| ${escapeCell(repo.name)} | ${escapeCell(repo.readiness)} | ${escapeCell(repo.risk)} | ${escapeCell(repo.git.branch ?? "missing")} | ${repo.git.dirty ? "yes" : "no"} | ${repo.counts.detectedContracts}/${repo.counts.expectedContracts} | ${escapeCell(browserSmoke)} | ${escapeCell(routes)} | ${escapeCell(missing)} | ${escapeCell(repo.recommendation)} |`;
  });
  const order = value.refactorOrder.map((item, index) => {
    return `${index + 1}. ${item.name}: ${item.next}`;
  });

  return `# Integration Contract Inventory

Generated: ${value.generatedAt}

Safety posture: read-only metadata scan. No source lines, secret values, runtime mutations, Telegram sends, deploys, trading, wallet actions, or money movement.

## Summary

- Repos scanned: ${value.summary.repoCount}
- Existing repos: ${value.summary.existingRepoCount}
- Contract-ready repos: ${value.summary.contractReadyCount}
- Partial-contract repos: ${value.summary.partialContractCount}
- Expected contracts: ${value.summary.expectedContractCount}
- Detected contracts: ${value.summary.detectedContractCount}
- Browser-smoke ready repos: ${value.summary.browserSmokeReadyCount}
- Dirty repos: ${value.summary.dirtyRepoCount}
- Readiness counts: ${formatCounts(value.summary.byReadiness)}
- Risk counts: ${formatCounts(value.summary.byRisk)}

## Contract Status

| Repo | Readiness | Risk | Branch | Dirty | Detected | Browser smoke | Contract routes | Missing | Recommendation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${rows.join("\n")}

## Refactor Order

${order.join("\n")}
`;
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
