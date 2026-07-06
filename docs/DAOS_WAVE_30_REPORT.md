# DAOS Wave 30 — Product Fill Target Patch v2 Report

## Goal

Reduce remaining `law003After` failures after Wave 29 via more precise product fill targets, without worsening overlap/contrast.

Feature flag: `DAOS_PRODUCT_FILL_V2=1` (default OFF). Requires `DAOS_PRODUCT_SCALE_PATCH=1`.

Constraints respected: no prompt/provider, template, API/UI changes; Phase 1 benchmark only (`npm run daos:benchmark`, not `benchmark:30`).

---

## Changed / created files

| File | Change |
|------|--------|
| `marketplace-infographic/src/lib/daos/compositor/product-scale-patch.ts` | v2 complexity bands, LAW_003 boost, LAW_014 cap, multiplier 4.2, apply trigger for `law003AfterStillFailing` |
| `marketplace-infographic/src/lib/generate-infographic-handler.ts` | Pass complexity/overlay/LAW_014 signals; expose v2 diagnostics |
| `marketplace-infographic/src/lib/daos/debug/daos-debug-bundle.ts` | `productFillV2*` diagnostic fields |
| `marketplace-infographic/src/lib/daos/benchmark/catalog.ts` | `BENCHMARK_DAOS_LAW003_SOFT_ENV` (v2 OFF) vs `BENCHMARK_DAOS_PRODUCT_FILL_V2_ENV` (v2 ON) |
| `marketplace-infographic/src/lib/daos/benchmark/runner.ts` | Compare fill v2 OFF vs ON |
| `marketplace-infographic/src/lib/daos/benchmark/reporter.ts` | Aggregate labels for v2 comparison |
| `marketplace-infographic/src/lib/daos/tests/product-fill-v2.test.ts` | **New** — unit tests |
| `marketplace-infographic/package.json` | Added test to `daos:test` |
| `marketplace-infographic/benchmark/report.md` | Phase 1 results |
| `marketplace-infographic/benchmark/results.json` | Phase 1 results |

---

## v2 target rules

When `DAOS_PRODUCT_FILL_V2=1` and `DAOS_PRODUCT_SCALE_PATCH=1`:

### Complexity bands (`targetProductAreaRatio`)

| Complexity | Band (area ratio) | Inferred from category |
|------------|-------------------|------------------------|
| low | 0.38 – 0.44 | toys, kitchen |
| medium | 0.42 – 0.50 | default |
| high | 0.46 – 0.55 | furniture |

Target interpolates within band based on current area deficit toward band max.

### LAW_003 boost

If `law003AfterStillFailing` (explicit or heuristic: whitespace > 35%, actual < target, overlay density ≤ 0.25) **and** overlay density ≤ 0.25 **and** LAW_014 risk not high → target **+0.05** (capped at band max). Reason suffix: `+law003_boost`.

### LAW_014 guard

If overlap > 2% or `law014RiskHigh` → target capped at band min. Reason suffix: `+law014_cap`. Patch does not increase scale when LAW_014 risk is high and area already ≥ 0.35.

### Scale limits

- Max multiplier: **4.2** (v1: 3.5)
- Placement clamps unchanged (width 20–78%, height 24–82%, safe inset)
- Apply when `actual < 0.35` **or** (`law003AfterStillFailing` and `actual < target`)

### Diagnostics

| Field | Meaning |
|-------|---------|
| `productFillV2Enabled` | v2 flag active |
| `productFillTargetReason` | e.g. `v2_medium_band+law003_boost` |
| `productFillV2Target` | Computed target area ratio |
| `productFillV2Applied` | Patch applied toward v2 target |

---

## Phase 1 benchmark — fill v2 OFF vs ON

Both arms:

```
DAOS_PRODUCT_SCALE_PATCH=1
DAOS_LAW003_SOFT_GOVERNANCE=1
DAOS_CONTRAST_OVERLAP_PATCH=1
DAOS_OVERLAY_PATCH=1
DAOS_GEOMETRY_WHITESPACE_PATCH=1
```

Difference: `DAOS_PRODUCT_FILL_V2=0` (baseline arm) vs `DAOS_PRODUCT_FILL_V2=1` (DAOS arm).

| Metric | v2 OFF | v2 ON | Δ |
|--------|--------|-------|---|
| **law003After fail rate** | **50%** | **50%** | 0 |
| **law003SoftResolved rate** | **50%** | **50%** | 0 |
| **compositeProductAreaRatio (avg)** | **0.328** | **0.316** | −0.012 |
| **LAW_014 violation rate** | **0%** | **0%** | 0 |
| **overlayQualityScore (avg)** | **56.3** | **53.5** | −2.8 |
| **summaryScore Δ** | — | — | **0** |

### Per-product highlights

| Product | law003After (OFF→ON) | compositeArea (OFF→ON) | overlayScore (OFF→ON) | final image hash |
|---------|----------------------|------------------------|----------------------|------------------|
| Cordless Drill | pass → pass | 0.42 → 0.39 | 48 → 48 | changed |
| Electric Kettle | pass → pass | 0.39 → 0.39 | 67 → 67 | same |
| Office Chair | n/a (mock fail) | n/a | n/a | same |
| Mattress | **fail → fail** | 0.15 → 0.13 | 63 → 52 | changed |
| Children's Toy | **fail → fail** | 0.35 → 0.35 | 47 → 47 | changed |

v2 **does apply** on several products (`productFillV2Applied=true`, e.g. mattress: target 0.5, multiplier ~1.8, reason `v2_medium_band+law003_boost`). Estimated after-patch area reaches 0.5, but **factual `compositeProductAreaRatio` stays ~0.15** due to `HEIGHT_OVERFLOW` extract warnings — compositor clamps overflow and LAW_003 whitespace remains 55.4%.

Children's toy: area 0.35 is at the v1 trigger boundary; v2 target band (low: 0.38–0.44) should apply but composite ratio unchanged — patch cannot close the gap to recalibrated LAW_003 threshold within safe bounds.

---

## Main finding

**Product fill v2 correctly computes higher complexity-aware targets and applies safely, but does not reduce `law003After` fail rate on Phase 1.**

1. **No LAW_003 regression on contrast/overlap:** LAW_014 stays 0%; no new overlap violations.
2. **No LAW_003 improvement:** Remaining failures (mattress, children's toy) are not resolved — estimated `productAreaAfterEstimate` diverges from factual `compositeProductAreaRatio` when placement hits height/safe clamps (`HEIGHT_OVERFLOW`).
3. **Slight overlay score dip (−2.8):** Scaling on drill/mattress changes composite layout without improving LAW_003 pass; mattress overlay score 63 → 52.
4. **Flag default OFF:** Safe to ship behind `DAOS_PRODUCT_FILL_V2=1`; v1 behavior unchanged when flag off.
5. **Next wave candidate:** Bridge `productAreaAfterEstimate` to factual composite feedback loop, or relax height clamp for extreme aspect-ratio products (mattress), rather than higher targets alone.

---

## Verification

```bash
npm run daos:test    # includes product-fill-v2.test.ts
npm run daos:spec
npm run lint
npm run daos:benchmark
```

All checks pass on Wave 30 branch.
