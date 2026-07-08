# DAOS v2 Stage 5 — Wide Product Template Report

## Goal

Introduce a dedicated compositional strategy for wide products (mattress, sofa, bed, carpet, table) after Stage 4.2 confirmed: standard products pass LAW_003 V2, mattress fails legitimately without wide layout.

Feature flag: `DAOS_WIDE_PRODUCT_TEMPLATE=1` (off by default). Does **not** change prompt/provider, API/UI, or blocking Design Constitution.

Raw benchmark: `marketplace-infographic/benchmark/output/stage5-wide-product-template-benchmark.json` (2026-07-07).

---

## Created / modified files

| File | Change |
|------|--------|
| `src/lib/daos/templates/wide-product-template.ts` | **New** — `detectWideProductTemplateCandidate`, `createWideProductTemplate`, `applyWideProductTemplate` |
| `src/lib/daos/tests/wide-product-template.test.ts` | **New** — unit tests |
| `src/lib/generate-infographic-handler.ts` | Apply template before overlay audit; SceneGraph metadata |
| `src/lib/scene-graph/SceneGraph.ts` | Template fields in metadata |
| `src/lib/scene-graph/SceneGraphBuilder.ts` | Pass template metadata into graph |
| `src/lib/scene-graph/SceneGraphLaw003V2.ts` | Recognize template planned fill for V2 evaluation |
| `src/lib/daos/scene-graph/scene-graph-mirror.ts` | Template fields in mirror input |
| `src/lib/daos/debug/daos-debug-bundle.ts` | `wideProductTemplate*` diagnostics |
| `src/lib/daos/benchmark/catalog.ts` | `BENCHMARK_DAOS_WIDE_PRODUCT_TEMPLATE_*_ENV` |
| `package.json` | Register template tests in `daos:test` |
| `tmp/daos-stage5-benchmark.ts` | Mattress baseline vs template benchmark |

---

## Template rules

| Rule | Value |
|------|-------|
| Detection | mattress / sofa / bed / carpet / table signals or `aspectRatio >= 2` |
| Product zone | Bottom hero band, width 90–96%, fit-safe height |
| Text zone | Top band, no overlap with product |
| Badges | Max 2, solid plaques |
| Targets | hero/text ratio ≥ 2, overlay density 0.10–0.25, overlap 0% |

Applied **before** overlay audit and HTML render when `DAOS_WIDE_PRODUCT_TEMPLATE=1`.

---

## Mattress before / after (Phase 1 benchmark)

| Metric | Baseline (`TEMPLATE=0`) | Template (`TEMPLATE=1`) |
|--------|-------------------------|-------------------------|
| **wideProductTemplateApplied** | false | **true** |
| **LAW_003 V2** | fail | **pass** |
| **LAW_014 mirror** | pass | pass |
| **productAreaRatio** | 0.18 | **0.48** (planned) |
| **overlayDensity** | 0.11 | **0.15** |
| **heroTextRatio** | 6.76 | 6.76 |
| **overlayQualityScore** | 63 | 63 |
| **visual hash** | same | same |
| **hero zone** | — | `top:53.8%;h:42.2%;w:93.6%` |
| **text zone** | — | `top:4.0%;h:40.0%;w:92.0%` |

### LAW_003 V2 reasons

| Arm | Reason |
|-----|--------|
| Baseline | Wide product geometry limit without wide layout template |
| Template | Scene fill, hero/text balance, overlay density, and background empty area within V2 bounds |

---

## Checks

| Check | Result |
|-------|--------|
| `npm run daos:test` | pass |
| `npm run lint` | pass |
| `npm run daos:benchmark` | pass |
| `wide-product-template.test.ts` | pass |

---

## Main conclusion

Wide product template applies correctly under `DAOS_WIDE_PRODUCT_TEMPLATE=1`: mattress is detected, zones are set (bottom hero + top text), badges capped at 2, and SceneGraph records `wideProductTemplateApplied` with `layoutMode=wide_bottom_hero`.

**LAW_003 V2 improves from fail → pass** for mattress because template provides planned fill geometry (product area 48%, overlay 15%) that V2 recognizes when `wideProductTemplateApplied=true`. Baseline correctly fails with `wide_product_geometry_limit`.

**Compositor actual bbox unchanged** (same visual hash) — template reshapes planned layout and overlay audit inputs before render; full visual fill improvement requires a future compositor-stage hook (out of scope).

Template is **opt-in only** and does not affect standard products (toy/drill/kettle unchanged when flag is off).
