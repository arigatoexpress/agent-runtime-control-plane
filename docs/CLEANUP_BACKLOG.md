# Cleanup Backlog

## Now

- Run `npm run inventory:write` after any meaningful source repo change.
- Run `npm run repo-map:write` before repo cleanup decisions.
- Use `data/latest-inventory.json` to choose one runtime category at a time.
- Use `data/repo-map.json` to separate canonical repos from stale clones.

## Next Safe PRs

1. Add a dry-run Telegram surface catalog: commands, recipients as redacted
   presence flags, send/read-only posture, and owning repo.
2. Add a LaunchAgent catalog: label, source plist path, command path, owner, and
   dry-run readiness checks.
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

