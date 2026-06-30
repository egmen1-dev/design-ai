# DESIGN AI v18 — Chapter 4.19: Chief Design Director

## Purpose

Chief Design Director is the **main orchestrator** of the Design AI platform. It evaluates all prior agent reports, detects systemic contradictions, and makes the final approve/retry decision — never creating story, scene, lighting, or prompts.

## Pipeline Position

```
Vision Quality Director → Commercial Photographer → Chief Design Director → Approve / Retry
```

Runs only after all prior stages complete. Last design intelligence before the user sees the result.

## Responsibilities (only)

- Cross-agent report analysis and conflict detection
- Confidence fusion across all directors
- Retry strategy selection (localized vs full pipeline)
- Recommended blueprint mutations for Lifecycle Manager
- Cost-aware approval decisions

**Never:** direct blueprint mutation, design creation, or prompt writing.

## Chief Review

```typescript
interface ChiefReview {
  approved: boolean;
  overallScore: number;
  estimatedScoreAfterRetry: number;
  retryRequired: boolean;
  retryStrategy: RetryStrategy;
  priorityProblems: ChiefProblem[];
  recommendedMutations: BlueprintMutation[];
  finalDecision: FinalDecision;
  confidence: number;
}
```

## Retry Strategies

Localized retries preferred over full pipeline: `lighting_retry`, `camera_retry`, `material_retry`, `scene_retry`, `photography_retry`, `render_retry`, `full_pipeline_retry`.

## Golden Rule

Chief Design Director does not create design — it ensures all agent decisions work as one professional commercial photography system.

## Implementation

| Module | Role |
|--------|------|
| `chief-design-director-types.ts` | ChiefReview, RetryStrategy, problems |
| `chief-design-director-engine.ts` | Cross-agent analysis, confidence fusion, mutations |
| `agents/chief-design-director-agent.ts` | Agent contract (VALIDATED stage, read-only) |

## Integration

Consumes Vision Quality Report (Ch 4.18), Commercial Photographer review, agent confidence scores, and retry history. Publishes recommended mutations for Lifecycle Manager — Chief never applies mutations directly.
