# DAOS Knowledge Gaps

**Version:** 1.0.0 — Knowledge Freeze  
**Date:** 2026-07-11  
**Parent:** [DAOS_COMMERCIAL_KNOWLEDGE_BASE_V1.md](./DAOS_COMMERCIAL_KNOWLEDGE_BASE_V1.md)

This document answers: **what knowledge is missing for DAOS to reach the level of top Wildberries listing cards?**

Gaps are ordered by **estimated product impact**, not implementation difficulty.

---

## Gap Summary

| # | Gap | Impact | Blocks | Related Law |
|---|-----|--------|--------|-------------|
| G1 | Real seller product photography benchmark | CRITICAL | Universal validation | LAW_010 |
| G2 | Thumbnail / search-grid legibility gate | CRITICAL | CTR proxy | LAW_018 |
| G3 | Universal attention hierarchy on weak silhouettes | HIGH | LAW_016 promotion to PROVEN | LAW_016 |
| G4 | Genome → Flux render path closure | HIGH | Background commercial control | LAW_013 |
| G5 | Final-quality gate uses pixel attention metrics | HIGH | Production enforcement | LAW_005, LAW_012 |
| G6 | Hero lighting for low-edge-density products | MEDIUM | Weak SVG / packshot edge cases | LAW_019 |
| G7 | Category-stratified dominance calibration | MEDIUM | Fair benchmark targets | LAW_020 |
| G8 | CTR / click-through validation | MEDIUM | Commercial outcome proof | — |
| G9 | User 50 experiments traceability | LOW | EKB ↔ pixel outcome mapping | EKB v1.0 |
| G10 | Monthly WB leader re-scan pipeline | LOW | Drift detection | — |

---

## G1 — Real Seller Product Photography Benchmark

**Status:** MISSING  
**Impact:** CRITICAL

### What we know

- All 5 DAOS Quality Cycle benchmarks use **SVG cutouts** (`production-product-images.ts`).
- LAW_010: Object Depth = 0, lighting gap −80, shadow failures on SVG.
- Cycle 5: hierarchy fix works on construction-vacuum (strong silhouette) but not drill/sprayer/washer.
- WB leaders (n=120) use **seller packshots and real product photography**.

### What we don't know

- Whether LAW_016 (Attention Hierarchy) achieves ≥3/5 peak-on-product on **real cutouts**.
- Whether LAW_002 (Foreground Isolation) final-card FI ≥ 50 on real photos.
- Whether compositor shadow/floor-contact succeeds on production seller PNG alpha masks.

### Required experiment

**Quality Cycle 6:** Replace SVG inputs with 5+ seller PNG cutouts per category. Re-run Cycles 3–5 benchmark harness. Success: final dominance ≥ WB median (49) on ≥3/5.

---

## G2 — Thumbnail / Search-Grid Legibility Gate

**Status:** MISSING  
**Impact:** CRITICAL

### What we know

- Cycle 1: "WB winners read at small size because product silhouette is bold."
- Cycle 3/5: casual thumbnail tests per-product — construction-vacuum passes, drill/sprayer fail.
- No automated measurement at **120×160** (WB mobile grid proxy).

### What we don't know

- Correlation between pixel dominance at full resolution and perceived legibility at thumbnail.
- Minimum product silhouette edge energy for scroll-stop at grid size.
- Whether LAW_005 hierarchy fix survives downscale.

### Required experiment

Render 120×160 previews in benchmark harness. Human review protocol (WB search-grid simulation). Optional: edge-saliency peak persistence at thumbnail scale.

---

## G3 — Universal Attention Hierarchy on Weak Silhouettes

**Status:** PARTIAL (1/5 confirmed)  
**Impact:** HIGH

### What we know

- LAW_003 PROVEN: headline steals attention (r = −0.723).
- LAW_016 LIKELY: CSS governance lifts dominance +10.2 aggregate but peak-on-product only 1/5.
- Weak product edge density (drill, sprayer, washer) — headline bar still wins fixation despite reduced VW.

### What we don't know

- Whether silhouette-boost (compositor or post-render) can make hierarchy universal.
- Category-specific headline cap curves (industrial tools vs climate appliances).
- Interaction between LAW_014 (sharpness) and LAW_016 (hierarchy).

### Required experiment

Cycle 6b: A/B hierarchy caps × silhouette boost on real photos. Target: peak-on-product ≥3/5, LAW_101 pass ≥4/5.

---

## G4 — Genome → Flux Render Path Closure

**Status:** MISSING  
**Impact:** HIGH

### What we know

- LAW_013 PROVEN: Commercial Genome changes Prompt Compiler (5/5) but not Flux (0/5).
- Sprint 3: background image diff at identical Flux prompt = generator noise.
- Environment, contrast, scene preference from 52 EKB rules do not affect v17 production backgrounds.

### What we don't know

- Whether wiring commercial snippet into v17 Pollinations path changes background in commercially meaningful ways.
- Whether background complexity control (Cycle 1 gap) is achievable via prompt or requires compositor post-process.

### Required experiment

Controlled A/B: same seed, commercial vs legacy Flux prompt (after v17 wiring). Measure background complexity, hero/headline separation, FI at compositor input.

---

## G5 — Final-Quality Gate Uses Pixel Attention Metrics

