# DESIGN AI v18 — Chapter 7.6: Agent Decision Engine

## Purpose

Agent Decision Engine is the central intelligence module of every Design AI agent. While other components handle data, knowledge, rules, and blueprints, Decision Engine makes the professional decision.

LLM is one tool inside Decision Engine — not the engine itself.

## Design Philosophy

```text
Legacy:  Input → LLM → Answer
Design AI: Problem Analysis → Knowledge → Options → Rules → Scoring
           → Conflicts → Selection → Explanation
```

## Module

Implemented as `agent-professional-decision-*`, extending Ch 4.8 `agent-decision-*` session API.

| File | Role |
|------|------|
| `agent-professional-decision-types.ts` | 8-stage pipeline, criteria, DecisionResult/Report |
| `agent-professional-decision-engine.ts` | Expert decision runner, scoring, conflicts |
| `agent-professional-decision.spec.ts` | Kitchen and validation tests |

## Decision Pipeline (8 stages)

1. Problem Analysis
2. Knowledge Retrieval
3. Option Generation
4. Rule Evaluation
5. Scoring
6. Conflict Detection
7. Decision Selection
8. Decision Explanation

## Multi-Criteria Scoring (Story Director)

| Criterion | Weight |
|-----------|--------|
| Business Match | 30% |
| Marketplace Fit | 20% |
| Commercial Impact | 20% |
| Knowledge Confidence | 15% |
| Historical Success | 15% |

## Key APIs

| API | Role |
|-----|------|
| `executeProfessionalDecision()` | Run full 8-stage pipeline |
| `generateStoryDirectorCandidates()` | Four story pattern options |
| `detectDecisionConflicts()` | Cross-section conflict detection |
| `buildProfessionalDecisionReport()` | DecisionReport for Validation/Consensus/Learning |
| `validateProfessionalDecisionWithExecution()` | Structure + kitchen test |

## Integration

- Ch 4.8 `agent-decision-engine` — AgentDecisionSession primitives
- Ch 7.2 `Base Agent Architecture` — decision_engine module stage
- Ch 4.10 `visual-story-director` — story pattern catalog
- Ch 3.7 `constraint-engine` — rule evaluation

## Golden Rule

A true professional analyzes the task, studies options, compares alternatives, respects constraints, and only then chooses — never the first idea that comes to mind.
