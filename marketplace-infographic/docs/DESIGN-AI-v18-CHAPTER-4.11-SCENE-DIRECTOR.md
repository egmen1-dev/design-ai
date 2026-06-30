# DESIGN AI v18 — Chapter 4.11: Scene Director

## Purpose

Scene Director is the **second Creative Agent**. It transforms the commercial story from Visual Story Director into a **physical scene** — a world model, not an image, composition, or prompt.

## Pipeline Position

```
Visual Story → Scene Director → Scene Blueprint → Composition Director
```

Runs only after Story Section exists.

## Responsibilities (only)

- Scene type and environment
- Spatial atmosphere and depth
- Environment materials
- Background narrative (why the product is here)
- Physical realism and provider-aware constraints

**Never:** text placement, composition, hero scale, typography, prompts.

## Scene Section

```typescript
interface SceneSection {
  sceneType: SceneType;
  environment: EnvironmentType;
  backgroundNarrative: string;
  lightingMood: string;
  materialPalette: string[];
  depthProfile: DepthProfile;
  cameraEnvironment: string;
  realismProfile: string;
  providerHints: string[];
  sceneBlueprint: SceneBlueprint;
  confidence: number; // 0.0..1.0
}
```

## Golden Rule

Scene Director does not create a beautiful background — it designs a **physical world** where the product naturally belongs. If removing the product leaves a random AI background, the agent failed.

## Implementation

| Module | Role |
|--------|------|
| `scene-director-types.ts` | Scene types, environments, depth profiles |
| `scene-director-engine.ts` | Story-driven scene selection, validation, decision pipeline |
| `agents/scene-director-agent.ts` | Agent contract integration |

## Integration

Uses Chapter 4.6 Context, 4.7 Memory, 4.8 Decision pipeline, and 4.9 Confidence. Environment selection is driven by **Story**, not product category alone.
