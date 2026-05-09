# Quarantine Plan

Generated: 2026-05-09T22:28:51.189Z

This is a non-destructive plan. It does not move, delete, stash, reset, or patch any source repo.

## Hard Stops

- Do not delete source repos from this plan.
- Do not run destructive git commands.
- Do not preserve diffs that may contain secrets without scanning/review.
- Do not touch PGF/THO production behavior.
- Do not unload LaunchAgents, mutate cloud, send Telegram, trade, or move money.

## Dirty Repos To Preserve Before Any Archive

| Repo | Path | Branch | Dirty Count | Guidance |
| --- | --- | --- | ---: | --- |
| Sapphire-hack-perfect | `/Users/aribs/Code/Sapphire-hack-perfect` | `feat/hackathon-perfect` | 9 | Sapphire clone with WIP; preserve patch before archive/quarantine |
| Sapphire-slither | `/Users/aribs/Code/Sapphire-slither` | `feat/sentinel-slither-patches` | 2 | Sapphire clone with WIP; preserve patch before archive/quarantine |
| Sapphire-subpages | `/Users/aribs/Code/Sapphire-subpages` | `feat/sapphirealpha-subpages...origin/main [ahead 1, behind 120]` | 5 | Sapphire clone with WIP; preserve patch before archive/quarantine |
| SapphireAlpha | `/Users/aribs/Code/SapphireAlpha` | `master` | 1 | classify during focused cleanup pass |

Suggested preservation commands for a reviewed repo:

```bash
mkdir -p /Users/aribs/Code/_cleanup_backups/runtime-pivot-$(date +%Y%m%dT%H%M%S)
git -C <repo> status --porcelain=v1 -b > <backup-dir>/<repo-name>.status.txt
git -C <repo> diff --stat > <backup-dir>/<repo-name>.diffstat.txt
# Only after confirming the diff contains no secrets:
git -C <repo> diff --binary > <backup-dir>/<repo-name>.tracked.patch
git -C <repo> ls-files --others --exclude-standard > <backup-dir>/<repo-name>.untracked.txt
```

## Clean Archive Candidates

