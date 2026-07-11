# DAOS Compositor Constraints

**Sprint:** 7A — Engineering Investigation (read-only)  
**Benchmark:** `benchmark/compositor-constraints.ts`  
**Artifacts:** `benchmark/output/sprint7a/compositor-constraints.json`

---

## Executive Answer

**Why does Product Area not reach 55%?**

The compositor applies a **stack of hard pixel ceilings** after Commercial Decision is already propagated and calibrated. The binding limits are in `product-render-policy.ts` and `alpha-fit.ts`, not in Commercial Genome, LayoutSpec, or calibration.

| Ceiling | Max bbox area (% of 900×1200) | Source |
|---------|-------------------------------|--------|
| Usable canvas (margins + header) | **60.0%** | `SIDE_MARGIN`, `HEADER_RESERVE`, `BOTTOM_PAD` |
| Policy max (`PRODUCT_MAX_*`) | **39.4%** | `612×696 px` |
| Alpha cap (`PRODUCT_ALPHA_MAX_*`) | **28.0%** | `504×600 px` |
| Alpha fit ×0.9 safety | **~22.7%** | `alpha-fit.ts:26` |
| **Observed real frame (objectScale=1.0)** | **24.3%** | Sprint 7A experiment |
| **Visible alpha silhouette** | **~19.0%** | Same experiment |

Commercial target **55%** exceeds every compositor ceiling except raw usable canvas (60%). **55% is physically unreachable** without relaxing policy constants.

---

## Pipeline Constraint Map

```
resolveLayoutObjectScale()          → sets objectScale (Commercial layer — NOT the blocker)
        ↓
computeMaxProductSize()             → zone × scaleBoost, capped by PRODUCT_MAX_*  ✓ limits area
        ↓
prepareProductLayer()               → resize inside maxW×maxH; aspect ratio may shrink  ✓ limits area
        ↓
fitProductWithSafePlacement()         → PRODUCT_ALPHA_MAX_* + side margins  ✓ PRIMARY shrink
        ↓
fitProductByAlphaBounds()           → ×0.9 safety factor  ✓ limits area
        ↓
resolveVerticalTop()                → position only (HEADER_RESERVE floor)  ✗ no area change
        ↓
shadow / reflection / floor contact → drawn outside product buffer  ✗ no area change
        ↓
HTML typography / badges overlay    → post-composite puppeteer pass  ✗ no compositor bbox change
        ↓
Final Bounding Box
```

---

## Production Constants (`product-render-policy.ts`)

| Constant | Value | % of canvas |
|----------|-------|-------------|
| `PRODUCT_MAX_WIDTH_PX` | 612 | 68% width |
| `PRODUCT_TARGET_MAX_HEIGHT_PX` | 696 | 58% height |
| `PRODUCT_ALPHA_MAX_WIDTH_PX` | **504** | **56% width** |
| `PRODUCT_ALPHA_MAX_HEIGHT_PX` | **600** | **50% height** |
| `PRODUCT_SIDE_MARGIN_PX` | 90 | 10% each side |
| `HEADER_RESERVE_PX` | 240 | 20% height |
| `PRODUCT_BOTTOM_PAD_PX` | 60 | 5% height |

**Critical mismatch:** `computeMaxProductSize` allows up to **612×696** (39.4%), but `fitProductWithSafePlacement` passes **504×600** (28.0%) to alpha fitting. The alpha stage always binds after prepare.

---

## Constraint Matrix

| Constraint | Limits Area | Type | Reason | Relax? | Risk |
|------------|-------------|------|--------|--------|------|
| `computeMaxProductSize` / scaleBoost | Yes | Implementation Detail | Zone × boost capped by policy | Yes | Low |
| `PRODUCT_MAX_WIDTH_PX` (68%) | Yes | Historical Constant | Render policy | Yes | Medium |
| `PRODUCT_TARGET_MAX_HEIGHT_PX` (58%) | Yes | Historical Constant | Render policy | Yes | Medium |
| `HEADER_RESERVE_PX` (20%) | Yes (indirect) | Marketplace Requirement | Headline zone floor | Partial | High |
| `PRODUCT_SIDE_MARGIN_PX` (10%) | Yes | Safety Constraint | Horizontal inset | Yes | Low–Medium |
| **`PRODUCT_ALPHA_MAX` (56%×50%)** | **Yes** | **Hard Constraint** | **Stricter than PRODUCT_MAX** | **Yes** | **Low if aligned** |
| `fitProductByAlphaBounds ×0.9` | Yes | Safety Constraint | Edge clipping guard | Yes | Low |
| `fitProductWithSafePlacement ×0.88` | Yes (conditional) | Safety Constraint | Margin retry shrink | Yes | Low |
| Template zone geometry | Yes | Implementation Detail | layout-engine zone % | Yes | Medium |
| HTML overlay / badges | **No** | Soft Constraint | Post-composite layer | N/A | N/A |
| Shadow / reflection | **No** | Implementation Detail | External composite | N/A | N/A |

---

## objectScale Experiment (battery-sprayer, calibrated)

