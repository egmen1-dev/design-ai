# DESIGN AI v18 — Chapter 4.15: Camera Director

## Purpose

Camera Director designs the **virtual camera viewpoint** for commercial product photography. It controls perspective — not images, lighting, materials, composition, or prompts.

## Pipeline Position

```
Lighting Director → Camera Director → Camera Section → Material Director
```

Runs only after Lighting Section exists.

## Responsibilities (only)

- Camera position, height, angle, and distance
- Focal length and perspective profile
- Hero scale and depth of field
- Framing profile aligned with layout
- Provider-aware commercial camera choices

**Never:** lighting, materials, composition, story, prompts.

## Camera Section

```typescript
interface CameraSection {
  cameraStyle: CameraStyle;
  cameraAngle: CameraAngleStyle;
  cameraHeight: CameraHeightStyle;
  cameraDistance: CameraDistanceStyle;
  focalLength: number;
  perspectiveProfile: PerspectiveProfile;
  heroScale: number;
  depthOfField: DepthOfFieldProfile;
  framingProfile: FramingProfile;
  providerHints: string[];
  cameraBlueprint: CameraBlueprint;
  confidence: number; // 0.0..1.0
}
```

## Golden Rule

Camera Director does not choose a beautiful angle — it chooses the viewpoint from which the buyer fastest understands product value.

## Implementation

| Module | Role |
|--------|------|
| `camera-director-types.ts` | Camera styles, angles, DOF, framing profiles |
| `camera-director-engine.ts` | Style selection, validation, decision pipeline |
| `agents/camera-director-agent.ts` | Agent contract integration |

## Integration

Uses Chapter 4.6 Context, 4.7 Memory, 4.8 Decision pipeline, and 4.9 Confidence. Camera selection is driven by **Lighting Section**, Photography Section, Composition, and Story — with marketplace thumbnail legibility as a primary constraint.
