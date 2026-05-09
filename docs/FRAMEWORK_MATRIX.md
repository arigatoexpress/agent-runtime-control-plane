# Framework Matrix

This is the current default stack after the 2026-05-09 architecture pivot
research pass.

## Defaults

| Lane | Default stack | Reason |
| --- | --- | --- |
| Paid artifact broker | Hono, official x402 SDK, Zod, Vitest, append-only provenance ledger | Small, TypeScript-native, portable, and already present in `agent-opportunity-exchange`. |
| x402 access rail | Official x402 Hono middleware in simulated/testnet mode first | Fits HTTP 402 semantics without inventing a payment contract. |
| Runtime-control extraction | This repo, Node 22, dry-run adapters, no live sends or service mutation | Local machine and Telegram control should not live in product repos. |
| Paid MCP interoperability | Official MCP TypeScript SDK plus x402 quote/preflight gates | Clean agent-buyer interface for resources and narrow tools. |
| Agent workflows | Mastra first for TypeScript agents, workflows, MCP, evals, and Studio | Best fit for a TS-first product once deterministic adapters are stable. |
| Server-owned agent runtime | OpenAI Agents SDK when approvals, tracing, handoffs, and guardrails are central | Better for audited orchestration and human review paths. |
| Durable jobs | Inngest or Trigger.dev before Temporal | Faster TypeScript scheduling and retries; Temporal only when workflow criticality justifies it. |
| Python-heavy analysis | FastAPI sidecars only where Python data/science tooling wins | Keeps the public paid API kernel simple while allowing serious analysis workers. |

## First Principles

- Payment is access control, not source-rights permission.
- Agents package and evaluate evidence after deterministic adapters fetch and
  normalize sources.
- Product repos should expose data contracts, not own local service topology.
- Runtime mutation belongs behind explicit approval and rollback.
- Every source adapter needs provenance, rights envelope, freshness, caveats,
  and normalized record hashes.

