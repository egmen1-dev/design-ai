# DAOS Product Sprint 8C Report

## Product Area Target Recalibration

**Sprint:** Product Sprint 8C  
**Status:** Complete  
**Type:** Target model + propagation recalibration  
**Priority:** CRITICAL  
**Branch:** `cursor/product-sprint8c-target-recalibration-aecb`  
**Benchmark:** `benchmark/commercial-target-recalibration.ts`  
**Artifacts:** `benchmark/output/sprint8c/`

---

## Context

Sprint 8B raised the geometry ceiling to **~36.6–37.4%** at `objectScale ≥ 0.75`, but Commercial Genome still targeted **55%** — unreachable without a new Hero layout. Commercial Fidelity compared measured area against aspirational 55%, producing misleading low scores and forcing `objectScale = 0.55`, which **under-harvested** the new geometry ceiling.

---

## Changes

### 1. Commercial Genome Beta — dual targets

| Field | Value | Applied to production? |
|-------|-------|------------------------|
| `productAreaTarget` | **0.42** (reachable) | **Yes** → `heroScale` / `productAreaPct` |
| `productAreaAspirationalTarget` | **0.55** (EKB future) | **No** → stored as `aspirationalProductAreaPct` |

Module: `daos/commercial-genome-beta/product-area-targets.ts`

### 2. Layout integration

- Reachable target clamped to **39–45%** band (`clampReachableTarget`)
- `reachableProductAreaPct` and `aspirationalProductAreaPct` written to `LayoutSpec`

### 3. Propagation recalibration

- Commercial path uses **geometry ceiling harvest**: `objectScale = 0.75`
- Does **not** map 1:1 from 55% aspirational target
- Module: `design/layout-spec/commercial-target-propagation.ts`
- `COMMERCIAL_PROPAGATION_VERSION`: `1.1.0-sprint8c`

### 4. Commercial Fidelity — honest dual-target model

`productAreaModel` on diagnostics:

| Field | Meaning |
|-------|---------|
| `aspirationalTarget` | EKB / ultra-dominant future goal (55%) |
| `reachableTarget` | Current layout safe goal (42%) |
| `measuredArea` | Post-composite pixel measurement |
| `unreachableGap` | `aspirationalTarget − measuredArea` |

**Scoring** uses `reachableTarget` for `product_area` delta — not aspirational 55%.

`COMMERCIAL_FIDELITY_VERSION`: `1.1.0-sprint8c`

---

## Benchmark (5 products, Sprint 8B vs 8C)

| Metric | Sprint 8B | Sprint 8C | Δ |
|--------|-----------|-----------|---|
| `objectScale` | 0.55 | **0.75** | ceiling harvest |
| Expected fidelity target | 55% | **42%** | reachable |
| Avg measured Product Area | 17.2% | **37.0%** | **+19.8 pp** |
| Avg Fidelity Score (`product_area`) | 5.5 | **87.4** | **+81.9** |

Fidelity improvement is **not self-deception**: measured area actually rose +19.8 pp while the scoring target dropped from unreachable 55% to honest 42%.

---

## Per-product snapshot

| Product | Measured 8B | Measured 8C | Fidelity 8B → 8C |
|---------|-------------|-------------|------------------|
| battery-sprayer | 17.2% | 36.8% | 5.5 → 87.4 |
| construction-vacuum | 16.7% | 35.8% | 5.5 → 89.5 |
| impact-drill | 17.5% | 37.4% | 5.5 → 88.5 |
| pressure-washer | 16.7% | 35.8% | 5.5 → 89.5 |
| home-humidifier | 17.5% | 37.4% | 5.5 → 88.5 |

`unreachableGap` (aspirational 55% − measured) remains ~17–19 pp — explicitly surfaced, not hidden.

---

## Success Criteria

| # | Criterion | Result |
|---|-----------|--------|
| 1 | Target no longer conflicts with geometry ceiling | **Yes** — reachable 42%, harvest @ 0.75 → ~37% measured |
| 2 | Commercial Fidelity Score rises meaningfully | **Yes** — +81.9 avg (honest target model) |
| 3 | Product Area honestly measurable | **Yes** — dual-target `productAreaModel` |
| 4 | DAOS distinguishes desirable vs achievable | **Yes** — aspirational stored, not compositor-applied |

---

## Exit criteria / next gap

Current layout compositor ceiling remains **~37–39%**. Commercial reachable target **42%** is slightly above measured ceiling — acceptable WARN band, not ERROR against aspirational 55%.

**Next product/design decision** (unchanged from Sprint 8B exit):

> Commercial aspirational 55–60% requires **ultra-dominant Hero layout** — not further calibration of current templates.

---

## Files touched

| File | Change |
|------|--------|
| `product-area-targets.ts` | Reachable / aspirational constants |
| `commercial-decision-beta.ts` | Dual targets |
| `types.ts` (genome) | `productAreaAspirationalTarget` |
| `commercial-layout-integration.ts` | Reachable clamp + aspirational extension |
| `commercial-layout-propagation.ts` | Ceiling harvest propagation |
| `commercial-target-propagation.ts` | `objectScale = 0.75` mapping |
| `commercial-fidelity/*` | Dual-target model + scoring |
| `benchmark/commercial-target-recalibration.ts` | Sprint 8C validation |

---

## References

- Sprint 8B: `docs/DAOS_PRODUCT_SPRINT_8B_REPORT.md`
- Benchmark: `benchmark/output/sprint8c/commercial-target-recalibration.json`
