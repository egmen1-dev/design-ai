# DESIGN AI v18 — Chapter 5.6: Design Rules Engine

## Purpose

Design Rules Engine is the execution mechanism of Design Knowledge Engine. While Knowledge Engine stores knowledge, Design Rules Engine applies it during Agent Ecosystem operation — transforming abstract design knowledge into concrete, context-dependent recommendations.

## Design Philosophy

Knowledge alone is not useful. A rule like "Use Warm Lighting" becomes valuable only after analyzing product category, marketplace, story, audience, scene, and brand.

## Architecture

```
Knowledge Objects → Rule Evaluation → Context Analysis → Rule Selection
→ Rule Prioritization → Agent Recommendation
```

Each agent receives only the most relevant rules, not the entire knowledge base.

## Rule Lifecycle

```
Knowledge Object → Context Matching → Priority Calculation → Conflict Resolution
→ Recommendation → Agent Decision → Design Memory Feedback
```

## Rule Structure

| Field | Role |
|-------|------|
| `domain` | Rule domain (marketplace, lighting, composition, etc.) |
| `conditions` | Context matching predicates |
| `recommendation` | Action, summary, and mandatory reason |
| `priority` / `confidence` | Scoring inputs |
| `kind` | `mandatory` or `advisory` |
| `sources` | Evidence attribution |

## Key Behaviors

| Behavior | Implementation |
|----------|----------------|
| Context matching | `matchRules()` — IF conditions against context |
| Rule scoring | `computeRuleScore()` — priority 40%, confidence 30%, context 20%, history 10% |
| Mandatory rules | Always apply when conditions match |
| Advisory rules | Ranked recommendations agents may override |
| Rule composition | `composeRules()` — merge multiple rules into one recommendation |
| Conflict resolution | `resolveRuleConflicts()` — priority, confidence, business goal |
| Agent scoping | `selectRulesForAgent()` — scoped subset per agent |
| Explainability | Every recommendation requires `reason` |
| Rule learning | `applyRuleLearningFeedback()` — Design Memory adjusts confidence |
| Stateless execution | `executeDesignRules()` — no stored state |

## Golden Rule

Knowledge answers **"what is known?"** Design Rules Engine answers **"what should be done right now?"**

## Implementation

| Module | Role |
|--------|------|
| `design-rules-engine-types.ts` | Rule model, context, scoring types |
| `design-rules-engine.ts` | Matching, prioritization, composition, execution |

## Integration

Builds on Ch 5.1 `getSeedKnowledgeRules()`, Ch 5.5 marketplace contexts, and Ch 5.4 knowledge layers. Distinct from Ch 5.2 `KnowledgeRule` (storage) — this chapter owns rule application.

## Failure Conditions

Violated when:

- all rules apply identically regardless of context;
- context analysis is skipped;
- conflicts cannot be resolved;
- recommendations lack explanations;
- agents receive raw Knowledge Objects.
