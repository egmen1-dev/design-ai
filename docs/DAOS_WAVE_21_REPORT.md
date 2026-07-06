# DAOS Wave 21 — Overlay Layout Patch Layer Report

## Goal

Automatically fix **LAW_003 whitespace** and **LAW_014 contrast/overlap** (plus `png_overlay_feel`) **before HTML render**, without rewriting templates, changing UI/API, prompt/provider, or blocking generation.

Feature flag: `DAOS_OVERLAY_PATCH=1` (default **OFF**).

---

## Implemented

### Patch layer

`marketplace-infographic/src/lib/daos/overlay/overlay-layout-patch.ts`

| Export | Role |
|--------|------|
| `createOverlayLayoutPatch(input)` | Deterministic patch plan from overlay audit signals |
| `applyOverlayLayoutPatch(input)` | Clone inputs, apply plan, return patched layout/data |
| `isDaosOverlayPatchEnabled()` | `process.env.DAOS_OVERLAY_PATCH === "1"` |

**Triggers**

| Signal | Threshold | Actions |
|--------|-----------|---------|
| LAW_003 or `overlayDensity` | > 0.35 | Max 2 visible badges, max 5 elements, hide decorative blocks, shorten secondary text |
| LAW_014 or `contrastRisk` | > 0.5 | Boost readable plaque, increase text contrast token, spread safe zones |
| `pngOverlayFeelRisk` | > 0.75 | Minimal overlay mode, reduce plaque count, suppress parametric badge/glass, remove extra shadows |

Inputs are **cloned** — originals are never mutated.

### Integration point

`generate-infographic-handler.ts` — **before** `renderInfographicHtml()` when `sdData.layout === "marketplace"`:

1. Run `analyzeOverlayQuality()` on pre-render overlay inputs
2. Call `applyOverlayLayoutPatch()` when flag is on
3. Pass patched `renderInfographicData`, `renderLayoutSpec`, `renderCompositionLayout`, `renderParametricBadgeHtml` into HTML render

### Diagnostics & debug bundle

Added to `diagnostic-report.ts` and `daos-debug-bundle.ts`:

- `overlayPatchEnabled`, `overlayPatchApplied`, `overlayPatchActions`
- `overlayPatchBeforeDensity`, `overlayPatchAfterDensity`
- `overlayPatchElementsBefore`, `overlayPatchElementsAfter`
- `overlayLayoutPatch` object on debug bundle

### Benchmark

Phase 1 compares **DAOS no-patch** (`DAOS_OVERLAY_PATCH=0`) vs **DAOS patched** (`DAOS_OVERLAY_PATCH=1`) on the full compressed DAOS stack. Plain baseline arm still runs but pair delta is no-patch → patched.

---

## Phase 1 benchmark (no-patch vs patched)

Run: `npm run daos:benchmark` (not `benchmark:30`)

| Metric | No patch avg | Patched avg | Delta |
|--------|--------------|-------------|-------|
| summaryScore | 75.5 | 75.5 | **0.0** |
| overlayQualityScore | **17.3** | **29.8** | **+12.5** |
| overlayDensity | 0.09 | 0.12 | +0.03 |
| pngOverlayFeelRisk | 1.00 | 1.00 | 0 |
| LAW_003 violation rate | 100% | 100% | 0 |
| LAW_014 violation rate | **75%** | **50%** | **−25pp** |
| composerQualityScore | 75.0 | 75.0 | 0 |

Per-product highlights (4/5 successful):

| Product | overlayQuality Δ | LAW_014 no-patch → patched | summary Δ |
|---------|-------------------|---------------------------|-----------|
| Cordless Drill | 10 → 16 (+6) | true → true | 0 |
| Electric Kettle | 39 → 42 (+3) | false → false | 0 |
| Mattress | 10 → 42 (+32) | true → **false** | 0 |
| Children's Toy | 10 → 19 (+9) | true → true | 0 |

Patch applied on patched runs with typical actions: `REDUCE_OVERLAY_DENSITY`, `HIDE_DECORATIVE_ELEMENTS`, `SHORTEN_SECONDARY_TEXT`, `BOOST_READABLE_PLAQUE`, `INCREASE_TEXT_CONTRAST`, `SPREAD_SAFE_ZONES`, `MINIMAL_OVERLAY_MODE`, `REMOVE_EXTRA_SHADOWS`, `CAP_OVERLAY_ELEMENTS`.

Final image hashes **changed** on all successful patched runs (layout patch affects HTML overlay before composite).

---

## Main finding

**The patch layer improves overlay audit scores and reduces LAW_014 violations without hurting summary score — but cannot clear LAW_003 or `pngOverlayFeelRisk` alone.**

1. **Overlay quality +12.5 pts** (17.3 → 29.8) — meaningful improvement from pre-render layout trimming and contrast boosts.
2. **LAW_014 halved** (75% → 50%) — mattress run flipped from violation to pass; contrast/spread actions work.
3. **LAW_003 unchanged at 100%** — constitution whitespace is driven by overall canvas whitespace (53–58%), not overlay element count; patch reduces overlay clutter but cannot reach 35% whitespace target.
4. **`pngOverlayFeelRisk` stays 1.0** — final-quality still flags `png_overlay_feel`; patch suppresses badges/glass but compositor/template rendering dominates the feel signal.
5. **Summary score flat (Δ 0)** — patch is safe: no regression on headline/modules/prompt path.

**Recommendation:** Keep patch behind `DAOS_OVERLAY_PATCH=1` for incremental overlay gains. Next work should target **constitution whitespace geometry** (product scale / safe-zone layout) and **post-composite contrast** — patch layer alone is insufficient for full LAW_003/png-feel clearance.

---

## Verification

```bash
cd marketplace-infographic
npm run daos:test      # pass (includes overlay-layout-patch.test.ts)
npm run daos:spec      # pass
npm run lint           # pass
npm run typecheck      # pre-existing tmp/* errors only
npm run daos:benchmark # Phase 1 pass — no-patch vs patched
```

---

## Files

**Created**

- `src/lib/daos/overlay/overlay-layout-patch.ts`
- `src/lib/daos/tests/overlay-layout-patch.test.ts`
- `docs/DAOS_WAVE_21_REPORT.md`

**Modified**

- `src/lib/generate-infographic-handler.ts` — patch hook before HTML render
- `src/lib/daos/debug/daos-debug-bundle.ts` — `overlayLayoutPatch` + diagnostics
- `src/lib/generation/diagnostic-report.ts` — overlay patch diagnostic fields
- `src/lib/daos/benchmark/catalog.ts` — `BENCHMARK_DAOS_NO_PATCH_ENV` / `BENCHMARK_DAOS_PATCHED_ENV`
- `src/lib/daos/benchmark/runner.ts` — three-arm Phase 1 (baseline + no-patch + patched)
- `src/lib/daos/benchmark/types.ts` — env profiles in results
- `package.json` — test script entry
- `benchmark/results.json`, `benchmark/report.md`, `benchmark/results.csv`, `benchmark/dashboard.md` — Wave 21 benchmark outputs
