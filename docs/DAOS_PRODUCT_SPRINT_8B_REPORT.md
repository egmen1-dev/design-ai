# DAOS Product Sprint 8B Report

## Template Geometry Clamp Optimization

**Sprint:** Product Sprint 8B  
**Status:** Complete  
**Type:** Minimal geometry fix + validation  
**Priority:** CRITICAL  
**Branch:** `cursor/product-sprint8b-geometry-clamp-aecb`  
**Benchmark:** `benchmark/template-geometry-optimization.ts`  
**Artifacts:** `benchmark/output/sprint8b/`

---

## Objective

Close **Product Gap #8** by raising the geometry-limited Product Area ceiling from **~29.5%** (Sprint 8A) toward the compositor policy maximum **39.4%** (Sprint 7B), with a single localized change in `layout-engine/builder.ts`.

---

## Change Applied

| Parameter | Before (8A) | After (8B) |
|-----------|-------------|------------|
| `finalH` clamp max | 85% | **58%** |
| `finalH` clamp min | 60% | 60% (unchanged) |
| `finalW` clamp | 55–72% | unchanged |
| Templates / Genome / Compositor / Propagation | — | **not modified** |

```typescript
// layout-engine/builder.ts
const finalH = clampPct(productH, PRODUCT_FINAL_HEIGHT_MIN_PCT, PRODUCT_FINAL_HEIGHT_MAX_PCT);
// PRODUCT_FINAL_HEIGHT_MAX_PCT: 85 → 58
```

**Regression guard** (`geometry-clamp-optimization.ts`): `geometryClampVersion`, `geometryClampSource`, `geometryFinalHBefore/After`, `geometryHeightBindingBefore/After`, `geometryPolicyCeilingReachable`, `geometryOptimizationWarnings`.

---

## Benchmark Results (20 templates × 5 products)

### Geometry ceiling @ `objectScale = 1.0`

| Metric | Sprint 7B / 8A (legacy) | Sprint 8B |
|--------|-------------------------|-----------|
| Avg allowed Product Area | **29.5%** | **36.6%** |
| Best template (`poster`) | 29.5% | **37.4%** |
| Worst template (`editorial`) | 30.4% | **33.6%** |
| Gain (avg) | — | **+7.1 pp** |
| Gap to policy max (39.4%) | ~9.9 pp | **~2.0–5.8 pp** |

Height binding is removed at ceiling; remaining gap is **width binding** (template `productScale` → zone width 58–63%, not policy-optimal 68%).

### Commercial path @ fixed `objectScale = 0.55`

Commercial propagation is frozen per sprint scope (`resolveLayoutObjectScale` still maps 55% target → 0.55). At this fixed scale:

| Product | Allowed 8A | Allowed 8B | Δ |
|---------|-----------|-----------|---|
| battery-sprayer | 19.1% | 17.2% | −1.9 pp |
| construction-vacuum | 18.3% | 16.7% | −1.6 pp |
| impact-drill | 19.5% | 17.5% | −2.0 pp |
| pressure-washer | 18.3% | 16.7% | −1.6 pp |
| home-humidifier | 19.5% | 17.5% | −2.0 pp |

Shorter zone height reduces max placement pixels at low `objectScale`. **Harvesting the +7.1 pp ceiling gain in production requires a follow-up calibration/propagation sprint** (explicitly out of scope for 8B).

### Safety validation

| Check | Result |
|-------|--------|
| Crop / overflow warnings | **0** regressions |
| Overlap (`overlapPct`) | **0** regressions (all products) |
| Typography / badge zones | Unchanged (builder paths not touched) |
| Safe placement (`fitProductWithSafePlacement`) | Unchanged |
| Vertical alignment | Zone center preserved; height cap only |

---

## Sprint Comparison (per product, @ objectScale=1)

| Product | Template | Allowed 7B/8A | Allowed 8B | Bbox W×H 8A → 8B | Overlap |
|---------|----------|---------------|------------|------------------|---------|
| battery-sprayer | focus | 29.5% | 36.8% | 457×696 → 571×696 | 0 |
| construction-vacuum | commercial | 29.5% | 35.8% | 458×696 → 555×696 | 0 |
| impact-drill | poster | 29.5% | 37.4% | 458×696 → 580×696 | 0 |
| pressure-washer | commercial | 29.5% | 35.8% | 458×696 → 555×696 | 0 |
| home-humidifier | poster | 29.5% | 37.4% | 458×696 → 580×696 | 0 |

Commercial Fidelity (layout-spec target 55%) is unchanged in intent; measured compositor area at ceiling rose **+6.3 to +7.9 pp** per product.

---

## Success Criteria

| # | Criterion | Result |
|---|-----------|--------|
| 1 | Ceiling ~29.5% → ~39.4% | **Partial:** 36.6% avg, 37.4% max (+7.1 pp). Full 39.4% needs wider zone (68% W) — width binding |
| 2 | Gap to policy max reduced | **Yes:** 9.9 pp → 2.0–5.8 pp |
| 3 | No crop/overflow regression | **Yes** |
| 4 | Typography/badge/safe zones intact | **Yes** |
| 5 | Commercial Fidelity improved at ceiling | **Yes** (+6–8 pp allowed @ objectScale=1) |
| 6 | Minimal local change | **Yes** (constants + one clamp) |

---

## Exit Criteria — Bottleneck Status

**Geometry height binding is no longer the primary bottleneck** at `objectScale = 1.0`.

Remaining constraints:

1. **Width binding** — template `productScale` coefficients cap zone width below policy-optimal 68% (~2–6 pp to 39.4%).
2. **Commercial target 55%** exceeds safe compositor/card design ceiling (~37–39%).

### Recommended next Product Gap

> **Commercial target 55% exceeds current safe compositor/card design ceiling.**

Next stage is a **product/design decision**, not a geometry bug fix:

- Lower commercial target to realistic **39–45%**, **or**
- Design new Hero layout for ultra-dominant product cards, **or**
- Re-calibrate propagation (`objectScale`) now that geometry ceiling is +7.1 pp higher.

---

## Files Touched

| File | Change |
|------|--------|
| `layout-engine/constants.ts` | `PRODUCT_FINAL_HEIGHT_MAX_PCT = 58` |
| `layout-engine/builder.ts` | Uses sprint8b height constant |
| `layout-engine/geometry-clamp-optimization.ts` | Diagnostics module (new) |
| `layout-engine/geometry-clamp-optimization.test.ts` | Unit tests (new) |
| `generate-infographic-handler.ts` | Wire `geometryOptimization` diagnostics |
| `benchmark/template-geometry-optimization.ts` | Sprint 8B benchmark (new) |
| `scripts/run-specs.sh` | Include geometry-clamp test |

---

## References

- Sprint 8A: `docs/DAOS_PRODUCT_SPRINT_8A_REPORT.md`
- Template geometry audit: `docs/DAOS_TEMPLATE_GEOMETRY_AUDIT.md`
- Benchmark output: `benchmark/output/sprint8b/template-geometry-optimization.json`
