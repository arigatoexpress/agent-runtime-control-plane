# Generated Data Directory

This directory is for local, regenerated control-plane outputs.

The runtime scanners write metadata-only inventory files here, such as repo
maps, LaunchAgent summaries, Telegram surface summaries, frontend inventories,
and contract inventories. Those outputs can include sensitive-adjacent key
names, local paths, machine-specific state, and stale snapshots, so they are not
tracked as source.

Regenerate them with the repo scripts when needed:

- `npm run repo-map:write`
- `npm run inventory:write`
- `npm run surfaces:write`
- `npm run launchagents:summary`
- `npm run telegram:summary`
- `npm run frontends:write`
- `npm run contracts:write`
- `npm run hackathon-demos:write`
- `npm run quarantine-plan`
