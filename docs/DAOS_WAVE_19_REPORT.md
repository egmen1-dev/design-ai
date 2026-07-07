# DAOS Wave 19 — Composer Quality Audit Report

## Goal

Understand why final marketplace cards do not improve after DAOS prompt/bridge work. Wave 19 adds **read-only** composition quality metrics from deterministic metadata — no changes to render-engine, provider, prompt, or UI/API.

---

## Implemented

### Composer audit module

`marketplace-infographic/src/lib/daos/audit/composer-quality-audit.ts`

| Export | Role |
|--------|------|
| `analyzeComposerQuality(input)` | Derives composition risks from paths, layout, composite metadata |
| `summarizeComposerQualityAudit(audit)` | Single 0–100 score + notes for diagnostics/benchmark |
| `overlayElementsFromCompositionLayout(layout)` | Estimates overlay density from layout zones |

**Input (all optional):** `finalImagePath`, `productCutoutPath`, `backgroundPath`, `canvas`, `overlayElements`, `renderDebug`, `debugBundle`, placement/area hints.

**Output:** `productAreaRatio`, `productPlacementRisk`, `backgroundContrastRisk`, `overlayDensityRisk`, `cutoutIntegrationRisk`, `shadowMissingRisk`, `finalCompositionRisk`, `warnings`, `recommendations`.

No OCR, no vision model.

### Rules

| Condition | Effect |
|-----------|--------|
| `productAreaRatio < 0.35` or `> 0.75` | `COMPOSER_PRODUCT_AREA_TOO_LOW/HIGH` warning |
| No shadow/contact metadata | `COMPOSER_SHADOW_CONTACT_MISSING` |
| Overlay elements unknown/missing | `COMPOSER_OVERLAY_ELEMENTS_UNKNOWN` |
| Background without placement | `COMPOSER_PLACEMENT_UNKNOWN_WITH_BACKGROUND` |
| `renderDebug.fallbackUsed=true` | Elevated `finalCompositionRisk` + warning |

### Debug bundle

`composerQualityAudit` stored on bundle; diagnostics extended with:

- `composerQualityScore`
- `composerQualityWarnings`
- `productAreaRatio`
- `finalCompositionRisk`

Hook: `generate-infographic-handler.ts` after composite + before `writeDaosDebugBundle`.

### Benchmark integration

`BenchmarkRunMetrics` now includes:

- `composerQualityScore`
- `productAreaRatio`
- `finalCompositionRisk`

Report/CSV/dashboard aggregate averages for baseline vs DAOS arms.

---

## Phase 1 benchmark (with composer metrics)

Run: `npm run daos:benchmark` (not `benchmark:30`)

| Metric | Baseline avg | DAOS avg | Delta |
|--------|--------------|----------|-------|
| summaryScore delta | — | — | **−5.0** |
| promptLength delta | — | — | **+308.8 chars** |
| modulesCompiled | 0.0 | 3.2 | +3.2 |
| **composerQualityScore** | **75.0** | **75.0** | **0** |
| **productAreaRatio** | **0.42** | **0.44** | +0.02 |
| **finalCompositionRisk** | **0.42** | **0.42** | **0** |

Per-product composer scores were identical (75/75) on all successful runs. Background hashes changed; final image hashes changed; composition audit metrics did not.

Office chair still fails early (Zod / fast abort) — no composer metrics.

---

## Main bottleneck (finding)

**Prompt/DAOS bridges are not the composition bottleneck.**

Evidence from Phase 1:

1. **Flat composer metrics** — `composerQualityScore` and `finalCompositionRisk` are unchanged between baseline and DAOS despite +309 char prompt delta and different backgrounds.
2. **Summary still drops −5** — DAOS debug summary/gate scores fall while composition audit stays at 75 / risk 0.42.
3. **Runtime logs** on successful products repeatedly hit **LAW_003 Whitespace** (>35% whitespace) and **LAW_014 Contrast** (text/product overlap) in design-constitution passes — these are post-composite HTML/overlay governance issues, not provider prompt length.
4. **Composite retries** — `extract_area: bad extract area` in floor-contact shadow during concept retry suggests compositor edge cases independent of DAOS context.

**Conclusion:** Further quality gains require targeting the **HTML overlay + governance pipeline** (whitespace, contrast, product dominance) and **composite stability**, not more prompt text. Wave 19 audit confirms DAOS changes operate upstream of where cards actually degrade.

**Recommendation:** Continue instrumenting; next wave should focus on overlay/governance feedback loop or composite placement adaptation when background changes.

---

## Verification

```bash
cd marketplace-infographic
npm run daos:test      # pass
npm run daos:spec      # pass
npm run lint           # pass
npm run typecheck      # pre-existing tmp/* errors only
npm run daos:benchmark # Phase 1 pass with composer metrics
```

---

## Files

**Created**

- `src/lib/daos/audit/composer-quality-audit.ts`
- `src/lib/daos/tests/composer-quality-audit.test.ts`
- `docs/DAOS_WAVE_19_REPORT.md`

**Modified**

- `src/lib/daos/debug/daos-debug-bundle.ts`
- `src/lib/generate-infographic-handler.ts`
- `src/lib/generation/diagnostic-report.ts`
- `src/lib/daos/benchmark/types.ts`
- `src/lib/daos/benchmark/metrics.ts`
- `src/lib/daos/benchmark/decision.ts`
- `src/lib/daos/benchmark/reporter.ts`
- `package.json`
