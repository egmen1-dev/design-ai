# DESIGN AI v18 — Chapter 6.3: Product Analysis Stage

## Purpose

Product Analysis Stage is the first intelligent stage of Design Pipeline. It builds a complete digital model of the product — answering **"What exactly are we selling?"** — not **"How should the image look?"**

Wrong product understanding cannot be compensated by later agents.

## Design Philosophy

Generic AI: Name → Prompt → Image.

Design AI: Product → Understanding → Knowledge → Business Model → Design Decisions → Blueprint → Image.

## Responsibilities

Product Analysis owns product understanding only:

| Area | Output |
|------|--------|
| Category / subcategory | `AnalyzedProductProfile.category`, `.subcategory` |
| Purpose & type | `.productType`, `.marketSegment` |
| Benefits | `.primaryBenefits`, `.secondaryBenefits` (prioritized for Story Director) |
| Buyer pains | `.painPoints` (story built around problems, not specs) |
| Audience | `.targetAudience` |
| Use cases | `.useCases` (for Scene Director) |
| Positioning | `.priceSegment`, `.marketSegment` |
| Emotions | `.emotionalTriggers` |
| Competitive edge | `.competitiveAdvantages` |

Product Analysis **never** makes design decisions.

## Product Profile

`AnalyzedProductProfile` implements the chapter spec `ProductProfile` — distinct from legacy `@/lib/product-analysis` `ProductAnalysis`.

## Pipeline Micro-Stages

`PRODUCT_ANALYSIS_PIPELINE`: input normalization → category recognition → feature extraction → pain points → audience → use cases → positioning → emotions → competitive analysis → profile assembly → knowledge request → validation.

## Knowledge Request

After analysis, `buildKnowledgeRequestFromProfile()` forms a `KnowledgeRetrievalRequest` with category, marketplace, audience, positioning, and business goal — loading only relevant Design Knowledge.

## Key APIs

| API | Role |
|-----|------|
| `analyzeProduct()` | Core stage execution |
| `buildAnalyzedProductProfile()` | Profile from input + category seed |
| `buildProductBlueprintFromProfile()` | Maps to `ProductBlueprint` |
| `buildKnowledgeRequestFromProfile()` | Ch 5.16 retrieval bridge |
| `productAnalysisToMutations()` | Blueprint `product` section patch |
| `enrichPipelineContextWithProductAnalysis()` | Ch 6.2 business context update |
| `runProductAnalysisStage()` | Stage entry point |
| `validateProductAnalysis()` | System validation |

## Integration

- Ch 6 `executeDesignPipelineStage(PRODUCT_ANALYSIS)` — pipeline gate
- Ch 6.1 `product-analyzer` — first orchestrator-ready agent
- Ch 6.2 `PipelineContextSection.BUSINESS` — owned by product-analyzer
- Ch 5.16 `AGENT_RETRIEVAL_DOMAINS["product-analyzer"]` — marketplace, consumer, pattern, psychology

## Golden Rule

Product Analysis is complete product understanding — the foundation all subsequent agents rely on.

## Failure Conditions

Violated when category is wrong, benefits are confused with raw specs, pain points missing, use cases undefined, Story Director lacks context, or Knowledge Retrieval loads irrelevant knowledge.
