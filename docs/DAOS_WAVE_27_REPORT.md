# DAOS Wave 27 — LAW_003 Whitespace Recalibration Report

## Goal

Recalibrate LAW_003 whitespace using **factual composite `productPlacement`**, not only planned HTML/layout `whitespacePct`. Constitution unchanged; DAOS diagnostics + soft overlay audit use recalibrated values.

---

## Where LAW_003 is calculated

| Location | What it measures |
|----------|------------------|
| `src/lib/design/design-constitution/laws/index.ts` — `LAW_003` | `ctx.layout.metrics.whitespacePct` or `layoutSpec.whitespaceTarget` (20–35% band) |
| `src/lib/design/build.ts` — `estimateMetrics()` | `whitespacePct = 100 - (product + text + plaque - overlap)` from **planned layout zones** (percent boxes) |
| `src/lib/daos/audit/overlay-quality-audit.ts` | Reads constitution `LAW_003` violation from `governanceReport` / `rendered_critique` |
| Handler overlay patches | May lower layout `whitespacePct` in metrics, but `rendered_critique` still reports ~53–58% when product bbox in layout is small vs factual composite |

**Root issue:** Constitution whitespace uses planned layout product area (~12–15%), while Wave 26 compositor delivers factual product area ~33–43% on patched runs. LAW_003 still fails on stale planned whitespace.

---

## Implemented

### LAW_003 recalibration helper

`src/lib/daos/governance/law003-recalibration.ts`

| Export | Role |
|--------|------|
| `recalculateLaw003Whitespace(input)` | Product + overlay adjusted whitespace |
| `createLaw003RecalibrationReport(input)` | Full report with before/after, confidence, warnings |
| `extractConstitutionLaw003Whitespace(reports)` | Parse `Whitespace 56.2%` from constitution reason |

**Rules:**
- `recalibrated = original - (factualProduct - plannedBefore) * 100` (uses `productAreaBeforeRatio` from scale patch when available)
- `originalWhitespace = max(layout whitespace, constitution parsed whitespace)`
- Factual product `< 30%` or overlay density `> 0.25` → no false pass
- `STALE_WHITESPACE_METRIC` when factual product grew but constitution still reports high whitespace

### Integration (non-blocking)

- Handler: preliminary overlay audit → composite placement → product scale audit → recalibration → **final overlay audit** with `law003Recalibration`
- `overlay-quality-audit.ts`: uses `law003After` for `law003WhitespaceViolation` + score when recalibration provided
- `daos-debug-bundle`: `law003Recalibration` object + diagnostic fields
- Benchmark: exports `law003Before`, `law003After`, `law003StaleMetricDetected`

---

## Phase 1 benchmark — patch OFF vs ON

| Metric | Patch OFF | Patch ON | Wave 26 (ref) |
|--------|-----------|----------|---------------|
| law003Before (constitution) | 100% fail | 100% fail | 100% |
| **law003After (recalibrated)** | **100% fail** | **50% fail** | n/a (100% raw) |
| law003StaleMetricDetected | 0% | **75%** | n/a |
| avg compositeProductAreaRatio | 0.10 | **0.33** | 0.09 → 0.33 |
| avg productScaleScore | 3 | **58** | 0.5 → 61 |
| avg overlayQualityScore | 59 | 39 | — |
| LAW_014 violation rate | 75% | 100% | 100% |
| summaryScore Δ | 0 | 0 | 0 |

Per-product **law003After** (patch ON / daos arm):

| Product | compositeArea | law003Before | law003After | staleMetric |
|---------|---------------|--------------|-------------|-------------|
| Cordless Drill | ~0.43 | fail | **pass** | yes |
| Electric Kettle | ~0.39 | fail | **pass** | yes |
| Mattress | ~0.13 | fail | fail | no |
| Children's Toy | ~0.35 | fail | fail | yes |

Patch OFF keeps law003After fail (factual product ~9–11% < 30% threshold).

---

## Main finding

**LAW_003 recalibration works when factual composite product area is large enough.**

1. **Constitution LAW_003** still measures planned layout `whitespacePct` (~53–58%) — unchanged by design.
2. **DAOS recalibration** lowers effective whitespace when factual product area ≥30% and overlay density ≤0.25.
3. **Patch ON:** law003After violation rate **100% → 50%**; stale metric detected on 3/4 products (planned whitespace lagging factual composite).
4. **Patch OFF:** factual product too small (~10%) — recalibration correctly keeps LAW_003 fail (no false pass).
5. **Remaining fails** on patch ON: factual area borderline (~35%) or LAW_014 contrast still blocking overlay gate.
6. **summaryScore Δ 0** — soft diagnostics only, no blocking change.

**Recommendation:** Wave 28+ may wire recalibrated whitespace into rendered_critique context or product-scale-driven layout metrics update — constitution core left intact.

---

## Verification

```bash
cd marketplace-infographic
npm run daos:test      # pass (includes law003-recalibration.test.ts)
npm run daos:spec      # pass
npm run lint           # pass
npm run typecheck      # pre-existing tmp/* errors only
npm run daos:benchmark # Phase 1 pass
```

---

## Files

**Created**

- `src/lib/daos/governance/law003-recalibration.ts`
- `src/lib/daos/tests/law003-recalibration.test.ts`
- `docs/DAOS_WAVE_27_REPORT.md`

**Modified**

- `src/lib/daos/audit/overlay-quality-audit.ts`
- `src/lib/daos/debug/daos-debug-bundle.ts`
- `src/lib/generate-infographic-handler.ts`
- `src/lib/generation/diagnostic-report.ts`
- `src/lib/daos/benchmark/types.ts`, `metrics.ts`, `decision.ts`, `reporter.ts`
- `package.json`
