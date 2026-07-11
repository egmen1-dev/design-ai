# DAOS Commercial Laws

**Version:** 1.0.0 — Knowledge Freeze  
**Date:** 2026-07-11  
**Parent:** [DAOS_COMMERCIAL_KNOWLEDGE_BASE_V1.md](./DAOS_COMMERCIAL_KNOWLEDGE_BASE_V1.md)

Canonical registry of commercial design laws. Each entry uses the schema:

```
Commercial Law | Description | Evidence | Confidence | Source | Production Status
```

**Status values:** PROVEN · LIKELY · HYPOTHESIS · REJECTED

---

## PROVEN Laws

### LAW_001 — Product Area Does Not Drive Product Dominance

| Field | Value |
|-------|-------|
| **Description** | Measured Product Area % (hero-zone clarity proxy) has negligible correlation with Product Dominance on Wildberries leader cards. Optimizing area alone will not lift dominance. |
| **Evidence** | Quality Cycle 2: Pearson r = **−0.099** (n=120 WB). Cycle 1: WB mean 29.5%, DAOS 31.0% — both cohorts similar, DAOS dominance −7.2. |
| **Confidence** | **High** — |r| < 0.10; reproduced across two cycles |
| **Source** | `DAOS_VISUAL_WEIGHT_RESEARCH.md`, `DAOS_PRODUCT_DOMINANCE_RESEARCH.md` |
| **Production Status** | **PROVEN** |

---

### LAW_002 — Foreground Isolation Increases Product Dominance

| Field | Value |
|-------|-------|
| **Description** | Product edges must separate sharply from background. Higher Foreground Isolation (hero edge density / global ratio) predicts higher Product Dominance. |
| **Evidence** | Cycle 2: r = **+0.332** (n=120). Cycle 3: composited FI = **80.5** (exceeds WB median 50.2). DAOS gap at Cycle 2: −20.2. |
| **Confidence** | **High** |
| **Source** | `DAOS_VISUAL_WEIGHT_RESEARCH.md`, `DAOS_FOREGROUND_ISOLATION.md` |
| **Production Status** | **PROVEN** — `foreground-isolation.ts` in compositor |

---

### LAW_003 — Headline Can Become the Primary Attention Object

| Field | Value |
|-------|-------|
| **Description** | Headline Visual Weight is a strong negative predictor of Product Dominance. A heavy, high-contrast headline steals fixation from the product. |
| **Evidence** | Cycle 4: r = **−0.723** (n=120). Layer gain 03→04: headline VW **+10.1** avg. Heatmap peak shift: composited (0.39, 0.23) → final (0.12, 0.07). |
| **Confidence** | **High** |
| **Source** | `DAOS_ATTENTION_COMPETITION_RESEARCH.md`, `DAOS_ATTENTION_MODEL_V1.md` |
| **Production Status** | **PROVEN** — mitigated by LAW_101 |

---

### LAW_004 — Badge Competition Is Not a Dominance Bottleneck

| Field | Value |
|-------|-------|
| **Description** | Badge overlay does not measurably increase visual competition on the final card. Typography/headline is the confirmed competitor, not badges. |
| **Evidence** | Cycle 4: `badgeCompetitionDelta = 0` on all 5 products. Badge count ~2 avg (EKB aligned). |
| **Confidence** | **High** |
| **Source** | `DAOS_ATTENTION_COMPETITION_RESEARCH.md` |
| **Production Status** | **PROVEN** |

---

### LAW_005 — Attention Hierarchy Governs Final-Card Dominance More Than Product Area

| Field | Value |
|-------|-------|
| **Description** | The order of visual attention (Product > Headline > Benefits > Badges > Background) is a stronger lever for final-card dominance than geometric product area. |
| **Evidence** | Cycle 4: Primary Focus Ratio r = **+0.744**. Cycle 5: dominance **39.2 → 49.4** (+10.2) after hierarchy CSS; Product Area unchanged (31.0%). |
| **Confidence** | **High** |
| **Source** | `DAOS_ATTENTION_HIERARCHY.md`, `DAOS_QUALITY_CYCLE_5_REPORT.md` |
| **Production Status** | **PROVEN** — LAW_101 in constitution |

---

