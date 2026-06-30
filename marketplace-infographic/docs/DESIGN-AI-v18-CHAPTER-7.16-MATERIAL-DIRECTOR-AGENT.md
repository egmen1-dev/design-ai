# DESIGN AI v18 — Chapter 7.16: Material Director Agent

## Purpose

Material Director designs physically plausible product materials after Story, Scene, Composition, Photography, Lighting, and Camera are defined. This agent answers: **"How should product materials look so the buyer trusts this is real professional photography?"**

## Mission

Make every material physically believable — plastic reads as plastic, metal as metal, rubber as rubber — with brand-new marketplace cleanliness that enhances perceived quality.

## Module

Implemented as `material-director-agent-*`, extending Ch 4.16 `material-director-*`.

| File | Role |
|------|------|
| `material-director-agent-types.ts` | 7 internal modules, input/output contracts, KPIs |
| `material-director-agent-engine.ts` | Agent runner, retry, Ch 7.5/7.6 integration |
| `material-director-agent.spec.ts` | Kitchen and validation tests |

## Internal Modules (7)

1. Material Detector
2. Surface Analyzer
3. Reflection Planner
4. Texture Controller
5. Wear Simulator
6. Material Validator
7. Material Blueprint Builder

## Pipeline Position

```text
Camera Director → Material Director → Render Adapter
```

## Key APIs

| API | Role |
|-----|------|
| `executeMaterialDirectorAgent()` | Full agent execution with modules + retry |
| `buildBatterySprayerMaterialDirectorInput()` | Garden sprayer kitchen fixture |
| `detectProductMaterials()` | Product material composition (ABS, rubber, tank, metal, PVC) |
| `fromMaterialSection()` | Spec-compliant MaterialBlueprint output |
| `validateMaterialDirectorAgentWithExecution()` | Structure + kitchen test |

## Integration

- Ch 4.16 `material-director-engine` — core material physics model
- Ch 7.15 `camera-director-agent` — Camera Blueprint input
- Ch 7.14 `lighting-director-agent` — Lighting Blueprint input
- Ch 7.13 `photography-director-agent` — Photography Blueprint input
- Ch 7.12 `composition-director-agent` — Layout Blueprint input
- Ch 7.11 `scene-director-agent` — Scene Blueprint input
- Ch 7.6 `agent-professional-decision` — material realism decision

## Golden Rule

The buyer may not know polymer chemistry — but instantly feels real material versus artificial imitation. Material Director makes every surface physically believable. It does not control light, choose camera, or build composition.
