# DAOS Quality Backlog

**Program:** DAOS Quality Program v1  
**Sources:** Cycle 1 (Dominance) + Cycle 2 (Visual Weight) + Cycle 3 (Isolation) + **Cycle 4 (Attention)**  
**Updated:** 2026-07-11  
**Rule:** Items sorted by **Product Impact**, not implementation difficulty.

---

## P0 — Critical (blocks Beta listing quality)

| Priority | Problem | Est. Impact | Status | Sprint | Complexity | Dependencies |
|----------|---------|------------|--------|--------|------------|--------------|
| P0-1 | **Compositor scene merge fails** | +25–35% perceived quality | **DONE** — 5/5 (Cycle 3) | Cycle 3 | Medium | — |
| P0-2 | **`png_overlay_feel`** | +20% trust | **DONE** — eliminated (Cycle 3) | Cycle 3 | Medium | P0-1 |
| P0-3 | **`product_not_dominant`** — final 40 vs composited 79 | +10–15% CTR proxy | **FAILING** | **Cycle 5** | Medium | P0-7 |
| P0-4 | **Foreground Isolation (compositor)** — 80.5 composited | +33% dominance | **DONE** compositor | Cycle 3 | Medium | — |
| P0-5 | **Foreground Isolation (final card)** — 33.8 vs WB 52.7 | +33% final dominance | **FAILING** | **Cycle 5** | Low | P0-7 |
| P0-6 | **Object Depth = 0** on SVG benchmark | +10% integration | **MISSING** | Cycle 5b | Medium | Real photos |
| **P0-7** | **Headline Visual Weight** — r=−0.723 with dominance; layer +10 after overlay | **+72% dominance** | **MISSING** | **Cycle 5 Exec** | Low | Cycle 4 research |

---

## P1 — High (major commercial lift)

| Priority | Problem | Est. Impact | Status | Sprint | Complexity | Dependencies |
|----------|---------|------------|--------|--------|------------|--------------|
| P1-1 | **Typography Contrast** — +39 avg after overlay; r=−0.595 | +60% dominance | **MISSING** | Cycle 5 Exec | Low | P0-7 |
| P1-2 | **Typography Competition Index** — +9.2 after overlay | +54% dominance | **MISSING** | Cycle 5 Exec | Low | P0-7 |
| P1-3 | **Attention peak shift** — hero→headline (heatmap confirmed) | Diagnostic | **CONFIRMED** | Cycle 4 | — | — |
| P1-4 | **SVG benchmark products** | +10–15% validity | **MISSING** | Cycle 6 | Low | Seller PNGs |
| P1-5 | **Final-quality measures composited not final** | Diagnostic gap | **PARTIAL** | Cycle 5 | Low | P0-7 |
| P1-6 | **Object Sharpness cluster** — 24.0 vs WB 30.5 | +32% dominance | **MISSING** | Cycle 5b | Medium | Real cutouts |
| P1-7 | **Badge Competition** — zero delta on overlay | +3% | **SUPPORTED** | — | — | Cycle 4 |

---

## P2 — Medium (polish and alignment)

| Priority | Problem | Est. Impact | Status | Sprint | Complexity | Dependencies |
|----------|---------|------------|--------|--------|------------|--------------|
| P2-1 | **Texture Competition** — r=−0.289 | +29% if violated | **OK** | — | — | Cycle 2 |
| P2-2 | **Product area not a driver** — r=−0.099 | Stop optimizing | **DONE** | — | — | Cycle 2 |
| P2-3 | **`not_professional`** — all runs | +5% trust | **FAILING** | Cycle 5 | Low | P0-7 |
| P2-4 | **Thumbnail validation** at WB grid 120×160 | +8–12% CTR | **MISSING** | Cycle 6 | Low | Cycle 5 |
| P2-5 | **Perspective cues** — 8.6 vs WB 26.7 | +17% dominance | **MISSING** | Cycle 5b | Medium | Compositor |
| P2-6 | **Category dominance targets** | +5% | **NOT TUNED** | Cycle 6 | Low | Model v1 |
| P2-7 | **Wire Attention Model v1** to final-quality gate | Measurement | **MISSING** | Cycle 5 | Med | Research docs |

---

## P3 — Lower (optimization)

| Priority | Problem | Est. Impact | Status | Sprint |
|----------|---------|------------|--------|--------|
| P3-1 | Monthly WB re-scan (100+ cards) | Calibration | **MANUAL** | Cycle 1b |
| P3-2 | Premium feel bands per category | +3% | **NOT MEASURED** | Cycle 6 |
| P3-3 | Information block count limit | +3% | **PARTIAL** | Cycle 5 |
| P3-4 | CTR headline templates | +3% | **PARTIAL** | Cycle 6 |
| P3-5 | Hero lighting post-overlay | +3% | **PLANNED** | Cycle 5b |

---

## Recommended Sprint Sequence (updated)

```
Quality Cycle 2  →  Visual Weight Research          ✅ COMPLETE
Quality Cycle 3  →  Foreground Isolation Exec       ✅ COMPLETE
Quality Cycle 4  →  Attention Competition Research ✅ COMPLETE
Quality Cycle 5  →  Typography Weight Governance    ← NEXT
Quality Cycle 6  →  Real product photos + thumbnail
```

---

## Single Highest-Impact Fix (Cycle 4 Council)

**Headline Visual Weight** — cap typography competition on final card overlay.

| Evidence | Value |
|----------|-------|
| r with dominance | **−0.723** |
| DAOS gap | **−8.7** |
| Layer gain 03→04 | **+10.1** |
| FI loss | **−46.7** |
| Heatmap peak shift | hero (0.39,0.23) → headline (0.12,0.07) |

Compositor is sufficient. **Do not** add more isolation. Fix overlay stage.

---

## Definition of Done

| Item | Done when |
|------|-----------|
| P0-7 | Headline VW on final card ≤ WB median (24.7) on ≥3/5 |
| P0-5 | Final FI ≥ 50 on ≥3/5 production cards |
| P0-3 | Final dominance ≥ WB median (49) on ≥3/5 |
| P1-1 | Typography contrast delta 03→04 ≤ +10 |
| P2-7 | `evaluateFinalQuality` uses attention metrics |
| P1-4 | Benchmark uses seller PNG cutouts |

---

## Tracking

| Cycle | Status | PR |
|-------|--------|-----|
| Cycle 1 — Dominance Research | **Complete** | #76 |
| Cycle 2 — Visual Weight Research | **Complete** | #77 |
| Cycle 3 — Foreground Isolation | **Complete** | #78 |
| **Cycle 4 — Attention Competition** | **Complete** | TBD |
| Cycle 5 — Typography Governance | **Next** | — |

---

## Out of Scope

No production code changes during research cycles (Cycle 4 complied). Cycle 5 may change typography overlay governance only — not Genome, Layout, Compositor, or Prompt without explicit approval.
