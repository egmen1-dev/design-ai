# DESIGN AI v18 — Chapter 4.21: Agent Communication Protocol

## Purpose

Agent Communication Protocol defines how intelligent agents exchange information inside Design AI. The goal is to eliminate direct agent dependencies and ensure a fully modular architecture.

## Communication Model

```
Agent → Section → Blueprint → Next Agent
```

**Never:** `Agent → Agent`

Render Blueprint is the **sole message bus**. Each agent reads the blueprint, creates its own section, publishes it, and completes.

## Five Principles

| Principle | Meaning |
|-----------|---------|
| **Immutable** | Published sections cannot be edited — new version on change |
| **Structured** | Contract-first data — no free-text prompts between agents |
| **Versioned** | Section history preserved in blueprint audit trail |
| **Explainable** | Every publication includes `decisionTrace` reasoning |
| **Independent** | No direct calls; read/write permissions enforced per agent |

## Responsibilities

- Enforce read/write permission matrix
- Validate section ownership (single owner per section)
- Detect direct agent-to-agent calls
- Reject prompt-like unstructured communication
- Track section versioning from audit history
- Validate publication explainability
- Isolate errors to failing section only

## Golden Rule

Agents never communicate with each other — they communicate through Blueprint. Blueprint is the only language the entire Design AI ecosystem understands.

## Implementation

| Module | Role |
|--------|------|
| `agent-communication-protocol-types.ts` | Principles, violations, publication types |
| `agent-communication-protocol-engine.ts` | Validation, ownership map, versioning |

## Integration

Builds on Agent Matrix (Ch 3.2), Agent Context (Ch 4.6), and Agent Dependencies (Ch 4.5). Used by Lifecycle Manager before/after agent execution to enforce modular communication.
