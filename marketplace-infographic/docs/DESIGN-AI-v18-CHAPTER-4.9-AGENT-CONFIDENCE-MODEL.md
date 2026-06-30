# DESIGN AI v18 — Chapter 4.9: Agent Confidence Model

## Purpose

Agent Confidence Model defines how each intelligent agent assesses the reliability of its own decision. Confidence is **not** design quality — it measures how sure the agent is that the decision is correct.

## Design Philosophy

Every professional designer knows how confident they are. Every `Agent Result` must include a Confidence Score.

## Core Principle

```
Decision  +  Confidence
```

- **Decision** — what to do
- **Confidence** — how sure the agent is (0.00..1.00)

## Confidence Levels

| Range | Level | Pipeline behavior |
|-------|-------|-------------------|
| 0.90–1.00 | Very High | Reliable |
| 0.75–0.89 | High | Usually no extra checks |
| 0.60–0.74 | Medium | May need review |
| 0.40–0.59 | Low | Consensus recommended |
| 0.00–0.39 | Critical | Retry / recovery |

## Calculation Factors

```
Input Completeness + Knowledge Match + Constraint Satisfaction
+ Alternative Stability + Reasoning Consistency → Confidence
```

Penalties: conflicts, missing inputs, unstable alternatives.  
Bonuses: knowledge agreement, clear winning alternative.

## Key Rules

- Confidence does **not** depend on LLM quality
- High confidence does **not** mean automatic approval
- Pipeline stores per-agent confidence — **no averaging**
- Values stored in Decision Trace for history and calibration

## Implementation

| Module | Role |
|--------|------|
| `agent-confidence-types.ts` | Levels, factors, thresholds, history |
| `agent-confidence-engine.ts` | Calculation, classification, lifecycle actions |

## Golden Rule

Every intelligent decision must include confidence. The pipeline trusts measurable certainty, not absolute claims.
