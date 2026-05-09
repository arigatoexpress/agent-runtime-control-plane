# Agent Runtime Control Plane Charter

This repo is the clean migration target for local-machine, Telegram, Hermes,
LaunchAgent, Pi, Windows, and other runtime-control surfaces that should not be
embedded across product repos.

## Mission

Centralize runtime inventory, dry-run orchestration, and operator approval
boundaries while leaving product repos focused on their actual products.

This repo is not the x402 product broker. Keep `/Users/aribs/Code/agent-opportunity-exchange`
as the paid intelligence kernel. This repo owns the runtime-control layer that
used to be scattered through Sapphire and satellites.

## Hard Boundaries

- No real Telegram sends.
- No live trading, order signing, wallet actions, or money movement.
- No `launchctl load`, `launchctl unload`, `systemctl start`, `systemctl stop`,
  Scheduled Task mutation, or cloud runtime mutation without an explicit
  reversible cutover plan.
- No secret printing, copying, rotation, or embedding.
- No deletion of source repos, production data, GCP projects, DNS, Firestore,
  GCS, LaunchAgents, or local runtime assets.
- Product repos are read-only inputs unless a focused migration PR is opened
  from a clean branch or worktree.

## Working Rules

- Default to read-only scanners and generated reports.
- Store only metadata: file paths, counts, categories, hashes when useful, and
  migration recommendations.
- Preserve source repo ownership until replacement, shadow comparison, and
  rollback are documented.
- Keep Telegram and local-machine behavior behind dry-run adapters first.
- Treat every migration as extract, mirror, compare, then retire.

