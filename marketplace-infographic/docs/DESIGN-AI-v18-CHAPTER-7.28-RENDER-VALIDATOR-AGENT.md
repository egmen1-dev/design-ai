# DESIGN AI v18 — Chapter 7.28: Render Validator Agent

## Purpose

Render Validator is the final technical expert of the Design AI Platform. While Chief Design Director asks whether generation may start, Render Validator asks whether the generated image matches the approved project.

It compares the approved design blueprint stack to the actual rendered result.

## Mission

Detect any deviation of the final image from the original design intent. It is the last quality gate before delivery to the user.

## Module

Implemented as `render-validator-agent-*`, post-render validation layer.

| File | Role |
|------|------|
| `render-validator-agent-types.ts` | 7 internal modules, input/output contracts, KPIs |
| `render-validator-agent-engine.ts` | Agent runner, blueprint comparison, artifact detection, retry routing |
| `render-validator-agent.spec.ts` | Kitchen and validation tests |

## Internal Modules (7)

1. Image Analyzer
2. Blueprint Comparator
3. Quality Inspector
4. Artifact Detector
5. Compliance Checker
6. Validation Engine
7. Validation Report Builder

## Pipeline Position

```text
Image Provider → Render Validator → Delivery Engine
```

Without successful validation, the image is not considered complete.

## Key APIs

| API | Role |
|-----|------|
| `executeRenderValidatorAgent()` | Full agent execution with modules + stage retry |
| `buildBatterySprayerRenderValidatorInput()` | Garden sprayer kitchen fixture with rendered image |
| `buildRenderValidationSection()` | Blueprint-vs-render comparison and scoring |
| `fromRenderValidationSection()` | Spec-compliant RenderValidationReport output |
| `validateRenderValidatorAgentWithExecution()` | Structure + kitchen test |

## Integration

- Ch 7.24 `chief-design-director-agent` — FinalDesignDecision input
- Ch 7.1–7.19 director blueprints — approved blueprint stack
- Ch 7.27 `render-adapter-agent` — upstream render pipeline
- Ch 7.6 `agent-professional-decision` — render validation decision check

## Golden Rule

Creating an image is not enough — it must match the approved intent. Render Validator guarantees the user receives exactly what the Agent Ecosystem approved.
