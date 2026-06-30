# DESIGN AI v18 — Chapter 7.3: Agent Lifecycle

## Purpose

Agent Lifecycle defines the full lifecycle of any intelligent agent inside Design AI Platform. Every agent — Product Analysis Agent, Story Director, Scene Director, Commercial Critic, Chief Design Director — follows the same state sequence regardless of specialization.

This ensures predictability, reproducibility, transparency, monitoring, and a unified Retry mechanism.

## Design Philosophy

An agent is **not** a permanently running process. It is a temporary intelligent service that appears only when the Pipeline requires a task, then completes and releases resources. Each new run starts fresh using only Pipeline Context.

## Lifecycle Model

```text
Created → Initialized → Context Loaded → Knowledge Loaded → Reasoning
       → Blueprint Generated → Self Validation → Completed → Archived
```

On error, lifecycle may enter **Retry**.

## Module

Implemented as `agent-session-lifecycle-*` to distinguish from Chapter 4.2 LM orchestrator lifecycle (`agent-lifecycle-*`).

| File | Role |
|------|------|
| `agent-session-lifecycle-types.ts` | Stages, runtime states, events, archive types |
| `agent-session-lifecycle-engine.ts` | Session runner, retry branch, telemetry, Event Bus |
| `agent-session-lifecycle.spec.ts` | Kitchen and validation tests |

## 9 Lifecycle Stages

| Stage | Runtime State | Responsibility |
|-------|---------------|----------------|
| Created | `created` | Agent ID, Execution ID, Trace ID, workspace |
| Initialized | `initialized` | DI: Input Adapter, Rule Engine, Knowledge, Logger, Telemetry |
| Context Loaded | `loading_context` | Pipeline Context validation |
| Knowledge Loaded | `loading_knowledge` | Knowledge Engine retrieval |
| Reasoning | `reasoning` | Decision Engine |
| Blueprint Generated | `generating_blueprint` | Owned blueprint section output |
| Self Validation | `validating` | Completeness, rules, contract |
| Completed | `completed` | Immutable result handoff to Pipeline |
| Archived | `archived` | Destroy instance; persist telemetry + trace |

## Retry Branch

```text
Validation Failed → Retry Requested → Reinitialized → Reasoning → Validation → Completed
```

## Lifecycle Events

- `AgentCreated`
- `KnowledgeLoaded`
- `DecisionCompleted`
- `ValidationPassed`
- `RetryStarted`
- `AgentCompleted`

Published to Event Bus (Ch 3.9) for Observability.

## Key APIs

| API | Role |
|-----|------|
| `AGENT_SESSION_LIFECYCLE_STAGES` | 9-stage catalog |
| `executeAgentSessionLifecycle()` | Run full ephemeral session |
| `buildAgentSessionArchive()` | Persist telemetry after destroy |
| `validateAgentSessionLifecycleWithExecution()` | Structure + kitchen test |
| `mapSessionStageToBaseArchitecture()` | Map to Ch 7.2 modules |

## Integration

- Ch 7.2 `Base Agent Architecture` — internal pipeline wrapped by session stages
- Ch 4.2 `Agent Lifecycle` — LM orchestrator (10 stages); different concern
- Ch 3.9 `Event Bus` — lifecycle event publishing
- Ch 6.19 `Pipeline Observability` — timeline and traces

## Golden Rule

An AI agent is born to solve one professional task, validates its work, passes the result to the Pipeline, and completes. No hidden state survives between projects — only Design Memory, Knowledge Engine, and Learning Engine retain long-term experience.
