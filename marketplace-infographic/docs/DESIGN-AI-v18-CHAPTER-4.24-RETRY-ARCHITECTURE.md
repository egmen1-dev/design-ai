# DESIGN AI v18 — Chapter 4.24: Retry Architecture

## Purpose

Retry Architecture defines how Design AI fixes errors without destroying already-correct decisions. Retry is localized recovery — not a "generate again" button.

## Design Philosophy

```
Bad Result → Find Problem → Repair Problem → Generate Again
```

Retry starts with diagnosis, not generation.

## Pipeline Position

```
Generation → Vision Analysis → Consensus Engine → Chief Design Director → Retry Architecture → Partial Pipeline → New Generation
```

## Retry Levels

| Level | Name | Scope |
|-------|------|-------|
| 0 | No Retry | Accept result |
| 1 | Provider Retry | Re-render only, blueprint unchanged |
| 2 | Adapter Retry | Rebuild render intent, same blueprint |
| 3 | Technical Retry | Lighting, camera, materials directors |
| 4 | Creative Retry | Scene, composition directors |
| 5 | Full Pipeline Retry | Rare, most expensive |

## Retry Plan

```typescript
interface RetryPlan {
  retryLevel: RetryLevel;
  restartFrom: PipelineStage;
  preserveSections: string[];
  rebuildSections: string[];
  mutationPlan: BlueprintMutation[];
  estimatedCost: number;
  estimatedImprovement: number;
  confidence: number;
  reason: string;
}
```

## Key Behaviors

- **Blueprint preservation** — Story v1 kept, Lighting v2 rebuilt
- **Retry tree** — downstream sections only, never story/scene for lighting retry
- **Retry budget** — max attempts and cost caps
- **Adaptive escalation** — repeated lighting retry escalates to creative retry
- **Explainability** — every retry requires a reason

## Golden Rule

Retry must not recreate the system — it must repair only what is actually broken.

## Implementation

| Module | Role |
|--------|------|
| `retry-architecture-types.ts` | RetryPlan, levels, budget, history |
| `retry-architecture-engine.ts` | Level selection, scope, budget, adaptive escalation |

## Integration

Consumes Chief Review (Ch 4.19), Consensus Report (Ch 4.23), Vision Report, and retry history. Publishes `RetryPlan` for Lifecycle Manager — Retry Architecture never makes design decisions.
