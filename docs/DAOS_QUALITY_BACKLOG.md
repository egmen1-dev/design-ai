# DAOS Quality Backlog

**Program:** DAOS Quality Program v1  
**Sources:** Quality Cycle 1 (Dominance) + Quality Cycle 2 (Visual Weight)  
**Updated:** 2026-07-11  
**Rule:** Items sorted by **Product Impact**, not implementation difficulty.

---

## P0 — Critical (blocks Beta listing quality)

| Priority | Problem | Est. Impact | Status | Sprint | Complexity | Dependencies |
|----------|---------|------------|--------|--------|------------|--------------|
| P0-1 | **Compositor scene merge fails** — no `03-composited.png`, `floor-contact extract_area` | +25–35% perceived quality | **MISSING** — 0/5 | Cycle 3 Exec | Medium | Real cutouts |
| P0-2 | **`png_overlay_feel`** — flat overlay, not grounded | +20% trust | **FAILING** | Cycle 3 Exec | Medium | P0-1 |
| P0-3 | **`product_not_dominant`** — 42.4 vs WB 49.6 | +10–15% CTR proxy | **FAILING** | Cycle 3 Exec | Low | Dominance Model v2 |
| **P0-4** | **Foreground Isolation** — 32.5 vs WB 52.7 (**−20.2**); r=0.332 with dominance | **+33% dominance** | **MISSING** | **Cycle 3 Exec** | Medium | P0-1, P0-6 |
| **P0-5** | **Object Sharpness cluster** — sharpness 24.0 vs 30.5, contrast −12.3 | **+32% dominance** | **MISSING** | **Cycle 3 Exec** | Medium | Cutout quality |
| **P0-6** | **Object Depth = 0** — no shadow/gradient cues (WB median 11.0) | +10% integration | **MISSING** | Cycle 3 Exec | Medium | P0-1 |

---

## P1 — High (major commercial lift)

| Priority | Problem | Est. Impact | Status | Sprint | Complexity | Dependencies |
|----------|---------|------------|--------|--------|------------|--------------|
| P1-1 | **Local Contrast** — 23.8 vs WB 29.7 (−5.9); r=0.321 | +32% dominance | **MISSING** | Cycle 3 Exec | Low | P0-5 |
| P1-2 | **SVG benchmark products** — invalidates dominance measurement | +10–15% validity | **MISSING** | Cycle 5 | Low | Seller PNGs |
| P1-3 | **No thumbnail validation** at WB grid 120×160 | +8–12% CTR | **MISSING** | Cycle 4 | Low | Production PNG |
| P1-4 | **Commercial fidelity** — 32.9 vs WB 38.2 | +8% competitiveness | **BELOW** | Cycle 3 Exec | Low | P0-4 |
| P1-5 | **Final-quality layout default** — `productAreaPct ?? 62` masks weakness | Diagnostic gap | **PARTIAL** | Cycle 3 Exec | Low | Model v2 gate |
| **P1-6** | **Perspective cues** — 8.6 vs WB 26.7 (−18.1); r=0.173 | +17% dominance | **MISSING** | Cycle 3 Exec | Medium | Compositor |
| **P1-7** | **Texture Competition** — keep headline edge density low (r=−0.289) | +29% if violated | **OK** (1.0 vs 2.1) | Cycle 4 | Low | — |

---

## P2 — Medium (polish and alignment)

| Priority | Problem | Est. Impact | Status | Sprint | Complexity | Dependencies |
|----------|---------|------------|--------|--------|------------|--------------|
| P2-1 | **Typography competition** — confirmed r=−0.289 | +5–8% | **OK** | Cycle 4 | Low | — |
| P2-2 | **Background flatness** — complexity 0.5 vs 1.9 | +5% | **PARTIAL** | Cycle 3 Exec | Med | Flux |
| P2-3 | **Product area not a driver** — r=−0.099 confirmed | Stop optimizing | **DONE** | — | — | Cycle 2 research |
| P2-4 | **Post-composite lighting** — objectLighting −80 gap on SVG | +5% | **MISSING** | Cycle 3 Exec | Med | P0-1 |
| P2-5 | **`not_professional`** — all Sprint 9.5 | +5% trust | **FAILING** | Cycle 3 Exec | Low | P0-4 |
| P2-6 | **Category dominance targets** — tools 52% vs appliances 45% | +5% | **NOT TUNED** | Cycle 4 | Low | Model v2 |
| P2-7 | **Badge visual weight** | +3–5% | **PARTIAL** | Cycle 4 | Low | — |
| **P2-8** | **Wire Dominance Model v2** to production gate | Measurement | **MISSING** | Cycle 3 Exec | Med | Research docs |

---

## P3 — Lower (optimization)

| Priority | Problem | Est. Impact | Status | Sprint |
|----------|---------|------------|--------|--------|
| P3-1 | Monthly WB re-scan (100+ cards) | Calibration | **MANUAL** | Cycle 1b |
| P3-2 | Premium feel bands per category | +3% | **NOT MEASURED** | Cycle 5 |
| P3-3 | Information block count limit | +3% | **PARTIAL** | Cycle 4 |
| P3-4 | CTR headline templates | +3% | **PARTIAL** | Cycle 5 |
| P3-5 | Camera angle policy | +3% | **PARTIAL** | Cycle 5 |

---

## Recommended Sprint Sequence (updated)

```
Quality Cycle 2  →  Visual Weight Research          ✅ COMPLETE
Quality Cycle 3  →  Visual Weight Execution          ← NEXT
                   (compositor + foreground isolation + sharpness cluster)
Quality Cycle 5  →  Real product photos              (parallel)
Quality Cycle 4  →  Thumbnail + typography gates
Quality Cycle 5b →  Category premium tuning
```

---

## Single Highest-Impact Fix (Cycle 2 Council)

**Foreground Isolation** — raise from 32.5 → ≥50 (WB median).

One fix, maximum dominance lift. Requires compositor merge + crisp product silhouette.

---

## Definition of Done

| Item | Done when |
|------|-----------|
| P0-4 | Foreground Isolation ≥ 50 on ≥3/5 DAOS production cards |
| P0-5 | Object Sharpness ≥ 29.6 (WB median) on ≥3/5 |
| P0-1 | ≥4/5 cards produce `03-composited.png` on real photos |
| P0-2 | `png_overlay_feel` absent on ≥4/5 runs |
| P0-3 | Dominance Model v2 score ≥ WB median (49) on ≥3/5 |
| P2-8 | `evaluateFinalQuality` uses pixel features, not layout default |
| P1-2 | Benchmark uses seller PNG cutouts |

---

## Tracking

| Cycle | Status | PR |
|-------|--------|-----|
| Cycle 1 — Dominance Research | **Complete** | #76 |
| **Cycle 2 — Visual Weight Research** | **Complete** | TBD |
| Cycle 3 — Visual Weight Execution | **Next** | — |
| Cycle 4 — Thumbnail CTR | Planned | — |
| Cycle 5 — Real Photos | Planned | — |

---

## Out of Scope

No production code changes during research cycles. No Genome / Layout / Prompt / Geometry changes without Cycle 3 scope approval.
