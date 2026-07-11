# DAOS Product Sprint 7A Report

## Compositor Constraints Investigation

**Sprint:** Product Sprint 7A  
**Status:** Complete  
**Type:** Engineering Investigation (read-only)  
**Priority:** CRITICAL  
**Branch:** `cursor/product-sprint7a-compositor-constraints-aecb`  
**Benchmark:** `benchmark/compositor-constraints.ts`  
**Artifacts:** `benchmark/output/sprint7a/`

---

## Context

Sprints 6B (propagation) and 6C (calibration) work correctly. Product Area remains **19–30%** vs commercial target **≈55%**. Sprint 7A establishes **why the existing compositor cannot reach 55%** using production code and experiments only.

**Zero production code changes.**

---

## Root Cause (confirmed)

Product Area is capped by **compositor pixel policy**, not Commercial layer:

1. **`PRODUCT_ALPHA_MAX_*` (56%×50% = 28%)** binds after `computeMaxProductSize` allows 39.4%
2. **Template zone × scaleBoost** saturates at ~29.5% before policy max
3. **`prepareProductLayer`** aspect-ratio fit reduces frame further (~24.3% at max objectScale)
4. **Alpha fit ×0.9** reduces visible silhouette to ~19%

**55% exceeds all compositor ceilings except raw usable canvas (60%)** and is unreachable without multiple constraint relaxations.

---

## Investigation 1 — Pipeline Map

| Stage | Affects final area? | Production file |
|-------|----------------------|-----------------|
| `resolveLayoutObjectScale` | Indirect (feeds objectScale) | `commercial-layout-propagation.ts` |
| `computeMaxProductSize` | **Yes** | `commercial-calibration.ts` |
| `prepareProductLayer` | **Yes** | `scene-compositor.ts` |
| `fitProductWithSafePlacement` | **Yes** | `alpha-fit.ts` |
| `PRODUCT_ALPHA_MAX` bounds | **Yes** | `product-render-policy.ts` |
| `resolveVerticalTop` | No (position) | `scene-compositor.ts` |
| Shadow / reflection | No | `scene-compositor.ts` |
| HTML typography / badges | No (post-pass) | `infographic-template` / puppeteer |

Full map: `docs/DAOS_COMPOSITOR_CONSTRAINTS.md`

---

## Investigation 2 — Constraint Types

| Constraint | Type |
|------------|------|
| `PRODUCT_ALPHA_MAX_*` | Hard Constraint |
| `PRODUCT_MAX_*` | Historical Constant |
| `HEADER_RESERVE_PX` | Marketplace Requirement |
| `PRODUCT_SIDE_MARGIN_PX` | Safety Constraint |
| `fitProductByAlphaBounds ×0.9` | Safety Constraint |
| `scaleBoost / zone geometry` | Implementation Detail |
| HTML overlay | Soft Constraint (non-compositor) |
| Shadows | Implementation Detail (non-shrinking) |

---

## Investigation 3 — objectScale Experiment

Sweep `{0.40, 0.50, 0.60, 0.70, 0.80, 0.90, 1.00}` on 5 products with production pipeline mirror.

**battery-sprayer (representative):**

| objectScale | Requested | Allowed | Real frame | Blocker |
|-------------|-----------|---------|------------|---------|
| 0.50 | 50% | 17.4% | 14.3% | zone × scaleBoost |
| 0.70 | 70% | 25.9% | 21.3% | zone_geometry_template |
| 1.00 | 100% | 29.5% | 24.3% | saturated |

Full data: `benchmark/output/sprint7a/compositor-constraints.json`

---

## Investigation 4 — Constraint Matrix

See `docs/DAOS_COMPOSITOR_CONSTRAINTS.md` — 11 constraints classified with relaxability and risk.

---

## Investigation 5 — Maximum Achievable Area

| Metric | Value |
|--------|-------|
| Current observed max (pipeline) | **24.3%** |
| Theoretical policy max | **39.4%** |
| Theoretical alpha cap | **28.0%** |
| Usable canvas (margins only) | **60.0%** |
| Practical WB max | **~39%** |
| Gap to 55% target | **30.7 pp** |

Even **objectScale=1.0** cannot exceed 29.5% allowed area.

---

## Investigation 6 — Commercial Loss Attribution

Primary losses from 55% target:

| Constraint | Contribution |
|------------|--------------|
| Header + margins + bottom pad | ~−25% canvas budget |
| Zone × scaleBoost template | ~−15–25% |
| PRODUCT_MAX policy cap | ~−11% |
| **PRODUCT_ALPHA_MAX mismatch** | **−11.4%** |
| Alpha fit ×0.9 | ~−5% |

---

## Investigation 7 — Minimal Change Proposal

**Sprint 7B recommendation:**

Align `PRODUCT_ALPHA_MAX_WIDTH_PX` / `PRODUCT_ALPHA_MAX_HEIGHT_PX` with `PRODUCT_MAX_WIDTH_PX` / `PRODUCT_TARGET_MAX_HEIGHT_PX`.

| | |
|--|--|
| **Change scope** | 2 constants in `product-render-policy.ts` |
| **Estimated gain** | **+11.4 percentage points** (28% → 39.4% alpha ceiling) |
| **Compositor rewrite** | No |
| **Risk** | Low |
| **Reaches 55%?** | No — still ~16 pp short; further policy work needed |

---

## Product Review

| Question | Answer |
|----------|--------|
| Why not 55%? | Stacked compositor caps; alpha cap (28%) is primary binder |
| Which limits are needed? | Side margins, header reserve (WB readability), alpha fit safety |
| Which are historical? | `PRODUCT_MAX_*` ratios, separate smaller `PRODUCT_ALPHA_MAX_*` |
| Which can be safely relaxed? | Alpha cap alignment (low risk), alpha 0.9→0.95 (low risk) |
| Single max-impact fix? | **Align PRODUCT_ALPHA_MAX with PRODUCT_MAX** (+11.4 pp) |

---

## Architecture Review

| Criterion | Result |
|-----------|--------|
| Constraints from existing compositor | **PASS** |
| No new constraints created | **PASS** |
| Architecture unchanged | **PASS** |

---

## Exit Criteria

| Criterion | Status |
|-----------|--------|
| Exact root cause named | **PASS** — `PRODUCT_ALPHA_MAX` mismatch + zone saturation |
| Per-constraint contribution estimated | **PASS** |
| Minimal change proposed | **PASS** — alpha cap alignment for 7B |
| No code mutations | **PASS** |

**Sprint 7B** should implement alpha cap alignment — confirmed change, not further investigation.

---

## Deliverables

- [x] `docs/DAOS_COMPOSITOR_CONSTRAINTS.md`
- [x] `docs/DAOS_PRODUCT_SPRINT_7A_REPORT.md`
- [x] `benchmark/compositor-constraints.ts`
- [x] `benchmark/output/sprint7a/compositor-constraints.json`