| Repo | Path | Branch | Guidance |
| --- | --- | --- | --- |
| Project-Go-Forward-a11y | `/Users/aribs/Code/Project-Go-Forward-a11y` | `feat/a11y-customer-pages...origin/chore/frontend-vitest-harness [gone]` | PGF clone/worktree candidate for archive after PR dependency check |
| Project-Go-Forward-adstudio-css | `/Users/aribs/Code/Project-Go-Forward-adstudio-css` | `refactor/adstudio-css-tailwind...origin/main [ahead 2, behind 73]` | PGF clone/worktree candidate for archive after PR dependency check |
| Project-Go-Forward-gmail-inbound | `/Users/aribs/Code/Project-Go-Forward-gmail-inbound` | `feat/gmail-inbound-scaffold...origin/main [ahead 2, behind 73]` | PGF clone/worktree candidate for archive after PR dependency check |
| Project-Go-Forward-photo-classify | `/Users/aribs/Code/Project-Go-Forward-photo-classify` | `feat/inventory-photo-classification...origin/main [ahead 2, behind 73]` | PGF clone/worktree candidate for archive after PR dependency check |
| Project-Go-Forward-rate-limiting | `/Users/aribs/Code/Project-Go-Forward-rate-limiting` | `feat/api-rate-limiting...origin/main [ahead 2, behind 73]` | PGF clone/worktree candidate for archive after PR dependency check |
| Sapphire-asfao | `/Users/aribs/Code/Sapphire-asfao` | `fix/asfao-bq-json-syntax...origin/fix/asfao-bq-json-syntax [gone]` | Sapphire clone candidate for archive/quarantine after confirming no dependency |
| Sapphire-awesome-mega | `/Users/aribs/Code/Sapphire-awesome-mega` | `docs/awesome-megaeth-ai-listing...origin/main [ahead 1, behind 112]` | Sapphire clone candidate for archive/quarantine after confirming no dependency |
| Sapphire-chainlink-2 | `/Users/aribs/Code/Sapphire-chainlink-2` | `feat/chainlink-extended-and-megaeth...origin/feat/arbitrum-gmx-chainlink-fallback [gone]` | Sapphire clone candidate for archive/quarantine after confirming no dependency |
| Sapphire-claude-md | `/Users/aribs/Code/Sapphire-claude-md` | `HEAD (no branch)` | Sapphire clone candidate for archive/quarantine after confirming no dependency |
| Sapphire-claude-md-tight | `/Users/aribs/Code/Sapphire-claude-md-tight` | `docs/claude-md-tight-refresh...origin/main [ahead 2, behind 93]` | Sapphire clone candidate for archive/quarantine after confirming no dependency |
| Sapphire-cypherpunk | `/Users/aribs/Code/Sapphire-cypherpunk` | `dashboard-cypherpunk-redesign` | Sapphire clone candidate for archive/quarantine after confirming no dependency |
| Sapphire-gate-hermes | `/Users/aribs/Code/Sapphire-gate-hermes` | `feat/chain-health-gate-hermes-primary...origin/main [ahead 5, behind 104]` | Sapphire clone candidate for archive/quarantine after confirming no dependency |
| Sapphire-gate-pkg | `/Users/aribs/Code/Sapphire-gate-pkg` | `feat/sentinel-gate-package...origin/feat/sentinel-gate-package [gone]` | Sapphire clone candidate for archive/quarantine after confirming no dependency |
| Sapphire-gemini | `/Users/aribs/Code/Sapphire-gemini` | `feat/brain-llm-gemini...origin/main [ahead 1, behind 119]` | Sapphire clone candidate for archive/quarantine after confirming no dependency |
| Sapphire-grants | `/Users/aribs/Code/Sapphire-grants` | `docs/grant-application-drafts...origin/docs/grant-application-drafts [gone]` | Sapphire clone candidate for archive/quarantine after confirming no dependency |
| Sapphire-hack | `/Users/aribs/Code/Sapphire-hack` | `feat/hackathon-frontend` | Sapphire clone candidate for archive/quarantine after confirming no dependency |
| Sapphire-hermes | `/Users/aribs/Code/Sapphire-hermes` | `feat/pyth-hermes-offchain-integration...origin/feat/pyth-hermes-offchain-integration [gone]` | Sapphire clone candidate for archive/quarantine after confirming no dependency |
| Sapphire-laneE-finish | `/Users/aribs/Code/Sapphire-laneE-finish` | `HEAD (no branch)` | Sapphire clone candidate for archive/quarantine after confirming no dependency |
| Sapphire-megaeth-b3 | `/Users/aribs/Code/Sapphire-megaeth-b3` | `feat/megaeth-wave-b3-gmx-v2...origin/feat/megaeth-wave-b5-plugin-tool [gone]` | Sapphire clone candidate for archive/quarantine after confirming no dependency |
| Sapphire-megaeth-executor | `/Users/aribs/Code/Sapphire-megaeth-executor` | `feat/megaeth-executor-scaffold...origin/feat/megaeth-executor-scaffold [gone]` | Sapphire clone candidate for archive/quarantine after confirming no dependency |
| Sapphire-megaeth-stable-dash | `/Users/aribs/Code/Sapphire-megaeth-stable-dash` | `feat/megaeth-stable-health-dashboard...origin/feat/megaeth-wave-b5-plugin-tool [gone]` | Sapphire clone candidate for archive/quarantine after confirming no dependency |
| Sapphire-megaeth-wave-b3 | `/Users/aribs/Code/Sapphire-megaeth-wave-b3` | `feat/megaeth-wave-b3-gmx...origin/feat/megaeth-wave-b5-plugin-tool [gone]` | Sapphire clone candidate for archive/quarantine after confirming no dependency |
| Sapphire-pitch | `/Users/aribs/Code/Sapphire-pitch` | `docs/sapphire-os-pitch...origin/main [ahead 1, behind 112]` | Sapphire clone candidate for archive/quarantine after confirming no dependency |
| Sapphire-ruff-b007 | `/Users/aribs/Code/Sapphire-ruff-b007` | `chore/lift-ruff-b007...origin/chore/lift-ruff-b007 [gone]` | Sapphire clone candidate for archive/quarantine after confirming no dependency |
| Sapphire-uxv2 | `/Users/aribs/Code/Sapphire-uxv2` | `feat/ux-overhaul-v2` | Sapphire clone candidate for archive/quarantine after confirming no dependency |

## Archive Procedure

1. Confirm there is no open PR, automation, LaunchAgent, or active terminal depending on the repo.
2. Preserve dirty state first when dirty count is nonzero.
3. Move clean inactive clones to a dated archive directory rather than deleting them.
4. Rerun `npm run repo-map:write` and `npm run quarantine-plan` after every archive move.

