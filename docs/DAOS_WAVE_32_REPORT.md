# DAOS Wave 32 — Compositor Asymmetric Limits Integration Report

## Goal

Make the scene compositor actually consume asymmetric placement limits from the Wave 31 aspect-ratio patch, so wide products (mattress) can use `fit-width` sizing end-to-end instead of being re-clamped by symmetric `objectScale` / alpha-fit caps.

Feature flag: `DAOS_COMPOSITOR_ASYMMETRIC_LIMITS=1` (default OFF, requires `DAOS_ASPECT_RATIO_PLACEMENT_PATCH=1`).

Constraints: no prompt/provider, template, API/UI changes; Phase 1 benchmark only (no `benchmark:30`).

---

## Where compositor overwrote Wave 31 limits

Wave 31 updated `compositionLayout.product.maxWidthPct` / `maxHeightPct` (e.g. mattress `78×24%`, `fitStrategy=fit-width`), but three compositor stages ignored or undid that plan:

| Stage | File | Problem |
|-------|------|---------|
| **`computeMaxProductSize`** | `scene-compositor.ts` | Applied symmetric `scaleBoost * productScaleMultiplier` to both `zoneW` and `zoneH` from layout pct — low `maxHeightPct` still shrank the shared box |
| **`prepareProductLayer`** | `scene-compositor.ts` | Post-rotation clamp used asymmetric px caps while the non-asymmetric path allowed canvas-level headroom (`canvasMaxW × canvasMaxH`) |
| **`fitProductWithSafePlacement`** | `alpha-fit.ts` via `scene-compositor.ts` | Used fixed `PRODUCT_ALPHA_MAX_WIDTH_PX` / `PRODUCT_ALPHA_MAX_HEIGHT_PX * multiplier` with no awareness of `fit-width` / `fit-height` strategy from the aspect patch |

Net effect before Wave 32: mattress showed `aspectRatioPlacementPatchApplied=true`, `fitStrategy=fit-width`, but factual `compositeProductAreaRatio` stayed ~0.13 with `HEIGHT_OVERFLOW` in extract guards.

---

## Created / modified files

| File | Change |
|------|--------|
| `src/lib/daos/compositor/asymmetric-limits.ts` | **New** — `createAsymmetricLimits`, `applyAsymmetricLimitsToCompositeOptions`, flag gate |
| `src/lib/compositing/scene-compositor.ts` | Consume `asymmetricLimits` in `computeMaxProductSize`, alpha caps, unified post-rotation clamp |
| `src/lib/generate-infographic-handler.ts` | `buildDaosSceneCompositeOptions` wires asymmetric limits into compositor options |
| `src/lib/daos/debug/daos-debug-bundle.ts` | Diagnostics: `asymmetricLimitsApplied`, `compositorFitStrategy`, `compositorMaxWidthPct`, `compositorMaxHeightPct` |
| `src/lib/daos/tests/asymmetric-limits.test.ts` | **New** — wide/tall/disabled/clamp/immutability tests |
| `src/lib/daos/benchmark/catalog.ts` | `BENCHMARK_DAOS_ASPECT_RATIO_PLACEMENT_ENV` (OFF) vs `BENCHMARK_DAOS_COMPOSITOR_ASYMMETRIC_LIMITS_ENV` (ON) |
| `src/lib/daos/benchmark/runner.ts`, `reporter.ts` | Compare asymmetric limits OFF vs ON |
| `package.json` | `asymmetric-limits.test.ts` in `daos:test` |
| `benchmark/report.md`, `results.json`, `results.csv` | Phase 1 results |

---

## Asymmetric limits logic

When `DAOS_ASPECT_RATIO_PLACEMENT_PATCH=1` **and** `DAOS_COMPOSITOR_ASYMMETRIC_LIMITS=1`:

| Product shape | `maxWidthPct` | `maxHeightPct` | `fitStrategy` |
|---------------|---------------|----------------|---------------|
| Wide (aspect ≥ 1.35 / patch applied) | High (e.g. 78) | Lower (e.g. 24) | `fit-width` — width boosted, height derived from aspect |
| Tall (aspect ≤ 0.75) | Lower | High | `fit-height` — height boosted, width derived |
| Balanced | Current symmetric logic | Current symmetric logic | `balanced-fit` |

