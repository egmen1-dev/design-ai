# DESIGN AI v18 — Chapter 6.7: Scene Planning Stage

## Purpose

Scene Planning answers **"Where should this story happen?"** after Visual Story Planning defined the narrative. Scene exists only to amplify product value — never for decoration alone.

## Design Philosophy

Generic AI: Product → Beautiful Background → Image.

Design AI: Story → Scene → Environment → Photography → Composition.

Scene is a continuation of Story — when Story changes, Scene must change.

## Responsibilities

| Area | Output |
|------|--------|
| Scene type | `PlannedSceneBlueprint.sceneType` |
| Environment | `.environment`, `.location` |
| Realism | `.realismLevel` |
| Support objects | story-relevant only |
| Time / weather | `.timeOfDay`, `.weather` |
| Negative rules | `.negativeObjects` |
| Scene Blueprint | bridge to Ch 4.11 |

Scene Planning does **not** decide composition, lighting, camera, or materials.

## Planned Scene Blueprint

`PlannedSceneBlueprint` implements the chapter spec `SceneBlueprint`.

## Key APIs

| API | Role |
|-----|------|
| `selectSceneCategory()` | studio, outdoor, home_interior, etc. |
| `buildPlannedSceneBlueprint()` | Full planned scene |
| `buildSceneDirectorContextFromPlanning()` | Ch 4.11 bridge |
| `runScenePlanningStage()` | Core stage + scene director |
| `scenePlanningToMutations()` | Blueprint `scene` section |
| `enrichPipelineContextWithScenePlanning()` | Ch 6.2 creative context |

## Integration

- Ch 6.6 `PlannedStoryBlueprint`
- Ch 6.5 Business Model
- Ch 6.3 Product Profile
- Ch 4.11 `buildSceneSection()` / scene-director
- Ch 6 `executeDesignPipelineStage(SCENE_PLANNING)`

## Golden Rule

Buyer understands where, how, and why the product is used before reading specs.

## Failure Conditions

Violated when scene is decorative only, unrelated to product, random props, background competes with hero, or usage context is unclear.
