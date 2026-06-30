# DESIGN AI v18 — Chapter 7.11: Scene Director Agent

## Purpose

Scene Director designs the surrounding world where the product story happens. After Visual Story Director defines the story, this agent answers: **"Where should this story happen?"**

## Mission

Create an environment that maximally amplifies the Story without distracting from the Hero Product — credible, commercial, and category-appropriate.

## Module

Implemented as `scene-director-agent-*`, extending Ch 4.11 `scene-director-*` and Ch 6.7 `scene-planning-stage-*`.

| File | Role |
|------|------|
| `scene-director-agent-types.ts` | 7 internal modules, input/output contracts, KPIs |
| `scene-director-agent-engine.ts` | Agent runner, retry, Ch 7.5/7.6 integration |
| `scene-director-agent.spec.ts` | Kitchen and validation tests |

## Internal Modules (7)

1. Scene Selector
2. Environment Builder
3. Background Designer
4. Atmosphere Engine
5. Prop Planner
6. Scene Validator
7. Scene Blueprint Builder

## Pipeline Position

```text
Visual Story Director → Scene Director → Composition Director
```

## Key APIs

| API | Role |
|-----|------|
| `executeSceneDirectorAgent()` | Full agent execution with modules + retry |
| `buildBatterySprayerSceneDirectorInput()` | Garden sprayer kitchen fixture |
| `fromPlannedSceneBlueprint()` | Spec-compliant SceneBlueprint output |
| `validateEnvironmentSupportsStory()` | Garden story requires garden environment |
| `validateSceneDirectorAgentWithExecution()` | Structure + kitchen test |

## Integration

- Ch 6.7 `scene-planning-stage-engine` — core scene planning
- Ch 4.11 `scene-director-engine` — scene section validation
- Ch 7.10 `visual-story-director-agent` — Story Blueprint input
- Ch 7.6 `agent-professional-decision` — scene environment decision

## Golden Rule

The buyer imagines the product in their life instantly. Scene Director creates that world — not composition, not light, not photography.
