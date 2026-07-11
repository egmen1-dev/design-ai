# DAOS Category Analysis — Beta Validation 2

**Date:** 2026-07-11  
**Source:** `benchmark/output/beta-validation-2/summary.json`  
**n = 120** products across **9** categories

---

## Category Scorecard

| Category | n | DAOS Wins | WB Wins | Draws | **Win Rate** | Avg Dominance | Avg Fidelity | Avg Attention |
|----------|---|-----------|---------|-------|--------------|---------------|--------------|---------------|
| Электроинструмент | 14 | 11 | 1 | 2 | **78.6%** | 52.1 | 38.2 | 36.1 |
| Авто | 14 | 11 | 3 | 0 | **78.6%** | 51.8 | 37.5 | 35.8 |
| Строительство | 14 | 10 | 3 | 1 | **71.4%** | 53.4 | 39.1 | 36.4 |
| Сад | 14 | 9 | 3 | 2 | 64.3% | 49.2 | 35.8 | 34.9 |
| Бытовая техника | 14 | 9 | 3 | 2 | 64.3% | 50.1 | 36.4 | 35.2 |
| Дом | 14 | 8 | 5 | 1 | 57.1% | 48.6 | 34.9 | 34.1 |
| Климат | 8 | 4 | 3 | 1 | 50.0% | 47.2 | 33.8 | 33.5 |
| Кухня | 14 | 7 | 4 | 3 | 50.0% | 49.8 | 35.1 | 34.7 |
| Мойка | 14 | 7 | 5 | 2 | 50.0% | 51.2 | 36.0 | 35.0 |

---

## Tier Classification

### Tier A — Strong (Win Rate ≥70%)

| Category | Win Rate | Strength |
|----------|----------|----------|
| **Электроинструмент** | 78.6% | Industrial silhouettes; packshot crop effective |
| **Авто** | 78.6% | High product mass; low typography competition |
| **Строительство** | 71.4% | Scene integration competitive |

**Council:** Ready for Closed Beta pilot in these categories.

### Tier B — Competitive (60–69%)

| Category | Win Rate | Note |
|----------|----------|------|
| Сад | 64.3% | Dominance losses on complex tools |
| Бытовая техника | 64.3% | Near parity; fidelity gap on losses |

### Tier C — Requires Calibration (≤59%)

| Category | Win Rate | Primary Failure |
|----------|----------|-----------------|
| **Дом** | 57.1% | Dominance (5/5 WB wins) |
| **Климат** | 50.0% | Category Specific (3) — small appliances |
| **Кухня** | 50.0% | Dominance (4) |
| **Мойка** | 50.0% | Background + Dominance |

---

## Failure Reasons by Category

| Category | Dominance | Background | Category Specific | Other |
|----------|-----------|------------|-------------------|-------|
| Электроинструмент | 0 | 1 | 0 | 0 |
| Строительство | 3 | 0 | 0 | 0 |
| Сад | 3 | 0 | 0 | 0 |
| Авто | 2 | 1 | 0 | 0 |
| Дом | 5 | 0 | 0 | 0 |
| Климат | 0 | 0 | 3 | 0 |
| Кухня | 4 | 0 | 0 | 0 |
| Бытовая техника | 2 | 0 | 0 | 1 Lighting |
| Мойка | 2 | 2 | 0 | 0 |

---

## Category Variance

Categories with highest deviation from global 63% win rate:

| Category | Win Rate | Δ from global |
|----------|----------|---------------|
| Электроинструмент | 78.6% | +15.6pp |
| Авто | 78.6% | +15.6pp |
| Климат | 50.0% | −13.0pp |
| Кухня | 50.0% | −13.0pp |
| Мойка | 50.0% | −13.0pp |

**Interpretation:** DAOS competitive advantage is **category-dependent**, not uniform. Industrial/tool categories show reproducible dominance; home/climate/cleaning need separate calibration tracks.

---

## Missing Market Categories

Not present in current WB harvest (documented for dataset v3):

- Освещение
- Хранение
- Электроника
- Товары для ремонта

---

## Calibration Recommendations (Product Backlog)

| Priority | Category | Action |
|----------|----------|--------|
| P0 | Климат | Category-specific hero scale + scene template |
| P0 | Дом | Dominance floor gate per LAW_003 |
| P1 | Кухня | Thumbnail + dominance joint optimization |
| P1 | Мойка | Background separation tuning |
| P2 | Expand harvest | Add 4 missing categories, target n=200 |

---

**END OF CATEGORY ANALYSIS**
