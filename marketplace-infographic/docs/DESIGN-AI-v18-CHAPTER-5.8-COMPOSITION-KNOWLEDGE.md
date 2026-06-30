# DESIGN AI v18 — Chapter 5.8: Composition Knowledge

## Purpose

Composition Knowledge contains formalized knowledge about visual composition for commercial infographics. It ensures element placement follows professional composition laws that improve information perception and commercial effectiveness.

## Design Philosophy

Composition is an engineering system. Every object has position, scale, visual weight, relationships, and attention impact. Nothing is placed randomly.

## Composition Rule

| Field | Role |
|-------|------|
| `principle` | Hierarchy, focal point, negative space, balance, etc. |
| `conditions` | Context matching predicates |
| `recommendation` | Actionable composition guidance |
| `examples` | Reference implementations |

## Visual Hierarchy

```
Hero Product → Primary Benefit → Supporting Elements → Additional Information → Decorative Elements
```

## Key Behaviors

| Behavior | Implementation |
|----------|----------------|
| Focal point | `hero-focal-point` rule — single dominant hero object |
| Negative space | Premium/minimal styles trigger generous space rules |
| Balance | Symmetrical (technical/medical) vs asymmetrical (sports/lifestyle) |
| Reading flow | Western Z-pattern: top-left → center → bottom-right |
| Rule of thirds | Advisory only — not mandatory |
| Grid systems | 2×2, 3×3, golden ratio, modular, overlay |
| Patterns | `recommendCompositionPattern()` — 6 library patterns |
| Anti-patterns | `detectAntiPatterns()` — overcrowding, chaos, competing foci |
| Adaptive composition | `getAdaptiveHeroRatio()` — small 50-65%, large 25-45% |
| Blueprint validation | `validateCompositionBlueprint()` — triggers local retry |
| Evolution | `applyCompositionLearningFeedback()` — confidence adjustment |

## Golden Rule

Composition is human attention management. If the user sees what Story Director planned in the first seconds, composition is correct.

## Implementation

| Module | Role |
|--------|------|
| `composition-knowledge-types.ts` | Rules, patterns, validation types |
| `composition-knowledge-engine.ts` | Hierarchy, patterns, validation |

## Integration

Builds on Ch 5.5 marketplace safe zones, Ch 5.7 style constraints, and Composition Director (Ch 4.12).

## Failure Conditions

Violated when:

- objects placed randomly;
- no hero object;
- illogical reading flow;
- composition contradicts story;
- quality evaluation rules missing.
