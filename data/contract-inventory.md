# Integration Contract Inventory

Generated: 2026-05-10T13:30:07.519Z

Safety posture: read-only metadata scan. No source lines, secret values, runtime mutations, Telegram sends, deploys, trading, wallet actions, or money movement.

## Summary

- Repos scanned: 5
- Existing repos: 5
- Contract-ready repos: 5
- Partial-contract repos: 0
- Expected contracts: 15
- Detected contracts: 15
- Dirty repos: 0
- Readiness counts: contract-ready=5
- Risk counts: low=4, medium=1

## Contract Status

| Repo | Readiness | Risk | Branch | Dirty | Detected | Contract routes | Missing | Recommendation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-opportunity-exchange | contract-ready | low | feat/buyer-contract-bundle | no | 4/4 | /v1/contracts (ok); /v1/readiness (ok); /.well-known/agent-opportunity-exchange.json (ok); /v1/x402/status (ok) | none | Keep as the canonical paid API contract source; downstream repos consume it instead of copying x402/payment logic. |
| regional-intel-workbench | contract-ready | low | feat/route-readiness-contract | no | 2/2 | /api/intel/contracts (ok); /openapi.json (ok) | none | Use as the regional data contract source after PR review; keep analyst local writes separate from public reads. |
| sapphire-sentinel | contract-ready | low | feat/frontend-workbench-shell | no | 3/3 | /api/frontend-contract (ok); /api/health (ok); /static/app.js (ok) | none | Keep as a standalone x402 consumer; use the frontend contract for browser-smoke automation before deeper UI polish. |
| megaeth-agent-guard | contract-ready | low | feat/static-workbench-assets | no | 3/3 | /api/frontend-contract (ok); /api/health (ok); /static/app.js (ok) | none | Promote the browser-smoke contract into the runtime catalog and keep live scouting as explicit read-only mode. |
| 0guard | contract-ready | medium | feat/frontend-action-contract | no | 3/3 | /api/frontend-contract (ok); /api/external-action-contracts (ok); /static/app.js (ok) | none | Use the external-action contract to quarantine posting/deploy/signing scripts before frontend extraction. |

## Refactor Order

1. agent-opportunity-exchange: Keep as the canonical paid API contract source; downstream repos consume it instead of copying x402/payment logic.
2. regional-intel-workbench: Use as the regional data contract source after PR review; keep analyst local writes separate from public reads.
3. sapphire-sentinel: Keep as a standalone x402 consumer; use the frontend contract for browser-smoke automation before deeper UI polish.
4. megaeth-agent-guard: Promote the browser-smoke contract into the runtime catalog and keep live scouting as explicit read-only mode.
5. 0guard: Use the external-action contract to quarantine posting/deploy/signing scripts before frontend extraction.
