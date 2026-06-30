# DESIGN AI v18 — Chapter 5.1: Philosophy of Design Knowledge

## Purpose

Design Knowledge Engine is the intellectual foundation of the Design AI Platform. If Agent Ecosystem makes decisions, Design Knowledge Engine ensures the quality of those decisions. No agent should decide based on random LLM knowledge or arbitrary prompts.

## Design Philosophy

Design AI is not an image generator — it is a system that makes design decisions. The platform's primary intellectual asset is Design Knowledge, not LLM models or Render Provider.

## Knowledge Before Generation

**Generic AI:**
```
User → Prompt → LLM → Image
```

**Design AI:**
```
User → Business Goal → Design Knowledge → Agent Decisions → Blueprint → Render → Image
```

Image generation is the last step, not the first.

## Structured Knowledge

Knowledge is not stored as documents or prompts. It is a structured system:

```
Category (Kitchen) → Preference (Soft Morning Light) → Reason (Warmth, appetite perception)
```

## Key Behaviors

| Behavior | Implementation |
|----------|----------------|
| Knowledge over LLM | Priority 100 — knowledge beats model intuition |
| Independence | No LLM, provider, or prompt dependency |
| Unified base | All agents share same seed rules |
| Explainable | Every rule has reason + evidence sources |
| Evidence-based | Industrial design, photography, UX, marketing, psychology, marketplace data |
| Reusable | One rule used by multiple agents |
| Evolution | Design Memory strengthens/weakens rules post-generation |
| Separation | Knowledge is standalone — not mixed with pipeline or prompts |

## Seed Knowledge Rules

| Rule | Category | Preference |
|------|----------|------------|
| Luxury cosmetics | cosmetics/luxury | soft_lighting |
| Kitchen | kitchen | soft_morning_light |
| Medical | medical | white_background |
| Premium | premium | large_negative_space |
| Marketplace | marketplace | hero_product_dominance |

## Golden Rule

LLM can generate answers. Render Provider can generate images. But only Design Knowledge Engine knows which design decision is truly correct. Knowledge — not models — is the foundation of the entire Design AI Platform.

## Implementation

| Module | Role |
|--------|------|
| `design-knowledge-philosophy-types.ts` | Rules, evidence sources, domains |
| `design-knowledge-philosophy-engine.ts` | Seed rules, validation, query API |

## Integration

Foundation for Chapter 5 Design Knowledge Engine. Connects to Agent Memory (Ch 4.7 Knowledge layer), Design Memory (Ch 4.20), and Explainability (Ch 4.26).

## Failure Conditions

Design Knowledge is architecturally wrong when:

- knowledge exists only inside prompts;
- agents use random LLM knowledge;
- rules lack evidence sources;
- rules cannot be explained;
- knowledge is not reused between agents.
