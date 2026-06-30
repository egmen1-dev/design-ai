# DESIGN AI v18 — Chapter 6.6: Visual Story Planning Stage

## Purpose

Visual Story Planning answers **"How do we show this through the image?"** after Product Analysis and Business Understanding established what is sold, to whom, and why it should be bought.

## Design Philosophy

Generic AI: Product → Background → Text.

Design AI: Business Goal → Story → Scene → Composition → Photography → Image.

The buyer perceives a whole story, not isolated elements.

## Responsibilities

| Area | Output |
|------|--------|
| Main story | `PlannedStoryBlueprint` |
| Story Pattern | problem_solution, hero_product, lifestyle, premium_experience, feature_showcase |
| Emotional line | `emotionalTone` |
| Primary message | single headline-level message |
| Narrative structure | `storyFlow` |
| Hero moment | central visual moment for composition |
| Story Blueprint | bridge to Ch 4.10 `StoryBlueprint` |

Story Director handles **meaning only** — not composition, lighting, or photography.

## Planned Story Blueprint

`PlannedStoryBlueprint` implements the chapter spec `StoryBlueprint`.

## Key APIs

| API | Role |
|-----|------|
| `selectStoryPatternFromBusiness()` | Pattern from Business Model arc |
| `buildPlannedStoryBlueprint()` | Full planned story |
| `buildStoryConstraints()` | Premium / feature showcase limits |
| `runVisualStoryPlanningStage()` | Core stage + Ch 4.10 director bridge |
| `storyPlanningToMutations()` | Blueprint `story` section |
| `enrichPipelineContextWithStoryPlanning()` | Ch 6.2 creative context |
| `validateVisualStoryPlanning()` | System validation |

## Integration

- Ch 6.3 Product Profile
- Ch 6.5 `PipelineBusinessModel`
- Ch 6.4 Knowledge Package
- Ch 4.10 `buildStorySection()` / `visual-story-director`
- Ch 6 `executeDesignPipelineStage(VISUAL_STORY_PLANNING)`

## Golden Rule

The buyer remembers the story seen in the first seconds — not composition or lighting.

## Failure Conditions

Violated when no story, multiple primary messages, story contradicts business model, undefined emotional tone, or downstream agents receive conflicting narratives.
