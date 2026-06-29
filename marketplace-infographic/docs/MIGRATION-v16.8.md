# v16.8 Prompt Compiler

## Principle

**Prompt Compiler NEVER invents design.** It compiles structured decisions (Creative Brief, Market Intelligence, Knowledge Engine, Design Genome, Scene Blueprint, LayoutSpec, Brand/Luxury Rules, Rendering Strategy) into one deterministic rendering prompt.

Prompt Builder is now a thin wrapper over the compiler for backward compatibility.

## Pipeline

```
Story Engine
    ↓
Scene Director → SceneBlueprint
    ↓
Composition Director → LayoutSpec (geometry)
    ↓
Layout Engine + Quality Gate
    ↓
Prompt Compiler (13 sections + negative prompt + validation)
    ↓
SD Background → Composite → Render
```

## Module

`src/lib/design/prompt-compiler/`

| File | Role |
|------|------|
| `types.ts` | Input/result interfaces, Design Constitution |
| `profiles.ts` | 12 rendering profiles (Premium, Luxury, Technical, …) |
| `sections.ts` | 12 modular section compilers (ordered) |
| `negative-prompt.ts` | Auto-built negative prompt |
| `validation.ts` | Pre-render validation + scores |
| `compiler.ts` | `compileRenderingPrompt()` orchestrator |
| `index.ts` | Public exports |

## Rendering sections (compile order)

1. Product Identity  
2. Scene  
3. Environment  
4. Composition  
5. Lighting  
6. Materials  
7. Camera  
8. Background  
9. Visual Hierarchy  
10. Typography Safe Zone  
11. Rendering Quality  
12. Marketplace Constraints  
13. Negative Prompt (separate output)

## Hard constraints (Design Constitution)

- Max 4 colors  
- 1 hero object  
- Max 3 secondary elements  
- Minimal decorative objects  
- Whitespace 20–35%  
- No visual clutter, floating products, random particles, unnecessary gradients  

## Validation

Before rendering, the compiler checks composition/scene completeness, camera, lighting, materials, layout references, brand consistency, and marketplace compatibility. On failure it recompiles once with stricter minimal profile.

## API fields

```json
{
  "pipelineVersion": "v16.8-prompt-compiler",
  "renderingProfile": "technical",
  "negativePrompt": "low quality, oversaturated, floating object, …",
  "readabilityScore": 88,
  "promptComplexityScore": 75,
  "promptCompilerApproved": true,
  "promptCompilerAttempts": 1
}
```

Stored payload (`generatedJson`) includes `promptCompiler` metadata with per-section explainability (module, reason, rules applied).

## Migration from v16.7

| Before | After |
|--------|-------|
| `buildSceneBackgroundPrompt()` prose fallback | `compileSceneRenderingPrompt()` deterministic sections |
| Scene narrative injected as prose | Scene from SceneBlueprint only |
| No negative prompt in pipeline | `negativePrompt` on brief + API response |
| No validation | Validation + optional recompile |

### Handler integration

`generate-infographic-handler.ts` calls `compileBackgroundPrompt()` which delegates to `compileSceneRenderingPrompt()`.

### Backward compatibility

- `buildSceneBackgroundPrompt()` still exported; returns `.prompt` only  
- `buildSceneNegativeHints()` delegates to compiler negative prompt  

## Test

```bash
npx tsx src/lib/design/prompt-compiler/prompt-compiler.spec.ts
```
