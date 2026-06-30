# DESIGN AI v18 — Chapter 7.2: Base Agent Architecture

## Purpose

Base Agent Architecture defines the universal internal structure used by every Design AI intelligent agent — Story Director, Lighting Director, Commercial Critic, Chief Design Director, and all future specialists.

## Design Philosophy

```text
Legacy:  Input → Prompt → LLM → Output
Design AI: Pipeline Context → Input Adapter → Context Analyzer → Knowledge
           → Decision Engine → Rule Engine → Blueprint Builder
           → Self Validation → Output Adapter → Telemetry
```

Only Decision Engine logic changes per agent.

## 9-Stage Pipeline

| Stage | Layer | Module |
|-------|-------|--------|
| Pipeline Context | Input | `pipeline-context-engine` |
| Input Adapter | Input | `universal-agent-bridge` |
| Context Analyzer | Context | `agent-context-engine` |
| Knowledge Retrieval | Knowledge | `knowledge-retrieval-engine` |
| Decision Engine | Decision | `agent-decision-engine` |
| Rule Engine | Rules | `constraint-engine` |
| Blueprint Builder | Blueprint | `mutation-engine` |
| Self Validation | Validation | `validation-engine` |
| Output Adapter | Output | `universal-agent-contract` |

Telemetry layer records duration, knowledge usage, rules evaluated, and scores.

## Core Types

- `BaseAgentInput` — pipelineContext, blueprint, knowledge, constraints
- `BaseAgentState` — ephemeral execution state (destroyed after run)
- `BaseAgentTelemetry` — observability record

## Key APIs

| API | Role |
|-----|------|
| `BASE_AGENT_PIPELINE` | 9-stage universal flow |
| `BASE_AGENT_LAYERS` | 9 architecture layers |
| `buildBaseAgentInput()` | Normalize agent input package |
| `projectContextForAgent()` | Context analyzer projection |
| `executeBaseAgentArchitecture()` | Run full pipeline for an agent |
| `validateBaseAgentArchitectureWithExecution()` | Structure + kitchen test |

## Principles

- **Stateless** — no long-lived agent state; memory in Design Memory / Knowledge Engine
- **Dependency Injection** — Knowledge Engine, Rule Engine, Logger injected externally
- **Modular** — each component independently testable

## Integration

- Ch 7 `Agent Implementation Specification` — parent spec
- Ch 7.1 `Agent Design Philosophy` — design manifest
- Ch 4.6 `Agent Context` — input layer
- Ch 4.8 `Agent Decision Model` — decision engine

## Golden Rule

All agents differ in profession but share identical engineering structure. Base Agent Architecture makes the ecosystem cohesive — new specialists without destabilizing the platform.
