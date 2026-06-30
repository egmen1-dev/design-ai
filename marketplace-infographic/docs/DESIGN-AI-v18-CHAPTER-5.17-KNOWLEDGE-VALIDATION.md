# DESIGN AI v18 — Chapter 5.17: Knowledge Validation

## Purpose

Knowledge Validation controls quality of all knowledge entering Design Knowledge Engine. Every rule, pattern, and anti-pattern must be correct, consistent, explainable, and agent-ready before publication.

## Design Philosophy

Without continuous quality control, knowledge bases degrade with outdated rules, duplicates, contradictions, and false patterns. Validation is as strict as a compiler checking source code.

## Validation Pipeline

1. Knowledge Creation
2. Schema Validation
3. Semantic Validation
4. Conflict Analysis
5. Evidence Validation
6. Simulation
7. Approval
8. Knowledge Repository

## Key Behaviors

| Behavior | Implementation |
|----------|----------------|
| Schema validation | `validateKnowledgeEntrySchema()` — fields, types, version, references |
| Semantic validation | `validateKnowledgeEntrySemantics()` — category fit, actionable recommendations |
| Conflict detection | `detectKnowledgeConflicts()` — e.g. warm vs cold lighting, expert review flag |
| Evidence validation | `validateKnowledgeEntryEvidence()` — sources required, confidence capped at 0.55 without evidence |
| Duplicate detection | `detectDuplicateKnowledge()` — similarity threshold 0.82 |
| Simulation | `simulateKnowledgeRule()` — blueprint count, commercial/vision impact, retry rate |
| Confidence | `recalculateKnowledgeConfidence()` — dynamic from simulation, memory, feedback |
| Version compatibility | `validateVersionCompatibility()` — major version cannot decrease |
| Explainability | `validateKnowledgeEntryExplainability()` — why, problem, where, proof |
| Full pipeline | `runKnowledgeValidationPipeline()` — per-entry approval status |
| Catalog validation | `validatePublishedKnowledgeCatalog()` — continuous validation readiness |

## Golden Rule

Knowledge joins Design AI only after proving correctness, consistency, explainability, and practical value.

## Implementation

| Module | Role |
|--------|------|
| `knowledge-validation-types.ts` | `ValidatableKnowledgeEntry` (distinct from Ch 5.2 `KnowledgeObject`) |
| `knowledge-validation-engine.ts` | Pipeline, conflicts, duplicates, simulation, reports |

## Integration

Validates catalog built from Ch 5.9–5.15 seeds, Ch 5.14 patterns, Ch 5.15 anti-patterns. Conflicts delegate to Design Rules Engine pattern.

## Failure Conditions

Violated when:

- knowledge publishes without validation;
- conflicts are not controlled;
- provenance is unknown;
- duplicates accumulate;
- revalidation is missing.
