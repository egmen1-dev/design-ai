# DAOS Commercial Knowledge Base v1

**Status:** Knowledge Freeze  
**Priority:** CRITICAL  
**Phase:** Transition to Beta  
**Date:** 2026-07-11  
**Scope:** Research consolidation only — no production code changes

---

## Executive Summary

DAOS completed the fundamental research phase across **Sprints 1–9.5** and **Quality Cycles 1–5**. This document consolidates statistically confirmed commercial design laws, separates them from hypotheses, maps production usage, documents contradictions, and establishes the governance rule for all future development.

**Sources ingested:**

| Source | Status | Data path |
|--------|--------|-----------|
| Sprint 1–9.5 | Complete | `docs/DAOS_PRODUCT_SPRINT_*`, `benchmark/output/sprint*` |
| Quality Cycle 1 — Dominance | Complete | `benchmark/output/quality-cycle-1/` |
| Quality Cycle 2 — Visual Weight | Complete | `benchmark/output/quality-cycle-2/` |
| Quality Cycle 3 — Foreground Isolation | Complete | `benchmark/output/quality-cycle-3/` |
| Quality Cycle 4 — Attention Competition | Complete | `benchmark/output/quality-cycle-4/` |
| Quality Cycle 5 — Attention Hierarchy | Complete (PARTIAL) | `benchmark/output/quality-cycle-5/` |
| EKB v1.0 (52 WB rules) | Runtime encoded | `commercial-genome-beta/wildberries-hero-rules.ts` |
| User commercial experiments (~50) | **Partially available** | Encoded as EKB v1.0 rules; raw experiment logs not in repo |

**Governance rule (post-freeze):**

> New changes are permitted only if they (1) confirm an existing law with new evidence, or (2) add a new law with experimental proof. Intuition-driven development is no longer permitted. All future Quality Cycles must reference this Knowledge Base.

---

## Commercial Laws Registry

Each law follows the canonical schema:

| Field | Description |
|-------|-------------|
| **Commercial Law** | Stable ID |
| **Description** | Plain-language statement |
| **Evidence** | Cycles, correlations, benchmarks |
| **Confidence** | High / Medium / Low (Council) |
| **Source** | Primary document |
| **Production Status** | PROVEN / LIKELY / HYPOTHESIS / REJECTED |

Full law definitions: [DAOS_COMMERCIAL_LAWS.md](./DAOS_COMMERCIAL_LAWS.md)

### Summary Table

