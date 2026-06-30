# DESIGN AI v18 — Chapter 7.22: Commercial Critic Agent

## Purpose

Commercial Critic is the main expert on commercial effectiveness. After Vision Critic validates visual professionalism, this agent answers: **"Will this design sell the product?"**

## Mission

Predict commercial success before publication — attention, trust, interest, benefit clarity, CTR, and purchase probability. Beautiful images do not guarantee sales.

## Module

Implemented as `commercial-critic-agent-*`, buyer and marketer perspective layer.

| File | Role |
|------|------|
| `commercial-critic-agent-types.ts` | 7 internal modules, input/output contracts, KPIs |
| `commercial-critic-agent-engine.ts` | Agent runner, scoring, retry, Ch 7.6 integration |
| `commercial-critic-agent.spec.ts` | Kitchen and validation tests |

## Internal Modules (7)

1. CTR Predictor
2. Selling Power Analyzer
3. Trust Evaluator
4. Emotion Analyzer
5. Commercial Risk Engine
6. Commercial Validator
7. Commercial Report Builder

## Pipeline Position

```text
Vision Critic → Commercial Critic → Senior Art Director
```

Commercial Critic is the first expert evaluating future card effectiveness. It never modifies blueprints.

## Key APIs

| API | Role |
|-----|------|
| `executeCommercialCriticAgent()` | Full agent execution with modules + retry |
| `buildBatterySprayerCommercialCriticInput()` | Garden sprayer kitchen fixture with vision report |
| `predictCommercialCtr()` | Relative CTR commercial score from blueprints |
| `fromCommercialSection()` | Spec-compliant CommercialReport output |
| `validateCommercialCriticAgentWithExecution()` | Structure + kitchen test |

## Integration

- Ch 7.21 `vision-critic-agent` — VisionReport input
- Ch 7.8 `business-understanding-agent` — BusinessModel input
- Ch 7.18 `marketplace-director-agent` — Marketplace Blueprint input
- Ch 6.15 `commercial-validation-stage` — scoring patterns reference
- Ch 7.6 `agent-professional-decision` — commercial critique decision validation

## Golden Rule

The buyer asks: do I want to open this card or scroll past? Commercial Critic models that moment — not beauty, but stop-power, trust, and the push toward the next action.
