# Product Execution Sprint 1 — Hero Visual Mass

**Status:** Validation Pending  
**Date:** 2026-07-11  
**Flag:** `DAOS_HERO_VISUAL_MASS=1`  
**Scope:** Compositor / hero fill / alpha-fit only

---

## Problem

Wave 1 proved Commercial Knowledge is correct — Category Intelligence did not change Home Win Rate (57.1%). The gap is **Runtime Execution**: Commercial Genome requires Hero Dominance, but compositor produces low Product Visual Mass.

---

## Solution

Runtime module `src/lib/compositing/hero-visual-mass.ts` — flag-gated compositor policy:

| Parameter | Legacy | Sprint 1 |
|-----------|--------|----------|
| objectScale multiplier | 1.0 | **1.14** |
| zone scaleBoost base | 0.58 | **0.72** |
| zone scaleBoost slope | 0.05 | **0.20** |
| alpha max width | 56% | **78%** |
| alpha max height | 50% | **68%** |
| header reserve | 20% | **12%** |
| alpha enlargement | off | **on** (min fill 72%) |
| flat-wide width boost | 1.0 | **1.18** |

Flat-wide silhouettes (aspect ≥1.12) detected from cutout alpha bounds — organizers, storage boxes.

---

## Boundaries (unchanged)

- Commercial Genome / EKB
- Category Profiles
- Attention Laws / typography gates
- Marketplace Learning

---

## Validation

```bash
cd marketplace-infographic
HVM_RESUME=0 npx tsx benchmark/hero-visual-mass-sprint1.ts
```

- Category: **Дом** only (n=14)
- `DAOS_CATEGORY_INTELLIGENCE=0` — proves execution-only lift
- Baseline: BV2 **57.1%**
- Target: **≥70%**

---

## Success Criteria

| Criterion | Target |
|-----------|--------|
| Product Visual Weight | ↑ |
| Product Dominance | ↑ |
| Home Win Rate | **≥70%** |
| Gen Success | 100% |

If Win Rate does not grow → **FAIL**

---

**END OF SPRINT 1 SPEC**