| ID | Law | Status | Confidence | Key Evidence |
|----|-----|--------|------------|--------------|
| LAW_001 | Product Area does not drive Product Dominance | **PROVEN** | High | Cycle 2, r = −0.099 |
| LAW_002 | Foreground Isolation increases Product Dominance | **PROVEN** | High | Cycle 2 r = +0.332; Cycle 3 composited FI = 80.5 |
| LAW_003 | Headline can become the primary attention object | **PROVEN** | High | Cycle 4, r = −0.723 |
| LAW_004 | Badge Competition is not a dominance bottleneck | **PROVEN** | High | Cycle 4, zero delta 5/5 |
| LAW_005 | Attention Hierarchy governs final-card dominance more than Product Area | **PROVEN** | High | Cycle 4–5; dominance +10.2 after LAW_101 |
| LAW_006 | Compositor isolation is sufficient; HTML overlay dilutes it | **PROVEN** | High | Cycle 3–4; FI 80.5 → 33.8 |
| LAW_007 | Hero Visual Weight is a primary dominance driver | **PROVEN** | High | Cycle 1; top-Q 25.4 vs DAOS 19.1 |
| LAW_008 | Sharpness/Contrast cluster explains Hero Visual Weight | **PROVEN** | High | Cycle 2; r ≈ 0.87–0.89 |
| LAW_009 | Texture Competition reduces dominance when elevated | **PROVEN** | Medium | Cycle 2, r = −0.289 |
| LAW_010 | SVG benchmark products invalidate depth/shadow measurements | **PROVEN** | High | Sprint 9.5, Cycle 3–5 |
| LAW_011 | Scene compositor merge is required for professional trust | **PROVEN** | High | Sprint 9.5 0/5 → Cycle 3 5/5 |
| LAW_012 | Layer transition 03→04 collapses dominance (−39.2 avg) | **PROVEN** | High | Cycle 4 layer-delta |
| LAW_013 | Commercial Genome intent does not reach Flux render path | **PROVEN** | High | Sprint 3; 0/5 Flux prompt change |
| LAW_014 | Object Sharpness cluster correlates with dominance | **LIKELY** | Medium | Cycle 2, r = +0.326 |
| LAW_015 | Perspective cues correlate with dominance (DAOS gap large) | **LIKELY** | Low | Cycle 2, r = +0.173; gap −18.1 |
| LAW_016 | Attention Hierarchy CSS governance restores dominance (not universal) | **LIKELY** | Medium | Cycle 5; 1/5 peak on product |
| LAW_017 | Canvas/compositor caps prevent 55% product area via scale alone | **LIKELY** | High | Sprint 7A, 6C calibration |
| LAW_018 | Thumbnail legibility requires bold product silhouette | **HYPOTHESIS** | Low | Cycle 1 qualitative; no 120×160 gate |
| LAW_019 | Hero Lighting post-overlay lifts weak silhouettes | **HYPOTHESIS** | Low | Cycle 3 exit recommendation |
| LAW_020 | Category-specific dominance targets improve calibration | **HYPOTHESIS** | Low | Cycle 1 per-category stats |
| LAW_021 | Product Area 50–60% (EKB) as pixel dominance lever | **REJECTED** | High | Cycle 1–2; zone proxy ~30% both cohorts |
| LAW_022 | Badge visual weight as post-overlay competitor | **REJECTED** | High | Cycle 4 zero delta |
| LAW_023 | Further compositor isolation fixes final-card FI | **REJECTED** | High | Cycle 3–4; compositor already 80.5 |
| LAW_024 | Increasing headline weight improves dominance | **REJECTED** | High | Cycle 4 r = −0.723 |

---

## Commercial Knowledge Matrix

For each law, whether the knowledge is currently used in production subsystems.

| Law | Genome | Prompt | LayoutSpec | Typography | Compositor | Benchmark | Diagnostics | Heatmaps | Product Review |
|-----|--------|--------|------------|------------|------------|-----------|-------------|----------|----------------|
| LAW_001 | PARTIAL | NOT USED | USED | — | — | USED | PARTIAL | — | USED |
| LAW_002 | NOT USED | NOT USED | NOT USED | — | **USED** | USED | PARTIAL | — | USED |
| LAW_003 | PARTIAL | PARTIAL | — | **USED** | — | USED | **USED** | USED | USED |
| LAW_004 | USED | USED | — | — | — | USED | — | — | USED |
| LAW_005 | USED | PARTIAL | — | **USED** | — | USED | **USED** | USED | USED |
| LAW_006 | NOT USED | NOT USED | — | PARTIAL | **USED** | USED | PARTIAL | USED | USED |
| LAW_007 | PARTIAL | PARTIAL | PARTIAL | — | PARTIAL | USED | PARTIAL | — | USED |
| LAW_008 | NOT USED | NOT USED | — | — | PARTIAL | USED | — | — | PARTIAL |
| LAW_009 | PARTIAL | PARTIAL | — | PARTIAL | — | USED | — | — | USED |
| LAW_010 | NOT USED | NOT USED | — | — | — | USED | — | — | USED |
| LAW_011 | PARTIAL | NOT USED | — | — | **USED** | USED | PARTIAL | — | USED |
| LAW_012 | NOT USED | NOT USED | — | **USED** | — | USED | **USED** | USED | USED |
| LAW_013 | USED | PARTIAL | USED | — | — | USED | PARTIAL | — | USED |
| LAW_014 | NOT USED | NOT USED | — | — | PARTIAL | USED | — | — | PARTIAL |
| LAW_015 | PARTIAL | PARTIAL | — | — | PARTIAL | USED | — | — | PARTIAL |
| LAW_016 | PARTIAL | NOT USED | — | **USED** | — | USED | **USED** | USED | USED |
| LAW_017 | USED | NOT USED | USED | — | PARTIAL | USED | PARTIAL | — | USED |
| LAW_018 | PARTIAL | NOT USED | — | — | — | NOT USED | NOT USED | — | PARTIAL |
| LAW_019 | NOT USED | NOT USED | — | — | NOT USED | NOT USED | NOT USED | — | NOT USED |
| LAW_020 | NOT USED | NOT USED | NOT USED | — | — | PARTIAL | NOT USED | — | NOT USED |
| LAW_021 | **USED** | USED | **USED** | — | PARTIAL | USED | PARTIAL | — | USED |
| LAW_022 | USED | USED | — | — | — | USED | — | — | REJECTED |
| LAW_023 | — | — | — | — | — | REJECTED | — | — | REJECTED |
| LAW_024 | — | — | — | REJECTED | — | USED | — | USED | REJECTED |

