# DESIGN AI v18 — Chapter 6.1: Pipeline Orchestrator

## Purpose

Pipeline Orchestrator is the central conductor of Design AI Platform. It organizes agent interaction, controls pipeline order, manages dependencies, tracks generation state, and ensures each stage runs at the right moment.

## Design Philosophy

Generic AI uses sequential Agent A → B → C. Design AI uses a managed dependency graph where each agent starts only when required context is ready.

## Responsibilities

Pipeline Orchestrator handles exclusively:

- pipeline launch and lifecycle
- blueprint transfer between agents
- dependency control
- parallel execution of independent agents
- error handling and localized retry
- pipeline completion

It never changes design decisions.

## High-Level Architecture

```
User Request → Pipeline Orchestrator → Knowledge → Creative → Technical → Rendering → Validation → Learning
```

All agents interact only through the Orchestrator.

## Key Components

| Component | Implementation |
|-----------|----------------|
| Pipeline Context | `OrchestratorPipelineContext` — distinct from Ch 3.14 and Ch 6 validation context |
| State Machine | `ORCHESTRATOR_STATE_MACHINE` — Created → Knowledge → Creative → Technical → Rendering → Validation → Approved → Learning → Completed |
| Dependency Graph | `AGENT_DEPENDENCY_GRAPH` — agent prerequisites |
| Parallel Execution | `canExecuteAgentsInParallel()`, `groupParallelReadyAgents()` |
| Events | `OrchestratorPipelineEvent` — StoryCompleted, BlueprintUpdated, RenderFinished, etc. |
| Blueprint Ownership | `validateBlueprintOwnership()` via `AGENT_WRITE_MATRIX` |
| Localized Retry | `planLocalizedRetry()` — minimal agent re-run |
| Recovery | `recoverOrchestratorPipeline()` — resume from snapshot |
| Telemetry | `collectOrchestratorTelemetry()` |
| Execution | `runPipelineOrchestrator()` |

## Golden Rule

Pipeline Orchestrator is not a designer, critic, or image generator. It is an intelligent dispatcher organizing dozens of specialists into one stable, scalable infographic process.

## Integration

- Ch 6 `PIPELINE_LAYERS` — layer alignment
- Ch 5.16 `retrieveKnowledgePackage()` — knowledge in context
- Ch 3.4 `canRunAgentsParallel()` — parallel groups
- Ch 3.9 Event Bus patterns — event-driven stages

## Failure Conditions

Violated when agents call each other directly, dependencies are uncontrolled, any error forces full restart, recovery is impossible, or blueprint sections change without owner control.
