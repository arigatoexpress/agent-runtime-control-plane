# Workspace Runtime Migration Strategy

## Target Architecture

Split the current workspace into four clean layers:

1. `agent-opportunity-exchange`: paid x402 artifact broker for rights-cleared
   intelligence products.
2. `agent-runtime-control-plane`: dry-run runtime-control and migration hub for
   Telegram, Hermes, LaunchAgents, local services, Windows tasks, Pi services,
   and operator approval gates.
3. Standalone domain repos: wildfire, cyber, regional, market, and hackathon
   projects with their own codebases and contracts.
4. `Sapphire`: current command repo and reference library until each surface is
   extracted, shadowed, verified, and retired through a reversible PR.

## Migration Order

1. Inventory current runtime coupling with `npm run inventory:write`.
2. Preserve canonical source-of-truth docs and configs in the original repos.
3. Mirror runtime contracts into this repo as dry-run adapters.
4. Add shadow comparison reports that prove the new repo sees the same state.
5. Move product-facing x402 work into `agent-opportunity-exchange`.
6. Convert hackathon repos into standalone x402/MCP consumers instead of
   Sapphire copies.
7. Retire duplicate local scripts, LaunchAgent docs, and Telegram surfaces only
   after rollback and soak evidence exist.

## Current Preserve Set

- Sapphire x402: `docs/ops/x402-product-spine.md`,
  `config/x402_products.json`, `config/x402_source_registry.json`,
  `config/agentwiki_artifacts.json`, `tools/agentwiki_x402_mcp/SKILL.md`.
- Sapphire runtime: `docs/ops/telegram-operator-console-runbook.md`,
  `services/pm_bot/README.md`, `docs/ops/telegram-intel-reader-runbook.md`,
  `docs/ops/hermes-runtime-readiness.md`, `scripts/ops/hermes_runtime_readiness.py`,
  `infra/launchagents/README.md`, `infra/org-repos.yaml`.
- AOE product kernel: `README.md`, `AGENTS.md`, `docs/API_CONTRACTS.md`,
  `docs/SAFETY_BOUNDARIES.md`, `docs/SAPPHIRE_TEARDOWN_PLAN.md`,
  `data/catalog/revenue-products.md`.
- Wildfire contracts: `docs/PHASE_0_RUNBOOK.md`,
  `docs/10-system-architecture.md`, `sapphire_integration/README.md`,
  `sapphire_integration/wildfire_signal_schema.json`.

## Cutover Gates

No runtime surface leaves its source repo until all of these are true:

- dry-run replacement exists in this repo;
- source and replacement produce comparable inventory/readiness outputs;
- rollback path is documented;
- secrets remain in their original secret stores;
- no live Telegram sends are required for verification;
- no live trading, money movement, or production data mutation is involved;
- the source repo has a focused PR or branch with tests and docs.

## Cleanup Policy

Generated caches and dependency directories can be ignored or removed only when
they are reproducible and outside protected paths. Tracked source, docs, local
runtime configs, receipts, and operational ledgers should be quarantined or
preserved until their replacement is proven.

