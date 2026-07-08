# DAOS Wave 26 — Composite Extract Area Guard Report

## Goal

Guard `sharp.extract()` calls so compositor no longer throws `extract_area: bad extract area`, reliably returns `productPlacement`, and DAOS audits can measure factual product size.

---

## Root cause

`renderFloorContactShadow()` in `floor-contact.ts` computed foot slice as:

```typescript
footTop = bounds.top + round(bounds.height * 0.62)
footHeight = max(10, bounds.bottom - footTop + 4)
extract({ left: bounds.left, top: footTop, width: bounds.width, height: footHeight })
```

When alpha bbox sits low in the cutout, **`footTop + footHeight` exceeds image height** (e.g. bottom=99, footTop=66, footHeight=37 → 103 > 100). Sharp rejects the extract and `compositeProductIntoScene()` aborts before returning `productPlacement`.

Same overflow pattern existed in `renderFloorReflection()` and `renderAlphaContactShadow()` (`shadow-generator.ts`).

---

## Implemented

### Safe extract util

`marketplace-infographic/src/lib/daos/compositor/safe-extract-area.ts`

| Export | Role |
|--------|------|
| `validateExtractArea(area, imageSize)` | Non-throwing validation warnings |
| `clampExtractArea(area, imageSize)` | Clamp into canvas (min 1×1 px) |
| `createSafeExtractArea(area, imageSize)` | Clamp + warnings + outside-canvas centered fallback |
| `mergeExtractGuard(guard, result)` | Accumulate warnings in compositor run |

### Compositor integration

- `floor-contact.ts` — both foot shadow + reflection extracts
- `shadow-generator.ts` — alpha contact shadow extract
- `scene-compositor.ts` — `softenBackgroundCenter` extract + `ExtractAreaGuard` accumulator

### SceneCompositeResult extension

```typescript
extractAreaWarnings?: string[];
extractAreaCorrected?: boolean;
```

### DAOS diagnostics

- `extractAreaCorrected`
- `extractAreaWarnings`
- `compositePlacementFound` (existing, now populated)

---

## Phase 1 benchmark — before vs after

| Metric | Wave 25 (before guard) | Wave 26 patch OFF | Wave 26 patch ON |
|--------|------------------------|-------------------|------------------|
| `extract_area` failures | **multiple** | **0** | **0** |
| compositePlacementFound rate | **0%** | **100%** (4/4) | **100%** (4/4) |
| extractAreaCorrected rate | n/a | **100%** | **100%** |
| avg compositeProductAreaRatio | n/a | **0.09** | **0.33** |
| avg productScaleScore | 0.0 | **0.5** | **60.8** |
| avg productDominanceScore | 1.0 | **41** | **82** |
| LAW_003 violation rate | 100% | 100% | 100% |
| summaryScore Δ | 0 | 0 | 0 |

Per-product `compositeProductAreaRatio` (patch OFF → ON):

| Product | OFF | ON | Δ |
|---------|-----|-----|---|
| Cordless Drill | 0.12 | 0.43 | +0.31 |
| Electric Kettle | 0.11 | 0.39 | +0.28 |
| Mattress | 0.04 | 0.13 | +0.09 |
| Children's Toy | 0.11 | 0.38 | +0.27 |

All successful runs show `extractAreaCorrected=true` (bbox was clamped) but compositor completes and `compositePlacementFound=true`.

---

## Main finding

**Extract guard fixes compositor stability; factual placement now flows into DAOS audits.**

1. **Zero `extract_area` failures** in Phase 1 benchmark after guard (was blocking all composites in Wave 25).
2. **compositePlacementFound 0% → 100%** — Wave 25 bridge can now read real `productPlacement`.
3. **compositeProductAreaRatio measurable** — patch OFF ~9% factual area vs patch ON ~33%; scale patch effect visible on real placement.
4. **productScaleScore 0 → 61** (patch ON) — audit uses factual compositor bbox, not layout percent bounds.
5. **LAW_003 still 100%** — constitution whitespace is HTML/governance layer; compositor scale does not move LAW_003 yet.
6. **summaryScore Δ 0** — no regression; composer quality improved (72 → 88 avg) from successful composite path.

---

## Verification

```bash
cd marketplace-infographic
npm run daos:test      # pass (includes safe-extract-area.test.ts)
npm run daos:spec      # pass
npm run lint           # pass
npm run typecheck      # pre-existing tmp/* errors only
npm run daos:benchmark # Phase 1 pass, 0 extract_area failures
```

---

## Files

**Created**

- `src/lib/daos/compositor/safe-extract-area.ts`
- `src/lib/daos/tests/safe-extract-area.test.ts`
- `docs/DAOS_WAVE_26_REPORT.md`

**Modified**

- `src/lib/compositing/floor-contact.ts`
- `src/lib/compositing/shadow-generator.ts`
- `src/lib/compositing/scene-compositor.ts`
- `src/lib/daos/debug/daos-debug-bundle.ts`
- `src/lib/generate-infographic-handler.ts`
- `src/lib/generation/diagnostic-report.ts`
- `src/lib/daos/benchmark/types.ts`, `metrics.ts`, `decision.ts`, `reporter.ts`
- `package.json`
