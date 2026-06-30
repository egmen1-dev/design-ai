# DESIGN AI v18 — Chapter 6.14: Vision Validation Stage

## Purpose

Vision Validation is the first quality control stage after image generation. While Consensus Validation verified design decisions before rendering, Vision Validation checks how accurately the Render Provider implemented the Blueprint.

## Design Philosophy

```text
Blueprint → Rendering → Vision Validation → Commercial Validation → Approval
```

Receiving an image is not the end of the pipeline — it is the start of objective evaluation.

## Responsibilities

| Area | Output |
|------|--------|
| Image analysis | blueprint-aligned signal extraction |
| Blueprint matching | scene, lighting, composition fidelity |
| Hero product | scale, visibility, deformations |
| Artifact detection | AI generation defects |
| Technical quality | sharpness, exposure, color stability |
| Vision report | `PlannedVisionReport` |

Vision Validation evaluates visual implementation only — not commercial effectiveness.

## Planned Vision Report

`PlannedVisionReport` implements the chapter spec `VisionReport`, distinct from Ch 3.18 and Ch 4.18 types.

## Key APIs

| API | Role |
|-----|------|
| `validateHeroProduct()` | Hero area vs blueprint expectations |
| `buildPlannedVisionReport()` | Score aggregation and approval |
| `planVisionRetryTargets()` | Targeted director retry recommendations |
| `runVisionValidationStage()` | Full 15-stage pipeline |
| `enrichPipelineContextWithVisionValidation()` | Validation context patch |
| `runVisionValidationStageFromPipeline()` | Rendering → vision chain |

## Integration

- Ch 6.13 `PlannedRenderResult` / `imageRef`
- Ch 4.18 `buildVisionQualityReport()` blueprint comparison
- Ch 6 `executeDesignPipelineStage(VISION_ANALYSIS)`
- Commercial Validation (downstream)

## Golden Rule

Success means every Render Blueprint element was implemented accurately, realistically, professionally, and without visual defects — not merely looking beautiful.

## Failure Conditions

Violated when images are judged aesthetically without blueprint comparison, artifacts are missed, violations lack explanations, or retry causes cannot be determined.
