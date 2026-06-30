# DESIGN AI v18 — Chapter 5.5: Marketplace Knowledge

## Purpose

Marketplace Knowledge contains specialized knowledge about requirements, restrictions, algorithms, and best practices for specific trading platforms. It ensures created infographics not only look professional but comply with marketplace requirements, maximizing commercial effectiveness.

## Design Philosophy

Beautiful design is not always effective design. Design AI projects images for a specific trading platform, not abstract beauty.

## Marketplace Abstraction

All marketplaces are represented through a unified `MarketplaceProfile` model:

- `requirements` — mandatory architectural constraints
- `restrictions` — critical publish-blocking rules
- `bestPractices` — commercial recommendations (non-mandatory)
- `rankingFactors` — factors influencing commercial success
- `supportedFormats` — image format specifications

## Supported Platforms

| Platform | Profile Version |
|----------|-----------------|
| Amazon | v12 |
| Ozon | v7 |
| Wildberries | v5 |
| Shopify | v3 |
| Etsy | v4 |
| Walmart Marketplace | v6 |
| eBay | v5 |
| AliExpress | v4 |

## Key Behaviors

| Behavior | Implementation |
|----------|----------------|
| Context-aware rules | `getContextRules()` — main_image vs secondary vs infographic |
| Regional profiles | Amazon US, Japan, Germany via `getMarketplaceKnowledgeProfile()` |
| Category knowledge | `CATEGORY_VISUAL_GUIDANCE` — kitchen, electronics, beauty, furniture, sports |
| Critical constraints | `getCriticalRestrictions()` checked before render pipeline |
| Blueprint validation | `validateMarketplaceBlueprint()` — requirements + restrictions |
| Independent versioning | `publishMarketplaceProfileVersion()` per marketplace |
| Blueprint mapping | `BLUEPRINT_MARKETPLACE_MAP` — Amazon/Ozon/WB → knowledge profiles |

## Golden Rule

Commercially effective design simultaneously complies with marketplace requirements, reflects category expectations, matches buyer expectations, supports platform algorithms, and increases purchase probability.

## Implementation

| Module | Role |
|--------|------|
| `marketplace-knowledge-types.ts` | Profile model, validation types |
| `marketplace-knowledge-engine.ts` | Profiles, category guidance, validation |

## Integration

Builds on Ch 5.4 `KnowledgeLayer.MARKETPLACE` and `creative.blueprint.marketplace` field. Distinct from Ch 3.7 `MARKETPLACE_CONSTRAINT_PROVIDER` (runtime constraints) — this chapter owns the knowledge layer.

## Failure Conditions

Violated when:

- all marketplaces share identical rules;
- category knowledge is missing;
- mandatory requirements mixed with recommendations;
- blueprint can bypass validation before render pipeline.
