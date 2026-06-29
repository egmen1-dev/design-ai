# DESIGN AI v18 — Chapter 4.4: Agent Discovery

> Реализация: `agent-discovery.ts`, `agent-discovery-engine.ts`

## Purpose

Agent Discovery определяет, **какие агенты нужны именно сейчас** — не какие существуют. Discovery не принимает дизайнерских решений.

## Golden Rule

Discovery никогда не выбирает лучший дизайн. Он определяет только участников текущего Pipeline.

## Discovery Pipeline

```text
RenderBlueprint → Lifecycle Stage → Agent Registry
    → Dependency Analysis → Capability Matching → Execution Plan
```

## API

```typescript
import {
  AgentDiscoveryEngine,
  discoverAgents,
  defaultPipelineConfiguration,
  PipelineMode,
} from "./render-blueprint";

const report = discoverAgents({
  blueprint,
  registry,
  configuration: defaultPipelineConfiguration({ mode: PipelineMode.STANDARD }),
  lifecycle: blueprint.lifecycle.stage,
  executedOnStage: [],
});

// report.plan.agents — ExecutionNode[]
// report.plan.parallelGroups — parallel batches
// report.excluded — reasons for skipped agents
```

## Pipeline Modes

| Mode | Behavior |
|------|----------|
| `standard` | Full agent chain |
| `fast_generation` | Skip commercial-photo-director, chief |
| `high_quality` | Enable chief + critics |
| `background_retry` | Lighting + render path only |
| `composite_retry` | Composite path without full creative chain |

## Discovery Rules

Agent included when ALL hold:
- Registered and ACTIVE
- Dependencies (consumed sections) ready
- Lifecycle stage matches
- Not already executed on stage
- Not filtered by pipeline mode
- Conditional rules pass (e.g. chief only if critics reported issues)

## Caching

Execution plan cached by `revision:lifecycle:mode` — recomputation forbidden without blueprint/mode change.

## Test

```bash
npx tsx src/lib/render-blueprint/agent-discovery.spec.ts
```
