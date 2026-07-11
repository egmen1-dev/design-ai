# DAOS Roadmap After Knowledge Freeze

**Version:** 1.0.0  
**Date:** 2026-07-11  
**Status:** Active — supersedes `DAOS_QUALITY_BACKLOG.md` sprint sequence  
**Parent:** [DAOS_COMMERCIAL_KNOWLEDGE_BASE_V1.md](./DAOS_COMMERCIAL_KNOWLEDGE_BASE_V1.md)

This roadmap reflects **only evidence-backed priorities** after Knowledge Freeze v1. Tasks without law support are removed or deprioritized.

---

## Governance

| Rule | Description |
|------|-------------|
| **Law-first** | Every cycle must cite ≥1 commercial law ID from [DAOS_COMMERCIAL_LAWS.md](./DAOS_COMMERCIAL_LAWS.md) |
| **No intuition** | New work requires PROVEN or LIKELY hypothesis with measurement plan |
| **Research vs execution** | Odd cycles may be research-only; even cycles implement confirmed laws |
| **Frozen layers** | Genome, Prompt, LayoutSpec, Geometry changes require explicit law contradiction proof |

---

## Completed (Archive)

| Cycle / Sprint | Law(s) | Outcome | PR |
|----------------|--------|---------|-----|
| Sprint 9.5 — Production validation | LAW_010, LAW_011 | 5/5 final PNG; 0/5 compositor | — |
| Cycle 1 — Dominance research | LAW_007 | 120 WB + 5 DAOS baseline | #76 |
| Cycle 2 — Visual Weight research | LAW_001, LAW_002, LAW_008, LAW_009 | 20 features, correlation matrix | #77 |
| Cycle 3 — Foreground Isolation exec | LAW_002, LAW_006, LAW_011 | Compositor 5/5; FI 80.5 composited | #78 |
| Cycle 4 — Attention Competition research | LAW_003, LAW_004, LAW_005, LAW_012 | Headline r=−0.723; layer deltas | #79 |
| Cycle 5 — Attention Hierarchy exec | LAW_005, LAW_016 | Dominance +10.2; PARTIAL 1/5 peak | #80 |
| **Knowledge Freeze v1** | ALL | Commercial Knowledge Base sealed | TBD |

---

## Removed / Deprioritized Tasks

Tasks that **lost relevance** after freeze evidence.

| Former ID | Task | Reason for removal |
|-----------|------|-------------------|
| P0-1 | Fix compositor scene merge | **DONE** — LAW_011 PROVEN (Cycle 3) |
| P0-2 | Eliminate `png_overlay_feel` | **DONE** — Cycle 3 |
| P0-4 | Foreground Isolation compositor | **DONE** — FI 80.5 |
| P2-2 | Optimize Product Area | **REJECTED** — LAW_021; stop optimizing |
| P1-7 | Badge Competition fix | **REJECTED** — LAW_022; zero delta |
| — | Further compositor isolation | **REJECTED** — LAW_023 |
| — | Increase headline weight | **REJECTED** — LAW_024 |
| Cycle 3 exit: Hero Lighting first | Deferred | Cycle 4 proved overlay larger lever; LAW_019 hypothesis only |
| P3-1 | Monthly WB re-scan | **P3** — G10; manual until automated |
| Premium feel bands (P3-2) | **P3** — no law; hypothesis only |
| CTR headline templates (P3-4) | **P3** — G8; no CTR data |
| Wire `productAreaTarget` to LAW_003 | **BLOCKED** — LAW_021 REJECTED for dominance |

---

## Elevated Priority Tasks

Tasks **confirmed by research** and previously under-prioritized.

| New ID | Task | Law | Former priority | New priority |
|--------|------|-----|-----------------|--------------|
| **Q6-1** | Real seller PNG benchmark suite | LAW_010 | P1-4 | **P0** |
| **Q6-2** | Thumbnail 120×160 validation gate | LAW_018 | P2-4 | **P0** |
| **Q6-3** | Re-validate LAW_016 on real photos | LAW_016 | P0-7 partial | **P0** |
| **Q6-4** | Wire attention metrics to final-quality gate | LAW_005, LAW_012 | P2-7 | **P1** |
| **Q7-1** | Genome → Flux v17 prompt wiring | LAW_013 | Sprint 3 gap | **P1** |
| **Q7-2** | Category dominance calibration | LAW_020 | P2-6 | **P2** |
| **Q7-3** | Hero lighting A/B (weak silhouettes) | LAW_019 | Cycle 3 exit | **P2** |

---

## Active Roadmap

### Quality Cycle 6 — Real Photos + Thumbnail Validation

**Priority:** P0 — CRITICAL  
**Type:** Benchmark refactor + validation (minimal production: benchmark inputs only)  
**Laws:** LAW_010, LAW_016, LAW_018

| Task | Success criteria |
|------|------------------|
| Replace SVG with ≥5 seller PNG cutouts | Benchmark harness uses real alpha masks |
| Re-run dominance + hierarchy benchmarks | ≥3/5 final dominance ≥ WB median (49) |
| Thumbnail gate at 120×160 | ≥3/5 human legibility pass |
| Promote LAW_016 → PROVEN or refine | Peak on product ≥3/5 |

**Removes blocker:** G1, G2, G3 from Knowledge Gaps.

---

### Quality Cycle 7 — Production Gate + Flux Closure

**Priority:** P1 — HIGH  
**Type:** Execution  
**Laws:** LAW_005, LAW_012, LAW_013, LAW_019

