# DAOS Wave 23 — Product Scale & Scene Fill Audit Report

## Goal

Understand why `productAreaRatio` does not grow and the final frame stays empty. Wave 23 adds **read-only deterministic audit** of compositor placement, cutout bounds, and scene fill — **no render/compositor/HTML/prompt changes**.

---

## Implemented

### Product scale audit

`marketplace-infographic/src/lib/daos/audit/product-scale-audit.ts`

| Export | Role |
|--------|------|
| `analyzeProductScale(input)` | Full product scale / scene fill audit |
| `summarizeProductScaleAudit(audit)` | Compact summary for diagnostics/benchmark |

**Inputs:** `canvas`, `productCutoutPath`, `finalImagePath`, `productBounds`, `placement` (compositor), `compositionLayout`, `layoutSpec`, `composerQualityAudit`, `overlayQualityAudit`.

**Outputs:** `productAreaRatio`, `productWidthRatio`, `productHeightRatio`, `productDominanceScore`, `emptySpaceEstimate`, `scaleRisk`, `placementRisk`, `sceneFillRisk`, `warnings`, `recommendations`, `score`.

### Deterministic rules

| Rule | Effect |
|------|--------|
| `productAreaRatio < 0.45` | `PRODUCT_SCALE_AREA_LOW` |
| `productWidthRatio < 0.45` | `PRODUCT_SCALE_WIDTH_LOW` |
| `productHeightRatio < 0.45` | `PRODUCT_SCALE_HEIGHT_LOW` |
| `emptySpaceEstimate > 0.45` | `SCENE_FILL_EMPTY_HIGH` |
| `productDominanceScore < 70` | `PRODUCT_DOMINANCE_LOW` |
| `LAW_003=true` + `productAreaRatio < 0.45` | `LAW_003_COMPOSITOR_SCALE_RECOMMENDED` — compositor patch, not overlay |
| Planned layout area >> compositor placement | `COMPOSITOR_VS_LAYOUT_GAP` |

Ratio resolution order: compositor `placement` → `productBounds` → `compositionLayout.product` → `composerQualityAudit` → planned `heroScale`.

### Debug bundle

- `productScaleAudit` on bundle
- Diagnostics: `productScaleScore`, `productDominanceScore`, `productWidthRatio`, `productHeightRatio`, `emptySpaceEstimate`, `sceneFillRisk`

### Benchmark metrics

`productScaleScore`, `productDominanceScore`, `emptySpaceEstimate`, `sceneFillRisk` in results/CSV/report aggregates.

---

## Phase 1 benchmark (overlay-only → overlay+geometry, with product scale audit)

Run: `npm run daos:benchmark` (not `benchmark:30`)

| Metric | Overlay only avg | + Geometry avg | Notes |
|--------|------------------|----------------|-------|
| productAreaRatio (composer) | **0.42** | **0.42** | Flat — uses planned layout metrics |
| productScaleScore | **0.0** | **0.0** | Critically low on all successful runs |
| productDominanceScore | **0.0** | **1.0** | Below dominance threshold |
| emptySpaceEstimate | **0.35** | **0.29** | High empty canvas |
| sceneFillRisk | **0.40** | **0.40** | Elevated on all products |
| LAW_003 violation rate | **100%** | **100%** | Unchanged |
| summaryScore delta | — | — | **0** |

Per-product pattern (4/5 successful):

- `composerQualityAudit.productAreaRatio` ≈ **0.40–0.45** (from planned `compositionLayout.metrics`)
- `productScaleAudit.productAreaRatio` ≈ **0.005–0.13** (from actual layout `product` bounds / rare compositor placement)
- `COMPOSITOR_PLACEMENT_UNKNOWN_WITH_BACKGROUND` on composer audit when `compositeResult.productPlacement` missing
- `LAW_003_COMPOSITOR_SCALE_RECOMMENDED` on every successful product
- `productScaleScore=0`, `productDominanceScore=0–1`

Example debug bundle (`childrens-toy`):

| Source | productAreaRatio |
|--------|------------------|
| Composer audit (planned) | **0.447** |
| Product scale audit (layout bounds) | **0.005** |
| Layout plan `productAreaPct` | **~62%** |
| Compositor placement | **missing** |

---

## Main finding — confirmed bottleneck

**The empty-frame problem is downstream of HTML/layout patches: compositor scale and placement, not overlay geometry.**

1. **Planned vs actual gap:** `compositionLayout.metrics.productAreaPct` reports ~44–62%, but `compositionLayout.product` pixel bounds yield **~0.5–13%** canvas area. Geometry patch (Wave 22) adjusts layout metadata, not compositor output — `productAreaRatio` stays flat.

2. **Compositor placement often missing:** `compositeResult.productPlacement` is not persisted when background-only or merge path skips composite; composer falls back to planned ratio (misleading ~0.44), while product scale audit exposes true layout bounds (~0.005).

3. **LAW_003 + low dominance on every run:** `emptySpaceEstimate` 0.29–0.35, `sceneFillRisk` ~0.40, `productDominanceScore` 0–1. Constitution whitespace 53–58% correlates with tiny product footprint on canvas.

4. **Recommendation validated:** When `LAW_003=true` and `productAreaRatio < 0.45`, audit recommends **compositor scale patch**, not overlay/layout patch — this is the correct next wave target.

---

## Verification

```bash
cd marketplace-infographic
npm run daos:test      # pass (includes product-scale-audit.test.ts)
npm run daos:spec      # pass
npm run lint           # pass
npm run typecheck      # pre-existing tmp/* errors only
npm run daos:benchmark # Phase 1 pass with product scale metrics
```

---

## Files

**Created**

- `src/lib/daos/audit/product-scale-audit.ts`
- `src/lib/daos/tests/product-scale-audit.test.ts`
- `docs/DAOS_WAVE_23_REPORT.md`

**Modified**

- `src/lib/generate-infographic-handler.ts` — audit hook after overlay audit
- `src/lib/daos/debug/daos-debug-bundle.ts` — `productScaleAudit` + diagnostics
- `src/lib/generation/diagnostic-report.ts` — product scale diagnostic fields
- `src/lib/daos/benchmark/types.ts`
- `src/lib/daos/benchmark/metrics.ts`
- `src/lib/daos/benchmark/decision.ts`
- `src/lib/daos/benchmark/reporter.ts`
- `package.json`
- `benchmark/results.json`, `benchmark/report.md`, `benchmark/results.csv`, `benchmark/dashboard.md`
