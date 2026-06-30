# DESIGN AI v18 — Chapter 4.14: Lighting Director

## Purpose

Lighting Director designs a **physically plausible lighting model** for commercial product photography. It projects light — not images, composition, camera settings, or prompts.

## Pipeline Position

```
Commercial Photo Director → Lighting Director → Lighting Section → Camera Director
```

Runs only after Photography Section exists.

## Responsibilities (only)

- Lighting scheme and source placement
- Key, fill, rim, and ambient light profiles
- Shadow, contrast, and color temperature
- Lighting mood aligned with Story
- Provider-aware commercial lighting

**Never:** composition, scene selection, materials, camera, prompts.

## Lighting Section

```typescript
interface LightingSection {
  lightingStyle: LightingStyle;
  lightingScheme: LightingScheme;
  keyLight: LightProfile;
  fillLight: LightProfile;
  rimLight?: LightProfile;
  ambientLight: AmbientProfile;
  shadowProfile: ShadowProfile;
  contrastProfile: ContrastProfile;
  colorTemperature: number;
  lightingMood: string;
  providerHints: string[];
  lightingBlueprint: LightingBlueprint;
  confidence: number; // 0.0..1.0
}
```

## Golden Rule

Lighting Director does not make lighting dramatic — it makes it **plausible**. The buyer should notice the product, not the light.

## Implementation

| Module | Role |
|--------|------|
| `lighting-director-types.ts` | Schemes, light profiles, shadow/contrast models |
| `lighting-director-engine.ts` | Scheme selection, validation, decision pipeline |
| `agents/lighting-director-agent.ts` | Agent contract integration |

## Integration

Uses Chapter 4.6 Context, 4.7 Memory, 4.8 Decision pipeline, and 4.9 Confidence. Scheme selection is driven by **Photography Section** and Story, with cutout-aware contact shadows for compositing.
