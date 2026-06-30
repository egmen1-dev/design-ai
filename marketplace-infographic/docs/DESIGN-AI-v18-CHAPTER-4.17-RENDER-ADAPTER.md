# DESIGN AI v18 — Chapter 4.17: Render Adapter

## Purpose

Render Adapter is the **boundary** between Design AI and the AI Render Provider. It translates the Render Blueprint into provider language — never design decisions.

## Pipeline Position

```
Technical Directors → Render Blueprint → Render Adapter → Provider Prompt → FLUX
```

After Render Adapter, no design decisions may be made.

## Responsibilities (only)

- Blueprint transformation and prompt compilation
- Provider-specific prompt optimization
- Provider hints forwarding
- Ambiguity removal and model constraint compliance

**Never:** story, scene, layout, photography, lighting, camera, materials — all decided upstream.

## Render Intent (provider output)

```typescript
interface AdapterRenderIntent {
  provider: string;
  positivePrompt: string;
  negativePrompt: string;
  styleHints: string[];
  providerHints: string[];
  cameraHints: string[];
  lightingHints: string[];
  materialHints: string[];
  qualityHints: string[];
  seed: number;
  aspectRatio: string;
  confidence: number;
}
```

The section-based `RenderIntent` from Chapter 3.11 remains the internal blueprint snapshot; `AdapterRenderIntent` is the provider-facing compiled output.

## Translation Pipeline

```
Render Blueprint → Semantic Translation → Provider Mapping → Prompt Optimization → Render Intent
```

## Golden Rule

Render Adapter does not make design decisions — it is a professional translator between Design AI language and the specific AI model language.

## Implementation

| Module | Role |
|--------|------|
| `render-adapter-types.ts` | AdapterRenderIntent, semantic blocks, explainability |
| `render-adapter-engine.ts` | Translation pipeline, validation, compile orchestration |
| `agents/render-adapter-agent.ts` | flux-adapter agent contract (read-only, FROZEN stage) |
| `render-adapters.ts` | Provider adapters wired to Ch 4.17 engine |
| `prompt-compiler.ts` | Provider vocabulary mapping (Ch 3.11 + Ch 4.15/4.16 fields) |

## Integration

Builds on Chapter 3.11 Render Pipeline. Uses upstream director `providerHints` and extended camera/material fields from Chapters 4.15–4.16. Prompt is never stored in the blueprint.
