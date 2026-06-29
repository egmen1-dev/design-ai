# DESIGN AI v18 — Chapter 4.6: Agent Context

## Purpose

Agent Context defines the unified mechanism for passing information to Design AI intelligent agents. Context is the agent's workspace and the **only** permitted input source.

## Design Philosophy

All agents receive information the same way — Creative Directors, Technical Directors, Critics, Orchestrators, and Learning Agents. Lifecycle always passes one object: **Agent Context**.

## Core Principle

Agent Context contains **data only**, never business logic. All computation is performed by the agent.

## Context Flow

```
Lifecycle Manager → Agent Context → Blueprint Agent → Agent Decision
```

Context is created immediately before agent execution and destroyed after `Execute()` completes.

## Structure

```typescript
interface AgentContext {
  blueprint: RenderBlueprint;
  snapshot?: BlueprintSnapshot;
  configuration: PipelineConfiguration;
  diagnostics: AgentDiagnosticContext;
  runtime: RuntimeContext;
}
```

| Field | Owner | Purpose |
|-------|-------|---------|
| `blueprint` | Lifecycle Manager | All design decisions |
| `snapshot` | Snapshot Manager | Immutable replay/debug copy |
| `configuration` | Pipeline Configuration | Mode, quality, flags |
| `diagnostics` | Diagnostic Engine | Pipeline ID, stage, retry, versions |
| `runtime` | Execution Environment | Provider, limits, feature flags |

## Policies

- **Read-only** — mutations only via Blueprint Mutation Engine after `Execute()`
- **Isolation** — each agent gets its own context instance
- **Lifetime** — exists only for agent execution
- **Security** — no secrets, tokens, or credentials
- **Transparency** — all agent inputs must be in context
- **Serialization** — full round-trip for replay and distributed execution

## Context Projection

Agents may receive a lightweight projection containing only sections they consume (from `AGENT_READ_MATRIX` / Agent Dependencies), reducing memory and network cost while logically operating on RenderBlueprint.

## Explainability

`explainContextUsage(agentId, context)` reports which sections were used, available, or missing — e.g. Composition Director used Story and Scene, not Vision Report.

## Implementation

| Module | Role |
|--------|------|
| `agent-context-types.ts` | Context structure, validation, projection, explainability types |
| `agent-context-engine.ts` | Build, validate, project, serialize, security scan |
| `universal-agent-contract.ts` | `createAgentContext()` bridges Ch 4.1 ↔ Ch 4.6 |

## Golden Rule

Agent Context is the **only** input source for any intelligent agent. Information from any other source violates the Agent Ecosystem architecture.
