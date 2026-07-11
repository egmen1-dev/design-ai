# DAOS Product Sprint 9.5 Report

## Production Card Validation

**Sprint:** Product Sprint 9.5  
**Status:** Complete  
**Type:** Production pipeline validation — benchmark refactor only (no production algorithm changes)  
**Priority:** CRITICAL (Beta Blocker)  
**Branch:** `cursor/product-sprint9-5-production-card-aecb`  
**Benchmark:** `marketplace-infographic/benchmark/production-card-validation.ts`  
**Review package:** `marketplace-infographic/benchmark/output/sprint9_5/report.html`

---

## Objective

Sprint 9 proved the Commercial pipeline runs end-to-end, but Product Review used **benchmark fallback overlay**, not the PNG a user downloads. Sprint 9.5 eliminates that blocker by routing all validation through **`handleGenerateInfographic`** — the same production handler the app uses.

**Out of scope (unchanged):** Commercial Genome, Rules, LayoutSpec, Propagation, Calibration, Geometry, Prompt, Flux, compositor algorithms, Product Score.

**New project rule:** All future Product Sprints must evaluate **production PNG only**. Benchmark-only / fallback images are insufficient for product quality assessment.

---

## Investigation — Production Path

| Stage | In `handleGenerateInfographic` | In Sprint 9 benchmark | In Sprint 9.5 |
|-------|-------------------------------|----------------------|---------------|
| Raw Product | Yes | Synthetic SVG | SVG via `production-product-images.ts` |
| Background Generation | Yes (`regenerateMarketplaceBackground`) | Yes | Yes — `01-background.png` |
| Cutout | Yes (`cutoutFromBuffer`) | Synthetic rect | Yes — `02-cutout.png` |
| prepareProductLayer | Yes | No (bypassed) | Yes (inside handler) |
| layoutObjectScale | Yes | Partial (benchmark layout only) | Yes |
| computeMaxProductSize | Yes | No | Yes |
| fitProductWithSafePlacement | Yes | No | Yes |
| Shadows | Yes (`renderFloorContactShadow`) | Failed → fallback | **Fails** on SVG cutout (handler continues) |
| Composite | Yes (`compositeProductIntoScene`) | Failed → `simpleCompositeFallback` | **Fails** — no `03-composited.png` |
| HTML Overlay | Yes (`renderInfographicHtml`) | **No** | Yes |
| Typography | Yes (puppeteer) | **No** | Yes |
| Badges | Yes | **No** | Yes |
| Final PNG | Yes (`renderHtmlToImage` → polish) | Benchmark composite only | Yes — `04-final-card.png` |

---

## Root Cause — Why Sprint 9 Used Fallback Overlay

| Factor | Explanation |
|--------|-------------|
| **Benchmark harness** | `shadow-beta-validation.ts` called `compositeProductIntoScene` **directly**, bypassing `handleGenerateInfographic` |
| **Synthetic cutout** | Benchmark-generated rectangle cutout, not production cutout path |
| **Compositor failure** | `renderFloorContactShadow` → `extract_area: bad extract area` in `floor-contact.ts` |
| **Benchmark workaround** | `simpleCompositeFallback()` — benchmark-only, **not** production code |
| **Missing stages** | No HTML overlay, typography, badges, or `renderHtmlToImage` — cards were background + product placeholder only |

**What blocked production compositor in Sprint 9:** the benchmark harness design (direct compositor call + synthetic cutout), not a missing production handler.

**Sprint 9.5 fix:** `production-card-validation.ts` calls **`handleGenerateInfographic` only** — no duplicated compositor logic, no fallback overlay.

---

## Benchmark Refactor

| File | Role |
|------|------|
| `benchmark/production-card-validation.ts` | Legacy vs Commercial A/B via production handler |
| `benchmark/lib/production-product-images.ts` | Shared SVG product inputs (benchmark-only) |

**Environment (stable handler smoke config, matches `tmp/wave17-ab-run.ts`):**

- `AI_MOCK_MODE=true`, `FAST_GENERATION=1`, `RENDER_ENGINE_V17=1`
- `DISABLE_IMGLY=1`, `USE_FAST_CUTOUT=1`, `DESIGN_GOVERNANCE_V171=0`

**Arms:**

- **Legacy:** `DAOS_COMMERCIAL_GENOME_BETA=0`, `DAOS_COMMERCIAL_LAYOUT_INTEGRATION=0`
- **Commercial:** both `=1`

---

