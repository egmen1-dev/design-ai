# DAOS v2 Stage 3.1 — SceneGraph Overlay Benchmark Report

## Goal

Phase 1 benchmark comparing overlay geometry sources:

| Arm | Env profile | Overlay geometry |
|-----|-------------|------------------|
| **Planned (baseline)** | `BENCHMARK_DAOS_SCENE_GRAPH_V2_PLANNED_ENV` | `ProductNode.planned` (`DAOS_SCENE_GRAPH_OVERLAY_PLANNED=1`) |
| **Actual (patched)** | `BENCHMARK_DAOS_SCENE_GRAPH_V2_ACTUAL_ENV` | `ProductNode.actual` from compositor (`DAOS_SCENE_GRAPH_V2=1`) |

Stack: full Wave 31 wide-product layout stack (`DAOS_WIDE_PRODUCT_LAYOUT=1` + prior patches). Mock provider, Phase 1 catalog, shared seed `daos-benchmark-phase1-20260706`.

Raw output: `marketplace-infographic/benchmark/output/stage3-overlay-benchmark.json` (2026-07-06T21:40:55Z).

---

## Coverage

| Product | Planned | Actual | Notes |
|---------|---------|--------|-------|
| cordless-drill | ✓ | ✓ | |
| electric-kettle | ✓ | ✓ | |
| office-chair | ✗ | ✗ | Pre-existing `ZodError` in mock brief (`deferredSpecs`/`deferredBullets` > 80 chars); unrelated to SceneGraph |
| mattress | ✓ | ✓ | Wide-layout stress case |
| childrens-toy | ✓ | ✓ | |

**Valid pairs: 4 / 5** (office-chair excluded from aggregates).

---

## Aggregate metrics (4 products)

| Metric | Planned | Actual | Δ |
|--------|---------|--------|---|
| **LAW_014 rate** | **0%** | **0%** | 0 |
| **overlayQualityScore (avg)** | **59.3** | **56.5** | −2.8 |
| **pngOverlayFeelRisk (avg)** | **0.38** | **0.35** | −0.03 (lower is better) |
| **overlapRisk (avg)** | **0.00** | **0.035** | +0.035 |
| **overlayUsedSceneGraphActual rate** | **0%** | **100%** | flag works |
| **overlayProductActualAreaRatio (avg)** | **0.363** | **0.363** | 0 (same compositor placement) |
| **summaryScore (avg)** | **75.5** | **75.5** | 0 |

---

## Per-product comparison

### Cordless Drill (`cordless-drill`)

| Metric | Planned | Actual |
|--------|---------|--------|
| LAW_014 | false | false |
| overlayQualityScore | 48 | 49 |
| pngOverlayFeelRisk | 0.90 | 0.80 |
| overlapRisk | 0.00 | **0.14** |
| overlayUsedSceneGraphActual | false | **true** |
| overlayProductActualAreaRatio | 0.434 | 0.434 |
| summaryScore | 78 | 78 |
| final image hash | `b8ef489e…` | `2fa0475a…` (changed) |

### Electric Kettle (`electric-kettle`)

| Metric | Planned | Actual |
|--------|---------|--------|
| LAW_014 | false | false |
| overlayQualityScore | 67 | **69** |
| pngOverlayFeelRisk | 0.20 | **0.10** |
| overlapRisk | 0.00 | 0.00 |
| overlayUsedSceneGraphActual | false | **true** |
| overlayProductActualAreaRatio | 0.435 | 0.435 |
| summaryScore | 78 | 78 |
| final image hash | `009cde4e…` | `009cde4e…` (**same**) |

### Mattress (`mattress`) — wide layout

| Metric | Planned | Actual |
|--------|---------|--------|
| LAW_014 | false | false |
| overlayQualityScore | 55 | **68** |
| pngOverlayFeelRisk | 0.20 | **0.10** |
| overlapRisk | 0.00 | 0.00 |
| overlayUsedSceneGraphActual | false | **true** |
| overlayProductActualAreaRatio | 0.201 | 0.201 |
| overlay gate | failed (55) | **warning (68)** |
| summaryScore | 73 | 73 |
| final image hash | `91a2d07a…` | `8e488e42…` (changed) |

### Children's Toy (`childrens-toy`)

| Metric | Planned | Actual |
|--------|---------|--------|
| LAW_014 | false | false |
| overlayQualityScore | 67 | **40** |
| pngOverlayFeelRisk | 0.20 | **0.40** |
| overlapRisk | 0.00 | 0.00 |
| overlayUsedSceneGraphActual | false | **true** |
| overlayProductActualAreaRatio | 0.383 | 0.383 |
| law003WhitespaceViolation | false | **true** |
| overlay gate | warning (67) | **failed (40)** |
| summaryScore | 73 | 73 |
| final image hash | `31ed829c…` | `f733c0ca…` (changed) |

### Office Chair (`office-chair`) — blocked

Both arms failed at mock brief sanitization (`oneThought.deferredSpecs[0]` and `deferredBullets[0]` exceed 80 characters). Deterministic for this prompt in `AI_MOCK_MODE`; not caused by SceneGraph Stage 3.

---

## Products improved (actual vs planned)

1. **Mattress** — largest gain: overlayQuality **+13** (55→68), pngOverlayFeelRisk **−0.10**, overlay gate **failed→warning**. Actual compositor bbox lets overlay avoid underestimating wide-product footprint.
2. **Electric Kettle** — overlayQuality **+2**, pngOverlayFeelRisk **−0.10**, identical final image hash (overlay-only refinement).
3. **Cordless Drill** — overlayQuality **+1**, pngOverlayFeelRisk **−0.10**; minor overlap-risk regression (0→0.14).

---

## Products worsened (actual vs planned)

1. **Children's Toy** — overlayQuality **−27** (67→40), pngOverlayFeelRisk **+0.20**, new **LAW_003** violation, overlay gate **warning→failed**. Actual bbox shifts safe-zone logic into a worse layout on this seed despite unchanged compositor area ratio.
2. **Cordless Drill** — overlapRisk **0→0.14** (contrast overlap estimate rises when actual geometry is wider than planned safe zone).

No product showed LAW_014 regression; summaryScore unchanged for all completed pairs.

---

## Main conclusion

**Stage 3 wiring works: overlay consistently reads `ProductNode.actual` (100% on actual arm) and improves wide-product overlay quality where planned geometry was misleading — but aggregate summary is flat and results are product-dependent.**

1. **Flag / plumbing verified** — `overlayUsedSceneGraphActual` is 0% planned vs 100% actual; `overlayProductActualSource=scene-compositor` on all successful actual runs.
2. **Mattress validates the hypothesis** — the primary Stage 3 target (wide layout, compositor actual ≠ planned safe zone) shows a strong overlay-quality lift without LAW_014 cost.
3. **LAW_014 unchanged** — 0% violation rate on both arms across 4 products.
4. **summaryScore neutral** — avg 75.5 both arms; final gate not yet moved by overlay-geometry switch alone.
5. **Regressions are localized** — children's toy shows actual geometry can over-constrain overlay on some seeds; cordless drill shows elevated overlap-risk when actual bbox exceeds planned assumptions.
6. **Benchmark gap** — office-chair blocked by pre-existing mock-brief Zod limit (out of Stage 3 scope).

**Recommendation:** Keep Stage 3 actual-geometry path ON for wide/aspect-ratio products; add seed-level guardrails or overlap tuning before defaulting actual geometry for all categories. Re-run office-chair after mock-brief sanitization fix.
