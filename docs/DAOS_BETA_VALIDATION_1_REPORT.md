# DAOS Beta Validation 1 Report

## Real Marketplace Challenge

**Status:** Beta Validation  
**Priority:** P0  
**Phase:** Closed Beta Preparation  
**Date:** 2026-07-11  
**Benchmark:** `marketplace-infographic/benchmark/beta-validation-1.ts`  
**Output:** `marketplace-infographic/benchmark/output/beta-validation-1/`

---

## Objective

Verify whether DAOS can create listing cards that **visually compete with top Wildberries leaders** — not via internal metrics alone, but via head-to-head comparison on real marketplace catalog images.

**Criterion:** Visual superiority of the finished card.

---

## Methodology

### Dataset

| Parameter | Value |
|-----------|-------|
| Products | **20** real WB top-search leaders |
| Categories | 9 — Электроинструмент, Сад, Строительство, Бытовая техника, Дом, Авто, Кухня, Мойка, Климат |
| Source | `quality-cycle-1/wb-cards/` (harvested WB search leaders) |
| Product input | WB catalog image (first listing photo) passed to production handler |
| DAOS pipeline | `handleGenerateInfographic` — Commercial Genome ON, Attention Hierarchy ON |

### Challenge Loop (per product)

```
WB Leader (leader.png)
  → DAOS Generation (production handler)
  → Side-by-side (comparison.png)
  → Pixel metrics (8 dimensions)
  → Structured human verdict (review.md)
```

### Metrics Measured

| Metric | Module |
|--------|--------|
| Product Dominance | `attention-metrics` / `commercial-fidelity` |
| Foreground Isolation | `attention-metrics` |
| Attention Hierarchy | Derived score from primary focus + competition |
| Headline Weight | `headlineVisualWeight` |
| Commercial Fidelity | `evaluateCommercialFidelity` |
| Primary Focus Ratio | `attention-metrics` |
| Thumbnail Readability | 120×160 hero saliency (new benchmark metric) |
| Visual Weight | `visual-weight-metrics` |

### Verdict Method

Structured assessment from weighted commercial scores (not pure metric count). Failed generation = automatic WB win (Composition gap). Overall tie-breaker uses composite commercial score; dominance collapse (−12 dominance, −10 fidelity) overrides thumbnail wins.

**Limitation:** WB catalog image used as product photo includes existing infographic composition — ideal input is isolated seller packshot. Documented in competitive analysis.

---

## Aggregate Results

| Metric | Value |
|--------|-------|
| Products tested | **20** |
| Generation success | **10/20 (50%)** |
| **DAOS Wins** | **6** |
| **WB Wins** | **14** |
| **Draws** | **0** |
| DAOS better (overall) | **30%** |
| DAOS wins (successful gen only) | **6/10 (60%)** |

### Per-Category

| Category | DAOS | WB | Draw |
|----------|------|-----|------|
| Электроинструмент | 2 | 1 | 0 |
| Сад | 0 | 3 | 0 |
| Строительство | 2 | 0 | 0 |
| Бытовая техника | 1 | 1 | 0 |
| Дом | 0 | 2 | 0 |
| Авто | 0 | 2 | 0 |
| Кухня | 0 | 2 | 0 |
| Мойка | 1 | 1 | 0 |
| Климат | 0 | 2 | 0 |

### Among Successful Generations (n=10)

| Metric | WB Mean | DAOS Mean | Δ (DAOS − WB) |
|--------|---------|-----------|---------------|
| Product Dominance | — | — | **−1.3** |
| Foreground Isolation | — | — | **+18.7** |
| DAOS win rate | — | — | **60%** |

DAOS improves **scene isolation** (FI +18.7) but does not consistently win **dominance** on real catalog inputs. Generation reliability is the primary blocker.

---

## Gap Classification (WB Wins)

| Gap | Count | Description |
|-----|-------|-------------|
| **Composition** | 10 | Generation pipeline failure (Zod validation on deferred specs) |
| **Product Dominance** | 4 | DAOS generated but dominance −12+ vs WB leader |
| Attention | 0 | — |
| Typography | 0 | — |
| Scene | 0 | (FI improved on average) |

**Top failure mode:** 50% of runs failed before final card — `deferredSpecs` / `deferredBullets` string length validation (>80 chars).

---

## Top 5 Improvements

| # | Improvement | Product Impact | Complexity | Expected Benefit |
|---|-------------|----------------|------------|------------------|
| 1 | **Generation reliability hardening** | CRITICAL | Low–Medium | Fix 50% failure rate; unblock any Beta |
| 2 | **Real seller packshot inputs** | CRITICAL | Low (ops) | +15–25% dominance; removes double-infographic artifact |
| 3 | **Post-overlay dominance preservation gate** | CRITICAL | Medium | Blocks ship when FI/hierarchy collapse after overlay |
| 4 | **Thumbnail 120×160 QA gate** | HIGH | Low | +8–12% CTR proxy; pre-publish legibility check |
| 5 | **Category-tuned attention hierarchy** | HIGH | Medium | Wins in tools/construction; fixes headline competition |

---

## Council Decision

### 1. In what % of cases does DAOS look better than the WB leader?

**30% overall** (6/20).  
**60% among successful generations** (6/10).

Overall figure is depressed by 50% pipeline failure. Where DAOS produces a card, it wins more often than it loses — but reliability prevents market-ready deployment.

### 2. What three reasons most often prevent winning?

1. **Pipeline failure (Composition)** — 10/20 products: generation aborts on validation errors before final PNG.
2. **Product Dominance gap** — 4/10 successful: WB leader retains higher dominance (−12 avg on losses).
3. **Input quality** — WB full card as product source creates cutout/composite artifacts; real packshots required.

### 3. Can closed Beta launch?

## **NOT READY**

**Argumentation:**

| Criterion | Status |
|-----------|--------|
| Compared vs real WB leaders | ✅ 20 products, 9 categories |
| Win/loss statistics | ✅ 6/14/0 |
| Top 5 improvements defined | ✅ |
| Generation reliability | ❌ 50% failure |
| Overall visual superiority | ❌ 30% DAOS wins |
| Dominance on success path | ⚠️ 60% wins but avg Δdominance −1.3 |

**Beta is blocked** until generation success ≥70% and DAOS overall win rate ≥40% on real packshot inputs. Among successful runs DAOS shows promise (60% wins, +18.7 FI) — **READY WITH LIMITATIONS** is achievable after reliability fix + packshot benchmark, not today.

---

## Artifacts

```
benchmark/output/beta-validation-1/
├── product-01/ … product-20/
│   ├── leader.png
│   ├── daos.png
│   ├── comparison.png
│   ├── metrics.json
│   └── review.md
├── summary.json
└── report.html
```

### Reproduce

```bash
cd marketplace-infographic
npx tsx benchmark/beta-validation-1.ts
# BV1_LIMIT=5 for quick smoke test
```

---

## Post-Cycle Rule

> Further development must be driven by **market comparison outcomes**, not internal metrics alone. Every improvement must increase DAOS win probability vs existing WB leader cards.

---

## Related

- [DAOS_COMPETITIVE_ANALYSIS.md](./DAOS_COMPETITIVE_ANALYSIS.md)
- [DAOS_COMMERCIAL_KNOWLEDGE_BASE_V1.md](./DAOS_COMMERCIAL_KNOWLEDGE_BASE_V1.md)
- [DAOS_MARKETPLACE_LEARNING.md](./DAOS_MARKETPLACE_LEARNING.md)

---

**END OF BETA VALIDATION 1**
