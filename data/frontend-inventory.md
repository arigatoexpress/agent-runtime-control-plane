# Frontend Inventory

Generated: 2026-05-10T03:29:12.373Z

Safety posture: read-only filename/package inventory. No source lines, secret values, runtime mutations, Telegram sends, trading, or money movement.

## Summary

- Repos scanned: 9
- Status counts: next-dashboard=1, protected-retail-react-app=1, react-vite-app=1, server-rendered-template-app=2, single-file-hono-workbench=1, thin-server-rendered-demo=3
- Risk counts: high=5, medium=3, protected=1

## Repo Frontend Status

| Repo | Status | Risk | Frameworks | Main surfaces | Autonomy recommendation |
| --- | --- | --- | --- | --- | --- |
| Sapphire | react-vite-app | medium | React, Vite, Vite React | 3 React/Next files; 610 templates; 22 static assets; 23 frontend/dashboard tests | Already has a modern app shell. Audit with browser smoke before any rewrite; avoid product-boundary churn. |
| agent-opportunity-exchange | single-file-hono-workbench | high | Hono, Hono Node, Vitest | src/frontend.ts (1187 lines); 1 templates; 1 frontend/dashboard tests | Refactor first in place: preserve Hono simplicity, make the UI a buyer workbench, and keep route/readiness/source proof visible. |
| wildfire-watch | server-rendered-template-app | medium | none detected | 3 templates; 5 static assets; 2 frontend/dashboard tests | Good standalone candidate, but likely needs an operator-grade workbench pass and production browser regression tests. |
| Project-Go-Forward | protected-retail-react-app | protected | React, Tailwind, Vite, Vite React | 18 React/Next files; 2 templates; 2 static assets; 7 frontend/dashboard tests | Do not fold into the x402/runtime cleanup. Treat as its own THO retail app with a focused, separately reviewed frontend track. |
| org-platform | next-dashboard | medium | Next.js, React | 3 React/Next files; 2 static assets | Useful scaffold/reference. Keep standalone and connect only through explicit API contracts. |
| regional-intel-workbench | server-rendered-template-app | high | none detected | 5 templates; 7 static assets | Good standalone candidate, but likely needs an operator-grade workbench pass and production browser regression tests. |
| cyber-threat-bot | thin-server-rendered-demo | high | none detected | 1 templates | Keep demo isolated; rebuild only after the product contract is clear. |
| megaeth-agent-guard | thin-server-rendered-demo | high | none detected | 1 templates | Keep demo isolated; rebuild only after the product contract is clear. |
| sapphire-sentinel | thin-server-rendered-demo | high | none detected | 1 templates | Keep demo isolated; rebuild only after the product contract is clear. |

## Refactor Order

1. agent-opportunity-exchange: fix the x402 buyer workbench first because it is the active product kernel and the UI is contained in one tested Hono surface.
2. wildfire-watch and regional-intel-workbench: keep standalone, then refactor as operational workbenches after the AOE product contract is stable.
3. Sapphire: treat as production-adjacent and split public/admin work carefully in a dedicated worktree before visual changes.
4. org-platform: keep as a reference Next dashboard scaffold, not a merge target.
5. Project-Go-Forward: protected THO retail scope; only change with explicit THO authorization.
6. hackathon satellites: preserve as standalone demos unless they become x402 consumers with clear contracts.
