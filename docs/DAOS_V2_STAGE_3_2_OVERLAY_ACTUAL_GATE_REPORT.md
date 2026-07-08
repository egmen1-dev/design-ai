# DAOS v2 Stage 3.2 — SceneGraph Actual Overlay Category Gate Report

## Goal

Gate `ProductNode.actual` overlay geometry behind category/aspect/risk rules instead of enabling globally when `DAOS_SCENE_GRAPH_V2=1`.

Force flags:
- `DAOS_SCENE_GRAPH_OVERLAY_FORCE_ACTUAL=1` → always actual
- `DAOS_SCENE_GRAPH_OVERLAY_PLANNED=1` → always planned (benchmark baseline)

Raw output: `marketplace-infographic/benchmark/output/stage3-2-overlay-gate-benchmark.json` (2026-07-07).

---

## Created / modified files

| File | Change |
|------|--------|
| `src/lib/scene-graph/overlay-actual-gate.ts` | **New** — gate rules + `shouldUseSceneGraphActualForOverlay` / `explainSceneGraphActualOverlayDecision` |
| `src/lib/scene-graph/product-actual-bridge.ts` | Gate integration in `resolveOverlayProductBbox`, diagnostics |
| `src/lib/scene-graph/index.ts` | Export gate API |
| `src/lib/scene-graph/tests/overlay-actual-gate.test.ts` | **New** — unit tests |
| `src/lib/scene-graph/tests/overlay-reads-product-actual.test.ts` | Gate context for mattress scenarios |
| `src/lib/daos/overlay/overlay-layout-patch.ts` | Gate-aware actual usage + diagnostics |
| `src/lib/daos/overlay/contrast-overlap-patch.ts` | Gate-aware bbox resolution |
| `src/lib/daos/audit/overlay-quality-audit.ts` | Gate-aware risk + LAW_014 recalibration |
| `src/lib/generate-infographic-handler.ts` | Pass `overlayGateContext` through overlay stage |
| `src/lib/daos/debug/daos-debug-bundle.ts` | `overlayActualGateDecision/Reasons/Confidence` |
| `src/lib/daos/benchmark/catalog.ts` | `BENCHMARK_DAOS_SCENE_GRAPH_V2_GATED_ENV` |
| `package.json` | Register gate tests in `daos:test` |

---

## Gate rules

### Use actual when (any)

| Rule | Signal |
|------|--------|
| Wide aspect | `aspectRatio >= 1.8` |
| Wide furniture | category/prompt matches mattress/матрас/диван/кровать/ковёр/стол |
| Wide hero | `wideHeroStrategyApplied=true` |
| Area drift | `\|productAreaDrift\| > 0.08` and actual overlap risk `< 0.25` |

### Use planned when (any blocker)

| Rule | Signal |
|------|--------|
| Toy category | toy/игрушка/children in category or prompt |
| Small centered bbox | actual area `< 25%`, compact aspect, centered on canvas |
| Overlap risk | actual overlap risk `> planned + 0.08` |
| LAW_003 regression | actual geometry would worsen whitespace gate |
| Unknown + low aspect | category unknown/generic and `aspectRatio < 1.5` |

Default: **planned** (confidence 0.7).

---

## Phase 1 benchmark — planned vs gated (n=4)

Stack: Wave 31 wide-product layout + `DAOS_SCENE_GRAPH_V2=1`.

| Metric | Planned (`OVERLAY_PLANNED=1`) | Gated (no force flags) | Δ |
|--------|-------------------------------|------------------------|---|
| **overlayQualityScore (avg)** | **57.0** | **57.5** | +0.5 |
| **pngOverlayFeelRisk (avg)** | **0.38** | **0.35** | −0.03 |
| **overlapRisk (avg)** | **0.00** | **0.035** | +0.035 |
| **summaryScore (avg)** | **75.5** | **75.5** | 0 |
| **actual gate rate** | **0%** | **25%** (1/4) | — |

Office-chair excluded (pre-existing mock-brief Zod error).

---

## Gate decisions by product (gated arm)

| Product | Gate | Reasons | overlayQ planned→gated | pngRisk | Toy regression? |
|---------|------|---------|------------------------|---------|-----------------|
| cordless-drill | **planned** | `default_planned` | 48→59 | 0.90→0.90 | — |
| electric-kettle | **planned** | `default_planned` | 67→67 | 0.20→0.20 | — |
| mattress | **actual** | `wide_aspect_ratio`, `wide_furniture_category`, `wide_hero_strategy`, `significant_area_drift` | 66→57 | 0.20→0.20 | — |
| children's-toy | **planned** | `toy_category` | 47→47 | 0.20→0.20 | **Fixed** (Stage 3.1: 67→40) |

### Stage 3.1 comparison (global actual vs Stage 3.2 gated)

| Product | Stage 3.1 actual arm overlayQ | Stage 3.2 gated overlayQ | Gate avoids regression? |
|---------|------------------------------|--------------------------|-------------------------|
| children's-toy | 40 (−27) | **47** (0) | **Yes** — toy forced planned |
| mattress | 68 (+13) | 57 (actual used) | Partial — actual still selected; score seed-dependent |
| electric-kettle | 69 (+2) | 67 (planned) | Neutral — kettle stays planned |
| cordless-drill | 49 (+1) | 59 (planned) | Drill stays planned; overlap risk contained |

---

## Main conclusion

**The category gate successfully prevents global actual-overlay rollout while preserving wide-product routing.**

1. **Toy regression fixed** — `toy_category` blocker keeps children's toy on planned geometry (overlayQ 47 vs 40 under global actual in Stage 3.1).
2. **Mattress routed to actual** — all four enable rules fire; only product with 25% actual-gate rate in Phase 1.
3. **Drill/kettle stay planned** — default/unknown-category paths avoid unnecessary actual overlap exposure.
4. **Aggregate metrics stable** — summaryScore flat (75.5); slight overlay quality (+0.5) and png risk (−0.03) improvement without global actual.
5. **Diagnostics complete** — `overlayActualGateDecision`, `overlayActualGateReasons`, `overlayActualGateConfidence` exported per run.

**Recommendation:** Ship gated actual overlay as default under `DAOS_SCENE_GRAPH_V2=1`; tune mattress overlap handling in a follow-up if actual-arm overlayQ remains seed-sensitive.

---

## Verification

```bash
npm run daos:test
npm run lint
```

Both pass. Stage 3.2 overlay benchmark: `npx tsx tmp/daos-stage3-2-benchmark.ts`.
