# DAOS Quality Program v1

**Status:** Active  
**Phase:** Quality Research → Quality Execution  
**Priority:** CRITICAL  
**Branch:** `cursor/quality-cycle-1-product-dominance-aecb`

---

## Context

Sprint 9.5 validated the **production pipeline**. Platform architecture is sufficient for further work.

The next project phase is **not architecture expansion**. The next phase is **commercial quality of final cards**.

Sprint 9.5 confirmed the first production quality flag:

> **`product_not_dominant`**

This is **Quality Gap №1**.

---

## Program Structure

```
DAOS Quality Program v1
│
├── Cycle 1 — Product Dominance Research     ✅ COMPLETE
│
├── Cycle 2 — Visual Weight Research         ✅ COMPLETE
│   ├── 20 pixel features per card
│   ├── Correlation matrix vs dominance
│   └── Product Dominance Model v2
│
├── Cycle 3 — Visual Weight Execution        ← NEXT
│   └── Foreground isolation + compositor + sharpness cluster
│
├── Cycle 4 — Thumbnail CTR Validation      (planned)
│   └── WB search-grid human review
│
└── Cycle 5 — Real Product Photo Validation (planned)
    └── Replace SVG benchmark inputs
```

---

## Architecture Rule (Program-wide)

During **research cycles**, production code is frozen.

All conclusions must be based on:

1. Real Wildberries card images
2. Production PNG from DAOS (`handleGenerateInfographic`)
3. Sprint 9.5 validation results
4. Existing measurement modules (`commercial-fidelity`, `final-quality-validator`)

**No new Registry. No new RFC. No Genome / Geometry / Compositor / Prompt changes during research.**

---

## Cycle 1 Deliverables

| Deliverable | Path |
|-------------|------|
| Dominance research | `docs/DAOS_PRODUCT_DOMINANCE_RESEARCH.md` |
| Quality backlog | `docs/DAOS_QUALITY_BACKLOG.md` |
| Program overview | `docs/DAOS_QUALITY_PROGRAM_V1.md` |
| Research data | `marketplace-infographic/benchmark/output/quality-cycle-1/` |

---

## Measurement SSOT

| Metric | Module | Notes |
|--------|--------|-------|
| Product Area | `commercial-fidelity/measure.ts` | Hero-zone clarity proxy |
| Product Dominance | `commercial-fidelity/measure.ts` | Hero vs headline energy ratio |
| Commercial Fidelity | `commercial-fidelity/evaluate.ts` | Aggregate 0–100 score |
| Handler quality flags | `design/final-quality-validator.ts` | `product_not_dominant`, `png_overlay_feel` |

---

## Council Decision (Cycle 1)

### What most blocks DAOS from competing with top Wildberries cards today?

**Top-5 Product Gaps** (by impact):

| Rank | Gap | Impact | Implementation order |
|------|-----|--------|----------------------|
| 1 | **Scene integration failure** (`png_overlay_feel`, 0/5 compositor merges) | CRITICAL — product floats as overlay, not in scene | **1st** — Quality Cycle 2 |
| 2 | **Low hero visual weight** (−4.8 vs WB leaders; top quartile +6.3 vs bottom) | HIGH — product does not “own” the frame | **2nd** — Cycle 3 |
| 3 | **Product dominance energy gap** (−7.2 pts vs WB mean; DAOS ≈ WB bottom quartile) | HIGH — confirmed `product_not_dominant` | **2nd** — Cycle 3 |
| 4 | **Typography / headline competition** (DAOS headline zones under-weighted but text still competes visually) | MEDIUM — top WB cards have lower headline density | **3rd** — Cycle 4 |
| 5 | **Benchmark inputs ≠ real seller photos** (SVG cutouts, compositor shadow failures) | MEDIUM — invalidates area/dominance ceiling | **1st parallel** — Cycle 5 |

---

## Success Criteria (Cycle 1)

| Criterion | Met |
|-----------|-----|
| Understand why WB leaders look stronger | Yes — dominance model + top-quartile stats |
| Measurable Product Gap list | Yes — Gap Matrix in research doc |
| Quality Backlog | Yes — `DAOS_QUALITY_BACKLOG.md` |
| Top-5 changes for max commercial lift | Yes — Council section above |

---

## How to Reproduce Cycle 1 Data

```bash
cd marketplace-infographic

# 1. Harvest WB product IDs (requires network)
npx tsx tmp/wb-harvest-ids.ts

# 2. Analyze 120 cards + DAOS baseline
QC1_WB_LIMIT=120 npx tsx tmp/quality-cycle-1-collect.ts
```

Output: `benchmark/output/quality-cycle-1/aggregate-stats.json`

---

## Next Step

**Quality Cycle 2 — Compositor Reliability**  
Fix `compositeProductIntoScene` success path on real cutouts so production cards include `03-composited.png` and eliminate `png_overlay_feel`.

No Genome or Geometry changes until Cycle 2 scope is approved.
