# DESIGN AI v18 — Chapter 6.5: Business Understanding Stage

## Purpose

Business Understanding Stage shifts from analyzing the product to understanding the **commercial task**. Product Analysis answers "What are we selling?" Business Understanding answers **"Why should someone want to buy this product?"**

## Design Philosophy

Buyers purchase outcomes, not specifications. Business Understanding transforms:

```text
Feature → Benefit → Customer Value
```

Example: `8 Ah Battery` → hours of autonomous work → time and effort savings.

## Responsibilities

| Area | Output |
|------|--------|
| Commercial goal | `PipelineBusinessModel.businessPriority` |
| Primary value | `.primaryValue` |
| Customer value | `.secondaryValues`, feature chains |
| Buyer pains | `.painPoints` |
| Purchase motivations | `.purchaseMotivations` |
| Emotional positioning | `.emotionalDrivers` |
| Story strategy | `.storyStrategy` for Story Director |

Business Understanding handles **commercial logic only** — never design.

## Business Model

`PipelineBusinessModel` implements the chapter spec `BusinessModel`.

## Key APIs

| API | Role |
|-----|------|
| `transformFeaturesToBenefits()` | Feature → Benefit → Customer Value chains |
| `rankBusinessPriorities()` | Visual hierarchy order for Story Director |
| `selectStoryStrategyArc()` | Problem→Solution or Premium→Quality arcs |
| `selectCompetitiveStrategy()` | Single positioning strategy |
| `buildPipelineBusinessModel()` | Assemble commercial model |
| `runBusinessUnderstandingStage()` | Core stage execution |
| `enrichPipelineContextWithBusinessUnderstanding()` | Ch 6.2 business `commercialModel` |
| `mapStoryStrategyToStoryType()` | Bridge to Visual Story Director |

## Integration

- Ch 6.3 `AnalyzedProductProfile` — product understanding input
- Ch 6.4 `StagedKnowledgePackage` — pain hints from anti-patterns
- Ch 6 `DesignPipelineStage.BUSINESS_UNDERSTANDING` — pipeline order 4
- Ch 4.10 `StoryType` — story strategy hint for Story Director

## Golden Rule

Buyers purchase solutions to their problems, not specifications.

## Failure Conditions

Violated when selling specs instead of value, missing purchase motivation, conflicting strategies, unranked priorities, or Story starts without commercial model.
