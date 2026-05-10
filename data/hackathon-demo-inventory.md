# Hackathon Demo Inventory

Generated: 2026-05-10T08:28:49.522Z

Safety posture: read-only metadata scan. No source lines, secret values, runtime mutations, Telegram sends, deploys, trading, wallet actions, or money movement.

## Summary

- Repos scanned: 4
- Existing repos: 4
- Dirty repos: 0
- Browser-smoke-ready demos: 2
- Repos with nearby send/deploy/sign scripts: sapphire-sentinel, 0guard
- Frontend classes: server-template-prototype=1, split-server-rendered-demo=2, static-docs-demo=1
- Risk counts: high=1, low=1, medium=2

## Demo Status

| Repo | Frontend class | Readiness | Risk | Branch | Dirty | Main surfaces | Recommendation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| sapphire-sentinel | split-server-rendered-demo | browser-smoke-ready | medium | feat/frontend-workbench-shell | no | templates/index.html; src/sapphire_sentinel/static/app.js; src/sapphire_sentinel/static/styles.css; src/sapphire_sentinel/app.py | Keep as the first standalone x402/MCP consumer demo; add contracts before visual churn. |
| megaeth-agent-guard | split-server-rendered-demo | browser-smoke-ready | low | feat/static-workbench-assets | no | templates/index.html; src/megaeth_agent_guard/static/app.js; src/megaeth_agent_guard/static/styles.css; src/megaeth_agent_guard/app.py | Keep standalone and add repeatable browser smoke around the blocked decision flow. |
| 0guard | static-docs-demo | needs-workbench-extraction | high | main | no | docs/index.html; src/guard0/app.py | Extract public demo from docs/index.html and quarantine send/deploy scripts behind dry-run contracts before promotion. |
| AgenticArigato | server-template-prototype | needs-product-contract | medium | main | no | bd-analytics-agent/app/server.py; bd-analytics-agent/app/templates.py; main.py | Treat as backend/agent source material; add a frontend only after the analytics API contract is clear. |

## Refactor Order

1. sapphire-sentinel: Keep as the first standalone x402/MCP consumer demo; add contracts before visual churn.
2. megaeth-agent-guard: Keep standalone and add repeatable browser smoke around the blocked decision flow.
3. 0guard: Extract public demo from docs/index.html and quarantine send/deploy scripts behind dry-run contracts before promotion.
4. AgenticArigato: Treat as backend/agent source material; add a frontend only after the analytics API contract is clear.
