# DAOS Category Wave 1 Report — Home (Дом)

**Status:** Complete  
**Priority:** P0  
**Phase:** Category Expansion  
**Date:** 2026-07-11  
**Profile:** 1.1.0-home-wave1  
**Output:** `benchmark/output/category-home/`

---

## Objective

Raise **Дом** Category Win Rate from **57.1%** (BV2 Tier C) to **≥70%** (Tier A) using Category Intelligence — without Foundation/Runtime changes.

---

## Dataset

| Parameter | Value |
|-----------|-------|
| Products tested | **14** (WB harvest limit) |
| Target minimum | 30 (not met) |
| Confidence | **LOW** (n < 30) |
| Category | `home` / Дом |
| Flag | `DAOS_CATEGORY_INTELLIGENCE=1` |

---

## Calibration Applied (v1.1)

Based on BV2 analysis — 5/5 losses = Dominance, LAW_003 headline correlation −0.723:

| Parameter | v1.0 | **v1.1** | Rationale |
|-----------|------|----------|-----------|
| productAreaTarget | 0.44 | **0.45** | Max reachable hero scale |
| maxCharacteristics | 3 | **1** | Reduce sidebar competition |
| badgeLimit | 1 | **0** | Minimize overlay mass |
| headlineFactor | 0.52 | **0.36** | LAW_003 suppression |
| headlineMaxWidth | 58% | **42%** | Narrow headline zone |
| sidebarOpacity | 0.78 | **0.55** | De-emphasize specs |
| dominanceFloor | 50 | **52** | Earlier gate trigger |
| visualHierarchy | product>headline>specs | product>headline>logo>specs | Demote characteristics |

---

## Results

### Category Win Rate

| Metric | BV2 Baseline | Wave 1.1 | Δ |
|--------|--------------|----------|---|
| **Category Win Rate** | 57.1% | **57.1%** | **0pp** |
| DAOS Wins | 8 | 8 | 0 |
| WB Wins | 5 | 5 | 0 |
| Draws | 1 | 1 | 0 |
| 95% Wilson CI | — | 32.6% – 78.6% | — |

### KPI Metrics

| KPI | BV2 Mean | Wave 1.1 Mean | Δ |
|-----|----------|---------------|---|
| Product Dominance | 49.4 | **49.3** | −0.1 |
| Commercial Fidelity | 35.4 | **35.6** | +0.2 |
| Attention Hierarchy | 33.7 | **33.7** | 0 |
| Foreground Isolation | — | **72.8** | — |
| Thumbnail Readability | — | **68.9** | — |

### Generation

| Metric | Result |
|--------|--------|
| Generation Success | **100%** (14/14) |
| Tier A Regression | **NONE** (frozen BV2: 78.6%, 78.6%, 71.4%) |

---

## Per-Product Verdict Comparison

| Slot | BV2 | v1.1 | DAOS Dom Δ | Notes |
|------|-----|------|------------|-------|
| 057 | wb | wb | 40→40 | Worst loss unchanged; headline 27.1 |
| 058 | wb | wb | 47→43 | Dominance worsened |
| 059 | wb | wb | 43→43 | Unchanged |
| 060 | wb | wb | 42→41 | Failure: Attention (was Dominance) |
| 061 | daos | daos | 57→58 | Maintained win |
| 062 | daos | daos | 60→61 | Maintained win |
| 063 | draw | draw | 47→46 | Unchanged |
| 064 | daos | daos | 62→62 | Maintained win |
| 065 | daos | daos | 52→53 | Maintained win |
| 066 | daos | daos | 54→55 | Maintained win |
| 067 | daos | daos | 62→63 | Maintained win |
| 068 | wb | wb | 28→28 | productVW=8 — compositor scale |
| 069 | daos | daos | 46→44 | Maintained win |
| 070 | daos | daos | 52→53 | Maintained win |

**Zero verdict flips.** Typography/composition intent did not convert any WB loss to DAOS win.

---

## Failure Analysis (5 losses)

| Reason | Count |
|--------|-------|
| Dominance | 4 |
| Attention | 1 |

---

## Exit Criteria

| Criterion | Target | Result |
|-----------|--------|--------|
| Category Win Rate | ≥70% | **FAIL** — 57.1% |
| Generation Success | 100% | **PASS** |
| Tier A no degradation | — | **PASS** |
| Product Dominance growth | Confirmed | **FAIL** — −0.1 |

---

## Council Decision

# FAIL

**Удалось ли поднять категорию "Дом" до уровня Tier A?** — **Нет.**

### Rationale

Category Intelligence v1.1 applied measurable LAW_003-driven typography suppression, composition tightening, and background calibration. Results are **statistically identical** to BV2 (8/5/1, 57.1%).

The primary Product Gap is **Product Visual Mass** — flat wide organizers on WB leaders achieve dominance 56–79 with product filling the frame. DAOS lifestyle compositor renders `productVW` 8–18, insufficient for dominance parity regardless of headline suppression.

This gap lives in the **compositor/runtime path** — outside the allowed Category Intelligence scope.

### Primary Product Gap (single)

**Compositor Product Visual Mass** for flat wide home silhouettes (organizers, storage boxes). Evidence: product-057 (DAOS dom 40 vs WB 79, productVW 17.4 vs 18.7 but composite dominance −39); product-068 (productVW 8).

### Recommended Action

Return to category analysis → Product Backlog item:

> Category-tuned compositor hero fill for `home` market group — requires Sprint 8C recalibration benchmark, not Category Intelligence intent.

**Next category (Кухня)** — deferred until home compositor gap is addressed OR kitchen profile validated independently (Wave 1.0 showed +7.1pp without v1.1).

---

## Deliverables

| File | Status |
|------|--------|
| `docs/DAOS_HOME_CATEGORY_PROFILE.md` | ✅ |
| `docs/DAOS_CATEGORY_INTELLIGENCE.md` | ✅ |
| `docs/DAOS_CATEGORY_WAVE_1_REPORT.md` | ✅ |
| `benchmark/output/category-home/summary.json` | ✅ |
| `benchmark/output/category-home/report.html` | ✅ |

---

## Re-run

```bash
cd marketplace-infographic
HOME_RESUME=0 npx tsx benchmark/category-home-validation.ts
```

---

**END OF CATEGORY WAVE 1 REPORT — HOME**
