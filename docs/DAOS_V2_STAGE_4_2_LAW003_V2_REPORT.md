# DAOS v2 Stage 4.2 — SceneGraph LAW_003 Formula V2 Report

## Goal

Introduce a geometry-first SceneGraph LAW_003 formula (V2) to resolve Stage 4.1 `metric_mismatch` cases where products look adequately filled but V1 whitespace estimation still fails.

Non-blocking under `DAOS_SCENE_GRAPH_V2=1`. Does **not** change blocking Design Constitution, templates, prompt/provider, or API/UI.

Raw benchmark: `marketplace-infographic/benchmark/output/stage4-2-law003-v2-benchmark.json` (2026-07-07).

---

## Created / modified files

| File | Change |
|------|--------|
| `src/lib/scene-graph/SceneGraphLaw003V2.ts` | **New** — `evaluateSceneGraphLaw003V2`, `compareLaw003V1V2` |
| `src/lib/scene-graph/tests/scene-graph-law003-v2.test.ts` | **New** — unit tests |
| `src/lib/scene-graph/SceneGraphConstitutionMirror.ts` | Compute V1 + V2; embed `law003V2` in mirror result |
| `src/lib/scene-graph/index.ts` | Export V2 API |
| `src/lib/daos/debug/daos-debug-bundle.ts` | `sceneGraphLaw003V2Passed/Score/Disagreement/Reason` |
| `package.json` | Register V2 tests in `daos:test` |
| `tmp/daos-stage4-2-benchmark.ts` | Phase 1 benchmark — current vs V1 vs V2 |

---

## LAW_003 V2 formula

**Inputs:** `productAreaRatio`, `overlayDensity`, `heroTextRatio`, `backgroundEmptyAreaEstimate` (geometric residual), `productDominanceScore` (estimated from SceneGraph geometry).

**Pass (all):**
- `productAreaRatio >= 0.32`
- `heroTextRatio >= 2`
- `overlayDensity` in `[0.07, 0.30]`
- `backgroundEmptyAreaEstimate <= 0.50`

**Hard fail (any):**
- `productAreaRatio < 0.25`
- `heroTextRatio < 1.6`
- `overlayDensity > 0.45`
- Wide product geometry without wide layout template

**Output:** `passed`, `score`, `version: "scenegraph-law003-v2"`, `oldPassed`, `disagreement`, `reason`, `metrics`.

Both V1 and V2 are stored in `sceneGraphConstitutionMirror.json` under `law003` and `law003V2`.

---

## Phase 1 benchmark — LAW_003 current vs mirror V1 vs V2 (n=4)

Office-chair excluded (pre-existing mock-brief Zod error).

| Product | Current | Mirror V1 | Mirror V2 | V1↔V2 disagreement | V2 resolves V1 fail |
|---------|---------|-----------|-----------|--------------------|---------------------|
| cordless-drill | fail | fail | **pass** | yes | yes |
| electric-kettle | fail | fail | **pass** | yes | yes |
| mattress | fail | fail | fail | no | no |
| children's-toy | fail | fail | **pass** | yes | yes |

### Aggregate

| Metric | Value |
|--------|-------|
| Current pass rate | 0% (0/4) |
| Mirror V1 pass rate | 0% (0/4) |
| **Mirror V2 pass rate** | **75% (3/4)** |
| V1↔V2 disagreement rate | **75%** |
| V2 resolves V1 fail | **3 products** |
| V2 still failing | **1 product** (mattress) |

### V2 metrics (resolved products)

| Product | productArea | overlayDensity | heroTextRatio | V2 reason |
|---------|-------------|----------------|---------------|-----------|
| cordless-drill | 0.39 | 0.11 | 8.00 | Scene fill within V2 bounds |
| electric-kettle | 0.43 | 0.11 | 6.93 | Scene fill within V2 bounds |
| children's-toy | 0.35 | 0.09 | 8.20 | Scene fill within V2 bounds |

### Mattress (still failing)

| Metric | Value |
|--------|-------|
| productArea | 0.19 |
| overlayDensity | 0.39 |
| heroTextRatio | 1.11 |
| V2 reason | Wide product geometry limit without wide layout template |

---

## Checks

| Check | Result |
|-------|--------|
| `npm run daos:test` | pass |
| `npm run lint` | pass |
| `npm run daos:benchmark` | pass |
| `scene-graph-law003-v2.test.ts` | pass |

---

## Main conclusion

LAW_003 V2 replaces whitespace-percent estimation with **multi-signal geometry fill** and resolves **75% of Phase 1 metric_mismatch cases** (drill, kettle, toy) while correctly keeping **mattress** as fail due to wide-product geometry without wide template.

V1↔V2 disagreement rate is **75%**, aligned with Stage 4.1 attribution: the old formula over-penalizes visually adequate compositions. V2 is suitable as a **calibration target** for future governance tuning but remains non-blocking per Stage 4 constraints.

Next step (out of scope): validate V2 against human QA labels and consider wide-product template auto-application for mattress-class products.
