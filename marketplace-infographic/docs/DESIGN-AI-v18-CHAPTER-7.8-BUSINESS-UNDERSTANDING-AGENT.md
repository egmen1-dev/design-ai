# DESIGN AI v18 — Chapter 7.8: Business Understanding Agent

## Purpose

Business Understanding Agent transforms technical product description into commercial strategy. After Product Analysis Agent completes, the system knows what the product is — this agent answers **why a person should want to buy it**.

## Mission

Answer: **"Why should a person want to buy this product?"** — work with benefits and buyer perception, not specifications.

## Module

Implemented as `business-understanding-agent-*`, extending Ch 6.5 `business-understanding-*` pipeline stage.

| File | Role |
|------|------|
| `business-understanding-agent-types.ts` | 7 internal modules, input/output contracts, KPIs |
| `business-understanding-agent-engine.ts` | Agent runner, local retry, Ch 7.5/7.6 integration |
| `business-understanding-agent.spec.ts` | Kitchen and validation tests |

## Internal Modules (7)

1. Value Analyzer
2. Pain Point Analyzer
3. Motivation Engine
4. Emotional Mapper
5. Competitive Positioning
6. Strategy Builder
7. Business Model Builder

## Pipeline Position

```text
Product Analysis Agent → Business Understanding Agent → Knowledge Retrieval → Story Director
```

## Key APIs

| API | Role |
|-----|------|
| `executeBusinessUnderstandingAgent()` | Full agent execution with modules + retry |
| `buildBatterySprayerBusinessAgentInput()` | Kitchen test fixture |
| `transformCharacteristicToCommercialValue()` | 8 Ah battery → time and effort savings |
| `fromPipelineBusinessModel()` | Spec-compliant BusinessModel output |
| `validateBusinessUnderstandingAgentWithExecution()` | Structure + kitchen test |

## Integration

- Ch 6.5 `business-understanding-engine` — core commercial value implementation
- Ch 7.5 `agent-memory-model` — isolated memory package during execution
- Ch 7.6 `agent-professional-decision` — business-focused decision problem
- Ch 6.4 `knowledge-retrieval-stage` — knowledge package input assembly

## Retry Logic

Local retry branches:

- **Emotional Mapper weak** → Emotional Mapper → Strategy Builder → Business Model Builder
- **Value Analyzer weak** → Value Analyzer → Competitive Positioning → Strategy Builder
- **Critical input errors** → full agent retry

## Golden Rule

Buyers purchase a solution to their problem, the expected outcome, and the emotions they receive after purchase — not the product itself.
