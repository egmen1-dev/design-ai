# DAOS Competitive Analysis

**Version:** 1.0.0 — Beta Validation 1  
**Date:** 2026-07-11  
**Source:** `benchmark/output/beta-validation-1/summary.json`

---

## Executive Summary

DAOS was benchmarked head-to-head against **20 real Wildberries leader cards** across 9 product categories. The production pipeline produced valid cards for **50%** of runs. Among successful comparisons, DAOS won **60%** — but overall market readiness remains **NOT READY** due to reliability and input-quality gaps.

---

## Competitive Position

```
                    WB Market Leaders
                           │
              ┌────────────┴────────────┐
              │   Beta Validation 1    │
              │   20 real products     │
              └────────────┬────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
   Generation OK      Generation FAIL    Metrics
   (10 products)     (10 products)      Layer
         │                 │                 │
    DAOS 6 / WB 3     WB auto-win      FI +18.7 DAOS
    Draw 1            Composition gap   Dom −1.3
```

| Dimension | DAOS vs WB | Assessment |
|-----------|------------|------------|
| **Overall win rate** | 30% (6/20) | Below market parity |
| **Conditional win rate** | 60% (6/10) | Promising when pipeline completes |
| **Foreground Isolation** | +18.7 avg (success path) | **DAOS advantage** — LAW_002 confirmed in field |
| **Product Dominance** | −1.3 avg (success path) | Near parity; losses are −12+ when WB wins |
| **Generation reliability** | 50% | **Critical blocker** |
| **Category strength** | Construction 2/0, Tools 2/1 | DAOS competitive in industrial |
| **Category weakness** | Garden 0/3, Home 0/2, Climate 0/2 | Failures + WB dominance |

---

## Win/Loss Matrix

### DAOS Wins (6)

| Product | Category | Key advantage |
|---------|----------|---------------|
| product-02 | Электроинструмент | Higher thumbnail + composite score |
| product-03 | Электроинструмент | FI + dominance balance |
| product-07 | Строительство | Strong scene integration |
| product-08 | Строительство | FI + visual weight |
| product-10 | Бытовая техника | Commercial fidelity parity |
| product-17 | Мойка | Thumbnail readability + FI |

**Pattern:** Industrial/construction categories; products where WB leader had moderate (not peak) dominance.

### WB Wins (14)

| Cause | Count | Products |
|-------|-------|----------|
| Generation failure | 10 | product-04–06, 09, 11–12, 14–15, 19–20 |
| Dominance defeat | 4 | product-01, 13, 16, 18 |

**Pattern:** Garden, Home, Climate — complex catalog images trigger pipeline validation failures. Dominance losses on tools/kitchen where WB leader already scores 60+ dominance.

### Draws (0)

No draws in final run — all products resolved to DAOS or WB winner.

---

## Metric Deep Dive (Successful Generations)

| Metric | Higher = better | DAOS vs WB trend |
|--------|-----------------|------------------|
| Product Dominance | ✓ | Slight WB edge (−1.3 avg) |
| Foreground Isolation | ✓ | **Strong DAOS edge (+18.7)** |
| Headline Weight | ✗ (lower) | DAOS often heavier (+15 on losses) |
| Primary Focus Ratio | ✓ | Near parity |
| Commercial Fidelity | ✓ | WB edge on losses (−15 typical) |
| Thumbnail Readability | ✓ | Mixed — DAOS wins on some industrial |
| Visual Weight | ✓ | Slight DAOS edge |

**Insight:** DAOS wins on **scene/isolation** (Cycles 3–4 knowledge) but loses on **commercial polish and dominance** when WB leader is already optimized. LAW_006 (overlay dilutes FI) still visible — DAOS FI high but dominance does not always follow.

---

## Gap Taxonomy

| Class | Frequency | Root cause | Knowledge Base law |
|-------|-----------|------------|-------------------|
| **Composition** | 10 | `deferredSpecs` Zod >80 chars | Pipeline reliability (new) |
| **Product Dominance** | 4 | Overlay + weak cutout from full card input | LAW_003, LAW_005 |
| **Scene** | — | FI improved; not primary loss driver | LAW_002 confirmed |
| **Attention** | — | LAW_101 warnings on most runs | LAW_016 partial |
| **Typography** | — | Headline VW elevated on losses | LAW_003 |
| **Visual** | — | Thumbnail mixed | LAW_018 hypothesis |
| **Lighting** | — | Not primary differentiator | LAW_019 |
| **Other** | — | Input methodology (card-as-product) | G1 Knowledge Gap |

---

## Competitive Hypotheses Validated

| Hypothesis | Result |
|------------|--------|
| DAOS compositor isolation competitive with WB | **YES** — FI +18.7 |
| DAOS wins majority of real comparisons | **NO** — 30% overall |
| Attention hierarchy sufficient for market | **PARTIAL** — wins industrial, loses on dominance |
| Pipeline ready for Beta | **NO** — 50% failure |
| Real packshots required | **YES** — full card input causes artifacts |

---

## Strategic Implications

### What works (preserve)

1. Foreground isolation compositor path — measurable WB-beating FI.
2. Commercial Genome + Layout integration — cards complete when pipeline succeeds.
3. Construction/industrial category performance — 100% DAOS wins (2/2).

### What blocks Beta (fix first)

1. **Generation reliability** — Zod validation on creative director output.
2. **Input contract** — require isolated packshot, not listing card.
3. **Dominance gate** — block `product_not_dominant` on final card.

### What to defer

- New Registry / RFC / Foundation refactors (per scope).
- Genome architecture expansion before reliability fix.
- Additional research cycles without market re-validation.

---

## Roadmap Alignment

Beta Validation 1 results **confirm** Knowledge Freeze roadmap priorities:

| Roadmap item | Validation evidence |
|--------------|---------------------|
| Q6 Real seller photos | CRITICAL — input artifact in 50% failures |
| Q6-4 Final-quality pixel gates | CRITICAL — `product_not_dominant` on most runs |
| Q7 Generation reliability | **NEW P0** — 50% abort rate |
| Marketplace Learning monthly | Confirmed — laws stable; execution gap is product not theory |

---

## Council Answers (Summary)

| Question | Answer |
|----------|--------|
| DAOS looks better in % cases | **30%** overall, **60%** when generation succeeds |
| Top 3 blockers | Pipeline failure, dominance gap, packshot input quality |
| Closed Beta ready? | **NOT READY** |

---

## Next Validation (Beta Validation 2)

Prerequisites before re-run:

1. Fix `deferredSpecs`/`deferredBullets` validation (or truncate in handler).
2. Replace WB card input with seller packshot harvest.
3. Target ≥70% generation success, ≥40% overall DAOS win rate.

Success criterion for Beta gate: **READY WITH LIMITATIONS** at 40% overall + 70% gen success.

---

**END OF COMPETITIVE ANALYSIS**
