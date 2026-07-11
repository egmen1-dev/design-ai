# DAOS Commercial Fidelity

**Version:** `1.0.0-sprint5`  
**Module:** `marketplace-infographic/src/lib/commercial-fidelity/`  
**Role:** Read-only measurement — never mutates generation pipeline

---

## Purpose

Commercial Fidelity measures how well a **final image** matches a **commercial decision** already stabilized on `LayoutSpec`.

DAOS can decide and generate. Commercial Fidelity answers:

> How well did the image execute the decision?

---

## Position in Pipeline

```
Commercial Genome → Decision → LayoutSpec → VisualSceneBlueprint → Provider → Image
                                                                              ↓
                                                                   Commercial Fidelity
                                                                              ↓
                                                                   Measured Delta + Diagnostics
```

Commercial Fidelity:

- Does **not** import Commercial Genome
- Does **not** change LayoutSpec, VisualSceneBlueprint, Prompt, or Render
- Only reads `LayoutSpec` / blueprint snapshot for **expected** values
- Analyzes image pixels for **measured** values

---

## Parameters (v1)

| ID | Label | Expected source | Measured signal |
|----|-------|-----------------|-----------------|
| `product_area` | Product Area | `productAreaPct` / `heroScale` | Hero-zone clarity proxy (%); composited bbox when alpha present |
| `product_dominance` | Product Dominance | `primaryObject` | Hero vs headline visual energy ratio |
| `visual_hierarchy` | Visual Hierarchy | `hierarchy` map | Hero vs headline edge-energy balance |
| `background_separation` | Background Separation | `backgroundPalettePreference` | Color distance hero ↔ headline zones |
| `scene_consistency` | Scene Consistency | `scenePreference` | Zone color/atmosphere match to scene profile |

---

## Fidelity Report Shape

Per parameter:

| Field | Description |
|-------|-------------|
| `expected` | Target from commercial decision (via LayoutSpec) |
| `measured` | Image analysis result |
| `delta` | `measured - expected` |
| `status` | `OK` / `WARNING` / `ERROR` / `UNMEASURABLE` |

Aggregate diagnostics:

- `commercialFidelityVersion`
- `commercialFidelityScore` (0–100, mean parameter adherence)
- `commercialFidelityDelta`
- `commercialExpectedValues`
- `commercialMeasuredValues`
- `commercialValidationWarnings`
- `commercialValidationErrors`
- `commercialImprovementCandidates`

---

## API

```typescript
import { evaluateCommercialFidelity } from "@/lib/commercial-fidelity";

const report = await evaluateCommercialFidelity({
  imagePath: "/path/to/final-or-background.png",
  layoutSpec,           // stabilized LayoutSpec with commercial fields
  visualBlueprint,      // optional — uses commercial.snapshot fallback
  productColorHint,     // optional — future composite refinement
});
```

---

## Measurement Modes

| Mode | When | Product Area |
|------|------|--------------|
| `background` | Flux/Pollinations background only (no product alpha) | Proxy: hero-zone canvas share × clarity |
| `composite` | Image has alpha / composited product | Future: opaque bbox area % |
| `unknown` | Unreadable input | `UNMEASURABLE` |

---

## Status Thresholds

| Parameter | WARNING | ERROR |
|-----------|---------|-------|
| Product Area | \|Δ\| ≥ 6% | \|Δ\| ≥ 12% |
| Product Dominance | \|Δ\| ≥ 10 | \|Δ\| ≥ 20 |
| Visual Hierarchy | \|Δ\| ≥ 10 | \|Δ\| ≥ 20 |
| Background Separation | \|Δ\| ≥ 12 | \|Δ\| ≥ 22 |
| Scene Consistency | \|Δ\| ≥ 15 | \|Δ\| ≥ 28 |

---

## Product Validation Integration

Run after generation in benchmarks or QA:

```bash
cd marketplace-infographic
npx tsx benchmark/commercial-fidelity-validation.ts
```

Output: `benchmark/output/sprint5/commercial-fidelity-validation.json`

---

## Known Limitations (v1)

1. **Product Area on background-only images** uses a clarity proxy, not true composited bbox.
2. **Typography / headline readability** requires full card composite (text overlay).
3. **Human CTR** cannot be inferred from pixels alone.
4. **Brand tone nuance** beyond palette/scene heuristics is not measured.

These gaps define future Product Sprints (compositor fidelity, full-card measurement).

---

## Architecture Constraints

| Layer | Responsibility |
|-------|----------------|
| Commercial Genome | Decides |
| LayoutSpec | Stabilizes |
| VisualSceneBlueprint | Materializes |
| Provider | Generates |
| **Commercial Fidelity** | **Measures** |

Commercial Fidelity never decides and never feeds back into generation in v1.
