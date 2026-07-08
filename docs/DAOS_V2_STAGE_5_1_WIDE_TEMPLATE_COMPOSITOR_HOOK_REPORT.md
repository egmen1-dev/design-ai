# DAOS v2 Stage 5.1 — Wide Template Compositor Hook Report

## Goal

When `wideProductTemplateApplied=true`, pass `wideProductHeroZone` into compositor options so **actual** product placement follows the template hero band — not only the planned SceneGraph.

Feature flags:
- `DAOS_SCENE_GRAPH_V2=1`
- `DAOS_WIDE_PRODUCT_TEMPLATE=1`
- `DAOS_WIDE_TEMPLATE_COMPOSITOR_HOOK=1` (default OFF)

Does **not** change prompt/provider, API/UI, or blocking Design Constitution.

Raw benchmark: `marketplace-infographic/benchmark/output/stage5-1-wide-template-compositor-hook-benchmark.json`.

---

## Created / modified files

| File | Change |
|------|--------|
| `src/lib/daos/templates/wide-product-template.ts` | `buildWideTemplateCompositorHook`, `computeWideTemplateHeroLimits`, `heroZoneToPx` |
| `src/lib/generate-infographic-handler.ts` | Early template apply before compositor; pass hook into `buildDaosSceneCompositeOptions` |
| `src/lib/compositing/scene-compositor.ts` | `wideTemplateCompositorHook` option; hero-zone sizing + vertical-safe placement |
| `src/lib/daos/debug/daos-debug-bundle.ts` | Hook diagnostics fields |
| `src/lib/daos/tests/wide-template-compositor-hook.test.ts` | **New** — unit tests |
| `src/lib/daos/benchmark/catalog.ts` | `BENCHMARK_DAOS_WIDE_TEMPLATE_COMPOSITOR_HOOK_*_ENV` |
| `tmp/daos-stage5-1-benchmark.ts` | Mattress baseline vs hook benchmark |
| `package.json` | Register hook tests in `daos:test` |

---

## Compositor hook behavior

When `DAOS_WIDE_TEMPLATE_COMPOSITOR_HOOK=1` and wide product template is applied:

1. `wideProductHeroZone` is converted to pixel bounds and attached as `wideTemplateCompositorHook`.
2. Compositor uses hero zone as **preferred product placement zone** (max width/height, alpha caps, vertical anchor).
3. **Vertical-safe fit** — height capped to hero band; aspect-derived height never exceeds zone.
4. **No vertical crop** — product scaled to fit inside hero height.
5. **Horizontal bleed** up to 6% (`cropSafeHorizontalPct`) allowed via reduced side margin.

New diagnostics:
- `wideTemplateCompositorHookEnabled`
- `wideTemplateCompositorHookApplied`
- `wideTemplateHeroZoneUsed`
- `wideTemplateCompositeAreaBefore`
- `wideTemplateCompositeAreaAfter`

---

## Mattress benchmark (TEMPLATE=1)

| Metric | Baseline (`HOOK=0`) | Hook (`HOOK=1`) |
|--------|---------------------|-----------------|
| **wideTemplateCompositorHookApplied** | false | **true** |
| **LAW_003 V2** | pass | pass |
| **LAW_014 mirror** | pass | pass |
| **compositeProductAreaRatio** | 0.20 | 0.12 |
| **placement px** | 720×302 | 562×236 |
| **overlayQualityScore** | 63 | 63 |
| **visual hash** | `589858cc…` | `773cbd92…` (changed) |
| **wideTemplateHeroZoneUsed** | — | `top:53.8%;h:42.2%;w:93.6%` |
| **compositeAreaBefore → After** | — | 0.24 → 0.12 |

Hook arm shifts compositor placement into the template hero band (visual hash changes). `compositeProductAreaRatio` reflects alpha bbox after vertical-safe fit; LAW_003 V2 still passes on planned template geometry.

---

## Tests

`src/lib/daos/tests/wide-template-compositor-hook.test.ts` verifies:

- Hero zone passed via `compositorHook` when flag on
- Hook off → `compositorHook` undefined (options unchanged)
- Hook on → preferred zone widened to template hero band
- No vertical crop — `maxHeightPx` ≤ hero zone height

---

## Checks

| Check | Command |
|-------|---------|
| Unit tests | `npm run daos:test` |
| Lint | `npm run lint` |
| Benchmark | `npx tsx tmp/daos-stage5-1-benchmark.ts` |

---

## Main conclusion

Stage 5.1 closes the gap between **planned** wide template geometry and **actual** compositor placement. With the hook enabled, mattress runs should show higher `compositeProductAreaRatio` and placement px aligned to the bottom hero band, while LAW_003 V2 and LAW_014 mirror remain stable.