| objectScale | Requested % | Allowed % (maxSize) | Real frame % | Alpha visible % | Blocking constraint |
|-------------|-------------|---------------------|--------------|-----------------|---------------------|
| 0.40 | 40 | 17.4 | 14.3 | 11.5 | zone × scaleBoost |
| 0.50 | 50 | 17.4 | 14.3 | 11.5 | zone × scaleBoost |
| 0.60 | 60 | 21.9 | 18.0 | 14.2 | zone_geometry_template |
| 0.70 | 70 | 25.9 | 21.3 | 16.8 | zone_geometry_template |
| 0.80 | 80 | 29.5 | 24.3 | 19.0 | zone_geometry_template |
| 0.90 | 90 | 29.5 | 24.3 | 19.0 | saturated |
| 1.00 | 100 | 29.5 | 24.3 | 19.0 | saturated |

Saturation at **29.5% allowed** occurs before policy max (39.4%) because template zone × calibrated maxBoost does not fill canvas caps.

---

## Maximum Achievable Product Area

| Definition | Value |
|----------|-------|
| **Current observed max** (objectScale=1.0, full pipeline) | **24.3%** frame / **19.0%** alpha |
| **Theoretical policy max** (`PRODUCT_MAX_*` only) | **39.4%** |
| **Theoretical alpha max** (`PRODUCT_ALPHA_MAX_*`) | **28.0%** |
| **Theoretical usable canvas** (margins only) | **60.0%** |
| **Practical WB max without headline overlap** | **~39%** (policy max) |
| **Max after aligning alpha to PRODUCT_MAX** | **~39.4%** (+11.4 pp) |
| **Commercial target** | **55%** — **still 15.6 pp short** even after alpha fix |

Reaching 55% requires **multiple** constraint relaxations (alpha + policy max + possibly header reserve), not a single coefficient tweak.

---

## Commercial Loss Attribution (target 55%)

Estimated contribution to gap from 55% target:

| Constraint | Est. loss | Type |
|------------|-----------|------|
| Header reserve 20% | −20% vertical budget | Marketplace Requirement |
| Side margins 10%×2 | −20% horizontal budget | Safety Constraint |
| Bottom pad 5% | −5% | Safety Constraint |
| Zone × scaleBoost (template) | −15 to −25% | Implementation Detail |
| PRODUCT_MAX policy cap | −11% (vs zone) | Hard Constraint |
| **PRODUCT_ALPHA_MAX mismatch** | **−11.4%** | **Hard Constraint** |
| Alpha fit ×0.9 | −5.3% | Safety Constraint |
| HTML overlay | 0% (post-pass) | Soft Constraint |
| Shadows | 0% | Implementation Detail |

**Primary single blocker:** `PRODUCT_ALPHA_MAX_*` caps at 28% while `computeMaxProductSize` allows 39.4%.

---

## Minimal Change Recommendation (Sprint 7B candidate)

**Align alpha caps with product max caps** — two constants in `product-render-policy.ts`:

```typescript
// Current
PRODUCT_ALPHA_MAX_WIDTH_PX  = round(900 * 0.56)  // 504
PRODUCT_ALPHA_MAX_HEIGHT_PX = round(1200 * 0.50) // 600

// Proposed
PRODUCT_ALPHA_MAX_WIDTH_PX  = PRODUCT_MAX_WIDTH_PX           // 612
PRODUCT_ALPHA_MAX_HEIGHT_PX = PRODUCT_TARGET_MAX_HEIGHT_PX   // 696
```

| | Current | Proposed |
|--|---------|----------|
| Alpha max area | 28.0% | 39.4% |
| Est. gain | — | **+11.4 pp** |
| Compositor rewrite | — | **No** |
| Risk | — | **Low** |

**Alternatives (lower impact):**

| Change | Est. gain | Risk |
|--------|-----------|------|
| `fitProductByAlphaBounds` 0.9 → 0.95 | +2.5 pp | Low |
| `PRODUCT_SIDE_MARGIN_PX` 10% → 7% | +2 pp | Medium |
| `HEADER_RESERVE_PX` 20% → 15% | +3 pp | High |

**Maximum single-fix impact:** alpha alignment (+11.4 pp). Still leaves ~15 pp to 55% target.

---

## Architecture Review

| Criterion | Confirmed |
|-----------|-----------|
| All constraints from existing compositor | Yes — traced to `scene-compositor.ts`, `alpha-fit.ts`, `product-render-policy.ts` |
| No new constraints introduced | Yes — read-only investigation |
| Architecture unchanged | Yes — zero production code mutations |

---

## Code References

- `marketplace-infographic/src/lib/product-render-policy.ts` — pixel policy constants
- `marketplace-infographic/src/lib/compositing/commercial-calibration.ts` — `computeMaxProductSize`
- `marketplace-infographic/src/lib/compositing/scene-compositor.ts` — pipeline orchestration
- `marketplace-infographic/src/lib/compositing/alpha-fit.ts` — alpha shrink (`×0.9`, `×0.88`)
