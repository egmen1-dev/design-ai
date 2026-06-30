# DESIGN AI v18 — Chapter 7.14: Lighting Director Agent

## Purpose

Lighting Director designs the full lighting scheme for the future image. After Story, Scene, Composition, and Photography are defined, this agent answers: **"How should light be placed so the product looks premium, realistic, and commercially attractive?"**

## Mission

Use light as an attention-management tool — highlight Hero Product, add volume, convey quality, support Story, and build buyer trust.

## Module

Implemented as `lighting-director-agent-*`, extending Ch 4.14 `lighting-director-*`.

| File | Role |
|------|------|
| `lighting-director-agent-types.ts` | 7 internal modules, input/output contracts, KPIs |
| `lighting-director-agent-engine.ts` | Agent runner, retry, Ch 7.5/7.6 integration |
| `lighting-director-agent.spec.ts` | Kitchen and validation tests |

## Internal Modules (7)

1. Lighting Strategy Selector
2. Key Light Planner
3. Shadow Engine
4. Reflection Controller
5. Color Temperature Engine
6. Lighting Validator
7. Lighting Blueprint Builder

## Pipeline Position

```text
Photography Director → Lighting Director → Camera Director
```

## Key APIs

| API | Role |
|-----|------|
| `executeLightingDirectorAgent()` | Full agent execution with modules + retry |
| `buildBatterySprayerLightingDirectorInput()` | Garden sprayer kitchen fixture |
| `fromLightingSection()` | Spec-compliant LightingBlueprint output |
| `validateLightingSupportsStory()` | Outdoor scene rejects industrial workshop lighting |
| `validateLightingDirectorAgentWithExecution()` | Structure + kitchen test |

## Integration

- Ch 4.14 `lighting-director-engine` — core lighting physics model
- Ch 7.13 `photography-director-agent` — Photography Blueprint input
- Ch 7.12 `composition-director-agent` — Layout Blueprint input
- Ch 7.11 `scene-director-agent` — Scene Blueprint input
- Ch 7.10 `visual-story-director-agent` — Story Blueprint input
- Ch 7.6 `agent-professional-decision` — lighting scheme decision

## Golden Rule

The buyer rarely notices good light but instantly feels bad light. Lighting Director uses light as commercial psychology — not decoration.
