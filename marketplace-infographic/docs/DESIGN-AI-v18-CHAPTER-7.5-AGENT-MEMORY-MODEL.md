# DESIGN AI v18 — Chapter 7.5: Agent Memory Model

## Purpose

Agent Memory Model defines how Design AI intelligent agents work with memory — what data they may use, what they may store, and what must exist only during task execution.

Goals: determinism, scalability, self-learning, reproducibility, and no hidden state.

## Design Philosophy

Strict memory separation — each information type has its own purpose, lifetime, and owner.

## Memory Architecture (6 tiers)

```text
Working Memory → Pipeline Memory → Design Memory → Knowledge Memory → Learning Memory → Analytics Memory
```

| Tier | Owner | Lifetime |
|------|-------|----------|
| Working | Agent | Agent session |
| Pipeline | Pipeline Orchestrator | One generation |
| Design | Learning Engine | Long-term |
| Knowledge | Knowledge Engine | Long-term |
| Learning | Learning Engine | Long-term |
| Analytics | Observability Platform | Long-term |

## Module

Implemented as `agent-memory-model-*`, extending Ch 4.7 `agent-memory-*` package API.

| File | Role |
|------|------|
| `agent-memory-model-types.ts` | Six tiers, access rules, snapshot, consistency |
| `agent-memory-model-engine.ts` | Session runner, validation, lifecycle |
| `agent-memory-model.spec.ts` | Kitchen and access rule tests |

## Key APIs

| API | Role |
|-----|------|
| `AGENT_MEMORY_TIER_STACK` | 6-tier catalog with owners |
| `getAgentMemoryTierAccess()` | Per-agent read/write permissions |
| `buildMemorySnapshot()` | Reproducible pipeline snapshot |
| `buildMemoryConsistencyVersions()` | Knowledge/pattern/marketplace versions |
| `executeAgentMemorySession()` | Memory session via Ch 4.7 + Ch 7.3 |
| `validateAgentMemoryModelWithExecution()` | Structure + kitchen test |

## Memory Principles

- Agents have no long-term memory
- Agents cannot mutate another agent's memory
- Memory is tier-separated with defined owners
- All experience stored centrally via Learning Engine
- Every record is reproducible with version tracking

## Integration

- Ch 4.7 `agent-memory-engine` — memory package build/release
- Ch 7.3 `agent-session-lifecycle` — ephemeral execution
- Ch 4.20 `design-memory` — Design Memory long-term store
- Ch 6.2 `pipeline-context` — Pipeline Memory SSOT

## Golden Rule

An agent remembers only what it needs right now. The platform remembers everything that helps it improve tomorrow.
