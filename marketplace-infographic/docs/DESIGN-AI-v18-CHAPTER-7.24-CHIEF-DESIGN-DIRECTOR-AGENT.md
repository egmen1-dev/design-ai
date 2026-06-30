# DESIGN AI v18 — Chapter 7.24: Chief Design Director Agent

## Purpose

Chief Design Director is the supreme intellectual leader of the Design AI Platform. All prior agents build blueprints, analyze quality, and produce expert reports. This agent designs nothing — it makes the final decision on whether a project is ready for generation.

## Mission

Unify all specialized expert opinions, issue a final professional decision, and ensure only projects meeting the highest quality standards enter the Render Pipeline. It is the digital equivalent of a Creative Director signing work before it ships to the client.

## Module

Implemented as `chief-design-director-agent-*`, executive approval layer.

| File | Role |
|------|------|
| `chief-design-director-agent-types.ts` | 7 internal modules, input/output contracts, KPIs |
| `chief-design-director-agent-engine.ts` | Agent runner, consensus, approval, retry planning, Ch 7.6 integration |
| `chief-design-director-agent.spec.ts` | Kitchen and validation tests |

## Internal Modules (7)

1. Blueprint Auditor
2. Expert Consensus Engine
3. Conflict Resolver
4. Priority Planner
5. Approval Engine
6. Director Validator
7. Final Decision Builder

## Pipeline Position

```text
Senior Art Director → Chief Design Director → Render Pipeline
```

Chief Design Director is the last agent in the ecosystem. No project enters generation without its approval.

## Expert Weights

| Expert | Weight |
|--------|--------|
| Commercial Critic | 35% |
| Vision Critic | 25% |
| Senior Art Director | 30% |
| Anti-Pattern Director | 10% |

## Approval Levels

- **Approved** — ready for generation
- **Approved With Minor Notes** — generation allowed, recommendations preserved
- **Retry Required** — project returns to pipeline
- **Rejected** — missing blueprints or critical constitution violations

## Key APIs

| API | Role |
|-----|------|
| `executeChiefDesignDirectorAgent()` | Full agent execution with modules + retry planning |
| `buildBatterySprayerChiefDesignDirectorInput()` | Garden sprayer kitchen fixture with all expert reports |
| `computeChiefDesignDirectorOverallScore()` | Weighted expert consensus score |
| `fromFinalDesignDecisionSection()` | Spec-compliant FinalDesignDecision output |
| `validateChiefDesignDirectorAgentWithExecution()` | Structure + kitchen test |

## Integration

- Ch 7.23 `senior-art-director-agent` — ArtDirectorReport input
- Ch 7.22 `commercial-critic-agent` — CommercialReport input
- Ch 7.21 `vision-critic-agent` — VisionReport input
- Ch 7.20 `anti-pattern-director-agent` — AntiPatternReport input
- Ch 7.1–7.19 director blueprints — full blueprint stack
- Ch 7.6 `agent-professional-decision` — executive decision validation

## Golden Rule

A true creative director orchestrates specialists and judges their work as a whole. Chief Design Director does not ask if it looks beautiful — it asks: **am I ready to sign this work and send it to millions of buyers?**
