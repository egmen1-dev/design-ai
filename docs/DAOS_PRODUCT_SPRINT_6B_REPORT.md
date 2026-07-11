# DAOS Product Sprint 6B Report

## Commercial Layout Propagation

**Sprint:** Product Sprint 6B  
**Status:** Complete  
**Priority:** CRITICAL  
**Product Gap closed:** #5 — Commercial LayoutSpec → compositor `objectScale`  
**Branch:** `cursor/product-sprint6b-layout-propagation-aecb`  
**Benchmark:** `benchmark/commercial-layout-propagation.ts`  
**Artifacts:** `benchmark/output/sprint6b/`

---

## Architecture Delta

| Change | Scope |
|--------|-------|
| New module `commercial-layout-propagation.ts` | `resolveLayoutObjectScale()` |
| `generate-infographic-handler.ts` | 3 call sites use commercial propagation |
| Diagnostics on generation payload | `commercialLayoutPropagation` |
| **Unchanged** | `computeMaxProductSize`, `fitProductWithSafePlacement`, Flux, Genome, LayoutSpec schema |

### Propagation priority

```
1. Commercial LayoutSpec.productAreaPct (or heroScale × 100)
2. Template compositionLayout.metrics.productAreaPct
3. Legacy default (65%)
```

Gate: `layoutSpec.commercialLayout.commercialIntentApplied.length > 0`

---

## Architecture Review (Mandatory)

| Criterion | Result |
|-----------|--------|
| **1. Propagation Integrity** | PASS — commercial `productAreaPct` flows to `objectScale` |
| **2. SSOT Preservation** | PASS — LayoutSpec remains source of product area target |
| **3. No Rewrite** | PASS — compositor algorithms untouched |
| **4. Backward Compatibility** | PASS — non-commercial runs use template/legacy fallback |

---

## Product Delta

### Before (Sprint 6A)

```typescript
layoutObjectScale(compositionLayout.metrics.productAreaPct)  // ~0.50–0.62
// layoutSpec.productAreaPct ignored
```

### After (Sprint 6B)

```typescript
resolveLayoutObjectScale({ layoutSpec, templateAreaPct })
// commercial → 0.55 when productAreaPct = 55
```

---

## Diagnostics

| Field | Description |
|-------|-------------|
| `commercialLayoutPropagation` | `true` when commercial source used |
| `commercialScaleSource` | `commercial` \| `template` \| `legacy` |
| `commercialScaleExpected` | Area % used for scale |
| `commercialScaleApplied` | Final `objectScale` |
| `commercialScaleDelta` | Delta vs template-only scale |
| `commercialPropagationVersion` | `1.0.0-sprint6b` |
| `commercialPropagationWarnings` | Integrity ASSERT messages |

Logged to `governanceDecisionLog` and `payloadExtras.commercialLayoutPropagation`.

---

## Benchmark Results (5 products)

| Metric | Sprint 6A (template) | Sprint 6B (commercial) |
|--------|----------------------|------------------------|
| `objectScale` source | template | **commercial** |
| `objectScale` value | 0.50 | **0.55** |
| `objectScale` changed | — | **5/5** |
| Max bbox (W×H) changed | — | **5/5** |
| Area closer to expected | — | **5/5** |
| `commercialScaleDelta` | — | **+0.05** avg |

Example — construction-vacuum:

| | Expected | objectScale | Max size |
|--|----------|-------------|----------|
| Sprint 6A | 55% | 0.50 (template) | 316×480 |
| Sprint 6B | 55% | **0.55** (commercial) | **317×482** |

---

## Product Review (5 products)

| Product | Legacy scale | Sprint 6A | Sprint 6B | Bbox Δ | Area closer |
|---------|--------------|-----------|-----------|--------|-------------|
| battery-sprayer | 0.66 default | 0.50 | **0.55** | yes | yes |
| construction-vacuum | 0.66 | 0.50 | **0.55** | yes | yes |
| impact-drill | 0.66 | 0.50 | **0.55** | yes | yes |
| pressure-washer | 0.66 | 0.50 | **0.55** | yes | yes |
| home-humidifier | 0.66 | 0.50 | **0.55** | yes | yes |

**Commercial Fidelity on merged PNG:** composite benchmark skipped (synthetic cutout floor-shadow edge case). Propagation validated via `computeMaxProductSize` estimate — next gap is compositor algorithm if pixel area still diverges from 55%.

---

## Success Criteria

| # | Criterion | Result |
|---|-----------|--------|
| 1 | Commercial LayoutSpec → objectScale | PASS |
| 2 | Template metrics as fallback only | PASS |
| 3 | Propagation diagnostics show source | PASS |
| 4 | ≥3 products area closer to expected | PASS (5/5) |
| 5 | Fidelity score increases | PARTIAL — needs full cutout composite (next gap) |
| 6 | No render/genome/prompt/flux changes | PASS |

---

## Continuous Chain (post Sprint 6B)

```
Commercial Genome → Decision → LayoutSpec → layoutObjectScale()
  → objectScale → computeMaxProductSize() → fitProductWithSafePlacement() → Final Card
```

**First uninterrupted propagation** from Genome to compositor scale input.

---

## Exit Criteria

Product Area is **no longer determined exclusively by template metrics** when Commercial LayoutSpec is present.

If measured pixel area still diverges significantly from `productAreaPct`, the next Product Gap is:

> `computeMaxProductSize()` / `fitProductWithSafePlacement()` algorithm ceiling — not propagation.

Evidence: `objectScale` 0.55 produces only ~1px dimension change vs 0.50 — scaleBoost formula `0.58 + objectScale * 0.05` has low sensitivity.

---

## Files Changed

| File | Change |
|------|--------|
| `layout-spec/commercial-layout-propagation.ts` | New propagation resolver |
| `layout-spec/commercial-layout-propagation.test.ts` | Unit tests |
| `layout-spec/index.ts` | Exports |
| `generate-infographic-handler.ts` | Wire propagation + diagnostics |
| `benchmark/commercial-layout-propagation.ts` | Validation harness |

---

## Activation

Unchanged flags:

```bash
DAOS_COMMERCIAL_GENOME_BETA=1
DAOS_COMMERCIAL_LAYOUT_INTEGRATION=1
RENDER_ENGINE_V17=1
```

Run validation:

```bash
cd marketplace-infographic
npx tsx benchmark/commercial-layout-propagation.ts
```
