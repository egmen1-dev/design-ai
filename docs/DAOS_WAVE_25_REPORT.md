# DAOS Wave 25 — Composite Result Placement Bridge Report

## Goal

Propagate **factual** `productPlacement` from `compositeProductIntoScene()` into DAOS audits so `productScaleAudit` measures real post-composite product size, not planned layout percent bounds.

Constraints respected: no prompt/provider, HTML templates, UI/API, or scale-patch changes.

---

## Implemented

### Composite result bridge

`marketplace-infographic/src/lib/daos/compositor/composite-result-bridge.ts`

| Export | Role |
|--------|------|
| `extractCompositeProductPlacement(input: unknown)` | Safe bbox extraction from `productPlacement`, `placement`, `bbox`, `dimensions`, etc. |
| `normalizeCompositePlacement(input, canvas)` | Pixel bbox + `areaRatio`, `widthRatio`, `heightRatio`, `source`, `confidence` |

Both accept `unknown` and never throw.

### Factual placement source

`scene-compositor.ts` → `compositeProductIntoScene()` returns:

```typescript
SceneCompositeResult = {
  mergedPath, mergedBuffer, lighting,
  productPlacement: { left, top, width, height } // final pixel placement
}
```

### Handler integration

`generate-infographic-handler.ts` — after compositor path, before `analyzeProductScale()`:

1. `normalizeCompositePlacement({ compositeResult, canvas })`
2. Pass `compositePlacement` into `productScaleAudit`
3. Stop passing layout `productBounds` (percent units misread as pixels)
4. Persist `compositePlacement` on debug bundle

### Product scale audit priority

`product-scale-audit.ts` now prefers, in order:

1. `compositePlacement` (factual post-composite ratios)
2. `placement` / `productBounds` (pixel bbox only)
3. `composerQualityAudit.productAreaRatio` (planned fallback)
4. `compositionLayout.metrics` / `layoutSpec.heroScale`

### Diagnostics

Added to debug bundle / generation diagnostic:

- `compositePlacementFound`
- `compositePlacementSource`
- `compositeProductAreaRatio`
- `compositeProductWidthRatio`
- `compositeProductHeightRatio`

### Debug bundle

Top-level field: `compositePlacement` (`NormalizedCompositePlacement`).

### Benchmark export

`compositeProductAreaRatio` added to metrics, CSV, report aggregates (patch OFF vs ON comparison on factual placement).

---

## Phase 1 benchmark (patch OFF → patch ON)

Both arms: DAOS compressed stack + `DAOS_OVERLAY_PATCH=1` + `DAOS_GEOMETRY_WHITESPACE_PATCH=1`.  
Delta: `DAOS_PRODUCT_SCALE_PATCH=0` vs `=1`.

| Metric | Patch OFF avg | Patch ON avg | Notes |
|--------|---------------|--------------|-------|
| compositeProductAreaRatio | **n/a** | **n/a** | `compositePlacementFound=false` on all successful runs |
| productAreaRatio (composer planned) | 0.43 | 0.45 | Still from `composerQualityAudit`, not compositor |
| productScaleScore | 0.0 | 0.0 | No factual placement in mock benchmark |
| productDominanceScore | 1.0 | 1.0 | — |
| LAW_003 violation rate | 100% | 100% | Unchanged |
| summaryScore | 75.5 | 75.5 | Δ 0 |

Per-product (patch OFF → ON, composer `productAreaRatio`):

| Product | compositePlacementFound | productAreaRatio | final image hash |
|---------|-------------------------|------------------|------------------|
| Cordless Drill | false | 0.41 → 0.42 | changed |
| Electric Kettle | false | 0.47 → 0.47 | same |
| Mattress | false | 0.38 → 0.43 | same |
| Children's Toy | false | 0.45 → 0.46 | changed |

Mock benchmark logs show repeated `Scene composite failed: extract_area: bad extract area` — compositor never returns `productPlacement`, so the bridge correctly sets `compositePlacementFound=false` and generation continues.

---

## Main finding

**Bridge is wired; benchmark mock path does not complete compositor merge, so factual placement is unavailable at audit time.**

1. **Code path correct** — when `compositeResult.productPlacement` exists, bridge normalizes pixel ratios and audit prefers them over layout percent bounds.
2. **Benchmark gap** — Phase 1 mock runs fail compositor (`extract_area`) → `compositePlacementFound=false` everywhere → `compositeProductAreaRatio` stays n/a.
3. **productAreaRatio still planned** — diagnostics `productAreaRatio` field remains `composerQualityAudit` (planned ~0.43–0.45); distinct from new `compositeProductAreaRatio`.
4. **LAW_003 unchanged (100%)** — constitution whitespace is measured on final HTML/governance layer, not compositor pixel bbox; even when patch ON raises planned composer ratio slightly, LAW_003 does not move.
5. **Interpretation for Wave 24 patch** — without successful composite in benchmark, we cannot yet confirm patch OFF/ON delta on **factual** placement; re-run with compositor succeeding (real cutout sizes) or inspect debug bundles where `compositePlacementFound=true`.

**Recommendation:** Validate bridge on a run where compositor succeeds (`compositePlacementFound=true`); expect `compositeProductAreaRatio` to track `productScaleAudit.productAreaRatio` and rise when `DAOS_PRODUCT_SCALE_PATCH=1`. LAW_003 will likely remain until governance reads compositor placement or merged image fill.

---

## Verification

```bash
cd marketplace-infographic
npm run daos:test      # pass (includes composite-result-bridge.test.ts)
npm run daos:spec      # pass
npm run lint           # pass
npm run typecheck      # pre-existing tmp/* errors only
npm run daos:benchmark # Phase 1 complete (STOP — criteria unchanged)
```

---

## Files

**Created**

- `src/lib/daos/compositor/composite-result-bridge.ts`
- `src/lib/daos/tests/composite-result-bridge.test.ts`
- `docs/DAOS_WAVE_25_REPORT.md`

**Modified**

- `src/lib/daos/audit/product-scale-audit.ts` — `compositePlacement` priority, no layout-percent bounds
- `src/lib/generate-infographic-handler.ts` — bridge hook, diagnostics passthrough
- `src/lib/daos/debug/daos-debug-bundle.ts` — `compositePlacement` + diagnostics fields
- `src/lib/generation/diagnostic-report.ts` — diagnostic type fields
- `src/lib/daos/benchmark/types.ts`, `metrics.ts`, `decision.ts`, `reporter.ts` — `compositeProductAreaRatio`
- `src/lib/daos/tests/product-scale-audit.test.ts` — composite preference test
- `package.json` — `daos:test` includes bridge test
