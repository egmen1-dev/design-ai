# DAOS Quality Cycle 3 Report

## Foreground Isolation — Implementation

**Sprint:** Quality Cycle 3  
**Status:** Complete (partial exit criteria)  
**Priority:** CRITICAL  
**Phase:** Commercial Perception  
**Branch:** `cursor/quality-cycle-3-foreground-isolation-aecb`  
**Benchmark:** `marketplace-infographic/benchmark/quality-cycle-3-validation.ts`  
**Review package:** `marketplace-infographic/benchmark/output/quality-cycle-3/report.html`

---

## Objective

Raise **Foreground Isolation** toward WB median **52.7** without changing Product Area, Geometry, Layout, Genome, or Prompt. Additive compositor integration only.

**Cycle 2 confirmed gap:** Foreground Isolation **−20.2** (DAOS 32.5 vs WB 52.7) — largest driver of Product Dominance (r = +0.332).

---

## What Changed

### Production (additive only)

| Change | File |
|--------|------|
| Background separation halo + localized blur | `foreground-isolation.ts` (new) |
| Post-merge rim light + masked contrast | `foreground-isolation.ts` |
| Compositor integration | `scene-compositor.ts` |
| Safe extract clamping (compositor unblock) | `safe-extract.ts`, `floor-contact.ts`, `shadow-generator.ts` |
| Diagnostic persistence | `sd-stored-payload.ts`, `generate-infographic-handler.ts` |

### What did NOT change

Product Area, `objectScale`, Geometry, LayoutSpec, Prompt Compiler, Commercial Rules, Feature Registry, Foundation.

---

## Benchmark Results (5 products)

| Metric | Cycle 2 | Cycle 3 Final | Cycle 3 Composited | Δ Final | WB Target |
|--------|---------|---------------|-------------------|---------|-----------|
| **Foreground Isolation** | 32.5 | **33.8** | **80.5** | +1.3 | 50.2 |
| Product Dominance | 42.4 | 40.0 | 79.2 | −2.4 | — |
| Visual Weight (hero) | 19.1 | 13.7 | 14.1 | −5.4 | — |
| Product Area % | 31.0 | **31.0** | 31.0 | **0** | unchanged |
| Object Sharpness | 24.0 | 21.7 | — | −2.3 | — |
| Object Contrast | 59.0 | 53.8 | — | −5.2 | — |
| Local Contrast | 23.8 | 21.6 | — | −2.2 | — |
| Commercial Fidelity | — | 28.0 | — | — | — |

**Compositor:** 5/5 success (was 0/5 in Sprint 9.5)  
**Isolation applied:** 5/5 (`foregroundIsolation.applied = true`)  
**Handler flags:** `not_professional`, `product_not_dominant` — **`png_overlay_feel` eliminated** (was on all Sprint 9.5 runs)  
**Quality score (composite):** 82/90 · **Final quality:** 87/100

### Per-product Foreground Isolation

| Product | Final | Composited |
|---------|-------|------------|
| Construction Vacuum | 47.4 | 83.2 |
| Battery Sprayer | 32.0 | 86.5 |
| Drill | 19.7 | 77.9 |
| Pressure Washer | 37.9 | 84.2 |
| Home Humidifier | 32.2 | 70.6 |

Construction Vacuum final FI **47.4** approaches WB band; others remain below target on final card.

---

## Success Criteria Assessment

| Criterion | Result |
|-----------|--------|
| Foreground Isolation increases | **Partial** — +1.3 on final card; +48.0 on composited layer |
| Visual Weight increases | **No** — −5.4 on final hero zone |
| Product Dominance increases | **No** — −2.4 |
| PNG Overlay Feel decreases | **Yes** — flag removed from all 5 runs |
| Product Area unchanged | **Yes** — Δ 0 |

---

## Exit Criteria — Council

**Did DAOS approach WB median (50.2) on Foreground Isolation?**

**On final production card: No.** Average 33.8 vs target 50.2 — gap remains **−16.4**.

**On composited merge layer: Yes.** Average **80.5** exceeds WB median — isolation effect is real at compositor output but **diluted by HTML typography overlay** and weak SVG benchmark silhouettes on 3/5 products.

**Recommended next cycle:** **Hero Lighting** (Cycle 2 correlation: Object Sharpness r=+0.326, Local Contrast r=+0.321) — not Product Area.

---

## Human Review

**Does the product look detached from the background, or still like a PNG on top?**

**Answer: Partially detached — improved, not resolved.**

| Observation | Assessment |
|-------------|------------|
| Composited layer (`03-composited.png`) | Product reads as **in-scene** — halo, shadow contact, rim edge, background pocket visible |
| Final card (`04-final-card.png`) | **Less overlay feel** than Sprint 9.5; construction-vacuum near WB isolation; drill/sprayer still flat |
| `png_overlay_feel` flag | **Removed** — automatic detector no longer fires |
| Remaining feel | Typography + empty hero whitespace still compete; SVG cutouts lack real edge complexity |

**Thumbnail test:** Construction vacuum and pressure washer would pass casual scroll; drill and sprayer still read as pasted asset at small size.

---

## Root Cause — Metric vs Perception Gap

1. **Measurement surface:** Final card metric includes headline/badge edges in global `edgeDensity`, suppressing hero/global ratio.
2. **Compositor → HTML handoff:** Merged scene isolation is strong (80.5) but overlay stage does not preserve dominance.
3. **Benchmark product quality:** SVG silhouettes limit Object Sharpness on drill/sprayer — caps final-card FI.

---

## Visual Package

```
marketplace-infographic/benchmark/output/quality-cycle-3/
├── construction-vacuum/
│   ├── 03-composited.png
│   ├── 04-final-card.png
│   └── metrics.json
├── battery-sprayer/ … home-humidifier/
├── summary.json
└── report.html
```

---

## Key Files

- Spec: [DAOS_FOREGROUND_ISOLATION.md](./DAOS_FOREGROUND_ISOLATION.md)
- Prior research: [DAOS_VISUAL_WEIGHT_RESEARCH.md](./DAOS_VISUAL_WEIGHT_RESEARCH.md)
- Cycle 2: `benchmark/output/quality-cycle-2/report.html`
