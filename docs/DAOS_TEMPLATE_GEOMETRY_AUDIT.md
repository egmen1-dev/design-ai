# DAOS Template Geometry Audit

**Sprint:** 8A — Engineering Investigation (read-only)  
**Benchmark:** `benchmark/template-geometry.ts`  
**Artifacts:** `benchmark/output/sprint8a/template-geometry.json`

---

## Executive Answer

**Why does Geometry limit Product Area after policy alignment (Sprint 7B)?**

The compositor reads **`CompositionLayout.product.maxWidthPct` / `maxHeightPct`** from `layout-engine/builder.ts` — not `LayoutSpec.geometry.hero` and not HTML overlay zones.

Template geometry produces **tall product zones (75–85% canvas height)**. `computeMaxProductSize` applies `scaleBoost` but **height-binding** caps `scaleBoost` at `696 / zoneH ≈ 0.77`. Result: allowed area saturates at **~29.5%** even when `objectScale = 1.0`.

Compositor policy allows **39.4%**. Geometry leaves **~10 pp** unused.

---

## Geometry Pipeline Map

```
LAYOUT_TEMPLATES (templates.ts)
        ↓ productScale, headlineWidth, centers
buildLayoutFromTemplate (builder.ts)     ← COMPOSITOR GEOMETRY SOURCE
        ↓ finalW/finalH clamps (55–72 × 60–85)
CompositionLayout.product.maxWidth/HeightPct
        ↓
computeProfessionalLayout (index.ts)
        ↓
computeMaxProductSize (commercial-calibration.ts)
        ↓
Compositor

Parallel path (NOT compositor):
composition-director/geometry.ts → LayoutSpec.geometry.hero → Fidelity / Prompt / Constitution
```

| Stage | Affects compositor Product Area? |
|-------|----------------------------------|
| `LAYOUT_TEMPLATES` | Indirect (productScale input) |
| **`buildLayoutFromTemplate`** | **Yes — primary** |
| `CompositionLayout` zones | **Yes — maxWidth/HeightPct** |
| `LayoutSpec.geometry.hero` | **No** |
| Headline / badge / typography zones | **No** (metrics & HTML only) |
| `safeInsetPct` | Position only |
| Compositor policy | Separate layer (Sprint 7B) |

---

## Geometry Ownership

| Question | Owner (production module) |
|----------|---------------------------|
| Who creates hero/product zone for compositor? | `layout-engine/builder.ts` |
| Who creates LayoutSpec.geometry.hero? | `composition-director/geometry.ts` |
| Who sets margins? | `safeInsetPct=6` (builder); `PRODUCT_SIDE_MARGIN` (policy) |
| Who reserves text? | `headline`/`subtitle` zones — HTML post-pass |
| Who reserves badges? | `leftPanel`/`rightSidebar` — HTML post-pass |
| Who computes `productAreaPct` before compositor? | `computeMetrics()` in builder.ts |

---

## Builder Formula (production)

From `layout-engine/builder.ts`:

```typescript
productW = clamp(scale * 100 * 0.92, 58, 74)
productH = clamp(scale * 100 * 1.05, 62, 88)
finalW = clamp(productW, 55, 72)
finalH = clamp(productH, 60, 85)   // ← height clamp 85% binds compositor
```

`compositionLayout.product.maxWidthPct = finalW`  
`compositionLayout.product.maxHeightPct = finalH`

---

## Template Survey (20 templates, standard meaning)

| Metric | Range |
|--------|-------|
| `productScale` | 0.61 – 0.70 |
| Product zone (W×H) | ~65×74 – 72×85 % |
| Layout `metrics.productAreaPct` | ~47 – 53 % |
| **Compositor allowed @ objectScale=1** | **29.5 – 30.4 %** |
| Gap to policy max (39.4%) | ~9 – 10 pp |

All templates saturate at nearly the same compositor allowed area — **height_binding** dominates, not template choice.

---

## Height Binding Mechanism

```
zoneH = maxHeightPct / 100 × 1200     (e.g. 85% → 1020px)
canvasMaxH = 696px                    (compositor policy)
maxBoost ≤ canvasMaxH / zoneH         (e.g. 696/1020 = 0.682)
maxW = zoneW × maxBoost               (capped at 612)
placementArea ≈ 29–30%                (saturated)
```

If zone height aligns with policy (**58%** → 696px):

```
maxBoost ≤ 696/696 = 1.0
maxW × maxH → 612×696 = 39.4%         (policy ceiling)
```

---

## Geometry Sensitivity (objectScale fixed at 1.0)

Varying only `product.maxWidthPct` × `maxHeightPct`:

| Zone W×H % | Allowed area | Binding |
|------------|--------------|---------|
| 72×85 (current clamp max) | ~30% | height_binding |
| 68×58 (policy aspect) | **39.4%** | width_binding |
| 65×75 (typical commercial) | ~29.5% | height_binding |

Typography/badge removal: **0 pp** compositor change (confirmed experimentally).

---

## Constraint Attribution (to 55% target)

| Constraint | Est. loss | Type |
|------------|-----------|------|
| `finalH` clamp max **85%** | **~10 pp** | Historical Constant |
| `productScale × 0.92 / × 1.05` | ~6 pp | Implementation Detail |
| Template `productScale` range | ~3 pp | Implementation Detail |
| Typography / badge HTML zones | 0 pp | Soft (non-compositor) |
| `LayoutSpec.geometry` hero cap 50% | 0 pp on compositor | Separate path |

---

## Maximum Reachable Area (experimental)

| Scenario | Allowed @ objectScale=1 |
|----------|-------------------------|
| **Current production geometry** | **29.5%** |
| Zone clamp max 72×85 | ~30% |
| **Policy-aspect zone 68×58** | **39.4%** |
| Compositor policy ceiling | 39.4% |
| Commercial target | 55% |

Without compositor changes, geometry can reach **39.4%** — not 55%. Remaining gap to 55% requires policy or target redefinition.

---

## Minimal Change Recommendation (Sprint 8B)

**Single change with maximum impact:**

In `layout-engine/builder.ts`, align product zone height with compositor policy:

```
finalH clamp maximum: 85 → 58
```

(Optionally keep `finalW` at 68–72.)

| | |
|--|--|
| Estimated gain | **+9.9 pp** (29.5% → 39.4%) |
| Compositor rewrite | No |
| Layout-engine rewrite | No — one clamp constant |
| Risk | Medium — shorter template zones, verify HTML overlap |

**Do not change:** `LayoutSpec`, Genome, propagation, calibration, compositor policy.

---

## Architecture Review

| Criterion | Confirmed |
|-----------|-----------|
| Geometry is independent pipeline stage | Yes |
| Separated from Commercial Layer | Yes — commercial sets objectScale, geometry sets zone |
| Separated from Compositor Policy | Yes — Sprint 7B fixed policy; geometry is upstream |
| No new architectural entities | Yes — investigation only |

---

## Code References

- `marketplace-infographic/src/lib/layout-engine/builder.ts`
- `marketplace-infographic/src/lib/layout-engine/templates.ts`
- `marketplace-infographic/src/lib/layout-engine/constants.ts`
- `marketplace-infographic/src/lib/composition/types.ts`
- `marketplace-infographic/src/lib/design/composition-director/geometry.ts` (parallel, non-compositor)
