# DAOS Quality Backlog

**Program:** DAOS Quality Program v1  
**Source:** Quality Cycle 1 — Product Dominance Research  
**Updated:** 2026-07-09  
**Rule:** Items sorted by **Product Impact**, not implementation difficulty.

---

## P0 — Critical (blocks Beta listing quality)

| Priority | Problem | Est. CTR Impact | Current Status | Recommended Sprint |
|----------|---------|-----------------|----------------|-------------------|
| P0-1 | **Compositor scene merge fails** — no `03-composited.png`, `floor-contact extract_area` on cutouts | +25–35% perceived quality | **MISSING** — 0/5 Sprint 9.5 | Quality Cycle 2 |
| P0-2 | **`png_overlay_feel`** — product reads as flat overlay, not grounded in scene | +20% professional trust | **FAILING** — all 5 Sprint 9.5 runs | Quality Cycle 2 |
| P0-3 | **`product_not_dominant`** — dominance score 42.4 vs WB 49.6 (−7.2) | +10–15% click proxy | **FAILING** — all 5 Sprint 9.5 runs | Quality Cycle 3 |

---

## P1 — High (major commercial lift)

| Priority | Problem | Est. CTR Impact | Current Status | Recommended Sprint |
|----------|---------|-----------------|----------------|-------------------|
| P1-1 | **Low hero visual weight** — 19.1 vs WB leaders 23.9 (top-Q 25.4) | +15–20% dominance | **PARTIAL** — layout targets exist, output weak | Quality Cycle 3 |
| P1-2 | **SVG benchmark products** — not representative of seller photography | +10–15% area/dominance validity | **MISSING** — Sprint 9.5 used SVG | Quality Cycle 5 |
| P1-3 | **No thumbnail validation** — cards not reviewed at WB grid size (~120×160) | +8–12% CTR | **MISSING** | Quality Cycle 4 |
| P1-4 | **Commercial fidelity below WB mean** — 32.9 vs 38.2 | +8% listing competitiveness | **BELOW MARKET** | Quality Cycle 3 |
| P1-5 | **Final-quality uses layout default** — `productAreaPct ?? 62` masks real pixel weakness | Diagnostic blind spot | **PARTIAL** | Quality Cycle 3 |

---

## P2 — Medium (polish and alignment)

| Priority | Problem | Est. CTR Impact | Current Status | Recommended Sprint |
|----------|---------|-----------------|----------------|-------------------|
| P2-1 | **Typography competes with product** — headline edge energy; top WB winners have lower density | +5–8% | **PARTIAL** — hierarchy rules exist | Quality Cycle 4 |
| P2-2 | **Background too flat** — complexity 0.5 vs WB 1.9; lacks depth cues | +5% | **PARTIAL** | Quality Cycle 3 |
| P2-3 | **Product area measure mismatch** — pixel proxy ~30% for both cohorts vs EKB 55% target | Diagnostic confusion | **PARTIAL** | Quality Cycle 3 |
| P2-4 | **Post-composite lighting harmonization** — product lighting ≠ scene | +5% | **PARTIAL** | Quality Cycle 2 |
| P2-5 | **`not_professional` flag** — all Sprint 9.5 runs | +5% trust | **FAILING** | Quality Cycle 3 |
| P2-6 | **Category dominance variance** — appliances 44.7 vs construction 52.4 on WB | +5% category fit | **NOT TUNED** | Quality Cycle 4 |
| P2-7 | **Badge visual weight** — EKB limit 2 but styling heavy | +3–5% | **PARTIAL** | Quality Cycle 4 |

---

## P3 — Lower (optimization)

| Priority | Problem | Est. CTR Impact | Current Status | Recommended Sprint |
|----------|---------|-----------------|----------------|-------------------|
| P3-1 | **Monthly WB leader re-scan** (100+ cards) for drift | Ongoing calibration | **MANUAL** | Quality Cycle 1b |
| P3-2 | **Premium feel bands** — saturation/luminance per category | +3% | **NOT MEASURED** | Quality Cycle 5 |
| P3-3 | **Information block count** on overlay | +3% | **PARTIAL** | Quality Cycle 4 |
| P3-4 | **CTR headline templates** per category | +3% | **PARTIAL** | Quality Cycle 5 |
| P3-5 | **Camera angle policy** per category (3/4 studio vs frontal) | +3% | **PARTIAL** — scene planner | Quality Cycle 5 |

---

## Recommended Sprint Sequence

```
Quality Cycle 2  →  Compositor reliability (P0-1, P0-2, P2-4)
Quality Cycle 5  →  Real product photos (P1-2) — parallel with Cycle 2
Quality Cycle 3  →  Visual weight + dominance gates (P0-3, P1-1, P1-4, P1-5, P2-2, P2-3, P2-5)
Quality Cycle 4  →  Thumbnail + typography + badges (P1-3, P2-1, P2-6, P2-7, P3-3)
Quality Cycle 5b →  Category premium tuning (P3-2, P3-4, P3-5)
```

---

## Definition of Done (per backlog item)

| Item | Done when |
|------|-----------|
| P0-1 | ≥4/5 production benchmark cards produce `03-composited.png` on real photos |
| P0-2 | `png_overlay_feel` absent on ≥4/5 production runs |
| P0-3 | Pixel `productDominanceScore` ≥ WB median (49) on ≥3/5 DAOS cards |
| P1-3 | Human sign-off at 120×160 thumbnail on 5-product panel |
| P1-2 | Benchmark uses seller PNG cutouts, not SVG |

---

## Out of Scope (Quality Program v1)

These are **not** backlog items — architecture freeze during research:

- Commercial Genome changes
- LayoutSpec / Propagation / Calibration changes
- Geometry clamp changes
- Prompt / Flux changes
- New Registry / RFC

---

## Tracking

| Cycle | Status | PR |
|-------|--------|-----|
| Cycle 1 — Dominance Research | **Complete** | TBD |
| Cycle 2 — Compositor | Planned | — |
| Cycle 3 — Visual Weight | Planned | — |
| Cycle 4 — Thumbnail CTR | Planned | — |
| Cycle 5 — Real Photos | Planned | — |
