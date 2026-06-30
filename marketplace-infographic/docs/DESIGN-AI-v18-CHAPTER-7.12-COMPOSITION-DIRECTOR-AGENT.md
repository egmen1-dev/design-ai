# DESIGN AI v18 — Chapter 7.12: Composition Director Agent

## Purpose

Composition Director builds the visual structure of the future infographic. After Story and Scene are defined, this agent answers: **"How should elements be arranged so the buyer's gaze moves as intended?"**

## Mission

Design composition that instantly attracts attention, keeps Hero Product dominant, guides the buyer's eye, reserves space for text, and follows commercial design laws.

## Module

Implemented as `composition-director-agent-*`, extending Ch 4.12 `composition-director-*` and Ch 6.8 `composition-planning-stage-*`.

| File | Role |
|------|------|
| `composition-director-agent-types.ts` | 7 internal modules, input/output contracts, KPIs |
| `composition-director-agent-engine.ts` | Agent runner, retry, Ch 7.5/7.6 integration |
| `composition-director-agent.spec.ts` | Kitchen and validation tests |

## Internal Modules (7)

1. Layout Selector
2. Hero Placement Engine
3. Hierarchy Builder
4. Reading Flow Planner
5. Negative Space Planner
6. Layout Validator
7. Layout Blueprint Builder

## Pipeline Position

```text
Scene Director → Composition Director → Photography Director
```

## Key APIs

| API | Role |
|-----|------|
| `executeCompositionDirectorAgent()` | Full agent execution with modules + retry |
| `buildBatterySprayerCompositionDirectorInput()` | Garden sprayer kitchen fixture |
| `fromPlannedCompositionBlueprint()` | Spec-compliant LayoutBlueprint output |
| `validateLayoutSupportsStory()` | Garden story rejects premium-only layout |
| `validateCompositionDirectorAgentWithExecution()` | Structure + kitchen test |

## Integration

- Ch 6.8 `composition-planning-stage-engine` — core layout planning
- Ch 4.12 `composition-director-engine` — layout section validation
- Ch 7.11 `scene-director-agent` — Scene Blueprint input
- Ch 7.10 `visual-story-director-agent` — Story Blueprint input
- Ch 7.6 `agent-professional-decision` — composition readability decision

## Golden Rule

Composition is the invisible director of attention. The buyer does not know why they looked at the product first — but the layout must make that path inevitable.
