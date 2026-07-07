# DAOS v2 Stage 4.1 — SceneGraph Whitespace Attribution Report

## Goal

Decompose LAW_003 whitespace failures into attributable root causes from SceneGraph `actual`/`planned` nodes. Non-blocking diagnostic layer under `DAOS_SCENE_GRAPH_V2=1`.

Does **not** change blocking Design Constitution, templates, prompt/provider, or API/UI.

Raw benchmark output: `marketplace-infographic/benchmark/output/stage4-1-whitespace-attribution-benchmark.json` (2026-07-07).

---

## Created / modified files

| File | Change |
|------|--------|
| `src/lib/scene-graph/SceneGraphWhitespaceAttribution.ts` | **New** — `analyzeSceneGraphWhitespaceAttribution`, `summarizeSceneGraphWhitespaceAttribution` |
| `src/lib/scene-graph/tests/scene-graph-whitespace-attribution.test.ts` | **New** — unit tests |
| `src/lib/scene-graph/SceneGraphSerializer.ts` | Write `sceneGraphWhitespaceAttribution.json` |
| `src/lib/scene-graph/index.ts` | Export attribution API |
| `src/lib/daos/scene-graph/scene-graph-mirror.ts` | Run attribution after constitution mirror |
| `src/lib/daos/debug/daos-debug-bundle.ts` | `sceneGraphWhitespaceAttribution`, `whitespacePrimaryCause`, `whitespaceSecondaryCauses`, `whitespaceRecommendations` |
| `package.json` | Register attribution tests in `daos:test` |
| `tmp/daos-stage4-1-benchmark.ts` | One-off Phase 1 benchmark |

---

## Attribution rules

| Signal | Primary cause |
|--------|---------------|
| `productAreaRatio < 0.25` | `product_too_small` |
| `aspectRatio >= 2.0` (or wide category) + `productAreaRatio < 0.25` | `wide_product_geometry_limit` |
| `overlayDensity < 0.12` + whitespace > 45% | `overlay_too_small` (+ `background_too_empty` secondary) |
| `heroTextRatio < 2` | `hero_text_ratio_low` |
| LAW_003 fail + `productAreaRatio >= 0.30` + overlay density ≤ safe (0.25) | `metric_mismatch` |
| Wide product + low hero/text | Recommend wide-product template, **not** hero scale patch |

Output: `estimatedWhitespace`, `productAreaRatio`, `overlayDensity`, `textAreaRatio`, `badgeAreaRatio`, `heroTextRatio`, `backgroundEmptyAreaEstimate`, `primaryCause`, `secondaryCauses`, `recommendations`, `confidence`.

---

## Phase 1 benchmark — primary causes by product (n=4)

Office-chair excluded (pre-existing mock-brief Zod error).

| Product | primaryCause | productArea | overlayDensity | heroTextRatio | Secondary causes |
|---------|--------------|-------------|----------------|---------------|------------------|
| cordless-drill | **metric_mismatch** | 0.39 | 0.12 | 7.54 | `background_too_empty` |
| electric-kettle | **metric_mismatch** | 0.43 | 0.11 | 6.93 | — |
| mattress | **wide_product_geometry_limit** | 0.19 | 0.39 | 1.11 | `hero_text_ratio_low`, `background_too_empty` |
| children's-toy | **metric_mismatch** | 0.35 | 0.09 | 8.20 | `overlay_too_small`, `background_too_empty` |

**Aggregate:** `metric_mismatch` 75% (3/4), `wide_product_geometry_limit` 25% (1/4).

---

## Analyzer recommendations (by product)

### cordless-drill
- Review LAW_003 whitespace formula — product and overlay look adequate but estimated whitespace still fails
- Reduce background empty area with tighter crop, content fill, or scene props

### electric-kettle
- Review LAW_003 whitespace formula — product and overlay look adequate but estimated whitespace still fails

### mattress
- Use wide-product layout template; avoid hero scale patch for wide geometry
- Reduce background empty area with tighter crop, content fill, or scene props
- Apply wide-product typography band; do not compensate with hero scale patch

### children's-toy
- Review LAW_003 whitespace formula — product and overlay look adequate but estimated whitespace still fails
- Add overlay elements or increase typography/badge footprint to reduce empty canvas
- Reduce background empty area with tighter crop, content fill, or scene props

---

## Checks

| Check | Result |
|-------|--------|
| `npm run daos:test` | pass |
| `npm run lint` | pass |
| `npm run daos:benchmark` | pass |
| `scene-graph-whitespace-attribution.test.ts` | pass |

---

## Main conclusion

Whitespace attribution runs immediately after the Constitution mirror and explains **why** LAW_003 fails in SceneGraph terms.

Phase 1 shows **75% of products** fail LAW_003 due to **`metric_mismatch`**: actual product fill (34–43% area) and overlay density look reasonable, but the whitespace estimator still reports 37–63% empty canvas. This confirms Stage 4's finding that the mirror LAW_003 signal is dominated by formula/estimation drift, not insufficient hero scale.

**Mattress** is the outlier with a structurally different diagnosis: **`wide_product_geometry_limit`** with **`hero_text_ratio_low`** (1.11) — the analyzer correctly recommends wide-product template and typography band instead of hero scale patch.

Next step (out of scope): calibrate `estimateWhitespaceFromGraph` against visual empty-space metrics, or tune recalibration thresholds before using attribution to drive patches.
