# DESIGN AI v18 — Chapter 7.23: Senior Art Director Agent

## Purpose

Senior Art Director is the lead design expert of the Design AI Platform. After Vision Critic asks whether the image looks professional and Commercial Critic asks whether it will sell, this agent answers the harder question: **"Would an experienced international agency art director approve this work?"**

## Mission

Deliver an independent professional assessment of the entire Agent Ecosystem output — not isolated elements, but how composition, typography, color, light, story, and emotion work together as one design system.

## Module

Implemented as `senior-art-director-agent-*`, holistic art direction layer.

| File | Role |
|------|------|
| `senior-art-director-agent-types.ts` | 7 internal modules, input/output contracts, KPIs |
| `senior-art-director-agent-engine.ts` | Agent runner, scoring, retry, Ch 7.6 integration |
| `senior-art-director-agent.spec.ts` | Kitchen and validation tests |

## Internal Modules (7)

1. Design Harmony Analyzer
2. Modern Design Evaluator
3. Premium Quality Inspector
4. Creative Direction Engine
5. Design Consistency Validator
6. Art Director Validator
7. Art Director Report Builder

## Pipeline Position

```text
Commercial Critic → Senior Art Director → Chief Design Director
```

Senior Art Director is the last specialized expert before the final director. It never modifies blueprints.

## Key APIs

| API | Role |
|-----|------|
| `executeSeniorArtDirectorAgent()` | Full agent execution with modules + retry |
| `buildBatterySprayerSeniorArtDirectorInput()` | Garden sprayer kitchen fixture with critic reports |
| `computeOverallDesignScore()` | Weighted holistic design score |
| `fromArtDirectorSection()` | Spec-compliant ArtDirectorReport output |
| `validateSeniorArtDirectorAgentWithExecution()` | Structure + kitchen test |

## Integration

- Ch 7.22 `commercial-critic-agent` — CommercialReport input
- Ch 7.21 `vision-critic-agent` — VisionReport input
- Ch 7.1–7.19 director blueprints — full blueprint stack input
- Ch 7.6 `agent-professional-decision` — art direction decision validation
- Ch 7.6 `agent-memory-engine` — design constitution and premium pattern knowledge

## Golden Rule

A professional designer evaluates the whole system. Senior Art Director does not ask if it is pretty — it asks: **can I put my name on this design as art director?** If not, the project returns for refinement.
