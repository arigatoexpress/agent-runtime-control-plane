# Cleanup Backlog

## Now

- Run `npm run inventory:write` after any meaningful source repo change.
- Run `npm run repo-map:write` before repo cleanup decisions.
- Run `npm run surfaces:write` before runtime-control migration decisions.
- Run `npm run launchagents:summary` before any LaunchAgent consolidation plan.
- Run `npm run telegram:summary` before any Telegram command-path migration.
- Run `npm run quarantine-plan` before archiving stale clone repos.
- Use `data/latest-inventory.json` to choose one runtime category at a time.
- Use `data/repo-map.json` to separate canonical repos from stale clones.
- Use `data/runtime-surfaces.json` to identify specific Telegram, Hermes,
  LaunchAgent, Windows, and Pi files that need a shadow adapter or runbook.
- Use `data/launchagents-summary.json` for canonical plist labels, command path
  shape, schedule posture, categories, and env-var key names with values
  redacted.
- Use `data/telegram-surfaces-summary.json` for Telegram command/send posture,
  recipient-key presence, token-key presence, and dry-run guard presence.
- Use `data/quarantine-plan.md` to preserve dirty clone state before any archive
  move.

## Next Safe PRs

1. Convert the Telegram surface catalog into one dry-run adapter for a single
   command family.
2. Add LaunchAgent command-path existence/readiness checks without loading or
   unloading any services.
3. Add an x402 salvage map from Sapphire into AOE: products, routes, source
   registries, and tests to port.
4. Add a clone quarantine report that creates patches for dirty Sapphire clones
   without moving or deleting them.
5. Add MCP read-only resources for runtime inventory and repo map outputs.

## Requires Explicit Cutover

- Disabling LaunchAgents or Scheduled Tasks.
- Retiring Telegram command paths.
- Deleting or moving source repos.
- Removing production dashboards or routes.
- Changing DNS, GCP, Firestore/GCS, secrets, or branch protections.
