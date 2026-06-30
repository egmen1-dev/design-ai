# DESIGN AI v18 — Chapter 5.13: Consumer Behavior Knowledge

## Purpose

Consumer Behavior Knowledge formalizes how real buyers make decisions on marketplaces. Design AI designs for purchasers — not designers, developers, or generation algorithms.

## Design Philosophy

The primary design unit is buyer behavior, not the image. Buyers ask: Is this what I need? Can I trust it? How is it better? Should I open the card? Should I buy?

## Consumer Behavior Rule Object

| Field | Role |
|-------|------|
| `behavior` | Observed buyer behavior pattern |
| `trigger` | Situation that activates the behavior |
| `expectedReaction` | Desired buyer response |
| `references` | `ConsumerBehaviorKnowledgeSource` evidence links |
| `conditions` | Context matching |

## Key Behaviors

| Behavior | Implementation |
|----------|----------------|
| Decision journey | `DECISION_JOURNEY_STEPS` — attention → interest → evaluation → trust → click → purchase |
| Attention stage | Hero product, contrast, simplicity, visual cleanliness |
| Interest stage | Primary benefit, visual story, emotional triggers, usage scenario |
| Evaluation stage | Differentiation, quality, expectation fit |
| Trust formation | `estimateTrustScore()` — min `MIN_TRUST_SCORE` (0.6) |
| Risk reduction | `RISK_REDUCTION_SIGNALS` — size, scenario, materials, construction |
| Comparative behavior | Must outperform neighboring cards on search grid |
| Buying modes | `BuyingMode.IMPULSE` vs `BuyingMode.RATIONAL` |
| Value perception | `estimatePerceivedValue()` — min `MIN_PERCEIVED_VALUE` (0.55) |
| Purchase motivation | Functional vs emotional — `PURCHASE_MOTIVATION_GUIDANCE` |
| Social proof | `SOCIAL_PROOF_SIGNALS` — design quality substitutes for reviews |
| Decision speed | `MAX_DECISION_TIME_MS` — aligned with Ch 5.12 scan window |
| Segmentation | Category, engagement, scenario-aware story adaptation |
| Blueprint validation | `validateConsumerBehaviorBlueprint()` — triggers retry |
| Evolution | `applyConsumerBehaviorLearningFeedback()` |

## Golden Rule

Guide the buyer path: **I saw → I understood → I trust → I want to open the card → I want to buy.**

## Implementation

| Module | Role |
|--------|------|
| `consumer-behavior-knowledge-types.ts` | Rule model, journey, validation types |
| `consumer-behavior-knowledge-engine.ts` | Rules, trust/value estimation, validation |

## Integration

Builds on Ch 5.5 Marketplace, Ch 5.12 Cognitive Psychology (scan window, trust), Ch 5.1 evidence sources.

## Failure Conditions

Violated when:

- design ignores buyer behavior;
- decision journey is not modeled;
- trust mechanisms are missing;
- risk is not reduced visually;
- image is aesthetic-only.
