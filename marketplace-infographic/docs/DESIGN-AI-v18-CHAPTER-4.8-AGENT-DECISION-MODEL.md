# DESIGN AI v18 — Chapter 4.8: Agent Decision Model

## Purpose

Agent Decision Model defines how intelligent agents make professional design decisions. It is the heart of the Agent Ecosystem — the transition from information to design outcome.

## Design Philosophy

Agents do not generate answers "from memory". Every decision follows sequential analysis, producing explainable, deterministic, reproducible outcomes.

## Core Cycle

```
Input → Understanding → Reasoning → Evaluation → Decision → Validation → Mutation
```

## Eight-Stage Pipeline

| Stage | Role |
|-------|------|
| **Observe** | Collect facts only — no conclusions |
| **Interpret** | Translate facts into professional context |
| **Reason** | Answer design questions professionally |
| **Compare** | Consider ≥2 alternatives |
| **Evaluate** | Score alternatives on six criteria |
| **Decide** | Select exactly one outcome |
| **Explain** | Document why and what was rejected |
| **Publish** | Emit Blueprint Mutations only |

## Decision Trace

```typescript
interface AgentDecisionTrace {
  agentId: string;
  timestamp: number;
  inputs: string[];
  alternatives: string[];
  selectedDecision: string;
  reasoning: string;
  confidence: number; // 0.0..1.0
}
```

## Quality Criteria

- Correctness
- Consistency
- Commercial Value
- Visual Quality
- Explainability
- Confidence

## Constraints

Agents must consider: Design Laws, Marketplace Rules, Product Fidelity, User Intent, Brand Constraints, Provider Capabilities, Blueprint Consistency.

## Decision Sources (only)

- Agent Context
- RenderBlueprint
- Knowledge / Reference / Learning Memory

## Implementation

| Module | Role |
|--------|------|
| `agent-decision-types.ts` | Stages, trace, alternatives, quality types |
| `agent-decision-engine.ts` | `AgentDecisionSession`, validation, replay |

## Golden Rule

Agents decide **professional design outcomes**, not prompts. Prompts are technical representations created later by the Render Adapter.
