# DAOS Product Sprint 8A Report

## Template Geometry Investigation

**Sprint:** Product Sprint 8A  
**Status:** Complete  
**Type:** Engineering Investigation (read-only)  
**Priority:** CRITICAL  
**Branch:** `cursor/product-sprint8a-template-geometry-aecb`  
**Benchmark:** `benchmark/template-geometry.ts`  
**Artifacts:** `benchmark/output/sprint8a/`

---

## Context

After Sprint 7B (alpha policy aligned to 39.4%), Product Area still saturates at **~29–30%** at `objectScale = 1.0`. Commercial target remains **55%**.

Sprint 8A localizes the bottleneck in **Template Geometry** (`layout-engine/builder.ts`), not Commercial Layer or Compositor Policy.

**Zero production code changes.**

---

## Root Cause

`buildLayoutFromTemplate` sets `product.maxHeightPct` up to **85%** of canvas height. Compositor `computeMaxProductSize` height-binds:

```
scaleBoost ≤ 696px / zoneH
```

For zoneH = 1020px (85%), scaleBoost ≤ 0.68 → allowed area **~29.5%**.

Policy-aspect zone **68×58%** removes height binding → **39.4%** allowed (full compositor ceiling).

---

## Investigation 1 — Pipeline Map

See `docs/DAOS_TEMPLATE_GEOMETRY_AUDIT.md`.

**Compositor geometry source:** `layout-engine/builder.ts` only.  
**Not compositor:** `LayoutSpec.geometry`, HTML typography, badges.

---

## Investigation 2 — Geometry Ownership

| Element | Owner |
|---------|-------|
| Product zone (compositor) | `layout-engine/builder.ts` |
| Hero zone (fidelity) | `composition-director/geometry.ts` |
| Margins | `safeInsetPct` + compositor policy |
| Text/badge reserve | HTML overlay (post-composite) |
| `productAreaPct` pre-compositor | `computeMetrics()` in builder |

---

## Investigation 3 — Template Survey (20 templates)

| Metric | Value |
|--------|-------|
| Compositor allowed @ objectScale=1 | **29.5 – 30.4%** |
| Layout metrics productAreaPct | 47 – 53% |
| Template spread | Minimal — height_binding equalizes |

---

## Investigation 4 — Geometry Sensitivity

Fixed `objectScale = 1.0`, varied zone dimensions only:

| Zone | Allowed area |
|------|--------------|
| Typical (~65×75) | 29.5% |
| Clamp max (72×85) | ~30% |
| **Policy aspect (68×58)** | **39.4%** |

Removing typography/badge from layout: **0% change** in compositor allowed area.

---

## Investigation 5 — Constraint Attribution

| Constraint | Est. loss to 55% |
|------------|------------------|
| `finalH` max 85% (height binding) | **~10 pp** vs policy max |
| Builder 0.92/1.05 coefficients | ~6 pp |
| Template productScale range | ~3 pp |
| HTML typography/badges | 0 pp (compositor) |

---

## Investigation 6 — Maximum Reachable Area

| Scenario | Allowed @ objectScale=1 |
|----------|-------------------------|
| Current geometry | **29.5%** |
| Policy-aspect zone 68×58 | **39.4%** |
| Compositor policy ceiling | 39.4% |
| Commercial target | 55% |

**39.4%** is the geometry + policy maximum without compositor changes. Gap to 55% = **15.6 pp** (target vs physical ceiling).

---

## Investigation 7 — Minimal Change (Sprint 8B)

**Recommendation:** `layout-engine/builder.ts` — reduce `finalH` clamp maximum from **85 → 58**.

| | |
|--|--|
| Gain | **+9.9 pp** (measured) |
| Scope | One clamp constant |
| Compositor rewrite | No |
| Layout-engine rewrite | No |

---

## Product Review

| Question | Answer |
|----------|--------|
| Why does Geometry limit area? | Tall zones (85% H) trigger height_binding in scaleBoost |
| Needed constraints? | Zone width; aspect aligned to compositor policy |
| Historical constraints? | 85% height clamp predates policy-aligned compositor |
| Max-impact single fix? | **finalH clamp 85 → 58** |

---

## Architecture Review

| Criterion | Result |
|-----------|--------|
| Geometry independent stage | PASS |
| Separated from Commercial | PASS |
| Separated from Compositor Policy | PASS |
| No new entities | PASS |

---

## Exit Criteria

| Criterion | Status |
|-----------|--------|
| Geometry bottleneck localized | **PASS** |
| Per-constraint attribution | **PASS** |
| Max reachable area determined | **PASS** (39.4%) |
| Minimal change proposed | **PASS** (finalH clamp) |

**Sprint 8B** should implement `finalH` clamp alignment — confirmed, not further investigation.

---

## Deliverables

- [x] `docs/DAOS_TEMPLATE_GEOMETRY_AUDIT.md`
- [x] `docs/DAOS_PRODUCT_SPRINT_8A_REPORT.md`
- [x] `benchmark/template-geometry.ts`
- [x] `benchmark/output/sprint8a/template-geometry.json`