**Legend:** USED = actively enforced or measured; PARTIAL = encoded but not fully wired; NOT USED = knowledge exists, system ignores it; REJECTED = knowledge disproven, should not be pursued.

**Critical wiring gaps:**

1. **LAW_013** — Genome rules reach Prompt Compiler (v16) but not Flux (v17 production path).
2. **LAW_021 (REJECTED)** — EKB still targets 55% area; pixel research says stop optimizing area.
3. **LAW_018** — No thumbnail gate at WB grid size (120×160).
4. **LAW_012/005** — Final-quality validator still uses layout defaults, not post-render attention metrics.

---

## Experimental Knowledge (Hypotheses — Not Laws)

These factors were investigated but **lack statistical confirmation** or **lack production validation**. They must not be mixed with proven laws.

| Hypothesis | Origin | Why not a law | Next experiment |
|------------|--------|---------------|-----------------|
| **Hero Shape** | EKB qualitative | No pixel correlation run | Shape complexity metric on real photos |
| **Perspective** | Cycle 2 r = +0.173 (low) | Weak WB variance; large DAOS gap may be SVG artifact | Real photo 3/4 angle benchmark |
| **Visual Mass** | EKB / human review | Not isolated as measurable feature | Mass = f(area × contrast × saturation) test |
| **Silhouette Complexity** | Sprint 7A, Cycle 5 | Qualitative; 3/5 SVG cutouts fail hierarchy | Seller PNG cutout suite |
| **Hero Lighting** | Cycle 3 exit rec | Not A/B tested | Post-overlay rim light on weak silhouettes |
| **Background palette control** | Sprint 3 | Flux prompt unchanged 0/5 | Wire commercial intent to v17 render |
| **Category dominance targets** | Cycle 1 categories | n=8–14 per category, not tuned | Per-category regression with n≥30 |
| **Premium feel bands** | Backlog P3-2 | Not measured | Saturation/contrast band experiment |
| **CTR headline templates** | EKB WB-TYPE-* | No CTR data | A/B on WB ads proxy |
| **Information block count** | EKB anti-rules | Partial enforcement only | Overlay density cap experiment |
| **Camera angle by category** | Cycle 1 secondary | Qualitative WB observation | Category-stratified photo harvest |
| **Object Depth as dominance driver** | Cycle 2 r = +0.098 | Negligible WB correlation; DAOS=0 is SVG artifact | Real photos with shadows |
| **Negative Space optimization** | Cycle 2 r = +0.099 | Same as Product Area — negligible | Deprioritize |
| **EKB productAreaTarget 55%** | Genome Beta | REJECTED as dominance lever (LAW_021) | Rephrase as layout aspiration, not pixel target |

---

## Contradictions

Research cycles occasionally produced conflicting recommendations. Each contradiction is resolved here.

### C1: Cycle 2 → Cycle 3 — "Fix compositor" vs "Compositor already sufficient"

| Cycle | Finding |
|-------|---------|
| Cycle 2 | Foreground Isolation top driver (r = +0.332); DAOS −20.2 gap; next sprint = compositor |
| Cycle 3 | Compositor FI = **80.5** (exceeds WB); final FI = **33.8** (+1.3 only) |

