# DAOS Product Sprint 7B Report

## Alpha Policy Alignment

**Sprint:** Product Sprint 7B  
**Status:** Complete  
**Priority:** CRITICAL  
**Branch:** `cursor/product-sprint7b-alpha-policy-alignment-aecb`  
**Benchmark:** `benchmark/alpha-policy-alignment.ts`  
**Artifacts:** `benchmark/output/sprint7b/`

---

## Objective

Sprint 7A identified architectural contradiction:

| Policy | Width | Height | Max area |
|--------|-------|--------|----------|
| `PRODUCT_MAX_*` (computeMaxProductSize) | 612 | 696 | **39.4%** |
| `PRODUCT_ALPHA_MAX_*` (alpha-fit) | 504 | 600 | **28.0%** |

Sprint 7B aligns alpha caps with product max caps — **constants only**, no algorithm changes.

---

## Change

`product-render-policy.ts`:

```typescript
// Before (7A)
PRODUCT_ALPHA_MAX_WIDTH_PX  = round(900 * 0.56)  // 504
PRODUCT_ALPHA_MAX_HEIGHT_PX = round(1200 * 0.50) // 600

// After (7B)
PRODUCT_ALPHA_MAX_WIDTH_PX  = PRODUCT_MAX_WIDTH_PX           // 612
PRODUCT_ALPHA_MAX_HEIGHT_PX = PRODUCT_TARGET_MAX_HEIGHT_PX // 696
```

**Unchanged:** Genome, LayoutSpec, propagation, calibration, `computeMaxProductSize`, `fitProductWithSafePlacement`, compositor logic.

---

## Diagnostics

New module `commercial-alpha-policy.ts` — logged on composite result and generation payload:

| Field | Value (7B) |
|-------|------------|
| `commercialAlphaPolicyVersion` | `1.0.0-sprint7b` |
| `alphaPolicySource` | `aligned` |
| `alphaPolicyWidth` | 612 |
| `alphaPolicyHeight` | 696 |
| `alphaPolicyConsistency` | `true` |
| `alphaPolicyWarnings` | `[]` |

---

## Benchmark Results

### Policy alignment

| Criterion | Result |
|-----------|--------|
| PRODUCT_MAX = PRODUCT_ALPHA_MAX | **PASS** |
| Policy constants only | **PASS** |
| Compositor rewrite | **None** |

### Stress test (612×696 prepared — policy ceiling)

When `computeMaxProductSize` delivers full policy max, alpha-fit no longer shrinks below it:

| | Sprint 7A (legacy alpha) | Sprint 7B (aligned) |
|--|--------------------------|---------------------|
| Final frame area | 21.7% | **39.4%** |
| Blocker | `PRODUCT_ALPHA_MAX` 504×600 | `alpha_fit_0.9` only when over cap |
| **Gain** | — | **+17.7 pp** |

### Commercial path (objectScale=0.55, 5 products)

Typical prepared size (372×465) remains **below** legacy alpha cap (504×600), so bbox unchanged at current template geometry:

| Metric | 7A | 7B |
|--------|----|----|
| Avg final area | 14.6% | 14.6% |
| Max at objectScale=1.0 | 24.3% | 24.3% |

**Interpretation:** Contradiction is **eliminated**. Commercial path improvement awaits template geometry delivering larger prepared layers (next gap if needed).

---

## Product Validation

| Question | Answer |
|----------|--------|
| Contradiction resolved? | **Yes** — 612=612, 696=696 |
| Max possible area increased? | **Yes** — ceiling 28% → 39.4% (+11.4 pp theoretical; +17.7 pp stress test) |
| Bbox changed at commercial 0.55? | No — prepare size below legacy cap |
| Commercial Fidelity | Unchanged at 0.55; improves when policy max is reached |

---

## Architecture Review

| Criterion | Result |
|-----------|--------|
| Internal policy contradiction removed | PASS |
| Architecture unchanged | PASS |
| Algorithms unchanged | PASS |
| Commercial layer unchanged | PASS |

---

## Exit Criteria

| Criterion | Status |
|-----------|--------|
| Unified policy limits | **PASS** |
| Max area ceiling increased | **PASS** (39.4% vs 28%) |
| No compositor rewrite | **PASS** |

**Next gap (if 55% still unreachable):** Template zone geometry — `compositionLayout.product.maxWidth/HeightPct` saturates before policy max at objectScale=1.0 (29.5% allowed vs 39.4% policy).

---

## Deliverables

- [x] `docs/DAOS_PRODUCT_SPRINT_7B_REPORT.md`
- [x] `benchmark/alpha-policy-alignment.ts`
- [x] `benchmark/output/sprint7b/alpha-policy-alignment.json`
- [x] `commercial-alpha-policy.ts` + diagnostics wiring