**Status:** PARTIAL  
**Impact:** HIGH

### What we know

- `final-quality-validator.ts` flags `product_not_dominant`, `png_overlay_feel` from layout/handler heuristics.
- `attention-hierarchy.ts` captures post-render metrics but only warns (LAW_101).
- Cycle 4: dominance drops −39.2 at overlay — not caught by pre-render gate.

### What we don't know

- Threshold values for blocking release: headline VW max, primary focus min, FI min on final card.
- Whether gate should block on LAW_101 failure or warn only.

### Required experiment

Define gate thresholds from Cycle 5 WB-calibrated distributions. Shadow mode → enforce mode after Cycle 6 validation.

---

## G6 — Hero Lighting for Low-Edge-Density Products

**Status:** NOT TESTED  
**Impact:** MEDIUM

### What we know

- Cycle 3 exit recommended Hero Lighting for sharpness cluster.
- Cycle 4–5 proved overlay competition was larger immediate lever — lighting deferred.
- LAW_019 remains hypothesis.

### What we don't know

- Post-overlay rim light / local contrast boost effect on dominance for drill/sprayer class products.
- Whether lighting helps without increasing headline competition (texture).

### Required experiment

Cycle 7 (after Cycle 6 real photos): A/B hero lighting module on weak-silhouette cohort only.

---

## G7 — Category-Stratified Dominance Calibration

**Status:** NOT TUNED  
**Impact:** MEDIUM

### What we know

- Cycle 1: Строительство 52.4 vs Бытовая техника 44.7 dominance mean.
- Single WB median (49) used as target across all products.
- n=8–14 per category — underpowered for regression.

### What we don't know

- Category-specific dominance drivers (tools favor 3/4 angle, appliances favor packshot).
- Fair pass/fail thresholds per category.

### Required experiment

Harvest n≥30 per top-3 categories. Re-run correlation matrix stratified. Promote LAW_020 if between-category variance is significant.

---

## G8 — CTR / Click-Through Validation

**Status:** NOT AVAILABLE  
**Impact:** MEDIUM

### What we know

- All metrics are **visual proxies** (dominance, FI, heatmaps) — not commercial outcomes.
- EKB psychology rules (WB-PSY-*) based on qualitative WB observation.

### What we don't know

- Whether dominance +10.2 (Cycle 5) correlates with CTR lift on WB.
- Relative importance of thumbnail vs full-card for click decision.

### Required experiment

Out of repo scope for freeze. Requires WB seller A/B or external panel study. Until then, dominance score remains best available proxy.

---

## G9 — User 50 Commercial Experiments Traceability

**Status:** PARTIAL  
**Impact:** LOW (documentation)

### What we know

- EKB v1.0 encodes **52 rules** from `experimental_knowledge_base_v1` (Commercial Genome Beta report).
- Rules cover Hero, Hierarchy, Typography, Psychology, Environment, etc.
- Some EKB rules **conflict** with pixel research (e.g., productAreaTarget 55% vs LAW_021 REJECTED).

### What we don't know

- Individual experiment designs, sample sizes, and outcomes for each of ~50 user experiments.
- Which EKB rules have pixel-cycle confirmation vs qualitative only.

### Required action

Map EKB rule IDs to commercial law IDs. Flag EKB rules as CONFIRMED / CONFLICTING / UNTESTED in Genome metadata. Raw experiment logs requested from knowledge owner.

---

## G10 — Monthly WB Leader Re-Scan

**Status:** MANUAL  
**Impact:** LOW

### What we know

- Cycle 1 harvested 1,099 IDs, analyzed 120.
- WB listing aesthetics drift over time.

### What we don't know

- Whether current correlation weights (r=0.332 FI, r=−0.723 headline VW) hold on 2026-H2 data.

### Required action

Automate `quality-cycle-1-collect.ts` monthly. Alert if top-driver correlations shift >0.1.

---

## Path to Wildberries Leader Level

```
Current state (Cycle 5):
  Compositor:     ✅ 5/5 (LAW_011)
  Overlay feel:   ✅ eliminated (LAW_011)
  Final dominance: ⚠️ 49.4 avg with hierarchy ON (near WB median 49)
  Peak on product: ❌ 1/5 (LAW_016 partial)
  Benchmark input: ❌ SVG only (LAW_010)
  Thumbnail gate:  ❌ missing (LAW_018)
  Genome→Flux:    ❌ broken (LAW_013)

Minimum to claim "leader parity":
  1. G1 — real photos, ≥3/5 dominance ≥ WB median
  2. G2 — thumbnail gate pass ≥3/5
  3. G3 — peak on product ≥3/5
  4. G5 — final-quality gate enforces LAW_101 + FI floor
```

**Estimated closure:** Quality Cycles 6–7 covering G1–G3 and G5. G4 (Flux) may run parallel as Product Sprint, not Quality Cycle.

---

## Related

- [DAOS_ROADMAP_AFTER_FREEZE.md](./DAOS_ROADMAP_AFTER_FREEZE.md) — scheduled cycles for gap closure
- [DAOS_COMMERCIAL_LAWS.md](./DAOS_COMMERCIAL_LAWS.md) — proven vs hypothesis boundary

---

**END OF KNOWLEDGE GAPS v1**
