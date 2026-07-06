# DAOS Benchmark Report — Phase 1

Created: 2026-07-06T07:14:19.764Z

Catalog: DAOS benchmark Phase 1 — five products with varied visual complexity

## Shared render settings

- Provider: pollinations
- Model: flux
- Render engine: v17

## Decision

**BenchmarkStatus:** SUCCESS

**Recommendation:** Continue to Phase 2 — run npm run daos:benchmark:30 when ready.

**Bottlenecks:**

- average summary delta -3.3 < +3
- meaning-loss not improved (avg delta 0.4)

## Per-product results

### Cordless Drill (`cordless-drill`)

Seed: `daos-benchmark-phase1-20260706:cordless-drill` | Complexity: medium

| Metric | Baseline | DAOS | Delta |
|--------|----------|------|-------|
| summaryScore | 83 | 73 | -10 |
| finalGate | warning (83) | warning (73) | -10 |
| meaningLoss | 1 | 3 | 2 |
| modulesCompiled | 0 | 4 | 4 |
| modulesStillIgnored | 0 | 0 | 0 |
| promptLength | 584 | 1389 | 805 |
| provider latency | 7185ms | 3589ms | — |
| generation time | 15661ms | 10412ms | — |
| background hash | `eab03ab7e690…` | `b705e7a6faab…` | changed |
| final image hash | `n/a…` | `n/a…` | same |

### Electric Kettle (`electric-kettle`)

Seed: `daos-benchmark-phase1-20260706:electric-kettle` | Complexity: low

| Metric | Baseline | DAOS | Delta |
|--------|----------|------|-------|
| summaryScore | n/a | n/a | n/a |
| finalGate | n/a (n/a) | n/a (n/a) | n/a |
| meaningLoss | 0 | 0 | 0 |
| modulesCompiled | 0 | 0 | 0 |
| modulesStillIgnored | 0 | 0 | 0 |
| promptLength | n/a | n/a | n/a |
| provider latency | n/ams | n/ams | — |
| generation time | 2039ms | 24ms | — |
| background hash | `n/a…` | `n/a…` | same |
| final image hash | `n/a…` | `n/a…` | same |

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
| provider latency | n/ams | n/ams | — |
| generation time | 161ms | 17ms | — |
| background hash | `n/a…` | `n/a…` | same |
| final image hash | `n/a…` | `n/a…` | same |

### Mattress (`mattress`)

Seed: `daos-benchmark-phase1-20260706:mattress` | Complexity: medium

| Metric | Baseline | DAOS | Delta |
|--------|----------|------|-------|
| summaryScore | 73 | 73 | 0 |
| finalGate | warning (73) | warning (73) | 0 |
| meaningLoss | 3 | 3 | 0 |
| modulesCompiled | 0 | 4 | 4 |
| modulesStillIgnored | 0 | 0 | 0 |
| promptLength | 581 | 1385 | 804 |
| provider latency | 6572ms | 4155ms | — |
| generation time | 13977ms | 11227ms | — |
| background hash | `de5e0c352a58…` | `8adf8aa219a7…` | changed |
| final image hash | `n/a…` | `n/a…` | same |

### Children's Toy (`childrens-toy`)

Seed: `daos-benchmark-phase1-20260706:childrens-toy` | Complexity: low

| Metric | Baseline | DAOS | Delta |
|--------|----------|------|-------|
| summaryScore | 73 | 73 | 0 |
| finalGate | warning (73) | warning (73) | 0 |
| meaningLoss | 3 | 3 | 0 |
| modulesCompiled | 0 | 4 | 4 |
| modulesStillIgnored | 0 | 0 | 0 |
| promptLength | 562 | 1362 | 800 |
| provider latency | 3870ms | 4927ms | — |
| generation time | 11348ms | 16050ms | — |
| background hash | `3ae75bf3c564…` | `c2a31535382a…` | changed |
| final image hash | `n/a…` | `n/a…` | same |

## Aggregate statistics

- Products: 5
- Average summary delta: -3.33
- Median summary delta: 0.00
- Best case: 0
- Worst case: -10
- Average prompt delta: 803.0 chars
- Average meaning-loss delta: 0.40
- Average modulesCompiled (baseline → DAOS): 0.0 → 2.4