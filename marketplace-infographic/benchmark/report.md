# DAOS Benchmark Report — Phase 1

Created: 2026-07-06T10:14:17.903Z

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
| productAreaRatio | 0.46 | 0.43 | — |
| finalCompositionRisk | 0.42 | 0.42 | — |
| overlayQualityScore | 10 | 16 | 6 |
| overlayDensity | 0.13 | 0.13 | — |
| pngOverlayFeelRisk | 1.00 | 1.00 | — |
| law003WhitespaceViolation | true | true | — |
| law014ContrastViolation | true | true | — |
| provider latency | 611ms | 410ms | — |
| generation time | 3656ms | 3482ms | — |
| background hash | `09c7ea087037…` | `09c7ea087037…` | same |
| final image hash | `ac7fe75fda1e…` | `6a61b12a951a…` | changed |

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
| productAreaRatio | 0.42 | 0.42 | — |
| finalCompositionRisk | 0.42 | 0.42 | — |
| overlayQualityScore | 39 | 42 | 3 |
| overlayDensity | 0.05 | 0.12 | — |
| pngOverlayFeelRisk | 1.00 | 1.00 | — |
| law003WhitespaceViolation | true | true | — |
| law014ContrastViolation | false | false | — |
| provider latency | 425ms | 446ms | — |
| generation time | 4311ms | 4147ms | — |
| background hash | `13da5f7cb088…` | `13da5f7cb088…` | same |
| final image hash | `97086db0de50…` | `39cdee95d4b8…` | changed |

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
| provider latency | n/ams | n/ams | — |
| generation time | 30ms | 34ms | — |
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
| productAreaRatio | 0.43 | 0.42 | — |
| finalCompositionRisk | 0.42 | 0.42 | — |
| overlayQualityScore | 10 | 42 | 32 |
| overlayDensity | 0.09 | 0.12 | — |
| pngOverlayFeelRisk | 1.00 | 1.00 | — |
| law003WhitespaceViolation | true | true | — |
| law014ContrastViolation | true | false | — |
| provider latency | 436ms | 424ms | — |
| generation time | 3428ms | 3503ms | — |
| background hash | `dc4677839ce8…` | `dc4677839ce8…` | same |
| final image hash | `fe8f5d5591fb…` | `d140ee79a6ad…` | changed |

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
| productAreaRatio | 0.43 | 0.40 | — |
| finalCompositionRisk | 0.42 | 0.42 | — |
| overlayQualityScore | 10 | 19 | 9 |
| overlayDensity | 0.07 | 0.12 | — |
| pngOverlayFeelRisk | 1.00 | 1.00 | — |
| law003WhitespaceViolation | true | true | — |
| law014ContrastViolation | true | true | — |
| provider latency | 440ms | 464ms | — |
| generation time | 3553ms | 3571ms | — |
| background hash | `991a1b6b06a9…` | `991a1b6b06a9…` | same |
| final image hash | `ac06fd835a62…` | `7147f258d721…` | changed |

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
- Average productAreaRatio (baseline → DAOS): 0.44 → 0.42
- Average finalCompositionRisk (baseline → DAOS): 0.42 → 0.42
- Average overlayQualityScore (baseline → DAOS): 17.3 → 29.8
- Average overlayDensity (baseline → DAOS): 0.09 → 0.12
- Average pngOverlayFeelRisk (baseline → DAOS): 1.00 → 1.00
- LAW_003 violation rate (baseline → DAOS): 100% → 100%
- LAW_014 violation rate (baseline → DAOS): 75% → 50%