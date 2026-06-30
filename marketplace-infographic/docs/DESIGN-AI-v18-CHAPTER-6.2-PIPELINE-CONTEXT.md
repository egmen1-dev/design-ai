# DESIGN AI v18 — Chapter 6.2: Pipeline Context

## Purpose

Pipeline Context is the central data object accompanying every generation throughout Design Pipeline. It provides all agents a single, current, consistent context for professional design decisions — the working memory of Agent Ecosystem.

## Design Philosophy

Generic AI restarts context with each prompt. Design AI uses one Pipeline Context per generation. All agents work with the same project model and never create independent data versions.

## Core Principle

Single Source of Truth — all changes flow through Pipeline Context.

## Context Sections

| Section | Owner agents | Content |
|---------|--------------|---------|
| Business | product-analyzer | product, marketplace, business goal, brand, audience |
| Knowledge | orchestrator | KnowledgePackage |
| Creative | story, scene directors | story, style, scene |
| Technical | composition, lighting, camera, material | camera, lighting, materials, composition |
| Render | flux-adapter | provider, prompt, settings |
| Validation | chief, vision, consensus | scores, approval, violations |
| Learning | design-memory | feedback, memory updates |

## Key Behaviors

| Behavior | Implementation |
|----------|----------------|
| Context object | `GenerationPipelineContext` — distinct from Ch 3.14 pool and Ch 6.1 orchestrator state |
| Immutable updates | `applyContextPatch()` — patch → merge → new revision |
| Ownership | `validateContextOwnership()`, `CONTEXT_SECTION_OWNERS` |
| Consistency | `validateContextConsistency()` |
| Handoff gate | `validateContextBeforeAgentHandoff()` |
| Lifecycle | `CONTEXT_LIFECYCLE` — Created → Enriched → ... → Archived |
| Snapshots | `createContextSnapshot()`, `buildStandardContextSnapshots()` |
| Recovery | `restoreContextFromSnapshot()`, `recoverContextFromLatestSnapshot()` |
| Scoped access | `getAgentContextView()` |
| Audit | `recordContextAudit()`, `getContextAuditTrail()` |
| Orchestrator bridge | `createContextFromOrchestrator()` |

## Golden Rule

Pipeline Context is unified working memory. Same Context = one team. Different truths = independent algorithms.

## Integration

- Ch 6.1 `createOrchestratorPipelineContext()` — bridge via `createContextFromOrchestrator()`
- Ch 5.16 `retrieveKnowledgePackage()` — knowledge section
- Ch 3.2 `AGENT_WRITE_MATRIX` — blueprint section ownership

## Failure Conditions

Violated when agents use different data versions, mutate directly, lack snapshots, cannot recover, or changes are not traceable.