**Resolution:** Cycle 2 measured **final cards** where compositor had failed (Sprint 9.5: 0/5). Cycle 3 fixed compositor. The remaining FI gap is **post-compositor** (overlay dilution), not compositor failure. LAW_006 supersedes "fix compositor" for final-card quality.

### C2: Cycle 3 → Cycle 4 — "Isolation fixed" vs "Dominance still failing"

| Cycle | Finding |
|-------|---------|
| Cycle 3 | `png_overlay_feel` eliminated; compositor 5/5; final dominance 40.0 (↓2.4) |
| Cycle 4 | Layer loss dominance −39.2; headline steals peak |

**Resolution:** Compositor success ≠ final-card dominance. The HTML overlay stage is a separate system with its own failure mode. Cycle 4 correctly redirected to Attention Competition.

### C3: Cycle 4 → Cycle 5 — "Headline is enemy" vs "Fix only partial"

| Cycle | Finding |
|-------|---------|
| Cycle 4 | Headline VW r = −0.723; fix typography governance |
| Cycle 5 | Dominance +10.2; peak on product **1/5** only |

**Resolution:** LAW_003 and LAW_005 are proven. LAW_016 is LIKELY — typography caps work on strong silhouettes (construction-vacuum) but not on weak SVG cutouts (drill, sprayer, washer). Product edge density is a confound.

### C4: EKB / Genome vs Pixel Research — Product Area 55%

| Source | Claim |
|--------|-------|
| EKB v1.0 / Genome Beta | `productAreaTarget = 0.55` |
| Cycle 1–2 | WB and DAOS both ~30% zone proxy; r = −0.099 with dominance |

**Resolution:** LAW_021 REJECTED for dominance optimization. The 55% target reflects **layout intent** (EKB experiments) but the **pixel proxy does not discriminate** winners. Genome should not treat area as dominance lever. Compositor caps (LAW_017) make 55% unreachable via scaleBoost alone anyway.

### C5: Backlog vs Cycle 5 Reality

| Document | State |
|----------|-------|
| `DAOS_QUALITY_BACKLOG.md` | P0-7 "MISSING"; Cycle 5 "← NEXT" |
| Cycle 5 report | LAW_101 implemented; PARTIAL exit |

**Resolution:** Backlog stale. Superseded by [DAOS_ROADMAP_AFTER_FREEZE.md](./DAOS_ROADMAP_AFTER_FREEZE.md).

### C6: Cycle 3 exit — "Next = Hero Lighting" vs Cycle 4–5 path

| Cycle | Recommendation |
|-------|----------------|
| Cycle 3 exit | Hero Lighting (sharpness cluster) |
| Cycle 4–5 | Attention Competition → Hierarchy |

**Resolution:** Cycle 4 layer analysis proved overlay competition was the **larger immediate lever** (−39.2 dominance loss vs −5.4 visual weight on final). Hero Lighting remains a **hypothesis** (LAW_019) for weak-silhouette products after hierarchy caps.

---

## Council Review

Per-law confidence with rationale.

| Law | Confidence | Rationale |
|-----|------------|-----------|
| LAW_001 | **High** | n=120 WB; |r|<0.10; confirmed Cycle 1 + 2; DAOS ≈ WB on area |
| LAW_002 | **High** | r=+0.332 WB; Cycle 3 composited 80.5 proves mechanism |
| LAW_003 | **High** | r=−0.723 WB n=120; heatmaps confirm peak shift |
| LAW_004 | **High** | Zero badge delta 5/5; reproducible layer analysis |
| LAW_005 | **High** | Cycle 4 layer loss + Cycle 5 dominance +10.2 |
| LAW_006 | **High** | Direct layer measurement; FI 80.5→33.8 |
| LAW_007 | **High** | Cycle 1 quartile analysis; consistent across 125 cards |
| LAW_008 | **High** | r>0.87 decomposition; internally consistent |
| LAW_009 | **Medium** | r=−0.289; DAOS already below WB on texture |
| LAW_010 | **High** | Object Depth=0, lighting=−80 gap; compositor shadow failures |
| LAW_011 | **High** | 0/5→5/5 compositor; `png_overlay_feel` eliminated |
| LAW_012 | **High** | Measured per-product layer deltas; heatmap corroboration |
| LAW_013 | **High** | Sprint 3 controlled A/B; SHA256 identical Flux prompts |
| LAW_014 | **Medium** | r=+0.326; collinear with LAW_008 cluster |
| LAW_015 | **Low** | r=+0.173 only; high WB variance; SVG confound |
| LAW_016 | **Medium** | Strong on 1/5; LAW_101 pass 2/5; needs real photos |
| LAW_017 | **High** | Sprint 7A/6C empirical curves; math documented |
| LAW_018–020 | **Low** | Qualitative or untested |
| LAW_021–024 | **High** | Rejection backed by multiple cycles |

