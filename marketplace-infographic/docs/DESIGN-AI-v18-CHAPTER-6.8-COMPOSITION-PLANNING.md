# DESIGN AI v18 — Chapter 6.8: Composition Planning Stage

## Purpose

Composition Planning answers **"How should all elements be placed inside the frame?"** after Story and Scene are defined. It organizes space so the buyer's eye follows a designed path and the product remains the primary focus.

## Design Philosophy

Generic AI builds composition intuitively. Design AI treats composition as an engineering system: every object has visual weight, priority, safe area, relationships, and influence on the attention path.

## Responsibilities

| Area | Output |
|------|--------|
| Layout pattern | `PlannedCompositionBlueprint.layoutPattern` |
| Hero placement | `.heroPlacement` |
| Visual hierarchy | `.visualHierarchy` |
| Reading flow | `.readingFlow` |
| Negative space | `.negativeSpace` |
| Overlay zones | `.textAreas`, `.badgeAreas` |
| Safe zones | `.safeZones` |
| Composition Blueprint | bridge to Ch 4.12 |

Composition Planning does **not** decide lighting, materials, camera, or colors.

## Planned Composition Blueprint

`PlannedCompositionBlueprint` implements the chapter spec `CompositionBlueprint`.

## Key APIs

| API | Role |
|-----|------|
| `selectLayoutPattern()` | centered_hero, split_layout, marketplace_split, etc. |
| `buildPlannedCompositionBlueprint()` | Full planned composition |
| `buildCompositionDirectorContextFromPlanning()` | Ch 4.12 bridge |
| `runCompositionPlanningStage()` | Core stage + composition director |
| `compositionPlanningToMutations()` | Blueprint `composition` section |
| `enrichPipelineContextWithCompositionPlanning()` | Ch 6.2 technical context |

## Integration

- Ch 6.7 `PlannedSceneBlueprint`
- Ch 6.6 `PlannedStoryBlueprint`
- Ch 6.5 Business Model
- Ch 6.3 Product Profile
- Ch 4.12 `buildLayoutSection()` / composition-director
- Ch 6 `executeDesignPipelineStage(COMPOSITION_PLANNING)`

## Golden Rule

Composition is the art of managing human attention — not decorating the frame.

## Failure Conditions

Violated when hero is missing, reading flow is chaotic, overlays cover the product, layout is overloaded, balance breaks, or reading flow conflicts with Story.
