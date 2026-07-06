# DAOS Benchmark Report — Phase 1

Created: 2026-07-06T13:06:42.821Z

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
| composerQualityScore | 75 | 75 | 0 |
| productAreaRatio | 0.45 | 0.43 | — |
| finalCompositionRisk | 0.42 | 0.42 | — |
| overlayQualityScore | 16 | 16 | 0 |
| overlayDensity | 0.12 | 0.12 | — |
| pngOverlayFeelRisk | 1.00 | 1.00 | — |
| law003WhitespaceViolation | true | true | — |
| law014ContrastViolation | true | true | — |
| productScaleScore | 0 | 0 | 0 |
| productDominanceScore | 1 | 1 | — |
| emptySpaceEstimate | 0.29 | 0.29 | — |
| sceneFillRisk | 0.40 | 0.40 | — |
| provider latency | 638ms | 1163ms | — |
| generation time | 3544ms | 4239ms | — |
| background hash | `09c7ea087037…` | `09c7ea087037…` | same |
| final image hash | `801274eaa110…` | `7e67405477d8…` | changed |

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
| composerQualityScore | 75 | 75 | 0 |
| productAreaRatio | 0.47 | 0.47 | — |
| finalCompositionRisk | 0.42 | 0.42 | — |
| overlayQualityScore | 16 | 16 | 0 |
| overlayDensity | 0.13 | 0.13 | — |
| pngOverlayFeelRisk | 1.00 | 1.00 | — |
| law003WhitespaceViolation | true | true | — |
| law014ContrastViolation | true | true | — |
| productScaleScore | 0 | 0 | 0 |
| productDominanceScore | 1 | 1 | — |
| emptySpaceEstimate | 0.29 | 0.29 | — |
| sceneFillRisk | 0.40 | 0.40 | — |
| provider latency | 479ms | 452ms | — |
| generation time | 4200ms | 4170ms | — |
| background hash | `13da5f7cb088…` | `13da5f7cb088…` | same |
| final image hash | `7ebe7976ea4a…` | `7ebe7976ea4a…` | same |

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
| law014ContrastViolation | n/a | n/a | — |
| productScaleScore | n/a | n/a | n/a |
| productDominanceScore | n/a | n/a | — |
| emptySpaceEstimate | n/a | n/a | — |
| sceneFillRisk | n/a | n/a | — |
| provider latency | n/ams | n/ams | — |
| generation time | 36ms | 39ms | — |
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
| composerQualityScore | 75 | 75 | 0 |
| productAreaRatio | 0.46 | 0.43 | — |
| finalCompositionRisk | 0.42 | 0.42 | — |
| overlayQualityScore | 16 | 16 | 0 |
| overlayDensity | 0.13 | 0.12 | — |
| pngOverlayFeelRisk | 1.00 | 1.00 | — |
| law003WhitespaceViolation | true | true | — |
| law014ContrastViolation | true | true | — |
| productScaleScore | 0 | 0 | 0 |
| productDominanceScore | 1 | 1 | — |
| emptySpaceEstimate | 0.29 | 0.29 | — |
| sceneFillRisk | 0.40 | 0.40 | — |
| provider latency | 420ms | 643ms | — |
| generation time | 5553ms | 4187ms | — |
| background hash | `dc4677839ce8…` | `dc4677839ce8…` | same |
| final image hash | `37cc73fd4a3b…` | `0aec4cb72880…` | changed |

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
| productAreaRatio | 0.42 | 0.41 | — |
| finalCompositionRisk | 0.42 | 0.42 | — |
| overlayQualityScore | 19 | 19 | 0 |
| overlayDensity | 0.11 | 0.11 | — |
| pngOverlayFeelRisk | 1.00 | 1.00 | — |
| law003WhitespaceViolation | true | true | — |
| law014ContrastViolation | true | true | — |
| productScaleScore | 0 | 0 | 0 |
| productDominanceScore | 1 | 1 | — |
| emptySpaceEstimate | 0.29 | 0.29 | — |
| sceneFillRisk | 0.40 | 0.40 | — |
| provider latency | 435ms | 650ms | — |
| generation time | 3304ms | 3860ms | — |
| background hash | `991a1b6b06a9…` | `991a1b6b06a9…` | same |
| final image hash | `55ca725d1f7a…` | `05ee9b6019ca…` | changed |

## Aggregate statistics

- Products: 5
- Average summary delta: 0.00
- Median summary delta: 0.00
- Best case: 0
- Worst case: 0
- Average prompt delta: 0.0 chars
- Average meaning-loss delta: 0.00
- Average modulesCompiled (baseline → DAOS): 3.2 → 3.2
- Average composerQualityScore (baseline → DAOS): 75.0 → 75.0
- Average productAreaRatio (baseline → DAOS): 0.45 → 0.44
- Average finalCompositionRisk (baseline → DAOS): 0.42 → 0.42
- Average overlayQualityScore (baseline → DAOS): 16.8 → 16.8
- Average overlayDensity (baseline → DAOS): 0.12 → 0.12
- Average pngOverlayFeelRisk (baseline → DAOS): 1.00 → 1.00
- LAW_003 violation rate (baseline → DAOS): 100% → 100%
- LAW_014 violation rate (baseline → DAOS): 100% → 100%
- Average productScaleScore (baseline → DAOS): 0.0 → 0.0
- Average productDominanceScore (baseline → DAOS): 1.0 → 1.0
- Average emptySpaceEstimate (baseline → DAOS): 0.29 → 0.29
- Average sceneFillRisk (baseline → DAOS): 0.40 → 0.40