# DESIGN AI v18 — Chapter 5.20: Golden Rules of Design Knowledge

## Purpose

Golden Rules of Design Knowledge are the constitutional principles of Design Knowledge Engine. While previous chapters described architecture, validation, learning, and versioning, this chapter defines immutable rules that must hold regardless of platform evolution.

## The 15 Golden Rules

| # | Rule | Principle |
|---|------|-----------|
| 1 | Knowledge Before Generation | No agent decides without Knowledge Engine |
| 2 | Knowledge Is Independent | Independent of LLM, Prompt, Provider, Marketplace, Model |
| 3 | Every Rule Needs Evidence | Provenance required for every rule |
| 4 | Everything Must Be Explainable | Why, where, problem, proof |
| 5 | Knowledge Never Disappears | Deprecate/archive/version — never delete |
| 6 | Validation Before Usage | Full validation cycle before use |
| 7 | Learning Never Stops | Continuous evolution from every outcome |
| 8 | Knowledge Is Shared | Single unified source of truth |
| 9 | Knowledge Over Prompt | Prompt conveys decisions, not knowledge |
| 10 | Business Before Beauty | Commercial effectiveness over aesthetics alone |
| 11 | Consistency Before Creativity | Compatible with knowledge architecture |
| 12 | Pattern And Anti-Pattern Together | Best practices and mistakes together |
| 13 | Human Knowledge Comes First | Expert foundation, learning enhances |
| 14 | Knowledge Must Evolve Safely | Verified, explainable, compatible, reversible |
| 15 | Knowledge Is The Core Asset | Knowledge Engine is primary intellectual value |

## Final Golden Rule

Image is only the result. Prompt is temporary. LLM is executor. Render Provider is visualization. True intelligence is the knowledge system that knows what to do, why, when, how to verify, and how to improve after every generation.

## Key Behaviors

| Behavior | Implementation |
|----------|----------------|
| Constitution catalog | `DESIGN_KNOWLEDGE_CONSTITUTION_RULES` — 15 immutable rules |
| Per-rule validation | `validateGoldenRule*()` for each rule |
| Full constitution | `validateDesignKnowledgeConstitution()` |
| Architecture statement | `DESIGN_KNOWLEDGE_ARCHITECTURE_STATEMENT` |
| Final rule | `FINAL_GOLDEN_RULE_OF_DESIGN_KNOWLEDGE` |
| Entry point | `runDesignKnowledgeGoldenRules()` |

## Integration

Validates across Ch 5.1 Philosophy, 5.14/5.15 Patterns, 5.16 Retrieval, 5.17 Validation, 5.18 Versioning, 5.19 Learning.

## Failure Conditions

Constitution violated when any of the 15 rules fail — knowledge used without evidence, validation, explainability, shared base, safe evolution, or commercial grounding.
