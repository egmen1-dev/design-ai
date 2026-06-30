# DESIGN AI v18 — Chapter 4.18: Vision Quality Director

## Purpose

Vision Quality Director is the **first agent that analyzes the generated image**. It compares the real render result against the Render Blueprint — never aesthetic preference or new design decisions.

## Pipeline Position

```
Render Blueprint → Render Adapter → FLUX → Generated Background → Vision Quality Director → Vision Report
```

Runs immediately after background generation, before product compositing.

## Responsibilities (only)

- Image analysis against Blueprint
- Generation error detection
- Compositing feasibility assessment
- Retry recommendations (publish only — does not execute retry)

**Never:** story, scene, layout, lighting, or prompt decisions.

## Vision Quality Report

```typescript
interface VisionQualityReport {
  compositionScore: number;
  sceneAccuracy: number;
  lightingAccuracy: number;
  materialAccuracy: number;
  backgroundCleanliness: number;
  overlaySafety: number;
  providerArtifacts: number;
  overallScore: number;
  problems: VisionProblem[];
  retryRecommendation: RetryRecommendation;
  confidence: number;
}
```

Chapter 3.18 `VisionReport` (composite image QA without blueprint) remains for post-composite validation. Chapter 4.18 `VisionQualityReport` is blueprint-aligned background validation.

## Golden Rule

Vision Quality Director does not judge beauty — it checks how accurately the Render Provider executed the professional design decision described in the Render Blueprint.

## Implementation

| Module | Role |
|--------|------|
| `vision-quality-director-types.ts` | VisionQualityReport, problems, retry recommendations |
| `vision-quality-director-engine.ts` | Blueprint comparison, scoring, explainability |
| `agents/vision-quality-director-agent.ts` | Agent contract (RENDERING stage, read-only) |

## Integration

Uses image signals from `vision-qa-signals`, compares against Story, Scene, Lighting, Camera, Material, and Composition sections. Publishes `RetryRecommendation` for Recovery Engine — Accept, Retry Lighting, Retry Scene, Retry Full Render, or Reject.
