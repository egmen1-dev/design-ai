# DESIGN AI v18 — Chapter 5.14: Pattern Library

## Purpose

Pattern Library is a centralized library of proven design decisions for commercial infographics. It stores universal project solutions adaptable to any product category — not ready-made image templates.

## Design Philosophy

A pattern is a template for making design decisions, not a picture template. Design AI reuses successful design principles — it does not copy competitor images.

## Design Pattern Object

| Field | Role |
|-------|------|
| `name` | Pattern name |
| `category` | Hierarchy level (business, story, composition, etc.) |
| `purpose` | Commercial/design rationale |
| `layout` | Layout scheme identifier |
| `confidence` | Rule confidence |
| `usageCount` | Times applied |
| `successRate` | Effectiveness history |
| `explainable` | Human-readable rationale |

## Pattern Hierarchy

1. **Business** — commercial strategy
2. **Story** — product narrative scenario
3. **Composition** — element placement
4. **Photography** — lighting, camera, environment
5. **Typography** — text hierarchy and CTA
6. **Marketplace** — platform-specific conventions

## Key Behaviors

| Behavior | Implementation |
|----------|----------------|
| Seed library | `SEED_DESIGN_PATTERNS` — 20 patterns across all levels |
| Pattern selection | `recommendDesignPatterns()` — ranked by context, not random |
| Pattern blending | `blendDesignPatterns()` — combine compatible schemes |
| Constraints | `violatesPatternConstraints()` — lifestyle/Amazon, grid/single-feature, luxury/budget |
| Scoring | `scorePatternUsage()` — vision, CTR, commercial, retry, user rating |
| Publication | `validatePatternForPublication()` — no duplicates, explainable, stats |
| Blueprint validation | `validatePatternBlueprint()` — triggers retry |
| Evolution | Usage statistics and success rate self-learning |

## Golden Rule

Pattern Library stores experience — not images. Each pattern is a formalized decision that has already proven effectiveness.

## Implementation

| Module | Role |
|--------|------|
| `pattern-library-types.ts` | `DesignPattern` model, hierarchy, validation types |
| `pattern-library-engine.ts` | Library, selection, blending, validation |

## Integration

Builds on Ch 5.8 Composition (`CompositionPatternId` references), Ch 5.5 Marketplace (WB, Amazon, Ozon), Ch 5.6 Design Rules (selection context).

`DesignPattern` is distinct from Ch 5.8 `CompositionPattern`.

## Failure Conditions

Violated when:

- library stores image templates instead of knowledge;
- patterns are duplicated;
- commercial effectiveness is ignored;
- usage statistics are missing;
- patterns are unexplainable.
