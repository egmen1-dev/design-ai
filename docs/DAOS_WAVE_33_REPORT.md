# DAOS Wave 33 — Wide Product Hero Strategy Report

## Goal

For wide products (mattress aspect ~2.6), stop relying on ordinary `fit-width` area targets. Introduce a dedicated wide hero strategy: full-bleed / diagonal / crop-safe placement that bypasses the `PRODUCT_MAX_WIDTH_PX` (68%) ceiling.

Feature flag: `DAOS_WIDE_HERO_STRATEGY=1` (default OFF, requires `DAOS_COMPOSITOR_ASYMMETRIC_LIMITS=1` + `DAOS_ASPECT_RATIO_PLACEMENT_PATCH=1`).

Constraints: no prompt/provider, template, API/UI changes; Phase 1 benchmark only.

---

## Created / modified files

| File | Change |
|------|--------|
| `src/lib/daos/compositor/wide-hero-strategy.ts` | **New** — `detectWideHeroCandidate`, `createWideHeroStrategy`, `applyWideHeroStrategy` |
| `src/lib/compositing/scene-compositor.ts` | Consume `wideHeroStrategy` for max size, alpha caps, side margin |
| `src/lib/generate-infographic-handler.ts` | Wire wide hero in `buildDaosSceneCompositeOptions`; diagnostics |
| `src/lib/daos/debug/daos-debug-bundle.ts` | `wideHeroStrategy*` diagnostics |
| `src/lib/daos/tests/wide-hero-strategy.test.ts` | **New** — unit tests |
| `src/lib/daos/benchmark/catalog.ts`, `runner.ts`, `reporter.ts` | wide hero OFF vs ON comparison |
| `package.json` | Test in `daos:test` |
| `benchmark/report.md`, `results.json` | Phase 1 results |

---

## Strategy selection

| Strategy | When | Behavior |
|----------|------|----------|
| **standard** | aspect &lt; 1.8, not a wide candidate, or flag OFF | No change |
| **wide_full_bleed** | Wide candidate, moderate width target | 85–92% canvas width, 2% side margin |
| **wide_crop_safe** | `targetUnreachable` / `HEIGHT_OVERFLOW` signal | Up to 96% width, 6% horizontal crop-safe bleed, `sideMarginPx=0` |
| **wide_diagonal** | fit-width + width target ≥ 92% | full-bleed + 2.5° rotation (compositor-safe ±3°) |

### Rules

- Candidate: aspect ≥ 2.0, or mattress/матрас prompt, or home category + aspect ≥ 1.8
- Width target: 85% at aspect 2.0 → 96% at aspect ≥ 3.0 (mattress 2.6 → **91.6%**)
- Crop-safe horizontal bleed: max **6%**, no vertical crop
- Guardrail: skip only when factual `law014ContrastViolation` **and** overlap &gt; 8%

### Diagnostics

| Field | Meaning |
|-------|---------|
| `wideHeroStrategyEnabled` | Flag on |
| `wideHeroStrategyApplied` | Strategy active in compositor |
| `wideHeroStrategy` | `wide_full_bleed` \| `wide_crop_safe` \| `wide_diagonal` |
| `wideHeroReason` | e.g. `wide_hero_wide_crop_safe` |
| `wideHeroWidthTarget` | Target width % (91.6 for mattress) |
| `wideHeroCropSafe` | Horizontal bleed % (6 max) |

---

## Phase 1 benchmark — wide hero OFF vs ON

Stack:

```
DAOS_PRODUCT_SCALE_PATCH=1
DAOS_ASPECT_RATIO_PLACEMENT_PATCH=1
DAOS_COMPOSITOR_ASYMMETRIC_LIMITS=1
DAOS_WIDE_HERO_STRATEGY=0|1
DAOS_LAW003_SOFT_GOVERNANCE=1
DAOS_CONTRAST_OVERLAP_PATCH=1
```

| Metric | OFF | ON | Δ |
|--------|-----|-----|---|
| **mattress compositeProductAreaRatio** | **0.13** | **0.18** | **+0.05** |
| **mattress productScaleScore** | 1 | 12 | +11 |
| **mattress width ratio** | 0.68 | 0.80 | +0.12 |
| **law003After (mattress)** | fail | fail | — |
| **targetUnreachable (mattress)** | true | true | — |
| **LAW_014 (mattress)** | pass | pass | — |
| **avg compositeProductAreaRatio** | 0.33 | 0.33 | 0 |
| **law003After fail rate** | 50% | 50% | 0 |
| **summaryScore Δ** | — | — | **0** |

### Mattress detail

| Metric | OFF | ON |
|--------|-----|-----|
| compositeProductAreaRatio | 0.13 | **0.18** |
| placement px | 612×229 | **720×270** |
| maxWidthPx (strategy) | 612 | **824** |
| wideHeroStrategy | standard | **wide_crop_safe** |
| wideHeroWidthTarget | — | **91.6%** |
| law003After | fail | fail |
| HEIGHT_OVERFLOW | yes | yes |
| final image hash | `37259b4e…` | `9057600f…` (changed) |

---

## Main finding

**Wide hero strategy breaks the 68% width ceiling and raises mattress factual area from ~0.13 to ~0.18 (+38% relative), but LAW_003 still fails** (product area below 30% threshold).

1. **Works for mattress:** `wide_crop_safe` at 91.6% width target, placement 80% canvas width — first meaningful `compositeProductAreaRatio` gain since Wave 30.
2. **LAW_003 gap remains:** 18% area &lt; 30% threshold; `targetUnreachable=true` — geometry cap at safe height (~317px) limits further growth without layout/prompt changes.
3. **LAW_014:** unchanged at 0% violation rate; guardrail uses factual contrast violation only.
4. **Non-wide products:** unchanged (standard strategy); aggregate avg area flat.

**Next candidate:** combine wide hero with vertical zone expansion or multi-row hero layout for extreme aspect products.

---

## Verification

```bash
npm run daos:test    # pass
npm run daos:spec    # pass
npm run lint         # pass
npm run daos:benchmark  # pass
```

All pass.