### LAW_006 — Compositor Isolation Is Sufficient; HTML Overlay Dilutes It

| Field | Value |
|-------|-------|
| **Description** | Foreground Isolation at compositor output is strong (80.5 avg). The HTML typography overlay collapses hero/global edge ratio, causing −46.7 FI loss. Do not add more compositor isolation for final-card FI. |
| **Evidence** | Cycle 3: composited FI 80.5, final 33.8. Cycle 4: avg isolation drop **46.64**, dominance drop **39.2**. |
| **Confidence** | **High** |
| **Source** | `DAOS_QUALITY_CYCLE_3_REPORT.md`, `DAOS_ATTENTION_COMPETITION_RESEARCH.md` |
| **Production Status** | **PROVEN** |

---

### LAW_007 — Hero Visual Weight Is a Primary Dominance Driver

| Field | Value |
|-------|-------|
| **Description** | Edge energy and color variance in the hero zone predict Product Dominance. DAOS underperforms WB leaders on this metric. |
| **Evidence** | Cycle 1: WB mean **23.9**, top-Q **25.4**, DAOS **19.1** (−4.8). Top-Q dominance **59.5** vs DAOS **42.4**. |
| **Confidence** | **High** |
| **Source** | `DAOS_PRODUCT_DOMINANCE_RESEARCH.md` |
| **Production Status** | **PROVEN** |

---

### LAW_008 — Sharpness/Contrast Cluster Explains Hero Visual Weight

| Field | Value |
|-------|-------|
| **Description** | Hero Visual Weight decomposes into Object Sharpness, Local Contrast, Object Contrast, and Object Saturation (r ≈ 0.87–0.89 with visualWeightHero). |
| **Evidence** | Cycle 2 visualWeightCorrelations: Object Sharpness r = **0.893**, Local Contrast **0.887**, Object Contrast **0.870**. |
| **Confidence** | **High** |
| **Source** | `DAOS_VISUAL_WEIGHT_RESEARCH.md` |
| **Production Status** | **PROVEN** (diagnostic) |

---

### LAW_009 — Texture Competition Reduces Dominance

| Field | Value |
|-------|-------|
| **Description** | Higher headline-zone edge density (texture competition) correlates with lower Product Dominance. |
| **Evidence** | Cycle 2: r = **−0.289** (n=120). DAOS already below WB mean on this metric (−1.1 gap). |
| **Confidence** | **Medium** |
| **Source** | `DAOS_VISUAL_WEIGHT_RESEARCH.md` |
| **Production Status** | **PROVEN** |

---

### LAW_010 — SVG Benchmark Products Invalidate Depth/Shadow Measurements

| Field | Value |
|-------|-------|
| **Description** | SVG cutout benchmark products produce Object Depth = 0, flat lighting, and weak silhouettes. Measurements on these inputs cannot validate real-photography commercial quality. |
| **Evidence** | Cycle 2: DAOS Object Depth **0.0** vs WB 15.6; Object Lighting gap **−80.6**. Sprint 9.5: shadow `extract_area` failures on all 5. Cycle 5: 3/5 still headline-first after hierarchy fix. |
| **Confidence** | **High** |
| **Source** | `DAOS_PRODUCT_SPRINT_9_5_REPORT.md`, `DAOS_QUALITY_CYCLE_5_REPORT.md` |
| **Production Status** | **PROVEN** |

---

### LAW_011 — Scene Compositor Merge Is Required for Professional Trust

| Field | Value |
|-------|-------|
| **Description** | Product must be grounded in scene (shadow, floor contact, rim) to eliminate `png_overlay_feel` and achieve professional listing appearance. |
| **Evidence** | Sprint 9.5: compositor **0/5**, `png_overlay_feel` all runs. Cycle 3: compositor **5/5**, flag eliminated. |
| **Confidence** | **High** |
| **Source** | `DAOS_PRODUCT_SPRINT_9_5_REPORT.md`, `DAOS_QUALITY_CYCLE_3_REPORT.md` |
| **Production Status** | **PROVEN** — compositor path fixed |

---

### LAW_012 — Layer Transition 03→04 Collapses Dominance

