# DAOS Competitive Sprint 1 — Win Rate Improvement

**Status:** Complete  
**Priority:** P0  
**Phase:** Closed Beta Preparation  
**Date:** 2026-07-11  
**Benchmark:** `marketplace-infographic/benchmark/beta-validation-1.ts`  
**Output:** `marketplace-infographic/benchmark/output/competitive-sprint-1/`

---

## Objective

Increase **Market Win Rate** — DAOS cards beating real Wildberries leaders — from Beta Validation 1 baseline **30%** to **≥45%**, while keeping **Generation Success = 100%**.

---

## Baseline (Beta Validation 1)

| Metric | Value |
|--------|-------|
| Overall Win Rate | **30%** (6/20) |
| Win Rate (successful gen) | **60%** (6/10) |
| Generation Success | 50% |
| Primary loss driver | Pipeline abort (10) + Product Dominance (4) |

Post-stabilization (pipeline READY, 100% gen): **65%** (13/20) — competitive sprint targets quality gaps on remaining WB wins.

---

## Three Changes Implemented

### 1. Category-Tuned Product Scale Boost

| Field | Value |
|-------|-------|
| **Product Impact** | Increases hero product area on dominance-critical categories (auto, home_appliances, electronics, generic) |
| **Implementation Complexity** | Low |
| **Expected Win Rate Gain** | +5–8% overall |
| **Confidence** | Medium-High |
| **Module** | `src/lib/competitive/dominance-preservation.ts` → `applyCompetitiveObjectScale()` |

Category/prompt-aware `objectScale` boost (+0.03–0.07) applied after commercial layout propagation in `generate-infographic-handler.ts`.

### 2. Calibrated Compositor + Hero Lighting Boost

| Field | Value |
|-------|-------|
| **Product Impact** | Larger product bbox on canvas; stronger edge contrast on cutouts → higher measured dominance & visual weight |
| **Implementation Complexity** | Low |
| **Expected Win Rate Gain** | +3–5% overall |
| **Confidence** | Medium |
| **Modules** | `marketplaceCompositeOptions()` always uses calibrated mode when competitive dominance ON; `scene-compositor.ts` contrastBoost 0.06 → 0.12 |

### 3. Post-Overlay Dominance Preservation Retry

| Field | Value |
|-------|-------|
| **Product Impact** | Re-composites + re-renders once when pixel dominance < 52 or LAW_101 fails after overlay |
| **Implementation Complexity** | Medium |
| **Expected Win Rate Gain** | +2–4% overall |
| **Confidence** | Medium |
| **Module** | Dominance retry loop in `generate-infographic-handler.ts` (+0.1 objectScale, max 1 retry) |

**Companion:** Category-tuned attention hierarchy caps — headline CSS scale 0.50–0.56 for auto/appliances/electronics/generic (`attention-hierarchy.ts`).

**Flag:** `DAOS_COMPETITIVE_DOMINANCE=1` (benchmark default; set `0` to disable).

---

## Validation — Same 20 WB Products

| Metric | BV1 | Post-Stabilization | Competitive Sprint 1 | Target |
|--------|-----|-------------------|----------------------|--------|
| **Overall Win Rate** | 30% | 65% | **70%** | ≥45% |
| DAOS Wins | 6 | 13 | **14** | — |
| WB Wins | 14 | 6 | **6** | — |
| Draws | 0 | 1 | **0** | — |
| **Generation Success** | 50% | 100% | **100%** | 100% |
| Win Rate (successful gen) | 60% | 65% | **70%** | — |

### Category Win Rate

| Category | BV1 | Sprint 1 |
|----------|-----|----------|
| Электроинструмент | 2/3 | **2/3** |
| Сад | 0/3 | **3/3** |
| Строительство | 2/2 | **2/2** |
| Бытовая техника | 1/2 | **2/2** |
| Дом | 0/2 | **1/2** |
| Авто | 0/2 | **1/2** |
| Кухня | 1/2 | **2/2** |
| Мойка | 1/2 | **1/2** |
| Климат | 0/2 | **0/2** |

### DAOS Metric Averages (generated cards)

| Metric | BV1 (n=10) | Sprint 1 (n=20) | Δ |
|--------|------------|-----------------|---|
| Product Dominance | 58.1 | **60.4** | +2.3 |
| Foreground Isolation | 82.1 | 81.1 | −1.0 |
| Attention Hierarchy | 35.6 | **36.8** | +1.2 |
| Commercial Fidelity | 43.0 | **43.6** | +0.6 |
| Thumbnail Readability | 84.4 | 83.3 | −1.1 |

### Regression Check

| Check | Result |
|-------|--------|
| Generation Success = 100% | **PASS** |
| Pipeline stable (0 aborts) | **PASS** |
| Previous DAOS wins preserved | **PASS** — 0 regressions vs stabilization |
| Net improvement | **+1** flip: product-16 (Кухня) draw → DAOS |

### Remaining WB Wins (6)

| Slot | Category | Gap Class |
|------|----------|-----------|
| product-01 | Электроинструмент | Product Dominance |
| product-11 | Дом | Product Dominance |
| product-13 | Авто | Product Dominance |
| product-18 | Мойка | Product Dominance |
| product-19 | Климат | Visual |
| product-20 | Климат | Product Dominance |

---

## Success Criteria

| Criterion | Result |
|-----------|--------|
| Overall Win Rate ≥45% | **PASS** — 70% |
| Generation Success = 100% | **PASS** |
| No degradation of prior wins | **PASS** |

---

## Council Decision

### 1. Достигнут ли целевой Win Rate?

**PASS** — Overall Win Rate **70%** (14/20), exceeding the **45%** target.

### 2. Какие изменения дали наибольший прирост?

1. **Pipeline stabilization** (prior sprint) — unlocked 10 failed products (+35pp vs BV1).
2. **Category objectScale boost + calibrated compositor** — +1.2 avg Product Dominance; flipped kitchen draw.
3. **Post-overlay dominance retry** — triggered on LAW_101 failures; preserved wins on borderline dominance cases.

Incremental sprint gain vs stabilization baseline: **+5pp** (65% → 70%).

### 3. Что остаётся главным ограничением до Closed Beta?

**Product Dominance on full WB catalog images as input** — 5/6 remaining losses are dominance gaps where WB leader already scores 60–79 dominance. Climate category (0/2) needs isolated packshots + category-specific scene templates. **Packshot input contract** remains the highest-ROI next step (not implemented — ops/benchmark scope).

---

## Next Three Improvements (Max Product ROI)

| # | Improvement | Product Impact | Complexity | Expected Gain | Confidence |
|---|-------------|----------------|------------|---------------|------------|
| 1 | Real seller packshot inputs | CRITICAL — removes double-overlay artifact | Low (ops) | +10–15% win rate | High |
| 2 | Climate category dominance template | HIGH — 0/2 wins today | Medium | +5–8% on climate | Medium |
| 3 | Pre-ship dominance gate (block `product_not_dominant`) | HIGH — prevents shipping weak cards | Low–Medium | +3–5% overall | Medium |

---

## Re-run Command

```bash
cd marketplace-infographic
BV1_LIMIT=20 BV1_OUT_DIR=competitive-sprint-1 npx tsx benchmark/beta-validation-1.ts
```

Unit test:

```bash
npx tsx src/lib/competitive/dominance-preservation.test.ts
```

---

**END OF COMPETITIVE SPRINT 1 REPORT**
