# DESIGN AI v18 — Chapter 4.25: Provider Independence

## Purpose

Provider Independence is a fundamental principle of Design AI: the entire system must be fully independent of any specific image generation model. Replacing the Render Provider should require changing only the Render Adapter.

## Architecture

```
Creative Directors → Technical Directors → Render Blueprint → Render Adapter → Provider
```

When the provider changes, everything above the adapter remains unchanged.

## Single Source of Truth

Render Blueprint is the source of truth — not prompt, not provider, not LLM. Prompt is a temporary translation of blueprint into a specific model's language.

## Provider Capability Profile

```typescript
interface ProviderCapabilities {
  supportsLongPrompt: boolean;
  supportsNegativePrompt: boolean;
  supportsStyleReference: boolean;
  supportsImageConditioning: boolean;
  supportsControlNet: boolean;
  maxPromptLength: number;
  preferredVocabulary: string[];
  knownWeaknesses: string[];
  knownStrengths: string[];
}
```

Creative agents never use this directly — only the adapter.

## Key Behaviors

| Behavior | Implementation |
|----------|----------------|
| No provider vocabulary in agents | Banned: 8k, hyper realistic, masterpiece, flux, etc. |
| Adapter isolation | Only adapter compiles prompts; blueprint read-only |
| Multi-provider compile | Same blueprint → FLUX, GPT Image, Imagen |
| Semantic independence | Soft Window Light stays semantic across providers |
| Provider benchmarking | Compare providers without changing blueprint |
| Explainability chain | Image → Render Intent → Blueprint → Agent Decisions |

## Golden Rule

Design AI designs commercial photography, not prompts. If changing provider requires rewriting agents, the system is built incorrectly.

## Implementation

| Module | Role |
|--------|------|
| `provider-independence-types.ts` | Capability profiles, violations, benchmark |
| `provider-independence-engine.ts` | Validation, multi-provider compile, benchmarking |

## Integration

Validates Render Blueprint and agent outputs before render. Works with Render Adapter (Ch 4.17) and Provider Capabilities (Ch 3.11).
