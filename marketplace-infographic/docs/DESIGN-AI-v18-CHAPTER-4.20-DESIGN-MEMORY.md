# DESIGN AI v18 — Chapter 4.20: Design Memory

## Purpose

Design Memory is the **long-term memory** of the Design AI platform. It does not store generation history or images — it gradually learns which design decisions actually work and teaches the architecture over time.

## Pipeline Position

```
Chief Design Director → Approved Result → Design Memory → Knowledge Update → Future Generations
```

Runs only **after** generation completes. Never participates in current pipeline decisions.

## Responsibilities (only)

- Accumulate successful and unsuccessful design patterns
- Analyze decision repeatability across generations
- Update design knowledge weights (gradual EMA adaptation)
- Provide explainable recommendations for future agents

**Never:** mutate the current blueprint, store images, or make pipeline decisions.

## Memory Update

```typescript
interface MemoryUpdate {
  successfulPatterns: Pattern[];
  unsuccessfulPatterns: Pattern[];
  updatedWeights: WeightMap;
  avoidPatterns: Pattern[];
  recommendedPatterns: Pattern[];
  knowledgeChanges: KnowledgeDelta[];
  confidence: number;
}
```

## Key Behaviors

| Behavior | Implementation |
|----------|----------------|
| Statistical patterns | Scene + lighting + materials combos with success rates |
| Category isolation | `premium_kitchen` ≠ `cosmetics` — separate weight scopes |
| Provider isolation | FLUX, GPT Image, Imagen patterns stored per provider |
| Retry learning | Score jumps after localized retry boost section weights |
| Marketplace learning | CTR, conversion, add-to-cart weighted into outcome score |
| Memory aging | Half-life decay prevents stale patterns dominating |
| Human feedback | Like reinforces decisions; dislike penalizes weights |

## Golden Rule

Design Memory does not remember images — it remembers which design decisions lead to successful commercial cards and teaches the Design AI architecture, not the render model.

## Implementation

| Module | Role |
|--------|------|
| `design-memory-types.ts` | MemoryUpdate, Pattern, WeightMap, query types |
| `design-memory-engine.ts` | Learning, query, aging, validation |
| `agents/design-memory-agent.ts` | Agent contract (FINISHED stage, read-only) |

## Integration

Consumes Chief Review (Ch 4.19), Vision Report (Ch 4.18), Commercial Photographer review, retry history, user feedback, and commercial metrics. Publishes `MemoryUpdate` for knowledge engine — Design Memory never applies changes to the current blueprint.