| Field | Value |
|-------|-------|
| **Description** | Applying HTML overlay after compositor merge causes predictable metric collapse: FI −46.7, Dominance −39.2, Primary Focus −0.30. |
| **Evidence** | Cycle 4 layer-delta.json; per-product heatmaps in `quality-cycle-4/heatmaps/`. |
| **Confidence** | **High** |
| **Source** | `DAOS_ATTENTION_COMPETITION_RESEARCH.md` |
| **Production Status** | **PROVEN** |

---

### LAW_013 — Commercial Genome Intent Does Not Reach Flux Render Path

| Field | Value |
|-------|-------|
| **Description** | Commercial decisions propagate to LayoutSpec and Prompt Compiler (v16) but v17 production render (Pollinations/Flux) receives identical prompts regardless of commercial arm. |
| **Evidence** | Sprint 3: Prompt Compiler changed **5/5**, Flux prompt changed **0/5**. Image diff at same seed: noise only. |
| **Confidence** | **High** |
| **Source** | `DAOS_GENERATION_CONTROL_SURFACE_REPORT.md` |
| **Production Status** | **PROVEN** (as gap) |

---

## LIKELY Laws

### LAW_014 — Object Sharpness Cluster Correlates With Dominance

| Field | Value |
|-------|-------|
| **Description** | Object Sharpness (edge + contrast composite) positively correlates with dominance, as part of the sharpness cluster. |
| **Evidence** | Cycle 2: r = **+0.326**. DAOS gap −6.6. Collinear with LAW_008. |
| **Confidence** | **Medium** |
| **Source** | `DAOS_VISUAL_WEIGHT_RESEARCH.md` |
| **Production Status** | **LIKELY** — compositor rim light partial |

---

### LAW_015 — Perspective Cues Correlate With Dominance

| Field | Value |
|-------|-------|
| **Description** | Left↔right luminance asymmetry (perspective proxy) weakly correlates with dominance; DAOS shows large gap but may be SVG artifact. |
| **Evidence** | Cycle 2: r = **+0.173** (low confidence WB). DAOS 8.6 vs WB 26.7 (−18.1). |
| **Confidence** | **Low** |
| **Source** | `DAOS_VISUAL_WEIGHT_RESEARCH.md` |
| **Production Status** | **LIKELY** — needs real photo validation |

---

### LAW_016 — Attention Hierarchy CSS Governance Restores Dominance (Not Universal)

| Field | Value |
|-------|-------|
| **Description** | Reducing headline font weight, size, and bar contrast restores product dominance on final cards, but effect depends on product silhouette strength. |
| **Evidence** | Cycle 5: dominance +10.2; headline VW −4.5; peak on product **1/5**; LAW_101 pass **2/5**. Construction-vacuum: dominance 62→77, human-first headline→product. |
| **Confidence** | **Medium** |
| **Source** | `DAOS_QUALITY_CYCLE_5_REPORT.md` |
| **Production Status** | **LIKELY** — LAW_101 default ON |

---

### LAW_017 — Canvas/Compositor Caps Prevent 55% Area via Scale Alone

| Field | Value |
|-------|-------|
| **Description** | Even with calibrated objectScale, placement area caps at ~29–39% depending on zone geometry. EKB 55% target unreachable via scaleBoost alone. |
| **Evidence** | Sprint 6C: max calibrated placement **29.5%** at objectScale 0.75. Sprint 7A: observed frame **24.3%** at objectScale 1.0. |
| **Confidence** | **High** (for cap); **LIKELY** (as law vs hypothesis) |
| **Source** | `DAOS_COMMERCIAL_CALIBRATION.md`, `DAOS_COMPOSITOR_CONSTRAINTS.md` |
| **Production Status** | **LIKELY** |

---

## HYPOTHESIS (Not Yet Laws)

### LAW_018 — Thumbnail Legibility Requires Bold Product Silhouette

| Field | Value |
|-------|-------|
| **Description** | WB winners remain readable at 120×160 grid size because product silhouette is bold; DAOS SVG products fail casual scroll test. |
| **Evidence** | Cycle 1 qualitative; Cycle 3/5 thumbnail tests per-product. No automated 120×160 gate. |
| **Confidence** | **Low** |
| **Source** | `DAOS_PRODUCT_DOMINANCE_RESEARCH.md` |
| **Production Status** | **HYPOTHESIS** |

