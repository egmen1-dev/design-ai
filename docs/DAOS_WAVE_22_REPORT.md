# DAOS Wave 22 — Geometry Whitespace Patch Report

## Goal

Fix **LAW_003 whitespace violation** through layout/composition **geometry** adjustments before HTML render — without rewriting templates, changing prompt/provider, or API/UI.

Feature flag: `DAOS_GEOMETRY_WHITESPACE_PATCH=1` (default **OFF**).

---

## Implemented

### Geometry patch layer

`marketplace-infographic/src/lib/daos/overlay/geometry-whitespace-patch.ts`

| Export | Role |
|--------|------|
| `createGeometryWhitespacePatch(input)` | Deterministic plan from LAW_003 / whitespace signals |
| `applyGeometryWhitespacePatch(input)` | Clone and patch `layoutSpec`, `compositionLayout`, `infographicData` |
| `isDaosGeometryWhitespacePatchEnabled()` | `process.env.DAOS_GEOMETRY_WHITESPACE_PATCH === "1"` |

**Triggers:** `LAW_003=true` or whitespace > 0.35

| Action | Effect |
|--------|--------|
| `ENLARGE_HERO_TARGET` | Raise `heroScale`, product `areaPct` / `maxWidthPct` / `maxHeightPct`, layout geometry hero rect |
| `SHIFT_OVERLAY_SAFE_ZONES` | Move headline/bullets/panels into safe insets; increase `safeInsetPct` |
| `REDUCE_TEXT_COLUMN_WIDTH` | Narrow `leftPanel`, headline, bullets; reduce `textAreaPct` |
| `LIMIT_EMPTY_BACKGROUND` | Cap decorative objects; tighten `whitespacePct` estimate and plaque area |
| `ENLARGE_PRODUCT_TARGET` | When `productAreaRatio < 0.45` |
| `LAYOUT_GEOMETRY_DIAGNOSIS` | When `overlayDensity < 0.15` but whitespace still high — flags geometry root cause |

Uses `applyGeometryPatch()` from composition-director when `layoutSpec.geometry` is present.

### Integration

`generate-infographic-handler.ts` — **after** `applyOverlayLayoutPatch()`, **before** `renderInfographicHtml()`:

1. Pass patched render inputs + overlay audit signals
2. Apply geometry patch when flag is on
3. Feed patched `renderCompositionLayout` / `renderLayoutSpec` into HTML render

### Diagnostics & debug bundle

- `geometryWhitespacePatchEnabled`, `geometryWhitespacePatchApplied`
- `geometryWhitespaceBefore`, `geometryWhitespaceAfterEstimate`
- `geometryPatchActions`
- `geometryWhitespacePatch` object on debug bundle

### Benchmark

Phase 1 compares **overlay-only** (`DAOS_OVERLAY_PATCH=1`, `DAOS_GEOMETRY_WHITESPACE_PATCH=0`) vs **overlay+geometry** (both `=1`).

---

## Phase 1 benchmark (overlay-only → overlay+geometry)

Run: `npm run daos:benchmark` (not `benchmark:30`)

| Metric | Overlay only avg | + Geometry avg | Delta |
|--------|------------------|----------------|-------|
| summaryScore | 75.5 | 75.5 | **0** |
| overlayQualityScore | **22.5** | **16.8** | **−5.7** |
| productAreaRatio | **0.44** | **0.44** | ~0 |
| overlayDensity | 0.13 | 0.12 | −0.01 |
| pngOverlayFeelRisk | 1.00 | 1.00 | 0 |
| LAW_003 violation rate | **100%** | **100%** | 0 |
| LAW_014 violation rate | **75%** | **100%** | **+25pp** |

Per-product (4/5 successful):

| Product | overlayQuality Δ | productAreaRatio | LAW_003 | final image hash |
|---------|------------------|------------------|---------|------------------|
| Cordless Drill | 0 | 0.45 → 0.46 | true → true | changed |
| Electric Kettle | 0 | 0.47 → 0.47 | true → true | changed |
| Mattress | **42 → 19 (−23)** | 0.40 → 0.38 | true → true | changed |
| Children's Toy | 0 | 0.46 → 0.43 | true → true | changed |

Geometry patch **applied** on patched runs (debug bundles show `geometryWhitespacePatchApplied=true` with actions `ENLARGE_HERO_TARGET`, `SHIFT_OVERLAY_SAFE_ZONES`, etc.). Final image hashes changed on all successful geometry-patched runs.

---

## Main finding

**Pre-render geometry patching applies correctly but does not clear LAW_003 in post-render constitution audit.**

1. **LAW_003 stays at 100%** — constitution measures rendered whitespace (53–58%), which is dominated by background/compositor canvas fill, not just `compositionLayout` zone metrics adjusted pre-render.
2. **productAreaRatio flat** (~0.44) — hero enlargement in layout spec does not propagate fully to final composite product dominance metrics.
3. **LAW_014 regressed** (75% → 100%) — safe-zone shifts and hero scale on mattress increased text/product overlap in rendered critique.
4. **overlayQuality −5.7** — mattress regression drives aggregate down; other products flat.
5. **summaryScore Δ 0** — no headline/modules regression; patch is safe but not yet effective for governance clearance.

**Recommendation:** Keep behind `DAOS_GEOMETRY_WHITESPACE_PATCH=1` for experimentation. Next work should target **compositor product scale / scene fill** and **constitution patch application at composite time**, not only HTML `compositionLayout` zones.

---

## Verification

```bash
cd marketplace-infographic
npm run daos:test      # pass (includes geometry-whitespace-patch.test.ts)
npm run daos:spec      # pass
npm run lint           # pass
npm run typecheck      # pre-existing tmp/* errors only
npm run daos:benchmark # Phase 1 pass — overlay-only vs overlay+geometry
```

---

## Files

**Created**

- `src/lib/daos/overlay/geometry-whitespace-patch.ts`
- `src/lib/daos/tests/geometry-whitespace-patch.test.ts`
- `docs/DAOS_WAVE_22_REPORT.md`

**Modified**

- `src/lib/generate-infographic-handler.ts` — geometry patch hook after overlay patch
- `src/lib/daos/debug/daos-debug-bundle.ts` — `geometryWhitespacePatch` + diagnostics
- `src/lib/generation/diagnostic-report.ts` — geometry patch diagnostic fields
- `src/lib/daos/benchmark/catalog.ts` — overlay-only vs geometry-patched env profiles
- `src/lib/daos/benchmark/runner.ts` — arm labels
- `package.json` — test script entry
- `benchmark/results.json`, `benchmark/report.md`, `benchmark/results.csv`, `benchmark/dashboard.md` — Wave 22 benchmark outputs
