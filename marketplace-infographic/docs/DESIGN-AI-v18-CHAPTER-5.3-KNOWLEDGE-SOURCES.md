# DESIGN AI v18 — Chapter 5.3: Knowledge Sources

## Purpose

Knowledge Sources defines where Design Knowledge Engine obtains the knowledge used by all platform agents. Every rule, recommendation, and design decision must have a verified origin.

## Source Hierarchy

| Level | Source | Base Trust |
|-------|--------|------------|
| 1 | Expert Knowledge | 0.90 |
| 2 | Scientific Research | 0.85 |
| 3 | Marketplace Analytics | 0.80 |
| 4 | Internal Platform Statistics | 0.75 |
| 5 | AI Generated Knowledge | 0.35 |

Higher level = higher initial trust weight.

## Source Types

- Expert — commercial photographers, art directors, designers
- Scientific — cognitive psychology, perception, color theory
- Marketplace — platform requirements, category best practices
- Internal Analytics — CTR, conversion, vision score, commercial score
- Design Memory — empirical patterns from generations
- Human Feedback — adjusts weights, never creates rules from single rating
- AI Hypothesis — requires validation and sample accumulation (≥5 samples)

## Key Behaviors

| Behavior | Implementation |
|----------|----------------|
| Source attribution | `AttributedKnowledgeSource` with type, name, confidence, date, version |
| Multi-source validation | `validateMultiSource()` — independent types + combined confidence |
| Dynamic weighting | `applyDynamicWeightUpdate()` — confirm/decline by outcomes |
| Conflict resolution | `resolveSourceConflict()` — preserve both, escalate to evaluation |
| Source independence | No circular marketplace ↔ design memory attribution |
| AI gating | `submitAiHypothesis()` — not auto-accepted |

## Golden Rule

No rule in Design AI may exist without a source. Expert knowledge, scientific research, marketplace data, platform statistics, and Design Memory form the evidential foundation for every design decision.

## Implementation

| Module | Role |
|--------|------|
| `knowledge-sources-types.ts` | Attribution, conflicts, validation types |
| `knowledge-sources-engine.ts` | Catalog, attribution, weighting, validation |

## Integration

Builds on Philosophy (Ch 5.1) evidence sources and Knowledge Architecture (Ch 5.2) objects. Feeds Design Memory (Ch 4.20).

## Failure Conditions

Violated when:

- rule origin is unknown;
- knowledge is LLM-only;
- sources lack validation;
- expert and platform data mixed without distinction;
- new rules accepted without validation.
