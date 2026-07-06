# DAOS Benchmark Report — Phase 1

Created: 2026-07-06T19:06:25.812Z

Catalog: DAOS benchmark Phase 1 — five products with varied visual complexity

## Shared render settings

- Provider: pollinations
- Model: flux
- Render engine: v17

## Decision

**BenchmarkStatus:** STOP

**Recommendation:** Do NOT benchmark 30 products. Address bottlenecks before scaling.

**Bottlenecks:**

- average summary delta 0.0 < +3
- meaning-loss not improved (avg delta 0.0)
- modulesCompiled not improved (avg delta 0.0)

## Per-product results

### Cordless Drill (`cordless-drill`)

Seed: `daos-benchmark-phase1-20260706:cordless-drill` | Complexity: medium

| Metric | Baseline | DAOS | Delta |
|--------|----------|------|-------|
| summaryScore | 78 | 78 | 0 |
| finalGate | warning (78) | warning (78) | 0 |
| meaningLoss | 2 | 2 | 0 |
| modulesCompiled | 4 | 4 | 0 |
| modulesStillIgnored | 0 | 0 | 0 |
| promptLength | 895 | 895 | 0 |
| composerQualityScore | 93 | 93 | 0 |
| productAreaRatio | 0.43 | 0.39 | — |
| finalCompositionRisk | 0.16 | 0.16 | — |
| overlayQualityScore | 59 | 48 | -11 |
| overlayDensity | 0.11 | 0.12 | — |
| pngOverlayFeelRisk | 0.90 | 0.90 | — |
| law003WhitespaceViolation | false | false | — |
| law003Before | true | true | — |
| law003After | false | false | — |
| law003StaleMetricDetected | true | true | — |
| law014ContrastViolation | false | false | — |
| productScaleScore | 89 | 77 | -12 |
| productDominanceScore | 98 | 93 | — |
| emptySpaceEstimate | 0.29 | 0.29 | — |
| sceneFillRisk | 0.01 | 0.05 | — |
| compositeProductAreaRatio | 0.43 | 0.39 | -0.04 |
| provider latency | 598ms | 510ms | — |
| generation time | 5430ms | 5276ms | — |
| background hash | `09c7ea087037…` | `09c7ea087037…` | same |
| final image hash | `f1c126ae52f1…` | `b8ef489e44cf…` | changed |

### Electric Kettle (`electric-kettle`)

Seed: `daos-benchmark-phase1-20260706:electric-kettle` | Complexity: low

| Metric | Baseline | DAOS | Delta |
|--------|----------|------|-------|
| summaryScore | 78 | 78 | 0 |
| finalGate | warning (78) | warning (78) | 0 |
| meaningLoss | 2 | 2 | 0 |
| modulesCompiled | 4 | 4 | 0 |
| modulesStillIgnored | 0 | 0 | 0 |
| promptLength | 848 | 848 | 0 |
| composerQualityScore | 93 | 93 | 0 |
| productAreaRatio | 0.39 | 0.39 | — |
| finalCompositionRisk | 0.16 | 0.16 | — |
| overlayQualityScore | 67 | 67 | 0 |
| overlayDensity | 0.10 | 0.10 | — |
| pngOverlayFeelRisk | 0.20 | 0.20 | — |
| law003WhitespaceViolation | false | false | — |
| law003Before | true | true | — |
| law003After | false | false | — |
| law003StaleMetricDetected | true | true | — |
| law014ContrastViolation | false | false | — |
| productScaleScore | 77 | 77 | 0 |
| productDominanceScore | 93 | 93 | — |
| emptySpaceEstimate | 0.29 | 0.29 | — |
| sceneFillRisk | 0.05 | 0.05 | — |
| compositeProductAreaRatio | 0.39 | 0.39 | 0.00 |
| provider latency | 616ms | 491ms | — |
| generation time | 6257ms | 6081ms | — |
| background hash | `13da5f7cb088…` | `13da5f7cb088…` | same |
| final image hash | `009cde4effb8…` | `009cde4effb8…` | same |

### Office Chair (`office-chair`)

Seed: `daos-benchmark-phase1-20260706:office-chair` | Complexity: high

| Metric | Baseline | DAOS | Delta |
|--------|----------|------|-------|
| summaryScore | n/a | n/a | n/a |
| finalGate | n/a (n/a) | n/a (n/a) | n/a |
| meaningLoss | 0 | 0 | 0 |
| modulesCompiled | 0 | 0 | 0 |
| modulesStillIgnored | 0 | 0 | 0 |
| promptLength | n/a | n/a | n/a |
| composerQualityScore | n/a | n/a | n/a |
| productAreaRatio | n/a | n/a | — |
| finalCompositionRisk | n/a | n/a | — |
| overlayQualityScore | n/a | n/a | n/a |
| overlayDensity | n/a | n/a | — |
| pngOverlayFeelRisk | n/a | n/a | — |
| law003WhitespaceViolation | n/a | n/a | — |
| law003Before | n/a | n/a | — |
| law003After | n/a | n/a | — |
| law003StaleMetricDetected | n/a | n/a | — |
| law014ContrastViolation | n/a | n/a | — |
| productScaleScore | n/a | n/a | n/a |
| productDominanceScore | n/a | n/a | — |
| emptySpaceEstimate | n/a | n/a | — |
| sceneFillRisk | n/a | n/a | — |
| compositeProductAreaRatio | n/a | n/a | n/a |
| provider latency | n/ams | n/ams | — |
| generation time | 57ms | 55ms | — |
| background hash | `n/a…` | `n/a…` | same |
| final image hash | `n/a…` | `n/a…` | same |

