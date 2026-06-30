# DESIGN AI v18 — Chapter 6.9: Photography Planning Stage

## Purpose

Photography Planning answers **"How should this look through a professional commercial photographer's eyes?"** after Scene and Composition are defined.

## Design Philosophy

Generic AI treats photography as part of the prompt. Design AI treats photography as a separate engineering discipline with dozens of decisions made before render.

## Responsibilities

| Area | Output |
|------|--------|
| Camera preset | `PlannedPhotographyBlueprint.cameraPreset` |
| Lens | `.lens` |
| Angle / height | `.cameraAngle`, `.cameraHeight` |
| Depth of field | `.depthOfField` |
| Lighting strategy | `.lightingPreset` |
| Exposure | `.exposure` |
| Reflections | `.reflectionStyle` |
| Photography Blueprint | bridge to Ch 4.13 |

Photography Planning defines lighting **strategy** — Lighting Director performs the calculation.

## Planned Photography Blueprint

`PlannedPhotographyBlueprint` implements the chapter spec `PhotographyBlueprint`.

## Key APIs

| API | Role |
|-----|------|
| `selectCameraPreset()` | studio, lifestyle, technical cameras |
| `selectLens()` | 35mm, 50mm, 85mm, 100mm macro |
| `buildPlannedPhotographyBlueprint()` | Full planned photography |
| `buildCommercialPhotoDirectorContextFromPlanning()` | Ch 4.13 bridge |
| `runPhotographyPlanningStage()` | Core stage + commercial photo director |
| `photographyPlanningToMutations()` | Blueprint `photography` section |
| `enrichPipelineContextWithPhotographyPlanning()` | Ch 6.2 technical context |

## Integration

- Ch 6.8 `PlannedCompositionBlueprint`
- Ch 6.7 `PlannedSceneBlueprint`
- Ch 6.6 `PlannedStoryBlueprint`
- Ch 6.3 Product Profile
- Ch 4.13 `buildPhotographySection()` / commercial-photo-director
- Ch 6 `executeDesignPipelineStage(PHOTOGRAPHY_PLANNING)`

## Golden Rule

Buyer instantly feels whether the image is professional — lens and exposure are invisible, trust is not.

## Failure Conditions

Violated when camera params are random, perspective conflicts with composition, photography looks artificial, lighting strategy is missing, or hero product loses visual advantage.
