# DAOS Beta Validation 2 Report

**Status:** Complete  
**Priority:** P0  
**Phase:** Closed Beta Readiness  
**Date:** 2026-07-11  
**Benchmark:** `marketplace-infographic/benchmark/beta-validation-2.ts`  
**Output:** `marketplace-infographic/benchmark/output/beta-validation-2/`

---

## Objective

Confirm that DAOS competitive advantage (observed at n=20 in Beta Validation 1 / ROI sprint at **85%**) **reproduces at scale** on real Wildberries market data — without product changes.

**This sprint is validation only.** No production pipeline modifications.

---

## Dataset

| Parameter | Value |
|-----------|-------|
| Products tested | **120** |
| Categories covered | **9** (harvest limit) |
| Min per category | 8–14 (Климат n=8; others n=14) |
| Packshot input | Hero-zone crop (`BV1_PACKSHOT_INPUT=1`) |
| Missing harvest categories | Освещение, Хранение, Электроника, Товары для ремонта |

**Confidence level:** **HIGH** (100 ≤ n < 300)

---

## Aggregate Results

| Metric | BV1 (n=20) | ROI Sprint (n=20) | **BV2 (n=120)** |
|--------|------------|-------------------|-----------------|
| Generation Success | 50% → 100% | 100% | **100%** |
| Market Win Rate | 30% → 85% | 85% | **63%** |
| DAOS Wins | 6 → 17 | 17 | **76** |
| WB Wins | 14 → 3 | 3 | **30** |
| Draws | 0 → 0 | 0 | **14** |

### Statistical Validation — Market Win Rate

| Stat | Value |
|------|-------|
| Point estimate | **63.3%** |
| 95% Wilson CI | **54.4% – 71.4%** |
| n | 120 |
| Confidence | **HIGH** |

**Key finding:** The 20-product sample **overestimated** market win rate. At n=120, confirmed win rate is **63%** — statistically below the **75%** Closed Beta exit threshold.

---

## KPI Statistics (DAOS generated cards, n=120)

| KPI | Mean | Std Dev | 95% CI | Outliers |
|-----|------|---------|--------|----------|
| Product Dominance | 50.7 | 10.9 | 48.7 – 52.6 | 21, 22 |
| Commercial Fidelity | 36.6 | 9.9 | 34.8 – 38.3 | — |
| Foreground Isolation | 60.9 | 14.0 | 58.4 – 63.4 | 103.5, 113.3 |
| Attention Hierarchy | 35.2 | 4.7 | 34.4 – 36.1 | 48.7, 49.6 |
| Thumbnail Readability | 65.4 | 13.5 | 63.0 – 67.8 | 19.9, 28.6, 99.8, 100 |
| Headline Weight | 16.8 | 6.3 | 15.7 – 17.9 | — |
| Primary Focus Ratio | — | — | — | — |
| Δ Dominance vs WB | −2.1 | — | — | — |

---

## Category Win Rate

| Category | n | Win Rate | Avg Dominance | Top Failure |
|----------|---|----------|---------------|-------------|
| Электроинструмент | 14 | **78.6%** | — | Background |
| Авто | 14 | **78.6%** | — | Dominance |
| Строительство | 14 | **71.4%** | — | Dominance |
| Сад | 14 | 64.3% | — | Dominance |
| Бытовая техника | 14 | 64.3% | — | Dominance |
| Дом | 14 | 57.1% | — | Dominance |
| Климат | 8 | 50.0% | — | Category Specific |
| Кухня | 14 | 50.0% | — | Dominance |
| Мойка | 14 | 50.0% | — | Background |

---

## Failure Analysis (30 DAOS losses)

| Reason | Count |
|--------|-------|
| **Dominance** | 21 |
| Background | 4 |
| Category Specific | 3 |
| Lighting | 1 |
| Typography | 1 |

---

## Regression Check

| Check | Result |
|-------|--------|
| Generation Success = 100% | **PASS** |
| No production crashes | **PASS** |
| BV1 overlapping 20 products | 3 prior DAOS wins regressed (different run conditions / expanded pool) |
| Critical new pipeline errors | **NONE** |

---

## Exit Criteria

| Criterion | Target | Result |
|-----------|--------|--------|
| Generation Success | 100% | **PASS** |
| Market Win Rate | ≥75% | **FAIL** — 63% (CI upper 71.4%) |
| Reproducible categories | All | **PARTIAL** — 3 categories <60% |
| No critical degradation | — | **PASS** (pipeline) |
| HIGH statistical confidence | n≥100 | **PASS** |

---

## Council Decision

### **NOT READY** for Closed Beta

**Rationale:** Pipeline is production-stable (100% generation). Market competitiveness at scale is **63%** with HIGH confidence — below the **75%** exit gate. Dominance remains the primary loss driver (70% of defeats). Climate, Kitchen, and Pressure-wash categories require calibration before seller onboarding.

**Recommended path:** Product Backlog items for category-specific dominance tuning and true seller packshots — **after** validation freeze.

---

## Deliverables

- `benchmark/output/beta-validation-2/summary.json`
- `benchmark/output/beta-validation-2/report.html`
- `benchmark/output/beta-validation-2/dashboard.html`
- `docs/DAOS_MARKET_CONFIDENCE_REPORT.md`
- `docs/DAOS_CATEGORY_ANALYSIS.md`

---

## Re-run

```bash
cd marketplace-infographic
BV2_LIMIT=120 npx tsx benchmark/beta-validation-2.ts
# Resume: BV2_RESUME=1 (default)
```

---

**END OF BETA VALIDATION 2 REPORT**
