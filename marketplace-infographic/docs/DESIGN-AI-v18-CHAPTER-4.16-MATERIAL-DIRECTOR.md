# DESIGN AI v18 — Chapter 4.16: Material Director

## Purpose

Material Director designs the **physically plausible material world** for commercial product photography. It projects surface physics — not textures, lighting, camera, composition, or prompts.

## Pipeline Position

```
Camera Director → Material Director → Material Section → Render Adapter
```

Last Technical Director before Render Adapter. Runs after Camera Section exists.

## Responsibilities (only)

- Environment surface materials and palette
- Reflection and roughness profiles
- Background and contact surfaces
- Texture complexity and micro details
- Provider-aware material stability

**Never:** story, composition, lighting, camera, prompts.

## Material Section

```typescript
interface MaterialSection {
  materialWorld: MaterialWorld;
  surfacePalette: SurfaceMaterial[];
  reflectionProfile: ReflectionProfile;
  roughnessProfile: RoughnessProfile;
  backgroundMaterial: BackgroundMaterial;
  contactSurface: ContactSurface;
  textureComplexity: TextureComplexity;
  microDetailLevel: MicroDetailLevel;
  providerHints: string[];
  materialBlueprint: MaterialBlueprint;
  confidence: number; // 0.0..1.0
}
```

## Golden Rule

Material Director does not make the background beautiful — it makes the surrounding world **physically convincing**. The buyer should subconsciously feel the product exists in real space.

## Implementation

| Module | Role |
|--------|------|
| `material-director-types.ts` | Surface materials, reflection/roughness, contact surfaces |
| `material-director-engine.ts` | World selection, validation, decision pipeline |
| `agents/material-director-agent.ts` | Agent contract integration |

## Integration

Uses Chapter 4.6 Context, 4.7 Memory, 4.8 Decision pipeline, and 4.9 Confidence. Material selection is driven by **Scene**, Photography, Lighting, and Camera sections — with marketplace cutout compositing as a primary constraint.
