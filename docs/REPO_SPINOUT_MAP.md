# Repo Spinout Map

## Canonical Centers

| Center | Keep | Spin out or extract | Notes |
| --- | --- | --- | --- |
| `Sapphire` | Command repo, safety patterns, public/admin boundary, x402 reference contracts | Telegram, local-machine, LaunchAgent, Windows, Pi, and duplicated hackathon/product code | Do not delete runtime assets until this repo shadows them and rollback exists. |
| `agent-opportunity-exchange` | Hono/x402 product kernel, source-rights registry, receipts, paid artifact contracts | Telegram and local-machine assumptions | The canonical paid product lane. |
| `agent-runtime-control-plane` | Runtime inventory, dry-run adapters, approval gates, migration reports | Product data/adapters that belong in AOE or domain repos | New repo created for this pivot. |
| `wildfire-watch` | Fire situational-awareness product, hardware docs, public-safety runbooks | Sapphire/Hermes alert coupling | Keep read-only planning boundaries. |
| `Project-Go-Forward` | THO retail app and production docs | None by default | Protected unless Ari explicitly reopens scope. |
| `regional-intel-workbench` | Regional source patterns and digest ideas | Pi/systemd deployment ownership | Candidate for standalone regional intelligence product. |
| `cyber-threat-bot` | Defensive cyber source patterns | LaunchAgent scheduling | Candidate for AOE defensive adapter support or standalone defensive product. |
| `sapphire-sentinel` | Hackathon x402/MegaETH demo | Sapphire-internal runtime assumptions | Refactor as a standalone x402/MCP consumer. |

## Cleanup Waves

1. **Runtime Extraction**: inventory and shadow Telegram, Hermes, LaunchAgents,
   Windows tasks, Pi scripts, and local URLs in this repo.
2. **x402 Focus**: keep all new paid artifacts in AOE; treat Sapphire x402 as a
   reference to salvage, not the destination.
3. **Satellite Breakout**: convert hackathon and domain repos into standalone
   services with their own `AGENTS.md`, tests, and deployment contract.
4. **Clone Quarantine**: classify `Sapphire-*` and `Project-Go-Forward-*`
   clones; preserve dirty patches before archive.
5. **Cloud/Local Cleanup**: only after replacement reports exist, retire
   duplicate local routines through focused PRs and operator-approved runtime
   changes.

## Non-Goals For This First Pass

- No deleting repos.
- No unloading LaunchAgents.
- No Telegram send tests.
- No real x402 settlement.
- No cloud infrastructure mutation.
- No THO changes.

