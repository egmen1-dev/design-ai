# DESIGN AI v18 — Chapter 4.13: Commercial Photo Director

## Purpose

Commercial Photo Director is the **last Creative Director** before Render Intent formation. It transforms Story, Scene, and Composition into a **professional commercial photoshoot plan** — thinking like an advertising photographer, not a designer or image generator.

## Pipeline Position

```
Story → Scene → Composition → Commercial Photo Director → Photography Section → Lighting / Camera / Material Directors
```

## Responsibilities (only)

- Photography style and shoot character
- Depth, mood, focus strategy, product interaction
- Shooting narrative and intents for Lighting, Camera, Material Directors
- Marketplace and provider-aware commercial photography

**Never:** story, scene, layout, prompts, or model-specific generation parameters.

## Photography Section

```typescript
interface PhotographySection {
  photographyStyle: PhotographyStyle;
  photoMood: PhotoMood;
  depthProfile: PhotoDepthProfile;
  focusStrategy: FocusStrategy;
  backgroundBlur: number;
  productInteraction: ProductInteraction;
  shootingNarrative: string;
  lightingIntent: string;
  cameraIntent: string;
  materialIntent: string;
  providerHints: string[];
  photographyBlueprint: PhotographyBlueprint;
  confidence: number; // 0.0..1.0
}
```

## Golden Rule

Commercial Photo Director does not think like an image generator — it thinks like a **professional advertising photographer** preparing a shoot before the shutter is pressed.

## Implementation

| Module | Role |
|--------|------|
| `commercial-photo-director-types.ts` | Photography styles, moods, focus, interaction profiles |
| `commercial-photo-director-engine.ts` | Shoot plan selection, validation, decision pipeline |
| `agents/commercial-photo-director-agent.ts` | Agent contract integration |

## Integration

Uses Chapter 4.6 Context, 4.7 Memory, 4.8 Decision pipeline, and 4.9 Confidence. Style selection is driven by **Story + Scene + Composition** with provider and marketplace constraints.
