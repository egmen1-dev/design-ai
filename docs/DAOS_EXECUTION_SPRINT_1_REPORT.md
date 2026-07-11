# Product Execution Sprint 1 — Council Report

**Date:** 2026-07-11  
**Branch:** `cursor/hero-visual-mass-sprint1-aecb`  
**Flag:** `DAOS_HERO_VISUAL_MASS=1`  
**Council:** **FAIL**

---

## Objective

Close Runtime Execution gap: Commercial Genome requires Hero Dominance, but compositor produced low Product Visual Mass. Target: Home Win Rate **57.1% → 70%** without changing Commercial Genome, Category Profiles, or Attention Laws.

---

## Implementation

Runtime module `marketplace-infographic/src/lib/compositing/hero-visual-mass.ts`:

| Parameter | Legacy | Sprint 1 |
|-----------|--------|----------|
| objectScale multiplier | 1.0 | **1.18** (cap 0.95) |
| execution mass width/height mul | 1.0 | **1.10 / 1.08** (+1.14 flat-wide width) |
| alpha max width/height | 56%/50% | **82%/72%** |
| header reserve | 20% | **10%** |
| alpha enlargement | off | **on** (min fill 78%) |
| flat-wide width boost | 1.0 | **1.22** |

### Critical fix (iteration 2)

Initial implementation used `Math.max(commercial, hero)` for sizing. Calibrated commercial calibration already hits `scaleBoost` ceiling **1.18**, so hero mass was a **no-op** in production. Fixed by:

1. **Mandatory multiplicative boost** via `applyHeroMassToMaxSize()` on top of commercial calibration
2. **`prepareProductLayer`** header reserve cap (was hardcoded 20%)
3. **Commercial-calibration** canvas caps aligned with hero header reserve when flag is on

---

## Validation Results

### Compositor isolation (synthetic flat cutout, `commercialCalibration: true`)

| Mode | Placement area | Delta |
|------|----------------|-------|
| Legacy | 10.2% (453×244) | — |
| Hero mass | 18.7% (612×330) | **+8.5pp** |

### Compositor on real packshot (product-001 / 10392457)

| Mode | Placement area | Delta |
|------|----------------|-------|
| Legacy | 14.0% (454×334) | — |
| Hero mass | 25.5% (612×450) | **+11.5pp** |

Compositor-level hero mass **works** when measured on merged scene output.

### Home category benchmark (n=9, 5 WB images unavailable)

| Metric | BV2 Baseline | Sprint 1 | Target |
|--------|--------------|----------|--------|
| Home Win Rate | 57.1% | **44.4%** (4/9) | ≥70% |
| Avg Product Dominance | 49.4 | 48.1 | ↑ |
| Avg Product VW | ~18 | 17.9 | ↑ |
| Gen Success | 100% | 100% | 100% |

**Council: FAIL** — no win rate lift; metrics flat despite compositor gains.

---

## Root Cause Analysis

1. **Compositor propagation (fixed):** `Math.max` + hardcoded 20% header reserve prevented hero mass from affecting production path.
2. **Metric decoupling (remaining):** `productDominanceScore` = `heroEnergy / (heroEnergy + headlineEnergy)` on the **final card with typography overlays**. DAOS headline VW (~27) vs WB leader (~5) dominates the ratio regardless of compositor area.
3. **Packshot constraint:** Pseudo-packshots cropped from WB hero zone carry lifestyle background; flat organizers remain low-edge silhouettes — area growth does not linearly translate to `edgeDensity`-based visual weight.
4. **Sample size:** n=9/14 home products (missing WB card PNGs for 5 IDs).

### Example: product-001 (organizer 10392457)

| | WB Leader | DAOS Sprint 1 |
|--|-----------|---------------|
| Product Dominance | 79 | 40 |
| Product VW | 18.7 | 17.2 |
| Headline VW | 5.2 | 26.8 |
| Typography competition | 20.6 | 40.9 |

Compositor area +11.5pp on packshot → final card productVW unchanged. Dominance gap driven by **typography energy in headline zone**, outside Sprint 1 scope.

---

## Product Backlog (post-Sprint 1)

| Item | Priority | Rationale |
|------|----------|-----------|
| Packshot fill mode for flat silhouettes | CRITICAL | Real seller cutouts, not WB hero crops |
| Post-composite dominance preservation | CRITICAL | Re-scale product when overlay adds headline energy |
| Decouple dominance metric from headline zone overlap | HIGH | Measure product alpha bbox, not hero zone edge density |
| Category execution profiles at compositor level | MEDIUM | Outside Category Profiles KB — runtime-only tuning |

---

## Reproduce

```bash
export DATABASE_URL="postgresql://daos:daos@localhost:5432/marketplace_infographic"
cd marketplace-infographic

# Unit tests
npx tsx src/lib/compositing/hero-visual-mass.test.ts

# Compositor bench
npx tsx benchmark/hero-visual-mass-compositor-bench.ts

# Real packshot diagnostic
npx tsx benchmark/hero-visual-mass-pipeline-diag.ts

# Full home validation
HVM_RESUME=0 npx tsx benchmark/hero-visual-mass-sprint1.ts
```

---

**END OF SPRINT 1 COUNCIL REPORT**
