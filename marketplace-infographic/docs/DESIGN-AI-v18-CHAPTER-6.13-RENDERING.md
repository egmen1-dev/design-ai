# DESIGN AI v18 — Chapter 6.13: Rendering Stage

## Purpose

Rendering Stage is where the Render Blueprint first becomes a real image. All prior pipeline stages only designed the output. Design AI sends the compiled specification to the Render Provider and receives the visual result.

## Design Philosophy

Render Provider is an execution system, not a design source. Quality depends on blueprint quality, not prompt cleverness.

```text
Render Blueprint → Render Adapter → Render Request → Provider API → Image → Storage → Vision Validation
```

## Responsibilities

| Area | Output |
|------|--------|
| Provider dispatch | `StageRenderProvider.generate()` |
| Image generation | `PlannedRenderResult` |
| Technical gate | resolution, format, existence checks |
| Error handling | network, timeout, provider failures |
| Retry planning | provider / adapter / pipeline levels |
| Storage | `RenderingStorageRecord` with full reproducibility metadata |
| Vision handoff | `imageRef` + `visionReady` flag |

Rendering Stage does not evaluate artistic quality — only technical delivery.

## Planned Render Result

`PlannedRenderResult` implements the chapter spec `RenderResult`, distinct from Ch 3.11 `ProviderResponse`.

## Key APIs

| API | Role |
|-----|------|
| `plannedRequestToStageRenderRequest()` | Adapter output → executor input |
| `createDefaultStageRenderProvider()` | Mock provider for tests |
| `validateTechnicalImageQuality()` | Technical gate only |
| `classifyRenderingError()` | Retry level selection |
| `runRenderingStage()` | Full 15-stage async pipeline |
| `runRenderingStageSyncFromPipeline()` | Sync path for design pipeline executor |
| `enrichPipelineContextWithRendering()` | Render context patch with imageRef |

## Integration

- Ch 6.12 `PlannedRenderRequest` / `CompiledProviderRequest`
- Ch 3.11 `RenderPipeline` provider adapters
- Ch 6 `executeDesignPipelineStage(RENDER_PROVIDER)`
- Vision Analysis (downstream)

## Golden Rule

Rendering Stage does not create design — it creates the image. All design decisions were made before generation.

## Failure Conditions

Violated when provider errors halt the pipeline, retry is impossible, metadata is missing, corrupted images pass the gate, or the stage depends on a specific model implementation.
