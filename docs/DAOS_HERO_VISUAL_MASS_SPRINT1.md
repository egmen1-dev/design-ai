# Product Execution Sprint 1 — Hero Visual Mass

**Status:** Council **FAIL** (2026-07-11)  
**Flag:** `DAOS_HERO_VISUAL_MASS=1`  
**Scope:** Compositor / hero fill / alpha-fit only  
**Full report:** [DAOS_EXECUTION_SPRINT_1_REPORT.md](./DAOS_EXECUTION_SPRINT_1_REPORT.md)

---

## Problem

Wave 1 proved Commercial Knowledge is correct — Category Intelligence did not change Home Win Rate (57.1%). The gap is **Runtime Execution**: Commercial Genome requires Hero Dominance, but compositor produced low Product Visual Mass.

---

## Solution

Runtime module `src/lib/compositing/hero-visual-mass.ts` — flag-gated compositor policy with **mandatory execution mass boost** on top of commercial calibration (not `Math.max`).

| Parameter | Legacy | Sprint 1 |
|-----------|--------|----------|
| objectScale multiplier | 1.0 | **1.18** |
| execution mass width mul | 1.0 | **1.10** (+1.14 flat-wide) |
| execution mass height mul | 1.0 | **1.08** |
| alpha max width | 56% | **82%** |
| alpha max height | 50% | **72%** |
| header reserve | 20% | **10%** |
| alpha enlargement | off | **on** (min fill 78%) |
| flat-wide width boost | 1.0 | **1.22** |

---

## Validation Summary

| Layer | Result |
|-------|--------|
| Compositor isolation | **+8.5pp** area (synthetic) |
| Real packshot compositor | **+11.5pp** area (product-001) |
| Home Win Rate (n=9) | **44.4%** vs 57.1% baseline — **FAIL** |
| Product VW mean | 17.9 (flat vs ~18 baseline) |

Compositor changes propagate at merge layer but do not lift benchmark win rate because dominance is measured post-typography overlay.

---

## Boundaries (unchanged)

- Commercial Genome / EKB
- Category Profiles
- Attention Laws / typography gates
- Marketplace Learning

---

## Success Criteria

| Criterion | Target | Result |
|-----------|--------|--------|
| Product Visual Weight | ↑ | Flat (~17.9) |
| Product Dominance | ↑ | Flat (48.1) |
| Home Win Rate | **≥70%** | **44.4% FAIL** |
| Gen Success | 100% | 100% |

---

**END OF SPRINT 1 SPEC**
