# DESIGN AI v18 — Chapter 3.11: Render Pipeline Contract

> Реализация: `render-pipeline.ts`, `render-adapters.ts`, `prompt-compiler.ts`

## Purpose

Единственный допустимый путь от `RenderBlueprint` к модели генерации. Decision Layer (агенты) отделён от Render Layer (адаптеры).

## Architecture

```text
RenderBlueprint → Render Adapter → ProviderRequest → Image Provider → Background → Composite → Vision QA
```

**Main Rule:** Prompt существует только внутри Render Adapter. Blueprint описывает сцену, не prompt-строку.

## Render Intent

```typescript
const intent = extractRenderIntent(blueprint);
// scene, camera, lighting, composition, materials, mood, background, constraints
```

Универсален для FLUX, GPT Image, SDXL, Pollinations.

## API

```typescript
import { compileFluxAdapterOutput, RenderPipeline } from "./render-blueprint";

const output = compileFluxAdapterOutput(blueprint); // only after FROZEN
// { prompt, negativePrompt, generator, compiledAt } — NOT stored in blueprint

const pipeline = new RenderPipeline({ renderFn });
const result = await pipeline.renderWithFallback(blueprint);
```

## Provider Capabilities

Каждый адаптер учитывает `ProviderCapabilities` — negative prompt, CFG, steps, seed и т.д.

Неподдерживаемые поля (coordinates, HTML, CTR, LayoutSpec) исключаются при negotiation.

## Adapters

| Adapter | Provider | Style |
|---------|----------|-------|
| FluxRenderAdapter | flux | короткий фото-английский |
| GptImageRenderAdapter | gpt-image | полное описание сцены, без negative |
| SdxlRenderAdapter | sdxl | positive + negative + CFG |
| PollinationsRenderAdapter | pollinations | API-safe compressed |

## Fallback Chain

```text
flux → gpt-image → sdxl → pollinations
```

Blueprint не меняется — меняется только adapter.

## Golden Rule

Render Adapter — только переводчик. Запрещено: менять blueprint, decision graph, retry, critics, layout.

## Test

```bash
npx tsx src/lib/render-blueprint/render-pipeline.spec.ts
```
