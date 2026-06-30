# DESIGN AI v18 — Chapter 5.12: Cognitive Psychology Knowledge

## Purpose

Cognitive Psychology Knowledge formalizes how human perception, attention, memory, trust, and decision-making shape commercial infographic design. Design AI designs for the human brain — not for AI aesthetics.

## Design Philosophy

Every design decision must answer cognitive questions: What is this? Can I trust it? What matters most? Is it worth my time? Should I open the product card?

## Cognitive Psychology Knowledge Object

| Field | Role |
|-------|------|
| `rule` | Cognitive principle |
| `purpose` | Perception or decision rationale |
| `recommendation` | Actionable guidance |
| `conditions` | Context matching |

## Key Behaviors

| Behavior | Implementation |
|----------|----------------|
| Human attention | `MARKETPLACE_ATTENTION_WINDOW_MS` — decision under 1 second |
| Selective attention | `MAX_COMPETING_FOCAL_POINTS = 1` |
| Visual search | Elements answer: what sells, how differs, why better, can trust |
| Cognitive load | `estimateCognitiveLoad()` — max `MAX_COGNITIVE_LOAD` (0.65) |
| Recognition before reading | `RECOGNITION_PRIORITY_ORDER` — shape → image → color → text |
| Pattern recognition | `LIFE_CONTEXT_GUIDANCE` — kitchen, workshop, garden, office, medical |
| Gestalt principles | `GESTALT_PRINCIPLES` — proximity, similarity, continuity, closure, figure-ground |
| Trust formation | `TRUST_SIGNALS` — photo quality, clean composition, realism, lighting |
| Emotional triggers | `EMOTIONAL_TRIGGER_GUIDANCE` — safety, reliability, technology, comfort, etc. |
| Eye movement | `EYE_MOVEMENT_PATH` — hero → benefit → characteristic → detail |
| Marketplace scan | `MARKETPLACE_SCAN_WINDOW_MS` — 2 second parse target |
| Blueprint validation | `validateCognitivePsychologyBlueprint()` — triggers retry |
| Evolution | `applyCognitivePsychologyLearningFeedback()` |

## Golden Rule

People buy when the brain quickly understands the product, feels trust, and wants to learn more. Success means forming the right first impression with minimal visual means.

## Implementation

| Module | Role |
|--------|------|
| `cognitive-psychology-knowledge-types.ts` | Knowledge model, validation types |
| `cognitive-psychology-knowledge-engine.ts` | Rules, load estimation, validation |

## Integration

Builds on Ch 5.4 Psychology Layer, Ch 5.5 Marketplace (scan behavior), Ch 5.8 Composition (focal point, eye flow), Ch 5.11 Typography (recognition before reading).

Evidence source: `KnowledgeEvidenceSource.COGNITIVE_PSYCHOLOGY` (Ch 5.1).

## Failure Conditions

Violated when:

- composition is overloaded;
- focal point is missing;
- perception is too slow;
- meaning depends on text alone;
- visual structure contradicts human perception laws.
