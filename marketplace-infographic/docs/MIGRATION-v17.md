# v17.0 Render Engine

## Paradigm shift

| v16 (model-centric) | v17 (renderer-centric) |
|---------------------|------------------------|
| Prompt Compiler → one giant text | Render Planner → structured `RenderRequest` |
| HF FLUX only | Swappable `RenderingProvider` |
| Coordinates in prompt string | Coordinates in JSON — adapter ignores unsupported fields |
| Product sometimes ghosted in SD | Product **never** regenerated — PNG cutout only |

## New pipeline

```
Product
  ↓
Knowledge Engine
  ↓
Story Engine
  ↓
Scene Director
  ↓
Composition Director
  ↓
Design Constitution
  ↓
Render Planner          ← replaces Prompt Compiler for rendering
  ↓
Render Adapter          ← model-specific compact prompts
  ↓
Rendering Provider      ← Pollinations (default) or HuggingFace (legacy)
  ↓
Canvas Composer         ← product shadows/reflection (existing scene-compositor)
  ↓
HTML Template           ← headline, badges, CTA (unchanged)
  ↓
Critics + Constitution
  ↓
Final Slide
```

## Module structure

```
src/lib/render-engine/
├── types.ts
├── config.ts
├── index.ts
├── planner/
│   ├── render-planner.ts    # RenderRequest builder — NEVER writes prompts
│   └── model-selection.ts   # Industrial→Kontext, Luxury→GPT Image, etc.
├── profiles/                # 12 rendering profiles
├── adapters/
│   ├── pollinations-adapters.ts
│   └── registry.ts
├── providers/
│   ├── pollinations/provider.ts
│   ├── huggingface/provider.ts   # legacy v16 wrapper
│   └── registry.ts
├── composer/canvas-composer.ts
├── retry/retry-engine.ts
├── quality/render-quality.ts
└── render-engine.spec.ts
```

## Feature flag

```bash
# Enable v17 render engine (Pollinations default)
RENDER_ENGINE_V17=1
# or
PIPELINE_V17=1

# Optional Pollinations key (works without key on free tier with limits)
POLLINATIONS_API_KEY=pk_...

# Fallback to HuggingFace inside v17
RENDER_PROVIDER=huggingface
```

**Default (flag off):** v16 path — Prompt Compiler + HF FLUX.1-schnell. No breaking changes.

## RenderRequest example

```json
{
  "version": "17.0",
  "profileId": "industrial",
  "modelId": "kontext",
  "providerId": "pollinations",
  "scene": { "type": "kitchen", "atmosphere": "...", "depth": "medium" },
  "layout": { "whitespaceTarget": 28, "palette": ["#1a1a2e"], "heroZone": { "x": 0.5, "y": 0.32, "width": 0.6, "height": 0.63 } },
  "lighting": { "key": "soft commercial key", "temperatureK": 5000 },
  "materials": { "surface": "stone", "floor": "matte" },
  "camera": { "lensMm": 70, "height": "eye level" },
  "quality": { "target": "8k", "photorealistic": true },
  "negative": { "terms": ["low quality", "text", "product"], "zoneExclusions": [] }
}
```

Adapters compile **small modules** only — coordinates stay in JSON for future ControlNet/ComfyUI adapters.

## Model selection rules

| Profile | Default model |
|---------|---------------|
| Industrial / Construction | Kontext |
| Luxury / Beauty | GPT Image |
| Minimal / Premium | Flux |
| Lifestyle / Outdoor / Furniture | Seedream |
| Electronics | Kontext |

Retry chain: Kontext → GPT Image → Flux (highest design score wins).

## API response fields (v17)

```json
{
  "pipelineVersion": "v17.0-render-engine",
  "backgroundSource": "provider",
  "renderProvider": "pollinations",
  "renderModel": "flux",
  "renderAttempts": 2,
  "renderDesignScore": 88
}
```

Stored in `generatedJson.renderEngine`.

## Implementation checklist

- [x] TypeScript interfaces (`RenderRequest`, `RenderingProvider`, `RenderAdapter`)
- [x] Render Planner
- [x] 4 Pollinations adapters (Flux, Kontext, GPT Image, Seedream)
- [x] Pollinations provider with retry/timeout
- [x] HuggingFace legacy provider adapter
- [x] Retry engine with model fallback
- [x] Canvas Composer wrapper (product preservation)
- [x] Render quality gate
- [x] Handler integration behind `RENDER_ENGINE_V17`
- [x] Unit tests
- [ ] ComfyUIAdapter (future)
- [ ] OpenAIAdapter (future)
- [ ] Vision critic multimodal pass
- [ ] ControlNet masks from LayoutSpec geometry

## Test

```bash
npx tsx src/lib/render-engine/render-engine.spec.ts
```
