# DAOS Foreground Isolation

**Version:** `1.1.0-quality-cycle-3`  
**Module:** `marketplace-infographic/src/lib/compositing/foreground-isolation.ts`  
**Phase:** Quality Cycle 3 — Commercial Perception  
**Feature flag:** `DAOS_FOREGROUND_ISOLATION` (default **ON**; set `=0` to disable)

---

## Purpose

Foreground Isolation is the largest confirmed Quality Gap between DAOS and top Wildberries cards (Cycle 2: **−20.2**, DAOS 32.5 vs WB 52.7). Cycle 3 adds **additive compositor effects** that increase visual separation between product and background **without** changing Product Area, Geometry, Layout, Genome, or Prompt.

```
Scene background + product cutout
           ↓
  applyBackgroundSeparationHalo()   ← pre-composite (background only)
           ↓
  shadows · floor contact · product composite
           ↓
  enhanceForegroundIsolation()      ← post-merge (product mask only)
           ↓
  film grain · scene harmony → merged PNG
```

---

## Root Cause Components (Cycle 2)

| Component | Cycle 3 lever |
|-----------|---------------|
| Object Edge Separation | Masked sharpen + rim soft-light on edge band |
| Lighting Separation | Directional rim gradient from scene lighting |
| Background Brightness Difference | Multiply darken behind product |
| Background Color Difference | Cool neutral darken tint `rgb(10,12,16)` |
| Depth Separation | Localized background blur behind silhouette |
| Local Contrast | Product-only linear + sharpen boost |
| Shadow Quality | Unchanged (existing floor-contact path) |
| Atmospheric Perspective | Halo band + softened background pocket |

**Forbidden:** artificial glow, Photoshop-style outline, objectScale / geometry changes.

---

## Pipeline Stages

### 1. `applyBackgroundSeparationHalo` (pre-composite)

Applied to `bgPrepared` **before** shadows and product overlay.

| Step | Effect |
|------|--------|
| Expanded alpha mask | Product silhouette + 14px blur for halo band |
| Localized softness | Background blur σ=2.2 only inside expanded mask |
| Behind-product darken | Multiply `rgb(10,12,16)` at ~38% expanded alpha |
| Halo band darken | Ring mask (expanded − core) at ~42% multiply |

Natural depth cue — not vignette, not outer glow.

### 2. `enhanceForegroundIsolation` (post-merge)

Applied to merged buffer **before** film grain.

| Step | Effect |
|------|--------|
| Edge band mask | Dilated alpha − core (σ=3 blur) |
| Rim separation | Directional white gradient, 11% max opacity, `soft-light` blend |
| Local contrast | Product mask only: linear(1.12, −10) + sharpen σ=0.8 |

Rim direction follows `SceneLightingProfile.direction` (contre-jour / fill side).

---

## Integration Points

| File | Role |
|------|------|
| `foreground-isolation.ts` | Core isolation pipeline |
| `scene-compositor.ts` | Calls halo pre-merge + enhancement post-merge; hash `ground-v7-isolation` |
| `safe-extract.ts` | Clamps Sharp `extract_area` — unblocks compositor on benchmark SVG cutouts |
| `floor-contact.ts`, `shadow-generator.ts` | Use `clampExtractRect()` |
| `generate-infographic-handler.ts` | Persists `foregroundIsolation` diagnostics in stored payload |
| `sd-stored-payload.ts` | Serializes `foregroundIsolation` diagnostics |

---

## Diagnostics

```typescript
type ForegroundIsolationDiagnostics = {
  applied: boolean;
  backgroundHalo: boolean;
  localContrast: boolean;
  edgeSeparation: boolean;
  version: "1.1.0-quality-cycle-3";
};
```

Stored in `generatedJson.foregroundIsolation` after Cycle 3 payload fix.

---

## Measurement

Cycle 2/3 benchmark formula (hero-right zone, 900×1200):

```
foregroundIsolation = (hero.edgeDensity / global.edgeDensity) × 50
```

**Important:** Final card (`04-final-card.png`) includes typography overlay — dilutes compositor isolation signal. Composited layer (`03-composited.png`) is the authoritative surface for isolation effect measurement.

---

## Constraints (unchanged)

- Product Area / `objectScale` — **no change**
- Geometry / LayoutSpec — **no change**
- Commercial Genome / Rules — **no change**
- Prompt Compiler — **no change**
- Feature Registry / Foundation — **no change**

---

## Related

- [DAOS Quality Cycle 3 Report](./DAOS_QUALITY_CYCLE_3_REPORT.md)
- [DAOS Visual Weight Research](./DAOS_VISUAL_WEIGHT_RESEARCH.md)
- [DAOS Product Dominance Model v2](./DAOS_PRODUCT_DOMINANCE_MODEL_V2.md)
