# DESIGN AI v18 — Chapter 6.12: Render Adapter Stage

## Purpose

Render Adapter Stage transforms the internal Render Blueprint into a format understood by a specific Render Provider. By this point the system knows what to create, how the scene looks, composition, lighting, and photographic scheme. The adapter answers only one question: how to explain this to the image generation model.

## Design Philosophy

Render Blueprint is Design AI's internal language. Each provider (Flux, GPT Image, Ideogram, SDXL, Imagen, Midjourney) understands instructions differently. Design AI never depends on model specifics — adaptation is a dedicated layer.

```text
Design AI → Render Blueprint → Render Adapter → Provider
```

## Responsibilities

| Area | Output |
|------|--------|
| Blueprint translation | Semantic blocks from director sections |
| Provider adaptation | `StageProviderProfile` per model |
| Prompt generation | `PlannedRenderRequest.positivePrompt` |
| Negative prompt | When `negativePromptSupport` is true |
| Parameter mapping | width, height, seed, guidance, steps |
| Marketplace adaptation | WB 900×1200, Amazon 2000×2000 |
| Constraint enforcement | no text, no people, hero preservation |
| Request assembly | `CompiledProviderRequest` for provider stage |

The adapter does not make design decisions — all decisions are in the Blueprint.

## Planned Render Request

`PlannedRenderRequest` implements the chapter spec render request shape, distinct from Ch 4.17 `AdapterRenderIntent`.

## Key APIs

| API | Role |
|-----|------|
| `getStageProviderProfile()` | Provider capability profile |
| `resolveMarketplaceRenderDimensions()` | Marketplace width/height/aspect |
| `prepareBlueprintForAdapter()` | Freeze lifecycle + marketplace params |
| `buildPlannedRenderRequest()` | Bridge to Ch 4.17 `runRenderAdapter()` |
| `runRenderAdapterStage()` | Full 15-stage internal pipeline |
| `enrichPipelineContextWithRenderAdapter()` | Render context patch |
| `runRenderAdapterStageFromPipeline()` | Consensus → adapter chain |

## Integration

- Ch 6.11 approved `PlannedConsensusReport`
- Ch 4.17 `runRenderAdapter()` / `buildAdapterRenderIntent()`
- Ch 6 `executeDesignPipelineStage(RENDER_ADAPTER)`
- Render Provider (downstream)

## Golden Rule

Blueprint describes what must be created. Render Provider creates the image. Render Adapter is the translator — it never makes design decisions.

## Failure Conditions

Violated when agents know provider specifics, blueprint depends on a model, prompt changes design meaning, new models cannot be added via adapter only, or pipeline must change when switching providers.
