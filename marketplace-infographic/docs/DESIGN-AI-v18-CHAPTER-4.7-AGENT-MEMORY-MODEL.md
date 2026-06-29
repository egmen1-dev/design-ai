# DESIGN AI v18 — Chapter 4.7: Agent Memory Model

## Purpose

Agent Memory Model defines what information an agent may use when making a decision. The goal is to eliminate hidden memory, make all decisions reproducible, and ensure deterministic operation of the Agent Ecosystem.

This describes **working memory per agent**, not system training.

## Design Philosophy

In Design AI, agents do not "remember". They receive information only for the duration of `Execute()`. After completion, all working memory is destroyed.

## Core Principle

Memory belongs to the **platform**, not the agent:

```
System → RenderBlueprint → Agent Context → Agent → Decision → Memory Released
```

## Memory Layers

| Layer | Owner | Mutable | Contents |
|-------|-------|---------|----------|
| **Runtime** | Agent | Yes | Locals, scratch, intermediate computations |
| **Working** | Lifecycle Manager | No | Agent Context (Ch 4.6) |
| **Knowledge** | Knowledge Engine | No | Design Genome, composition laws, photography guidelines |
| **Reference** | Reference Providers | No | Categories, trends, material/scene/lighting catalogs |
| **Learning** | Design Memory | No | Successful/failed combinations, template weights, stats |

## Memory Access

Each agent explicitly declares which layers it uses via `AGENT_MEMORY_ACCESS_MATRIX`:

- **Scene Director** → Working, Knowledge, Reference
- **Commercial Photo Director** → Working, Knowledge
- **Composition Director** → Working, Knowledge, Learning

## Policies

- **Read-only** — all layers except Runtime are immutable during pipeline
- **Isolation** — each agent gets its own memory package; no sharing
- **Lifetime** — memory exists only for agent execution; `releaseAgentMemory()` clears runtime
- **Projection** — Lifecycle may pass only required knowledge/reference topics
- **Replay** — `serializeMemoryReplay()` captures full memory state for debug/regression
- **Security** — no API keys, tokens, or credentials in any layer

## Implementation

| Module | Role |
|--------|------|
| `agent-memory-types.ts` | Layer types, access declarations, replay types |
| `agent-memory-engine.ts` | Build, validate, project, release, replay, explainability |

## Golden Rule

An intelligent agent has no long-term memory. All knowledge belongs to the platform and is delivered through the controlled memory model. After `Execute()`, the agent retains nothing.
