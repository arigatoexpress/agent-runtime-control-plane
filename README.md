# Agent Runtime Control Plane

Standalone control-plane repo for migrating local-machine and Telegram agent
surfaces out of product repos without mutating the live systems.

The first slice is a read-only inventory tool that classifies runtime coupling
across the current workspace:

- x402 and payment-access surfaces;
- Telegram and Hermes surfaces;
- LaunchAgent, local Mac, Windows, Pi, and localhost assumptions;
- repo status and migration posture.

## Quick Start

```bash
npm test
npm run inventory
npm run inventory:write
npm run contracts
npm run contracts:write
npm run publication:plan
npm run verify
```

`npm run inventory:write` writes `data/latest-inventory.json`. The report stores
paths and category counts only. It does not store source lines, secrets, env
values, message bodies, payment headers, or runtime payloads.

`npm run contracts:write` writes `data/contract-inventory.md` and
`data/contract-inventory.json`. That report tracks machine-readable contract and
readiness endpoints across the x402, regional-intel, and hackathon satellite
repos so this control plane can consume contracts instead of absorbing product
code.

`npm run publication:plan` emits a non-mutating publication readiness plan. It
combines the tracked-source publication audit with ignored generated-data output
metadata, keeps generated inventories excluded from any public export, and
requires explicit approval before repository visibility changes.

## Current Strategy

Use this repo as the migration destination for runtime-control contracts and
dry-run adapters. Keep paid x402 products in
`/Users/aribs/Code/agent-opportunity-exchange`.

Target split:

- `agent-opportunity-exchange`: Hono/x402 paid artifact broker.
- `agent-runtime-control-plane`: dry-run runtime and messaging control plane.
- `wildfire-watch`: standalone wildfire situational-awareness product.
- `sapphire-sentinel` and hackathon repos: standalone demo/product repos that
  consume x402/MCP contracts rather than copying Sapphire internals.
- `Sapphire`: preserved as current command repo until each runtime surface has
  a tested replacement and rollback.

See [docs/MIGRATION_STRATEGY.md](docs/MIGRATION_STRATEGY.md).