### Mattress (`mattress`)

Seed: `daos-benchmark-phase1-20260706:mattress` | Complexity: medium

| Metric | Baseline | DAOS | Delta |
|--------|----------|------|-------|
| summaryScore | 73 | 73 | 0 |
| finalGate | warning (73) | warning (73) | 0 |
| meaningLoss | 3 | 3 | 0 |
| modulesCompiled | 4 | 4 | 0 |
| modulesStillIgnored | 0 | 0 | 0 |
| promptLength | 892 | 892 | 0 |
| composerQualityScore | 72 | 72 | 0 |
| productAreaRatio | 0.13 | 0.18 | — |
| finalCompositionRisk | 0.21 | 0.21 | — |
| overlayQualityScore | 52 | 52 | 0 |
| overlayDensity | 0.09 | 0.09 | — |
| pngOverlayFeelRisk | 0.20 | 0.20 | — |
| law003WhitespaceViolation | true | true | — |
| law003Before | true | true | — |
| law003After | true | true | — |
| law003StaleMetricDetected | false | false | — |
| law014ContrastViolation | false | false | — |
| productScaleScore | 1 | 12 | 11 |
| productDominanceScore | 46 | 54 | — |
| emptySpaceEstimate | 0.29 | 0.29 | — |
| sceneFillRisk | 0.29 | 0.24 | — |
| compositeProductAreaRatio | 0.13 | 0.18 | 0.05 |
| provider latency | 610ms | 431ms | — |
| generation time | 6437ms | 5361ms | — |
| background hash | `dc4677839ce8…` | `dc4677839ce8…` | same |
| final image hash | `37259b4e6edd…` | `9057600feb2b…` | changed |

### Children's Toy (`childrens-toy`)

Seed: `daos-benchmark-phase1-20260706:childrens-toy` | Complexity: low

| Metric | Baseline | DAOS | Delta |
|--------|----------|------|-------|
| summaryScore | 73 | 73 | 0 |
| finalGate | warning (73) | warning (73) | 0 |
| meaningLoss | 3 | 3 | 0 |
| modulesCompiled | 4 | 4 | 0 |
| modulesStillIgnored | 0 | 0 | 0 |
| promptLength | 869 | 869 | 0 |
| composerQualityScore | 75 | 75 | 0 |
| productAreaRatio | 0.35 | 0.35 | — |
| finalCompositionRisk | 0.16 | 0.16 | — |
| overlayQualityScore | 47 | 47 | 0 |
| overlayDensity | 0.10 | 0.10 | — |
| pngOverlayFeelRisk | 0.20 | 0.20 | — |
| law003WhitespaceViolation | true | true | — |
| law003Before | true | true | — |
| law003After | true | true | — |
| law003StaleMetricDetected | true | true | — |
| law014ContrastViolation | false | false | — |
| productScaleScore | 66 | 66 | 0 |
| productDominanceScore | 88 | 88 | — |
| emptySpaceEstimate | 0.29 | 0.29 | — |
| sceneFillRisk | 0.09 | 0.09 | — |
| compositeProductAreaRatio | 0.35 | 0.35 | 0.00 |
| provider latency | 594ms | 456ms | — |
| generation time | 5886ms | 5631ms | — |
| background hash | `991a1b6b06a9…` | `991a1b6b06a9…` | same |
| final image hash | `ed180ac01ba9…` | `ed180ac01ba9…` | same |

## Aggregate statistics

- Products: 5
- Average summary delta: 0.00
- Median summary delta: 0.00
- Best case: 0
- Worst case: 0
- Average prompt delta: 0.0 chars
- Average meaning-loss delta: 0.00
- Average modulesCompiled (baseline → DAOS): 3.2 → 3.2
- Average composerQualityScore (baseline → DAOS): 83.3 → 83.3
- Average productAreaRatio (baseline → DAOS): 0.33 → 0.33
- Average finalCompositionRisk (baseline → DAOS): 0.18 → 0.18
- Average overlayQualityScore (baseline → DAOS): 56.3 → 53.5
- Average overlayDensity (baseline → DAOS): 0.10 → 0.10
- Average pngOverlayFeelRisk (baseline → DAOS): 0.38 → 0.38
- LAW_003 violation rate (wide hero OFF → ON): 50% → 50%
- LAW_014 violation rate (contrast patch OFF → ON): 0% → 0%
- Average productScaleScore (baseline → DAOS): 58.3 → 58.0
- Average productDominanceScore (baseline → DAOS): 81.3 → 82.0
- Average emptySpaceEstimate (baseline → DAOS): 0.29 → 0.29
- Average sceneFillRisk (baseline → DAOS): 0.11 → 0.11
- Average compositeProductAreaRatio (wide hero OFF → ON): 0.33 → 0.33
- compositePlacementFound rate (wide hero OFF → ON): 100% → 100%
- extractAreaCorrected rate (wide hero OFF → ON): 100% → 100%
- LAW_003 violation rate recalibrated (contrast patch OFF → ON): 50% → 50%
- LAW_003 stale metric rate (soft OFF → ON): 75% → 75%
- LAW_003 soft resolved rate (wide hero OFF → ON): 50% → 50%
- targetUnreachable rate (wide hero OFF → ON): 100% → 100%
- Average overlayGateScore (soft OFF → ON): 56.3 → 53.5
- overlayGate pass rate (soft OFF → ON): 0% → 0%