## Validation Results

| Product | Legacy Fidelity | Commercial Fidelity | Final PNG | Composited (`03`) |
|---------|-----------------|---------------------|-----------|-------------------|
| construction-vacuum | 38.5 | 44.0 | Yes | No (composite failed) |
| battery-sprayer | 45.0 | 30.5 | Yes | No |
| impact-drill | 35.5 | 33.5 | Yes | No |
| pressure-washer | 24.5 | 30.5 | Yes | No |
| home-humidifier | 36.5 | 26.0 | Yes | No |

**Summary:** **5/5** products produced `04-final-card.png` via production handler. **0/5** produced `03-composited.png` — scene compositor shadow step still fails on SVG benchmark cutouts; handler degrades to HTML overlay with cutout on background (production behavior, not benchmark fallback).

**Automatic quality flags (handler):** `not_professional`, `product_not_dominant`, `png_overlay_feel` on all runs.

---

## Visual Package

```
marketplace-infographic/benchmark/output/sprint9_5/
├── product-1/
│   ├── 01-background.png
│   ├── 02-cutout.png
│   ├── 04-final-card.png      # 03-composited missing when composite fails
│   ├── 05-comparison.png
│   └── metrics.json
├── product-2/ … product-5/
├── report.html
├── summary.md
└── summary.json
```

---

## Human Review — Ready for Wildberries Without Photoshop?

**Answer: No** (for these benchmark runs; **partially** for pipeline capability).

| Criterion | Assessment |
|-----------|------------|
| Full production path | **Yes** — handler completes; final PNG includes typography/badges |
| Scene compositor | **No** — floor-contact shadow fails on SVG products; no merged scene |
| Product dominance | **Weak** — `product_not_dominant`, fidelity 26–44 |
| Professional appearance | **Not ready** — `not_professional`, `png_overlay_feel` |
| Real product photos | **Not tested** — SVG placeholders only |
| Thumbnail / WB grid | **Not reviewed** at search-grid scale |

**Remaining work before Shadow Beta listing quality:**

1. Re-run with **real seller product photos** (not SVG) to validate compositor + shadows.
2. Confirm `03-composited.png` exists on real cutouts.
3. Human thumbnail review at WB grid size.
4. Address `png_overlay_feel` / product dominance in a future quality sprint (out of 9.5 scope).

---

## Council Decision

### **YES WITH LIMITATIONS**

DAOS **can** generate production-format cards today (background + cutout + HTML overlay + typography + final PNG via the same handler users get). Cards are **not** ready to upload to Wildberries without manual work on benchmark evidence.

**Evidence:**

1. **5/5** `04-final-card.png` from `handleGenerateInfographic` — not benchmark fallback.
2. Sprint 9.5 benchmark contains **zero** `simpleCompositeFallback` usage.
3. All 13 pipeline stages execute inside the handler except compositor merge output (shadow extract fails on SVG).
4. Final cards include **typography and overlay** (Sprint 9 did not).
5. Handler quality flags consistently report professional/product-dominance gaps.
6. Commercial Fidelity 26–44 — below listing-ready threshold.
7. Compositor merged artifact absent on all 5 SVG products — scene integration not validated.

**Not YES because:** compositor shadow failure + low fidelity + overlay feel + SVG-only inputs.

**Not NO because:** production handler path works end-to-end and emits downloadable PNGs.

---

## Success Criteria

| Criterion | Met |
|-----------|-----|
| Production pipeline used | Yes |
| No fallback overlay in benchmark | Yes |
| Production PNG generated | Yes (5/5 final cards) |
| Per-stage quality visibility | Partial (`03-composited` missing when composite fails) |
| Honest Beta readiness answer | Yes — YES WITH LIMITATIONS |

---

## How to Re-run

```bash
cd marketplace-infographic
npx tsx benchmark/production-card-validation.ts

# Limit products:
SPRINT9_5_LIMIT=2 npx tsx benchmark/production-card-validation.ts
```

Open `benchmark/output/sprint9_5/report.html` for stage-by-stage review.

---

## Deliverables

| Deliverable | Path |
|-------------|------|
| Sprint report | `docs/DAOS_PRODUCT_SPRINT_9_5_REPORT.md` |
| Benchmark script | `marketplace-infographic/benchmark/production-card-validation.ts` |
| Output package | `marketplace-infographic/benchmark/output/sprint9_5/` |
| HTML report | `marketplace-infographic/benchmark/output/sprint9_5/report.html` |
