# DAOS Benchmark Framework

Progressive A/B benchmarking: **Baseline** (DAOS flags off) vs **DAOS** (full v17 bridge stack).

## Commands

| Command | Products | Action |
|---------|----------|--------|
| `npm run daos:benchmark` | 5 (Phase 1) | Run benchmark and write reports |
| `npm run daos:benchmark:30` | 30 (Phase 2) | **Defined only — do not run automatically** |

## Outputs

After each run, written to `benchmark/`:

- `results.json` — full structured results
- `results.csv` — flat export (baseline / daos / delta rows)
- `report.md` — per-product Baseline → DAOS → Delta tables + decision
- `dashboard.md` — top improvements, failures, warnings, cost estimate

## Product catalog

- Phase 1: `benchmark/products.phase1.json` (5 products)
- Phase 2: extends Phase 1 + `benchmark/products.phase2.json` (25 more)

## Env profiles

**Baseline:** all DAOS flags `0`, `RENDER_ENGINE_V17=1`

**DAOS:** `DAOS_RENDER_CONTEXT=1`, `DAOS_V17_PROMPT_BRIDGE=1`, `DAOS_V17_MODULES_BRIDGE=1`, `DAOS_V17_CTR_BRIDGE=1`

## Decision engine (Phase 1 gate)

`SUCCESS` → continue to Phase 2 if **any** of:

- average summary delta ≥ +3
- meaning-loss improved (lower count)
- modulesCompiled improved

Otherwise `STOP` — do not run 30-product benchmark.

## Implementation

Core library: `src/lib/daos/benchmark/`

CLI: `scripts/daos-benchmark.ts`
