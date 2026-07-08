# DAOS Wave 31 — Aspect Ratio Product Placement Patch Report

## Goal

Fix cases where product fill target is high but factual `compositeProductAreaRatio` stays low due to `HEIGHT_OVERFLOW` / safe-bounds clamp — by choosing fit strategy before compositor placement.

Feature flag: `DAOS_ASPECT_RATIO_PLACEMENT_PATCH=1` (default OFF).

Constraints: no prompt/provider, template, API/UI changes; Phase 1 benchmark only.

---

## Created / modified files

| File | Change |
|------|--------|
| `src/lib/daos/compositor/aspect-ratio-placement-patch.ts` | **New** — fit strategies, safe bounds, target unreachable |
| `src/lib/daos/compositor/product-scale-patch.ts` | Integrate aspect patch after scale target |
| `src/lib/daos/tests/aspect-ratio-placement-patch.test.ts` | **New** — unit tests |
| `src/lib/daos/debug/daos-debug-bundle.ts` | Aspect-ratio diagnostics |
| `src/lib/generate-infographic-handler.ts` | `productHint` from prompt |
| `src/lib/daos/benchmark/catalog.ts`, `runner.ts`, `types.ts`, `metrics.ts`, `decision.ts`, `reporter.ts` | OFF vs ON comparison |
| `package.json` | Test in `daos:test` |
| `benchmark/report.md`, `results.json` | Phase 1 results |

---

## Fit strategies

| Strategy | When | Behavior |
|----------|------|----------|
| **fit-width** | Wide aspect (≥1.35), `home`/mattress prompt, `HEIGHT_OVERFLOW` signal | Maximize width within safe bounds; derive height from aspect; cap height to prevent overflow |
| **fit-height** | Tall aspect (≤0.75) | Maximize height; derive width from aspect |
| **balanced-fit** | Default moderate aspect | Proportional target within both caps |
| **crop-safe-fit** | — | **Not used** (forbidden by default) |

### Safety rules

- Width/height stay within 20–78% / 24–82% canvas pct
- Product stays inside canvas (no width/height ≤ 0)
- If target unreachable → `targetUnreachable=true`, use max visible area
- If correction would reduce visible area → skip, unless wide-product height reduction prevents overflow
- Wide category inferred from prompt when `analysis.category=generic` (e.g. «матрас 160x200»)

### Diagnostics

| Field | Meaning |
|-------|---------|
| `aspectRatioPlacementPatchEnabled` | Flag on |
| `aspectRatioPlacementPatchApplied` | Layout dims changed |
| `productAspectRatio` | Resolved natural aspect |
| `fitStrategy` | `fit-width` \| `fit-height` \| `balanced-fit` |
| `targetUnreachable` | Target area exceeds safe visible bounds |
| `heightOverflowPrevented` | Height capped to safe max |
| `widthOverflowPrevented` | Width capped to safe max |

---

## Phase 1 benchmark — aspect ratio OFF vs ON

Stack: `PRODUCT_SCALE_PATCH=1`, `PRODUCT_FILL_V2=0`, `LAW003_SOFT=1`, `CONTRAST_OVERLAP=1`

| Metric | OFF | ON | Δ |
|--------|-----|-----|---|
| **law003After fail rate** | **25%** | **50%** | +25pp |
| **law003SoftResolved** | **75%** | **50%** | −25pp |
| **compositeProductAreaRatio (avg)** | **0.33** | **0.32** | −0.01 |
| **LAW_014 rate** | **0%** | **0%** | 0 |
| **overlayQualityScore (avg)** | **61.3** | **53.5** | −7.8 |
| **summaryScore Δ** | — | — | **0** |
| **targetUnreachable rate** | **0%** | **100%** | diagnostics |

### Mattress

| Metric | OFF | ON |
|--------|-----|-----|
| compositeProductAreaRatio | 0.13 | 0.13 |
| law003After | fail | fail |
| aspectRatioPlacementPatchApplied | false | **true** |
| fitStrategy | — | **fit-width** (aspect 2.6) |
| HEIGHT_OVERFLOW warnings | yes | yes |
| final image hash | same | same |

Patch applies (`78×24%` layout vs uniform scale) but factual composite placement unchanged — compositor `alpha-fit` still clips; `extractAreaCorrected` remains true.

### Children's Toy

| Metric | OFF | ON |
|--------|-----|-----|
| compositeProductAreaRatio | 0.38 | 0.35 |
| law003After | **pass** | **fail** |
| aspectRatioPlacementPatchApplied | false | false |

Toy regressed on this seed: baseline soft-resolved, patched arm failed recalibrated LAW_003.

---

## Main finding

**Aspect-ratio placement patch correctly plans asymmetric fit (fit-width for mattress) and exposes `targetUnreachable`, but does not yet close the estimate→composite gap.**

1. **Mattress:** `aspectRatioPlacementPatchApplied=true`, `fitStrategy=fit-width`, layout `maxHeightPct` reduced — yet `compositeProductAreaRatio` stays ~0.13 and `HEIGHT_OVERFLOW` persists in compositor extract path.
2. **Toy:** No patch applied; incidental layout drift regressed `law003After` on this seed.
3. **Aggregate LAW_003:** 25% → 50% fail (worse) — patch default OFF; needs compositor-side respect for asymmetric limits (Wave 32 candidate).
4. **LAW_014:** unchanged at 0%.
5. **Diagnostics:** `targetUnreachable` rate 100% with patch ON — honest signal that safe bounds cap below fill target.

---

## Verification

```bash
npm run daos:test
npm run daos:spec
npm run lint
npm run daos:benchmark
```

All pass.