| Task | Success criteria |
|------|------------------|
| Final-quality gate: headline VW ceiling | Uses `attention-metrics.ts` post-render |
| Final-quality gate: FI floor on final card | FI ≥ 45 on ≥3/5 |
| LAW_101 enforce mode (optional block) | Configurable warn → block |
| v17 Flux commercial prompt wiring | ≥3/5 measurable background diff (not noise) |
| Hero lighting A/B on weak silhouettes | Dominance +5 on drill/sprayer cohort |

**Removes blocker:** G4, G5, G6.

---

### Quality Cycle 8 — Category Calibration + EKB Reconciliation

**Priority:** P2 — MEDIUM  
**Type:** Research + metadata  
**Laws:** LAW_020, LAW_021 (reconciliation)

| Task | Success criteria |
|------|------------------|
| Harvest n≥30 per category (tools, climate, appliances) | Stratified correlation matrix |
| EKB rule ↔ commercial law mapping | Each WB-HERO-* tagged CONFIRMED/CONFLICTING/UNTESTED |
| Deprecate `productAreaTarget` as dominance lever in Genome docs | LAW_021 alignment |
| Category-specific dominance targets in benchmark | Fair pass/fail per category |

**Removes blocker:** G7, G9.

---

### Ongoing — Monitoring

| Task | Frequency | Law |
|------|-----------|-----|
| WB leader re-scan | Monthly | LAW_007 calibration |
| Benchmark regression on 5-product suite | Per PR touching compositor/typography | LAW_002, LAW_005 |
| Heatmap + layer-delta on overlay changes | Per typography/compositor PR | LAW_012 |

---

## Priority Matrix (Post-Freeze)

### P0 — Critical

| ID | Problem | Law | Cycle |
|----|---------|-----|-------|
| Q6-1 | SVG benchmark invalidates measurements | LAW_010 | 6 |
| Q6-2 | No thumbnail gate | LAW_018 | 6 |
| Q6-3 | Hierarchy not universal (1/5) | LAW_016 | 6 |

### P1 — High

| ID | Problem | Law | Cycle |
|----|---------|-----|-------|
| Q6-4 | Final gate ignores pixel attention | LAW_005, LAW_012 | 7 |
| Q7-1 | Genome doesn't reach Flux | LAW_013 | 7 |
| — | Final FI still below WB (33.8→49.4 partial) | LAW_006 | 6–7 |

### P2 — Medium

| ID | Problem | Law | Cycle |
|----|---------|-----|-------|
| Q7-2 | Category targets not tuned | LAW_020 | 8 |
| Q7-3 | Hero lighting untested | LAW_019 | 7 |
| — | Perspective gap (−18.1) | LAW_015 | 8 (with real photos) |
| — | Object Sharpness gap (−6.6) | LAW_014 | 7 (compositor tuning) |

### P3 — Lower / Blocked

| ID | Problem | Status |
|----|---------|--------|
| — | Product Area optimization | **BLOCKED** (LAW_021) |
| — | Badge competition work | **BLOCKED** (LAW_022) |
| — | More compositor isolation | **BLOCKED** (LAW_023) |
| — | CTR validation | **DEFERRED** (G8) |

---

## Definition of Done (Beta Listing Quality)

Beta commercial quality is achieved when **all** criteria pass on the **real-photo benchmark suite**:

| Criterion | Metric | Target |
|-----------|--------|--------|
| Compositor merge | Success rate | 5/5 |
| `png_overlay_feel` | Handler flag | 0/5 |
| Final Product Dominance | Mean | ≥ WB median (49) |
| Peak on product | Heatmap | ≥ 3/5 |
| LAW_101 pass | Post-render | ≥ 3/5 |
| Final Foreground Isolation | Mean | ≥ 45 |
| Thumbnail legibility | Human review 120×160 | ≥ 3/5 |
| `product_not_dominant` | Handler flag | ≤ 1/5 |

---

## Sprint Sequence Diagram

```
Sprint 9.5 ──► Cycle 1 ──► Cycle 2 ──► Cycle 3 ──► Cycle 4 ──► Cycle 5
(production     (dominance   (visual      (FI exec)   (attention   (hierarchy
 validation)     research)    weight)                  research)    exec)
                                                                    │
                                                                    ▼
                                                          Knowledge Freeze v1
                                                                    │
                    ┌───────────────────────────────────────────────┘
                    ▼
              Cycle 6 ──────────► Cycle 7 ──────────► Cycle 8
              (real photos +     (gates + Flux +      (category +
               thumbnail)         hero lighting)        EKB sync)
```

---

## Backlog Sync

`docs/DAOS_QUALITY_BACKLOG.md` remains as historical record through Cycle 5. **This document is the authoritative roadmap** for all cycles after Knowledge Freeze v1.

Update rule: any new backlog item must include:

1. Commercial Law ID reference
2. Measurement plan
3. Success criteria with n and threshold
4. Council confidence target (promote LIKELY → PROVEN or reject)

---

## Related

- [DAOS_KNOWLEDGE_GAPS.md](./DAOS_KNOWLEDGE_GAPS.md)
- [DAOS_COMMERCIAL_LAWS.md](./DAOS_COMMERCIAL_LAWS.md)
- [DAOS_QUALITY_PROGRAM_V1.md](./DAOS_QUALITY_PROGRAM_V1.md)

---

**END OF ROADMAP AFTER FREEZE**