---

## Final Decision

### Can Commercial Design Theory DAOS be considered formed?

**Answer: PARTIAL**

### Argumentation

**What is formed (YES territory):**

1. **Dominance driver model** — statistically confirmed hierarchy: Foreground Isolation → Sharpness cluster → Attention Hierarchy → (negative) Typography Competition.
2. **Two-stage quality model** — compositor stage (LAW_002, LAW_011) and overlay stage (LAW_003, LAW_005, LAW_012) are distinct systems with distinct fixes.
3. **Measurement SSOT** — 20+ pixel features, correlation matrices, heatmaps, layer deltas across 125+ cards.
4. **Negative knowledge** — Product Area, Badge Competition, further compositor isolation are ruled out.
5. **Production laws** — LAW_101 (Attention Hierarchy) encoded in constitution; foreground-isolation in compositor.

**What is not formed (NO territory):**

1. **Universal execution proof** — Cycle 5 PARTIAL (1/5 peak on product); SVG benchmark limits generalization.
2. **Real seller photography validation** — all 5 DAOS cards use SVG cutouts; WB leaders use packshots.
3. **Thumbnail / CTR validation** — no 120×160 gate; no click-through data.
4. **Genome → render closure** — LAW_013: commercial intent stops at Prompt Compiler; Flux uncontrolled.
5. **User's 50 experiments** — encoded in EKB v1.0 but not individually traceable to pixel outcomes in this repo.

**Conclusion:** DAOS has a **strong, evidence-based theory of commercial dominance drivers** sufficient to govern Quality Cycles 6+. It does **not** yet have a **complete theory of universal card execution** at Wildberries leader level. Theory is **PARTIAL** until Cycle 6 (real photos + thumbnail) confirms or refutes LAW_016 and LAW_018.

---

## Data Index

| Artifact | Path |
|----------|------|
| Cycle 1 aggregate | `marketplace-infographic/benchmark/output/quality-cycle-1/aggregate-stats.json` |
| Cycle 2 correlations | `marketplace-infographic/benchmark/output/quality-cycle-2/correlation-matrix.json` |
| Cycle 3 summary | `marketplace-infographic/benchmark/output/quality-cycle-3/summary.json` |
| Cycle 4 layer delta | `marketplace-infographic/benchmark/output/quality-cycle-4/layer-delta.json` |
| Cycle 4 heatmaps | `marketplace-infographic/benchmark/output/quality-cycle-4/heatmaps/` |
| Cycle 5 A/B | `marketplace-infographic/benchmark/output/quality-cycle-5/summary.json` |
| Sprint 9.5 baseline | `marketplace-infographic/benchmark/output/sprint9_5/` |

---

## Related Documents

- [DAOS_COMMERCIAL_LAWS.md](./DAOS_COMMERCIAL_LAWS.md) — canonical law definitions
- [DAOS_KNOWLEDGE_GAPS.md](./DAOS_KNOWLEDGE_GAPS.md) — remaining unknowns
- [DAOS_ROADMAP_AFTER_FREEZE.md](./DAOS_ROADMAP_AFTER_FREEZE.md) — revised Quality Roadmap
- [DAOS_QUALITY_PROGRAM_V1.md](./DAOS_QUALITY_PROGRAM_V1.md) — program origin (superseded roadmap)

---

**END OF KNOWLEDGE FREEZE v1**
