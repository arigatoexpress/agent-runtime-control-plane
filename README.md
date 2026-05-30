# Agent Runtime Control Plane

Dry-run control plane for local runtime, repository inventory, and Telegram surface migration. It centralizes runtime scanners and publication-readiness plans without mutating live systems.

## What this does

This repo inventories runtime coupling across the workspace — x402 surfaces, Telegram/Hermes bots, LaunchAgents, local machine assumptions, and repo status — then emits read-only reports and migration plans. It is the migration destination for runtime-control contracts that used to be scattered across product repos.

## Quick start

```bash
npm install
npm test
npm run verify
```

**Key commands:**
```bash
npm run inventory              # Scan workspace runtime surfaces
npm run inventory:write        # Write data/latest-inventory.json
npm run contracts              # Scan contract endpoints across repos
npm run contracts:write        # Write data/contract-inventory.md + .json
npm run publication:plan       # Emit publication-readiness plan
```

## Architecture

```
Scanner scripts (inventory, surfaces, launchagents, telegram, frontends, contracts)
         │
         ▼
   Read-only JSON / Markdown reports in data/
         │
         ▼
   Publication audit + plan (dry-run, no mutations)
```

## Key features

- **Workspace inventory** — classify runtime coupling without reading secrets or source lines
- **Contract inventory** — discover machine-readable readiness endpoints across satellites
- **Publication planning** — audit tracked-source readiness and generated-output exclusion
- **Dry-run by default** — no `launchctl`, `systemctl`, or cloud runtime mutations
- **Telegram surface mapping** — catalog commands and migration posture without sending messages

## Tech stack

- Node.js ≥ 22
- JavaScript (ES modules, `.mjs`)
- Node built-in test runner

## Agent collaborators

See [AGENTS.md](AGENTS.md) for hard boundaries, working rules, and migration strategy.

## License

MIT