Outputs: `maxWidthPx`, `maxHeightPx`, `maxAlphaWidthPx`, `maxAlphaHeightPx`, `fitStrategy`, `reason`, `applied`, `warnings`.

Safety: all px values clamped to canvas headroom + `PRODUCT_*_PX` policy caps; width clamp applied **before** height derivation to avoid pre-clamp aspect mismatch.

---

## Phase 1 benchmark — asymmetric limits OFF vs ON

Stack:

```
DAOS_PRODUCT_SCALE_PATCH=1
DAOS_ASPECT_RATIO_PLACEMENT_PATCH=1
DAOS_COMPOSITOR_ASYMMETRIC_LIMITS=0|1
DAOS_LAW003_SOFT_GOVERNANCE=1
DAOS_CONTRAST_OVERLAP_PATCH=1
DAOS_PRODUCT_FILL_V2=0
```

| Metric | OFF | ON | Δ |
|--------|-----|-----|---|
| **compositeProductAreaRatio (avg)** | **0.33** | **0.32** | −0.01 |
| **law003After fail rate** | **50%** | **50%** | 0 |
| **law003SoftResolved** | **50%** | **50%** | 0 |
| **targetUnreachable rate** | **100%** | **100%** | 0 |
| **LAW_014 rate** | **0%** | **0%** | 0 |
| **overlayQualityScore (avg)** | **56.3** | **53.5** | −2.8 |
| **summaryScore Δ** | — | — | **0** |

### Mattress

| Metric | OFF (asymmetric=0) | ON (asymmetric=1) |
|--------|--------------------|-------------------|
| compositeProductAreaRatio | **0.13** | **0.13** |
| compositeProductWidthRatio | 0.68 | 0.68 |
| compositeProductHeightRatio | 0.19 | 0.19 |
| placement px | 612×229 | 612×229 |
| law003After | **fail** | **fail** |
| asymmetricLimitsApplied | false | **true** |
| compositorFitStrategy | — | **fit-width** |
| compositorMaxWidthPct / maxHeightPct | — | **78 / 24** |
| asymmetricLimits.maxWidthPx / maxHeightPx | — | **612 / 235** |
| HEIGHT_OVERFLOW warnings | yes | yes |
| targetUnreachable | true | true |
| final image hash | `37259b4e…` | `37259b4e…` (identical) |

Mattress: flag ON makes limits **explicit and traceable** (`asymmetric_fit-width`, `612×235px` alpha box) and converges to the same composite placement as the implicit symmetric path on this seed — no area regression after clamp-order / alpha-cap alignment fixes.

### Children's Toy

| Metric | OFF | ON |
|--------|-----|-----|
| compositeProductAreaRatio | 0.35 | 0.35 |
| law003After | fail | fail |
| final image hash | changed | changed (same delta as OFF) |

---

## Main finding

**Wave 32 closes the wiring gap: compositor now reads asymmetric limits and exposes them in diagnostics, but does not yet raise mattress `compositeProductAreaRatio` above ~0.13.**

1. **Integration works:** `asymmetricLimitsApplied=true` on mattress; `compositorFitStrategy=fit-width`; px limits (`612×235`) flow into `computeMaxProductSize` and `fitProductWithSafePlacement`.
2. **No factual area gain:** Planned fill target ~0.51 vs composite ~0.13 — `targetUnreachable=true` on all products. Wide mattress geometry (aspect 2.6) caps visible area at ~13% of canvas even at max width (`PRODUCT_MAX_WIDTH_PX=612`).
3. **HEIGHT_OVERFLOW persists:** Originating in safe-extract / shadow floor-contact guards, not in layout pct alone — orthogonal to asymmetric limit wiring.
4. **Neutral on aggregate:** LAW_003 fail rate unchanged (50%); summary score delta 0; mattress image hash identical OFF vs ON after fixes.

**Next wave candidate:** raise effective width ceiling for wide-category products (alpha-fit enlargement path, or category-specific `PRODUCT_MAX_WIDTH_PX`), and/or address extract-area shadow overflow separately from product scale.

---

## Verification

```bash
npm run daos:test    # pass (includes asymmetric-limits.test.ts)
npm run daos:spec    # pass
npm run lint         # pass
npm run daos:benchmark  # pass (BenchmarkStatus: STOP — unchanged gate)
```

All pass.
