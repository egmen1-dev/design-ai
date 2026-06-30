# DESIGN AI v18 — Chapter 7.19: Pattern Director Agent

## Purpose

Pattern Director selects the most effective visual patterns for a specific product category. After Marketplace Director adapts the card for platform rules, this agent answers: **"Which proven design patterns should be used for this product category?"**

## Mission

Use CTR-proven design principles — never copy existing cards, but extract patterns that made successful designs work. Fuse compatible patterns with controlled innovation to avoid repetition.

## Module

Implemented as `pattern-director-agent-*`, extending Ch 5.14 `pattern-library-*`.

| File | Role |
|------|------|
| `pattern-director-agent-types.ts` | 7 internal modules, input/output contracts, KPIs |
| `pattern-director-agent-engine.ts` | Agent runner, retry, Ch 5.14 integration |
| `pattern-director-agent.spec.ts` | Kitchen and validation tests |

## Internal Modules (7)

1. Pattern Search
2. Pattern Ranking
3. Pattern Compatibility
4. Pattern Fusion
5. Uniqueness Controller
6. Pattern Validator
7. Pattern Blueprint Builder

## Pipeline Position

```text
Marketplace Director → Pattern Director → Anti-Pattern Director
```

Pattern Director completes the design planning stage using platform-wide pattern knowledge.

## Key APIs

| API | Role |
|-----|------|
| `executePatternDirectorAgent()` | Full agent execution with modules + retry |
| `buildBatterySprayerPatternDirectorInput()` | Garden sprayer Wildberries kitchen fixture |
| `searchCompatiblePatterns()` | Pattern library search with story/scene filters |
| `fromPatternSection()` | Spec-compliant PatternBlueprint output |
| `validatePatternDirectorAgentWithExecution()` | Structure + kitchen test |

## Integration

- Ch 5.14 `pattern-library-engine` — pattern search, ranking, fusion, validation
- Ch 7.18 `marketplace-director-agent` — Marketplace Blueprint input
- Ch 7.12 `composition-director-agent` — Layout Blueprint input
- Ch 7.11 `scene-director-agent` — Scene Blueprint input
- Ch 7.10 `visual-story-director-agent` — Story Blueprint input
- Ch 7.8 `business-understanding-agent` — Business Model input
- Ch 7.6 `agent-professional-decision` — pattern direction decision

## Golden Rule

A good designer does not copy others' work — they understand why it works. Pattern Director uses accumulated experience from millions of successful design decisions, extracts principles, discards randomness, and fuses best practices into a unique combination for this product, audience, and marketplace.
