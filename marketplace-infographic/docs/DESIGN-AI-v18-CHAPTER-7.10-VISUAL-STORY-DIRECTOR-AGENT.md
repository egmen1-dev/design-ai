# DESIGN AI v18 — Chapter 7.10: Visual Story Director Agent

## Purpose

Visual Story Director is the first creative agent in Design AI Platform. It transforms product and business understanding into a visual story — the idea behind future infographic.

## Mission

Answer: **"What story should the buyer see in the first 2–3 seconds?"** — meaning only, not scene, composition, or lighting.

## Module

Implemented as `visual-story-director-agent-*`, extending Ch 4.10 `visual-story-director-*` and Ch 6.6 `visual-story-planning-stage-*`.

| File | Role |
|------|------|
| `visual-story-director-agent-types.ts` | 7 internal modules, input/output contracts, KPIs |
| `visual-story-director-agent-engine.ts` | Agent runner, retry, Ch 7.5/7.6 integration |
| `visual-story-director-agent.spec.ts` | Kitchen and validation tests |

## Internal Modules (7)

1. Story Pattern Selector
2. Commercial Story Engine
3. Emotion Designer
4. Hero Moment Builder
5. Narrative Planner
6. Story Validator
7. Story Blueprint Builder

## Pipeline Position

```text
Knowledge Retrieval → Visual Story Director → Scene Director
```

## Key APIs

| API | Role |
|-----|------|
| `executeVisualStoryDirectorAgent()` | Full agent execution with modules + retry |
| `buildBatterySprayerStoryDirectorInput()` | Garden sprayer kitchen fixture |
| `fromPlannedStoryBlueprint()` | Spec-compliant StoryBlueprint output |
| `buildCommercialStoryNarrative()` | Selling story, not product description |
| `validateVisualStoryDirectorAgentWithExecution()` | Structure + kitchen test |

## Integration

- Ch 6.6 `visual-story-planning-stage-engine` — core story planning
- Ch 4.10 `visual-story-director-engine` — story section validation
- Ch 7.6 `agent-professional-decision` — multi-candidate story decision
- Ch 7.5 `agent-memory-model` — isolated memory during execution

## Golden Rule

The buyer decides with emotions before seeing composition or lighting. This agent creates the story the entire ecosystem turns into commercial infographic.
