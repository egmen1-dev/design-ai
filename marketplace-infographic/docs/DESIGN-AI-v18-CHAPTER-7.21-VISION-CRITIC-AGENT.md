# DESIGN AI v18 — Chapter 7.21: Vision Critic Agent

## Purpose

Vision Critic is the first independent expert that evaluates the full design pipeline output. After Anti-Pattern Director clears structural risks, this agent answers: **"Does this infographic look professionally perceived?"**

## Mission

Assess visual quality only — composition, hierarchy, balance, readability, and clarity. Vision Critic does not judge business, marketing, or CTR.

## Module

Implemented as `vision-critic-agent-*`, pre-render visual perception layer.

| File | Role |
|------|------|
| `vision-critic-agent-types.ts` | 7 internal modules, input/output contracts, KPIs |
| `vision-critic-agent-engine.ts` | Agent runner, scoring, retry, Ch 7.6 integration |
| `vision-critic-agent.spec.ts` | Kitchen and validation tests |

## Internal Modules (7)

1. Composition Inspector
2. Hierarchy Inspector
3. Balance Inspector
4. Visual Noise Detector
5. Readability Inspector
6. Vision Validator
7. Vision Report Builder

## Pipeline Position

```text
Anti-Pattern Director → Vision Critic → Commercial Critic
```

Vision Critic is the first independent critic — it never modifies blueprints.

## Key APIs

| API | Role |
|-----|------|
| `executeVisionCriticAgent()` | Full agent execution with modules + retry |
| `buildBatterySprayerVisionCriticInput()` | Garden sprayer full stack + anti-pattern report |
| `buildVisionSection()` | Score composition, hierarchy, balance, readability, clarity |
| `fromVisionSection()` | Spec-compliant VisionReport output |
| `validateVisionCriticAgentWithExecution()` | Structure + kitchen test |

## Integration

- Ch 7.20 `anti-pattern-director-agent` — AntiPatternReport input
- Ch 7.19–7.11 director agents — full blueprint stack
- Ch 5.12 `cognitive-psychology-knowledge` — gestalt and perception principles
- Ch 7.6 `agent-professional-decision` — vision critique decision validation

## Golden Rule

Vision Critic looks at the project as if seeing it for the first time. If the card looks unprofessional or unreadable, the pipeline must stop regardless of prior agent success.
