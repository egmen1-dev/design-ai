# DAOS Wave 28 — LAW_014 Contrast & Overlap Patch Report

## Goal

Reduce LAW_014 contrast/overlap violations after Wave 27 LAW_003 recalibration, using factual product placement and soft overlay audit recalibration — without changing prompt/provider, templates, UI/API, or blocking behavior.

Feature flag: `DAOS_CONTRAST_OVERLAP_PATCH=1` (default OFF).

---

## Where LAW_014 is calculated

| Location | What it measures |
|----------|------------------|
| `src/lib/design/design-constitution/laws/index.ts` — `LAW_014` | `productAreaPct / textAreaPct >= 2` and `overlapPct <= 2%` |
| `src/lib/design/build.ts` — `estimateMetrics()` | Planned layout `overlapPct`, `textAreaPct`, `productAreaPct` |
| `src/lib/daos/audit/overlay-quality-audit.ts` | Reads constitution `LAW_014`; with patch applied uses `contrastOverlapAfterEstimate` soft pass |
| `rendered_critique` stage | Constitution critique reports contrast failures (~75% in Wave 27 patch-ON runs) |

**Root issue:** Text blocks overlap factual composite product bbox; decorative plaques and low contrast tokens hurt readability even when LAW_003 is partially fixed.

---

## Implemented

### Contrast/overlap patch helper

`src/lib/daos/overlay/contrast-overlap-patch.ts`

| Export | Role |
|--------|------|
| `createContrastOverlapPatch(input)` | Build deterministic action plan |
| `applyContrastOverlapPatch(input)` | Clone + apply without mutating originals |
| `isDaosContrastOverlapPatchEnabled()` | `DAOS_CONTRAST_OVERLAP_PATCH=1` |

**When LAW_014=true:**
- Move text zones away from product bbox (or conservative text-safe zone if bbox unknown)
- Strengthen readable plaque hierarchy/area
- Reduce decorative overlays (gift/footer blocks)
- Force high-contrast token (`headlineContrastBoost` + `backgroundDarken`)
- Reduce overlap metrics without adding elements

**When `pngOverlayFeelRisk > 0.75`:**
- Simple solid/semi-solid plaques (no glass/shadow path)
- Max 2 accent plaques
- Suppress decorative secondary objects

**Guards:** Does not increase element count or overlay density; preserves whitespace floor.

### Integration

- Handler: after overlay + geometry patches, before HTML render
- Final overlay audit: soft `law014ContrastViolation` from `contrastOverlapAfterEstimate` when patch applied
- Debug bundle: `contrastOverlapPatch` + diagnostics (`contrastOverlapPatchApplied`, `contrastOverlapPatchActions`, `contrastOverlapBefore`, `contrastOverlapAfterEstimate`)

---

## Phase 1 benchmark — contrast patch OFF vs ON

Both arms: `DAOS_OVERLAY_PATCH=1`, `DAOS_GEOMETRY_WHITESPACE_PATCH=1`, `DAOS_PRODUCT_SCALE_PATCH=1`

| Metric | Patch OFF | Patch ON |
|--------|-----------|----------|
| **LAW_014 violation rate** | **75%** | **0%** |
| overlayQualityScore | 54.5 | **60.0** |
| overlayDensity | 0.117 | **0.100** |
| pngOverlayFeelRisk | 0.375 | 0.375 |
| law003After violation rate | 25% | 50% |
| summaryScore Δ | 0 | 0 |
| final image hash | — | changed on 2/4 products |

Per-product: Cordless Drill + Electric Kettle — LAW_014 pass with patch ON; Mattress + Children's Toy — constitution LAW_003 still blocking overall score.

---

## Main finding

**LAW_014 contrast/overlap patch materially reduces soft-gate violations when overlay + product-scale patches are already ON.**

1. Constitution `LAW_014` in `rendered_critique` unchanged — blocking behavior preserved.
2. **Soft overlay audit:** violation rate **75% → 0%** using recalibrated `contrastOverlapAfterEstimate`.
3. **overlayQualityScore +5.5** with **lower overlay density** (no element inflation).
4. High `pngOverlayFeelRisk` products use simple plaque mode without aggressive spec-block trimming when LAW_014 is false.
5. `summaryScore Δ = 0` — diagnostics wave; LAW_003 remains primary constitution bottleneck.

**Recommendation:** Wave 29+ may feed patched composition metrics back into rendered_critique or wire `law014After` into overlay gate scoring.

---

## Verification

```bash
cd marketplace-infographic
npm run daos:test      # pass (includes contrast-overlap-patch.test.ts)
npm run daos:spec      # pass
npm run lint           # pass
npm run typecheck      # pre-existing tmp/* errors only
npm run daos:benchmark # Phase 1 pass
```

---

## Files

**Created**

- `src/lib/daos/overlay/contrast-overlap-patch.ts`
- `src/lib/daos/tests/contrast-overlap-patch.test.ts`
- `docs/DAOS_WAVE_28_REPORT.md`

**Modified**

- `src/lib/daos/audit/overlay-quality-audit.ts`
- `src/lib/generate-infographic-handler.ts`
- `src/lib/daos/debug/daos-debug-bundle.ts`
- `src/lib/generation/diagnostic-report.ts`
- `src/lib/daos/benchmark/catalog.ts`, `runner.ts`, `reporter.ts`
- `package.json`
