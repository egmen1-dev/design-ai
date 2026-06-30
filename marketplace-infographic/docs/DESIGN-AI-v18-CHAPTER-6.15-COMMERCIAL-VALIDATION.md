# DESIGN AI v18 — Chapter 6.15: Commercial Validation Stage

## Purpose

Commercial Validation is the final intelligent evaluation before approval. Vision Validation asks whether the image is technically good; Commercial Validation asks whether it will sell.

## Design Philosophy

```text
Blueprint → Rendering → Vision Validation → Commercial Validation → Approval
```

Beautiful design is not enough — commercial effectiveness is the platform goal.

## Responsibilities

| Area | Output |
|------|--------|
| Attention analysis | `attentionScore` |
| CTR prediction | `ctrPrediction` |
| Trust analysis | `trustScore` |
| Selling power | `sellingPower` |
| Marketplace fit | `marketplaceFit` |
| Purchase intent | `purchaseIntent` |
| Commercial report | `PlannedCommercialReport` |

Commercial Validation does not evaluate technical image quality — Vision Validation handles that.

## Planned Commercial Report

`PlannedCommercialReport` implements the chapter spec `CommercialReport`, distinct from Ch 4.19 `ChiefReview`.

## Key APIs

| API | Role |
|-----|------|
| `scoreAttention()` / `predictCtr()` | Attention and click-through modeling |
| `scoreSellingPower()` | Value proposition and story strength |
| `buildPlannedCommercialReport()` | Weighted commercial score + approval |
| `buildCommercialRecommendations()` | Targeted director retry suggestions |
| `runCommercialValidationStage()` | Full 15-stage pipeline |
| `runCommercialValidationStageFromPipeline()` | Vision → commercial chain |

## Integration

- Ch 6.14 `PlannedVisionReport`
- Ch 6.5 `BusinessUnderstandingSection`
- Ch 6 `executeDesignPipelineStage(COMMERCIAL_VALIDATION)`
- Chief Design Review (downstream)

## Golden Rule

Perfect composition and lighting have no value if the image does not help sell the product.

## Failure Conditions

Violated when only beauty is scored, business goals are ignored, CTR is not predicted, low scores lack explanations, or all images receive identical scores.
