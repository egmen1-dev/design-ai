# DESIGN AI v18 — Chapter 4.26: Explainability Architecture

## Purpose

Explainability Architecture defines how every decision inside Design AI can be fully explained, verified, and reconstructed. Explainability is not an optional feature — it is a mandatory property of the entire architecture. If a decision cannot be explained, it must not exist inside the system.

## Design Philosophy

Design AI is not a black box. Every design decision must have:

- an author;
- a reason;
- a data source;
- an expected effect;
- impact on the final image.

Every decision must be reproducible.

## Explainability Pipeline

```
Agent → Decision → Reason → Blueprint → Render Intent → Image
```

For any pixel, the chain that led to its appearance must be traceable.

## Decision Ownership

Each decision has exactly one owner:

| Section | Owner |
|---------|-------|
| Story | Visual Story Director |
| Scene | Scene Director |
| Photography | Commercial Photo Director |
| Lighting | Lighting Director |
| Camera | Camera Director |
| Materials | Material Director |
| Composition | Composition Director |

If ownership cannot be determined, the architecture is violated.

## Key Behaviors

| Behavior | Implementation |
|----------|----------------|
| Decision metadata | `DecisionMetadata` with agent, reason, confidence, sources, dependencies |
| Reason first | Decisions include human explanation, not bare values |
| Dependency trace | Each decision knows upstream blueprint sections |
| Decision graph | Oriented graph for Chief Director, Consensus, Design Memory |
| Confidence chain | Propagated via weakest upstream link, not simple average |
| Human reports | Blueprint converts to plain-language decision report |
| Machine reasons | `StructuredReason` with tags and knowledge sources |
| Retry transparency | Documents what changed, why, who initiated, expected effect |
| Debug mode | Full trace of decisions, graph, mutations, retries |

## Golden Rule

In Design AI there are no decisions that appeared "just because." Every decision has an author, a reason, knowledge sources, dependencies, and an expected effect. If any element is missing, the decision is architecturally invalid.

## Implementation

| Module | Role |
|--------|------|
| `explainability-architecture-types.ts` | Decision metadata, graph, trace, debug types |
| `explainability-architecture-engine.ts` | Ownership, graph, confidence chain, validation |

## Integration

Works with Observability (Ch 3.15), Agent Decision Model (Ch 4.8), Blueprint Evolution (Ch 4.22), Consensus Engine (Ch 4.23), Retry Architecture (Ch 4.24), and Provider Independence (Ch 4.25).

## Failure Conditions

Explainability is violated when:

- unexplained decisions exist;
- decision author cannot be determined;
- dependencies are missing;
- retry runs without explanation;
- blueprint cannot be recovered from history.
