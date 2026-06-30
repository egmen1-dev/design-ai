# DESIGN AI v18 — Chapter 7.15: Camera Director Agent

## Purpose

Camera Director designs the virtual camera through which the buyer sees the product. After Story, Scene, Composition, Photography, and Lighting are defined, this agent answers: **"From where exactly should the buyer view the product?"**

## Mission

Choose a viewpoint where the product looks attractive, benefits are obvious, proportions stay natural, perspective builds trust, and the image looks professionally commercial.

## Module

Implemented as `camera-director-agent-*`, extending Ch 4.15 `camera-director-*`.

| File | Role |
|------|------|
| `camera-director-agent-types.ts` | 7 internal modules, input/output contracts, KPIs |
| `camera-director-agent-engine.ts` | Agent runner, retry, Ch 7.5/7.6 integration |
| `camera-director-agent.spec.ts` | Kitchen and validation tests |

## Internal Modules (7)

1. Camera Strategy Selector
2. Angle Planner
3. Lens Selector
4. Perspective Controller
5. Framing Optimizer
6. Camera Validator
7. Camera Blueprint Builder

## Pipeline Position

```text
Lighting Director → Camera Director → Material Director
```

## Key APIs

| API | Role |
|-----|------|
| `executeCameraDirectorAgent()` | Full agent execution with modules + retry |
| `buildBatterySprayerCameraDirectorInput()` | Garden sprayer kitchen fixture |
| `fromCameraSection()` | Spec-compliant CameraBlueprint output |
| `validateCameraSupportsStory()` | Outdoor scene rejects flat top-down angles |
| `validateCameraDirectorAgentWithExecution()` | Structure + kitchen test |

## Integration

- Ch 4.15 `camera-director-engine` — core camera physics model
- Ch 7.14 `lighting-director-agent` — Lighting Blueprint input
- Ch 7.13 `photography-director-agent` — Photography Blueprint input
- Ch 7.12 `composition-director-agent` — Layout Blueprint input
- Ch 7.11 `scene-director-agent` — Scene Blueprint input
- Ch 7.10 `visual-story-director-agent` — Story Blueprint input
- Ch 7.6 `agent-professional-decision` — camera viewpoint decision

## Golden Rule

The buyer never thinks about lens or camera angle — but the camera defines how they see the product. Camera Director chooses the single correct viewpoint so the product looks clearer, higher quality, and more desirable. It does not control light, build composition, or create story.