---

### LAW_019 — Hero Lighting Post-Overlay Lifts Weak Silhouettes

| Field | Value |
|-------|-------|
| **Description** | Targeted rim light or local contrast boost on final card may recover dominance for products with low edge density where typography caps are insufficient. |
| **Evidence** | Cycle 3 exit recommendation. Not A/B tested. |
| **Confidence** | **Low** |
| **Source** | `DAOS_QUALITY_CYCLE_3_REPORT.md` |
| **Production Status** | **HYPOTHESIS** |

---

### LAW_020 — Category-Specific Dominance Targets Improve Calibration

| Field | Value |
|-------|-------|
| **Description** | Dominance means vary by WB category (tools 52% vs appliances 45%). Category-aware targets may improve benchmark validity. |
| **Evidence** | Cycle 1 per-category table; n=8–14 per category. |
| **Confidence** | **Low** |
| **Source** | `DAOS_PRODUCT_DOMINANCE_RESEARCH.md` |
| **Production Status** | **HYPOTHESIS** |

---

## REJECTED Laws

### LAW_021 — Product Area 50–60% as Pixel Dominance Lever

| Field | Value |
|-------|-------|
| **Description** | REJECTED: Increasing product area to EKB target 55% will not measurably increase dominance. |
| **Evidence** | LAW_001: r = −0.099. Both cohorts ~30% proxy. LAW_017: 55% unreachable via scale. |
| **Confidence** | **High** (rejection) |
| **Source** | Cycles 1–2, Sprint 6C/7A |
| **Production Status** | **REJECTED** — EKB/Genome still encodes 55%; wiring mismatch |

---

### LAW_022 — Badge Visual Weight as Post-Overlay Competitor

| Field | Value |
|-------|-------|
| **Description** | REJECTED: Badges do not measurably compete with product for attention on overlay stage. |
| **Evidence** | LAW_004: zero delta 5/5. |
| **Confidence** | **High** (rejection) |
| **Source** | Cycle 4 |
| **Production Status** | **REJECTED** |

---

### LAW_023 — Further Compositor Isolation Fixes Final-Card FI

| Field | Value |
|-------|-------|
| **Description** | REJECTED: Additional compositor isolation work will not fix final-card Foreground Isolation. Problem is overlay stage. |
| **Evidence** | LAW_006: compositor FI already 80.5. |
| **Confidence** | **High** (rejection) |
| **Source** | Cycles 3–4 |
| **Production Status** | **REJECTED** |

---

### LAW_024 — Increasing Headline Weight Improves Dominance

| Field | Value |
|-------|-------|
| **Description** | REJECTED: Bolder, larger, higher-contrast headlines decrease product dominance. |
| **Evidence** | LAW_003: r = −0.723. Pre-Cycle-5 defaults (weight 800, bar 0.93 opacity) were anti-commercial. |
| **Confidence** | **High** (rejection) |
| **Source** | Cycle 4, `DAOS_ATTENTION_HIERARCHY.md` |
| **Production Status** | **REJECTED** |

---

## Constitution Cross-Reference

| DAOS Law ID | Constitution | Relationship |
|-------------|--------------|--------------|
| LAW_101 | `design-constitution/laws/index.ts` | Implements LAW_005, mitigates LAW_003 |
| LAW_003 (Constitution) | Whitespace 20–35% | Geometry law — orthogonal to commercial LAW_003 (headline attention) |
| EKB WB-HERO-* | `wildberries-hero-rules.ts` | 52 rules from user experiments; some conflict with LAW_021 |

**Naming note:** Commercial LAW_003 (headline attention) is distinct from Constitution LAW_003 (whitespace). Knowledge Freeze commercial laws use `LAW_001–024` namespace in this document only.

---

## Amendment Protocol

After Knowledge Freeze v1:

1. **Confirm existing law** — new Quality Cycle must cite law ID, reproduce measurement, extend n or cohort.
2. **Add new law** — requires PROVEN or LIKELY status with correlation or A/B evidence; Council confidence assigned.
3. **Reject law** — requires contradicting evidence across ≥2 measurement surfaces.
4. **No intuition changes** — changes without experimental proof are blocked.

---

**END OF COMMERCIAL LAWS v1**
