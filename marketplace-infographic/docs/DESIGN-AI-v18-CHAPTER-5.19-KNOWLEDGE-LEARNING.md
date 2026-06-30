# DESIGN AI v18 — Chapter 5.19: Knowledge Learning

## Purpose

Knowledge Learning is the continuous self-improvement mechanism for Design Knowledge Engine. It improves existing rules using real platform outcomes — turning Design AI from a static expert system into a self-learning platform.

## Design Philosophy

No knowledge base is ever complete. Design AI learns throughout its entire lifecycle from generations, scores, feedback, and marketplace changes.

## Learning Pipeline

1. Generation
2. Evaluation
3. Feedback Collection
4. Pattern Detection
5. Knowledge Proposal
6. Validation
7. Knowledge Update
8. Knowledge Engine

## Key Behaviors

| Behavior | Implementation |
|----------|----------------|
| Learning sources | `SOURCE_TRUST_WEIGHTS`, `getLearningSourceTrust()` — 10 independent sources |
| Learning objects | `KnowledgeLearningObject` — composition, style, lighting, camera, materials, patterns |
| Reinforcement | `adjustKnowledgeConfidenceFromOutcomes()` — vision/commercial/retry-driven confidence |
| Pattern discovery | `detectKnowledgePatternProposals()` — recurring successes → proposed patterns |
| Anti-pattern discovery | `detectKnowledgeAntiPatternProposals()` — recurring failures → proposed anti-patterns |
| Marketplace adaptation | `analyzeMarketplaceAdaptation()` — improving vs declining decisions |
| Human feedback | `collectLearningFeedback()` — single feedback never changes rules |
| Expert review | `requiresExpertReview()`, `applyKnowledgeProposalValidation()` |
| Stability | high-confidence rules resist change without strong evidence |
| Safety | `updateKnowledgeFromLearning()` — caps delta, validates via Ch 5.17, versions via Ch 5.18 |
| Full pipeline | `runKnowledgeLearningPipeline()` |
| System validation | `validateKnowledgeLearning()`, `runKnowledgeLearning()` |

## Golden Rule

The main value of Design AI is becoming better after every generation. Each project, pattern, fix, and confirmed rule becomes collective platform experience.

## Integration

- Ch 5.17 `runKnowledgeValidationPipeline()` — learned updates validated before publish
- Ch 5.18 `createKnowledgeVersionDraft()`, `releaseKnowledgeVersion()` — versioned knowledge updates
- Ch 4.20 Design Memory — `DESIGN_MEMORY` learning source
- Ch 5.14/5.15 Pattern & Anti-Pattern libraries — proposal targets

## Failure Conditions

Violated when:

- knowledge added without validation;
- confidence changes chaotically;
- expert validation missing for new patterns;
- knowledge base degrades over time;
- same errors repeat without learning.
