# DESIGN AI v18 — Chapter 7.17: Typography Director Agent

## Purpose

Typography Director designs all infographic text communication after Material Director completes the photographic scene. This agent answers: **"How should text be shown so it is read in fractions of a second?"**

## Mission

Make text instantly readable, story-aligned, non-competing with the hero product, hierarchy-clear, and commercially effective. Typography Director never decorates text — it makes it efficient.

## Module

Implemented as `typography-director-agent-*`, extending Ch 5.11 `typography-knowledge-*`.

| File | Role |
|------|------|
| `typography-director-agent-types.ts` | 7 internal modules, input/output contracts, KPIs |
| `typography-director-agent-engine.ts` | Agent runner, retry, Ch 7.5/7.6 integration |
| `typography-director-agent.spec.ts` | Kitchen and validation tests |

## Internal Modules (7)

1. Typography Strategy Selector
2. Hierarchy Builder
3. Readability Engine
4. Text Layout Planner
5. Contrast Controller
6. Typography Validator
7. Typography Blueprint Builder

## Pipeline Position

```text
Material Director → Typography Director → Marketplace Director
```

Typography Director is the first agent that designs the Overlay Layer.

## Key APIs

| API | Role |
|-----|------|
| `executeTypographyDirectorAgent()` | Full agent execution with modules + retry |
| `buildBatterySprayerTypographyDirectorInput()` | Garden sprayer kitchen fixture |
| `buildTextHierarchy()` | Four-level text hierarchy from story and business model |
| `fromTypographySection()` | Spec-compliant TypographyBlueprint output |
| `validateTypographyDirectorAgentWithExecution()` | Structure + kitchen test |

## Integration

- Ch 5.11 `typography-knowledge-engine` — readability rules and validation
- Ch 7.12 `composition-director-agent` — Layout Blueprint safe zones input
- Ch 7.10 `visual-story-director-agent` — Story Blueprint input
- Ch 7.8 `business-understanding-agent` — Business Model input
- Ch 7.6 `agent-professional-decision` — typography strategy decision

## Golden Rule

The buyer does not read the card — they scan it. Typography Director has less than one second to deliver the main message. It does not decorate text — it makes information commercially effective.
