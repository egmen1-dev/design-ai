# DAOS Wave 20 — Overlay Quality Audit & Guardrails Report

## Goal

Identify and record causes of `png_overlay_feel`, poor whitespace/contrast, and unprofessional final card appearance. Wave 20 adds **deterministic overlay audit** and **soft guardrails** only — no template, renderer, prompt, or API changes.

---

## Implemented

### Overlay audit

`marketplace-infographic/src/lib/daos/audit/overlay-quality-audit.ts`

| Export | Role |
|--------|------|
| `analyzeOverlayQuality(input)` | Full overlay/HTML quality audit with score |
| `summarizeOverlayQualityAudit(audit)` | Compact summary for diagnostics/benchmark |

**Inputs:** `canvas`, `overlayElements`, `layoutSpec`, `htmlTemplateData`, `diagnosticReport`, `governanceReport` (constitution), `composerQualityAudit`, `compositionMetrics`.

**Outputs:** `overlayElementCount`, `estimatedOverlayDensity`, risk fields, `law003WhitespaceViolation`, `law014ContrastViolation`, `pngOverlayFeelRisk`, `warnings`, `recommendations`, `score`.

### Deterministic rules

| Rule | Effect |
|------|--------|
| `overlayElementCount > 6` | `OVERLAY_ELEMENT_COUNT_HIGH` |
| `estimatedOverlayDensity > 0.45` | `OVERLAY_DENSITY_HIGH` |
| Governance `LAW_003` failed | `law003WhitespaceViolation=true` |
| Governance `LAW_014` failed | `law014ContrastViolation=true` |
| Missing `layoutSpec.hierarchy` | `OVERLAY_HIERARCHY_UNKNOWN` |
| `composer.finalCompositionRisk > 0.4` | Raises `pngOverlayFeelRisk` |
| `finalQuality.issues` includes `png_overlay_feel` | Raises `pngOverlayFeelRisk` |
| Score starts at 100 | Penalties for density, laws, risks, warnings |

Density prefers `compositionMetrics` (text/plaque/overlap %) over raw zone sums.

### Soft overlay gate

`marketplace-infographic/src/lib/daos/gates/overlay-gate.ts`

`evaluateDaosOverlayGate(audit)` → `passed` | `warning` | `failed`, **`blocking: false` always**.

**Failed when:**
- `score < 60`
- `law003WhitespaceViolation && law014ContrastViolation`
- `pngOverlayFeelRisk > 0.75`

### Debug bundle

- `overlayQualityAudit` on bundle
- Diagnostics: `overlayQualityScore`, `overlayDensity`, `overlayWarnings`, `pngOverlayFeelRisk`, `law003WhitespaceViolation`, `law014ContrastViolation`

### Benchmark metrics

`overlayQualityScore`, `overlayDensity`, `pngOverlayFeelRisk`, `law003WhitespaceViolation`, `law014ContrastViolation` in results/CSV/report aggregates.

---

## Phase 1 benchmark (with overlay metrics)

Run: `npm run daos:benchmark` (not `benchmark:30`)

| Metric | Baseline avg | DAOS avg | Notes |
|--------|--------------|----------|-------|
| summaryScore delta | — | — | **−3.75** |
| overlayQualityScore | **0.0** | **4.8** | Both arms critically low |
| overlayDensity | **1.00** | **1.00** | Fixed post-run: plaques were counted as 0–100 not 0–1 |
| pngOverlayFeelRisk | **1.00** | **1.00** | Max risk on all successful products |
| LAW_003 violation rate | **100%** | **100%** | Whitespace >35% on every product |
| LAW_014 violation rate | **100%** | **75%** | Contrast/overlap on most products |
| composerQualityScore | 75.0 | 75.0 | Unchanged (Wave 19 finding) |

Per-product pattern (4/5 successful): `overlayQualityScore=0`, `law003=true`, `pngOverlayFeelRisk=1.0`, `final-quality` logs `png_overlay_feel`, `not_professional`, `product_not_dominant`.

---

## Main finding

**The overlay/governance layer is the confirmed bottleneck — not DAOS prompt bridges.**

1. **LAW_003 (whitespace)** fails on 100% of Phase 1 runs — whitespace 53–58% vs 35% max. This is layout/HTML overlay geometry, independent of provider prompt.
2. **LAW_014 (contrast)** fails on 75–100% of DAOS runs — text/product overlap ~5%.
3. **`pngOverlayFeelRisk = 1.0`** on all successful products — correlates with `finalQuality.issues: png_overlay_feel` and flat composer metrics (Wave 19).
4. **DAOS does not improve overlay score** — baseline and DAOS overlay audits are equally poor; prompt compression (Wave 18) cannot fix HTML-layer problems.
5. **Overlay gate would be `failed`** on all successful products (score 0, dual law risk, png risk 1.0) but **`blocking=false`** — generation continues as required.

**Recommendation:** Next wave should target **whitespace reduction in layout spec patches** and **contrast/overlap refinement** (constitution patch application), not more DAOS context in provider prompts.

---

## Verification

```bash
cd marketplace-infographic
npm run daos:test      # pass
npm run daos:spec      # pass
npm run lint           # pass
npm run typecheck      # pre-existing tmp/* errors only
npm run daos:benchmark # Phase 1 pass with overlay metrics
```

---

## Files

**Created**

- `src/lib/daos/audit/overlay-quality-audit.ts`
- `src/lib/daos/gates/overlay-gate.ts`
- `src/lib/daos/tests/overlay-quality-audit.test.ts`
- `src/lib/daos/tests/overlay-gate.test.ts`
- `docs/DAOS_WAVE_20_REPORT.md`

**Modified**

- `src/lib/daos/debug/daos-debug-bundle.ts`
- `src/lib/daos/gates/index.ts`
- `src/lib/generate-infographic-handler.ts`
- `src/lib/generation/diagnostic-report.ts`
- `src/lib/daos/benchmark/types.ts`
- `src/lib/daos/benchmark/metrics.ts`
- `src/lib/daos/benchmark/decision.ts`
- `src/lib/daos/benchmark/reporter.ts`
- `src/lib/daos/audit/composer-quality-audit.ts` (plaques/bullets area fix)
- `package.json`
