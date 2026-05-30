# Agent Runtime Control Plane — Agent Guidelines

## What this repo does

Dry-run migration control plane for local-machine, Telegram, Hermes, LaunchAgent, Pi, Windows, and other runtime surfaces. It inventories the workspace, scans contracts, and emits read-only reports and publication plans without mutating live systems.

## Key directories and files

| Path | Purpose |
|------|---------|
| `scripts/inventory.mjs` | Workspace runtime surface scanner |
| `scripts/runtime-surfaces.mjs` | Runtime coupling classifier |
| `scripts/launchagents.mjs` | macOS LaunchAgent inventory |
| `scripts/telegram-surfaces.mjs` | Telegram/Hermes command and surface catalog |
| `scripts/contract-inventory.mjs` | Machine-readable contract endpoint discovery |
| `scripts/publication-audit.mjs` | Tracked-source publication audit |
| `scripts/publication-plan.mjs` | Publication-readiness plan generator |
| `src/classifier.mjs` | Shared classification helpers |
| `tests/` | Node built-in test runner tests |
| `data/` | Generated reports (gitignored except `data/README.md`) |
| `docs/MIGRATION_STRATEGY.md` | Migration strategy document |

## How to run tests / dev

```bash
npm test                    # node --test tests/*.test.mjs
npm run test:portable       # subset of tests for CI
npm run verify:ci           # test:portable + check:scripts + publication:audit + publication:plan
npm run verify              # full verification with all scanners
npm run check:scripts       # node --check all scripts
```

## Safety boundaries

- No real Telegram sends.
- No live trading, order signing, wallet actions, or money movement.
- No `launchctl load/unload`, `systemctl start/stop`, Scheduled Task mutation, or cloud runtime mutation without an explicit reversible cutover plan.
- No secret printing, copying, rotation, or embedding.
- No deletion of source repos, production data, GCP projects, DNS, Firestore, GCS, LaunchAgents, or local runtime assets.
- Product repos are read-only inputs unless a focused migration PR is opened from a clean branch or worktree.

## Working rules

- Default to read-only scanners and generated reports.
- Store only metadata: file paths, counts, categories, hashes when useful, and migration recommendations.
- Preserve source repo ownership until replacement, shadow comparison, and rollback are documented.
- Keep Telegram and local-machine behavior behind dry-run adapters first.
- Treat every migration as extract, mirror, compare, then retire.

## Current status

Mature scanner suite. All core inventories and publication tools are tested. Target split:
- `agent-opportunity-exchange`: paid artifact broker (Hono/x402)
- `agent-runtime-control-plane`: this repo — dry-run runtime control
- `wildfire-watch`: standalone wildfire situational-awareness product
- `sapphire-sentinel` and hackathon repos: standalone demo/product repos consuming contracts
- `Sapphire`: preserved as current command repo until each surface has a tested replacement
