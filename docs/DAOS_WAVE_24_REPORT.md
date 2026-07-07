# DAOS Wave 24 — Compositor Product Scale Patch Report

## Goal

Close the gap between **planned product area** and **actual compositor pixel bounds** so the product occupies real visible canvas area. Feature flag: `DAOS_PRODUCT_SCALE_PATCH=1` (default **OFF**).

---

## Implemented

### Product scale patch

`marketplace-infographic/src/lib/daos/compositor/product-scale-patch.ts`

| Export | Role |
|--------|------|
| `createProductScalePatch(input)` | Deterministic scale/placement plan |
| `applyProductScalePatch(input)` | Clone layout, boost scale, return compositor options |
| `isDaosProductScalePatchEnabled()` | `process.env.DAOS_PRODUCT_SCALE_PATCH === "1"` |

**Triggers:** `actual productAreaRatio < 0.35`

| Action | Effect |
|--------|--------|
| `BOOST_PRODUCT_SCALE` | `scaleMultiplier = sqrt(target / actual)`, clamped 1–3.5 |
| `CENTER_IN_HERO_ZONE` | Center product in hero safe zone |
| `APPLY_PLACEMENT_PATCH` | Pixel placement patch for compositor |
| `UPDATE_COMPOSITOR_LIMITS` | Boost `objectScale`, pass `productScaleMultiplier` |

Target area: **0.42–0.55** depending on deficit.

### Compositor hook (minimal additive change)

`scene-compositor.ts` accepts optional `productScaleMultiplier` on `SceneCompositeOptions` — **only when explicitly passed** from DAOS patch. Scales `computeMaxProductSize` and alpha fit limits.

### Integration

`generate-infographic-handler.ts` — `buildDaosSceneCompositeOptions()` called **before** each marketplace `compositeProductIntoScene()`:

1. `applyProductScalePatch()` on `compositionLayout` + planned area
2. Patched `compositionLayout`, `objectScale`, `productScaleMultiplier` passed to compositor
3. Original `compositionLayout` preserved for HTML render path

### Diagnostics & debug bundle

- `productScalePatchEnabled`, `productScalePatchApplied`, `productScaleMultiplier`
- `productAreaBefore`, `productAreaTarget`, `productAreaAfterEstimate`
- `productScalePatchActions`
- `productScalePatch` object on debug bundle

---

## Phase 1 benchmark (no patch → product scale patched)

Both arms: full DAOS compressed stack + `DAOS_OVERLAY_PATCH=1` + `DAOS_GEOMETRY_WHITESPACE_PATCH=1`.  
Delta: `DAOS_PRODUCT_SCALE_PATCH=0` vs `=1`.

| Metric | No patch avg | Patched avg | Delta |
|--------|--------------|-------------|-------|
| summaryScore | 75.5 | 75.5 | **0** |
| productAreaRatio (composer) | **0.45** | **0.44** | ~0 |
| productScaleScore | **0.0** | **0.0** | 0 |
| productDominanceScore | **1.0** | **1.0** | 0 |
| emptySpaceEstimate | **0.29** | **0.29** | 0 |
| sceneFillRisk | **0.40** | **0.40** | 0 |
| overlayQualityScore | **16.8** | **16.8** | 0 |
| LAW_003 violation rate | **100%** | **100%** | 0 |
| LAW_014 violation rate | **100%** | **100%** | 0 |

Per-product:

| Product | patch applied | multiplier | area before → target | final image hash |
|---------|---------------|------------|----------------------|------------------|
| Cordless Drill | yes | ~1.82 | 0.15 → 0.49 | **changed** |
| Electric Kettle | no (area OK) | 1.0 | — | same |
| Mattress | yes | ~1.8 | 0.15 → 0.49 | **changed** |
| Children's Toy | yes | ~1.8 | 0.15 → 0.49 | **changed** |

Debug bundles confirm `productScalePatchApplied=true` with `scaleMultiplier≈1.82` and `placementPatch` ~702×984px on patched runs.

---

## Main finding

**Compositor patch applies and changes merged image output, but post-render audit metrics do not yet reflect improved placement.**

1. **Patch works at compositor input** — multiplier ~1.82, target area ~0.49, placement patch 702×984px; final image hash changes on 3/4 products.
2. **productAreaRatio flat (~0.44)** — post-render `composerQualityAudit` still derives ratio from planned `compositionLayout.metrics`, not `compositeResult.productPlacement`.
3. **productScaleScore stays 0** — Wave 23 audit still compares layout bounds vs canvas; needs to read compositor `productPlacement` after patch.
4. **LAW_003 unchanged (100%)** — constitution whitespace measured on final HTML composite; compositor scale alone insufficient without placement persistence into audit chain.
5. **summaryScore Δ 0** — safe; no regression.

**Recommendation:** Next step — wire `compositeResult.productPlacement` into `productScaleAudit` post-composite and re-measure; consider second-pass constitution on merged image only.

---

## Verification

```bash
cd marketplace-infographic
npm run daos:test      # pass (includes product-scale-patch.test.ts)
npm run daos:spec      # pass
npm run lint           # pass
npm run typecheck      # pre-existing tmp/* errors only
npm run daos:benchmark # Phase 1 pass
```

---

## Files

**Created**

- `src/lib/daos/compositor/product-scale-patch.ts`
- `src/lib/daos/tests/product-scale-patch.test.ts`
- `docs/DAOS_WAVE_24_REPORT.md`

**Modified**

- `src/lib/compositing/scene-compositor.ts` — optional `productScaleMultiplier`
- `src/lib/generate-infographic-handler.ts` — compositor patch hook
- `src/lib/daos/debug/daos-debug-bundle.ts` — `productScalePatch` + diagnostics
- `src/lib/generation/diagnostic-report.ts`
- `src/lib/daos/benchmark/catalog.ts`, `runner.ts`
- `package.json`
- `benchmark/*` — Wave 24 results
