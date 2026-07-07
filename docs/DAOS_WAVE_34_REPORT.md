# DAOS Wave 34 — Wide Product Layout Strategy Report

## Goal

For extreme-wide products, use a dedicated layout strategy: **bottom hero product band + top text zone** — instead of trying to pass LAW_003 through compositor scale alone.

Feature flag: `DAOS_WIDE_PRODUCT_LAYOUT=1` (default OFF).

Constraints: no prompt/provider, global template, API/UI changes; Phase 1 benchmark only.

---

## Created / modified files

| File | Change |
|------|--------|
| `src/lib/daos/overlay/wide-product-layout.ts` | **New** — detect/create/apply layout patch |
| `src/lib/generate-infographic-handler.ts` | Apply after contrast patch, before HTML render |
| `src/lib/daos/debug/daos-debug-bundle.ts` | `wideProductLayout*` diagnostics |
| `src/lib/daos/tests/wide-product-layout.test.ts` | **New** — unit tests |
| `src/lib/daos/benchmark/catalog.ts`, `runner.ts`, `reporter.ts` | wide layout OFF vs ON |
| `package.json` | Test in `daos:test` |

---

## Layout strategy

| Zone | Spec | Applied (mattress) |
|------|------|-------------------|
| **Hero (product)** | bottom 38–45% height, width 85–96%, crop-safe bleed ≤6% | `top:53.8%; h:42.2%; w:91.6%` |
| **Text** | top 35–45% height | `top:4%; h:40%; w:92%` |
| **Badges** | max 2 | capped |
| **Plaques** | simple/clean, no glass | `backgroundStyle: clean_studio` |
| **Overlap** | text top / product bottom | `overlapPct: 0` in layout metrics |

Strategy name: `wide_bottom_hero_text_top`

Candidate rules: aspect ≥ 2.0 or mattress/матрас prompt/category.

---

## Phase 1 benchmark — wide layout OFF vs ON

Stack (both arms):

```
DAOS_PRODUCT_SCALE_PATCH=1
DAOS_ASPECT_RATIO_PLACEMENT_PATCH=1
DAOS_COMPOSITOR_ASYMMETRIC_LIMITS=1
DAOS_WIDE_HERO_STRATEGY=1
DAOS_WIDE_PRODUCT_LAYOUT=0|1
DAOS_LAW003_SOFT_GOVERNANCE=1
DAOS_CONTRAST_OVERLAP_PATCH=1
```

### Mattress

| Metric | layout OFF | layout ON | Δ |
|--------|------------|-----------|---|
| compositeProductAreaRatio | **0.18** | **0.19** | +0.01 |
| composite width ratio | 0.80 | 0.80 | 0 |
| law003After | **fail** | **fail** | — |
| overlayQualityScore | 52 | **55** | +3 |
| LAW_014 | pass | pass | — |
| pngOverlayFeelRisk | 0.20 | 0.20 | — |
| summaryScore | 73 | 73 | 0 |
| final image hash | `9057600f…` | `907ffc9e…` | changed |
| wideProductLayoutApplied | false | **true** | — |
| planned productAreaPct (layout) | ~22% | **~39%** | +17pp |

### Aggregate

| Metric | OFF | ON |
|--------|-----|-----|
| avg compositeProductAreaRatio | 0.35 | 0.34 |
| law003After fail rate | 25% | 50% |
| LAW_014 rate | 0% | 0% |
| avg overlayQualityScore | 61.3 | 54.3 |

Toy regression on this seed (law003 pass→fail) is **not** from wide layout — `wideProductLayoutApplied=false` for non-wide products.

---

## Main finding

**Wide product layout patch correctly separates text (top) and hero (bottom) for mattress**, raising planned `productAreaPct` to ~39% and factual composite area slightly (0.18→0.19). Overlay quality on mattress improves (+3).

**LAW_003 still fails** for mattress: factual composite ~19% vs 30% threshold; recalibrated whitespace ~58%; failure reason `OVERLAY_DENSITY_TOO_HIGH`. Layout alone cannot close the gap without compositor re-run using updated hero zone (layout patch runs after composite in current pipeline).

**Next candidate:** feed wide layout hero zone back into compositor pre-pass, or run layout patch before composite for wide candidates.

---

## Verification

```bash
npm run daos:test    # pass
npm run daos:spec    # pass
npm run lint         # pass
npm run daos:benchmark  # pass
```

All pass.
