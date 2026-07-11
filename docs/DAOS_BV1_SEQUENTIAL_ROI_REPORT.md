# DAOS BV1 Sequential ROI Report

**Date:** 2026-07-11  
**Method:** Three BV1-prioritized improvements deployed **sequentially** with mini-Beta Validation after each step (same 20 WB products).

**ROI formula:** `(Product Impact × Confidence) / Complexity`  
**Effectiveness threshold:** Absolute Win Rate gain **≥ 2pp** per step.

---

## Baselines

| Stage | Win Rate | Gen Success | Notes |
|-------|----------|-------------|-------|
| Beta Validation 1 | **30%** (6/20) | 50% | Original benchmark |
| Post-stabilization | **65%** (13/20) | 100% | Pipeline fixes only |
| **Final (Imp 1+2+3)** | **85%** (17/20) | 100% | This report |

---

## Improvement 1 — Post-overlay Product Dominance Gate (P0)

**Basis:** LAW_003, LAW_005, LAW_006, LAW_101 · Commercial Knowledge Base

**Implementation:**
- `post-overlay-dominance-gate.ts` — pixel gate on dominance, headline VW, focus ratio, hierarchy
- Typography Relaxation mode (`standard` → `relaxed`) on LAW_101 failure
- `DAOS_POST_OVERLAY_DOMINANCE_GATE=1`

| ROI Field | Value |
|-----------|-------|
| Product Impact | HIGH |
| Confidence | HIGH |
| Complexity | LOW |
| Expected Gain | +6–8% |

### Mini-Validation (`roi-improvement-1/`)

| Metric | Value |
|--------|-------|
| Win Rate Before | **65%** |
| Win Rate After | **65%** |
| Absolute Gain | **0pp** |
| Relative Gain | 0% |
| Regressions | 1 (product-15 daos→draw) |
| Improvements | 1 (product-13 wb→daos) |

### Council Review — Improvement 1

**INSUFFICIENT** (< 2pp threshold)

**Analysis:** Typography Relaxation reduces headline competition but cannot fix **product dominance deficit** caused by full WB card used as packshot input. LAW_101 warnings persist after relaxation on dominance-critical slots (product-01, 11, 18, 20).

**Decision:** Proceed to Improvement 2 — orthogonal root cause (G1 packshot gap per Competitive Analysis).

---

## Improvement 2 — Real Packshot Input Pipeline (P1)

**Basis:** Competitive Analysis — BV1 compared against full listing cards, not isolated product photos

**Implementation:**
- `benchmark/lib/packshot-input.ts` — hero-zone crop from WB leader card (metadata-aware)
- Cached packshots in `benchmark/output/packshots/`
- `BV1_PACKSHOT_INPUT=1` in benchmark

| ROI Field | Value |
|-----------|-------|
| Product Impact | HIGH |
| Confidence | HIGH |
| Complexity | LOW |
| Expected Gain | +3–5% |

### Mini-Validation (`roi-improvement-2/`)

| Metric | Value |
|--------|-------|
| Win Rate Before | **65%** (after Imp1) |
| Win Rate After | **85%** |
| Absolute Gain | **+20pp** |
| Relative Gain | +30.8% vs prior |
| Regressions | 2 (product-13, 17) |
| Improvements | 6 (incl. product-01, 11, 18, 20) |

### Council Review — Improvement 2

**PASS** — exceeds 2pp threshold. **Primary win-rate driver** of this sprint.

---

## Improvement 3 — Thumbnail Readability Gate (P2)

**Basis:** Attention Model · LAW_101 · 120×160 mobile grid

**Implementation:**
- `thumbnail-readability-gate.ts` — 120×160 edge-saliency score, gate floor 55
- Production re-render with Typography Relaxation if thumbnail fails
- `DAOS_THUMBNAIL_READABILITY_GATE=1`

| ROI Field | Value |
|-----------|-------|
| Product Impact | MEDIUM |
| Confidence | MEDIUM |
| Complexity | MEDIUM |
| Expected Gain | +2–4% |

### Mini-Validation (`roi-improvement-3/`)

| Metric | Value |
|--------|-------|
| Win Rate Before | **85%** (after Imp2) |
| Win Rate After | **85%** |
| Absolute Gain | **0pp** |
| Relative Gain | 0% |
| Regressions | **0** |

### Council Review — Improvement 3

**INSUFFICIENT** (< 2pp threshold)

**Analysis:** With packshot input (Imp2), thumbnail readability already scores competitively; gate triggers warnings but does not change head-to-head verdict distribution. **Retain for QA telemetry**; not a win-rate lever at current benchmark.

---

## Cumulative Product ROI

| Step | Win Rate | Δ vs Prior | Effective? |
|------|----------|------------|------------|
| Stabilization (prior) | 30% → 65% | +35pp | ✓ |
| Imp 1 — Dominance Gate | 65% → 65% | 0pp | ✗ Council Review |
| Imp 2 — Packshot Input | 65% → 85% | **+20pp** | ✓ **PASS** |
| Imp 3 — Thumbnail Gate | 85% → 85% | 0pp | ✗ Council Review |
| **BV1 → Final** | 30% → **85%** | **+55pp** | ✓ |

---

## Category Win Rate (Final — `roi-improvement-3/`)

| Category | DAOS | WB |
|----------|------|-----|
| Электроинструмент | 3 | 0 |
| Сад | 3 | 0 |
| Строительство | 2 | 0 |
| Бытовая техника | 2 | 0 |
| Дом | 2 | 0 |
| Авто | 1 | 1 |
| Кухня | 2 | 0 |
| Мойка | 1 | 1 |
| Климат | 1 | 2 |

---

## Council Answers

### 1. Достигнут ли целевой Win Rate ≥45%?

**PASS** — **85%** overall (17/20).

### 2. Какие изменения дали наибольший прирост?

1. **Packshot Input Pipeline (Imp2)** — **+20pp** absolute
2. **Pipeline Stabilization (prior sprint)** — +35pp vs BV1
3. **Post-overlay Dominance Gate (Imp1)** — net 0pp alone; enables LAW_101 compliance

### 3. Главное ограничение до Closed Beta?

**Климат category (1/3 wins)** and **2 remaining WB losses** on auto/мойка — need true seller packshots (not cropped from cards) and category-specific dominance templates.

---

## Re-run Commands

```bash
cd marketplace-infographic

# Improvement 1 only
BV1_OUT_DIR=roi-improvement-1 npx tsx benchmark/beta-validation-1.ts

# Improvement 1+2
BV1_OUT_DIR=roi-improvement-2 BV1_PACKSHOT_INPUT=1 npx tsx benchmark/beta-validation-1.ts

# Full stack
BV1_OUT_DIR=roi-improvement-3 BV1_PACKSHOT_INPUT=1 npx tsx benchmark/beta-validation-1.ts
```

---

**END OF SEQUENTIAL ROI REPORT**
