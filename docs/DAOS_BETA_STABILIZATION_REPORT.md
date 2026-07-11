# DAOS Beta Stabilization Sprint — Production Reliability

**Status:** Complete  
**Priority:** P0  
**Date:** 2026-07-11  
**Benchmark:** `marketplace-infographic/benchmark/beta-validation-1.ts`  
**Output:** `marketplace-infographic/benchmark/output/beta-stabilization-1/`

---

## Objective

Raise production pipeline **Generation Success** from **50%** (Beta Validation 1) to **≥95%** by fixing validation and runtime failures — without touching Genome, Prompt, Layout, Typography, Compositor, Commercial Laws, or Knowledge Runtime.

---

## Root Cause

All **10/20** Beta Validation 1 failures shared one error:

```
Zod too_big — string > 80 chars
  path: oneThought.deferredSpecs[0]
  path: deferredBullets[0]
```

**Chain:**

1. `extractSpecs()` in `multi-concept.ts` splits product prompts into sentence fragments without length cap.
2. Long marketplace descriptions (Garden, Home, Climate, Kitchen) produce specs **>80 characters**.
3. `sanitizeDesignBrief()` spread `...obj` but did **not** clip `oneThought.deferredSpecs` or `deferredBullets` before `designBriefSchema.parse()`.
4. `applyPosterRules()` copied `ot.deferredSpecs` → `deferredBullets` without truncation.
5. `buildMockBrief()` in mock/fast path called `sanitizeDesignBrief(applyPosterRules({ deferredBullets: creative.oneThought.deferredSpecs }))` → **hard Zod abort**.

Failed products: product-04, 05, 06, 09, 11, 12, 14, 15, 19, 20.

---

## Fixes Applied

| Layer | File | Change |
|-------|------|--------|
| Validation sanitize | `design-brief/sanitize.ts` | `normalizeDeferredStrings()` + `normalizeOneThought()` clip to schema limits before Zod parse |
| Poster rules | `design-process/pipeline.ts` | Truncate `deferredSpecs` / `deferredBullets` in `applyPosterRules()` |
| Source extraction | `design-process/multi-concept.ts` | `extractSpecs()` clips each fragment to 80 chars |
| Regression test | `design-brief/sanitize-deferred.test.ts` | Asserts long strings survive sanitization |

**Scope compliance:** No changes to Genome, Prompt, Layout, Typography, Compositor, Laws, or Knowledge Runtime.

---

## Benchmark — Same 20 Products

| Metric | Before (BV1) | After (Stabilization) | Target |
|--------|--------------|------------------------|--------|
| **Generation Success** | **50%** (10/20) | **100%** (20/20) | ≥95% |
| Unexpected aborts | 10 (Zod) | **0** | 0 |
| Runtime crashes | 0 | **0** | 0 |
| DAOS wins (head-to-head) | 6 | 13 | — |
| WB wins | 14 | 6 | — |
| Draws | 0 | 1 | — |

### Previously Failed Products — Now Succeed

| Slot | Category | Before | After |
|------|----------|--------|-------|
| product-04 | Сад | FAIL | ✓ daos win |
| product-05 | Сад | FAIL | ✓ daos win |
| product-06 | Сад | FAIL | ✓ daos win |
| product-09 | Бытовая техника | FAIL | ✓ daos win |
| product-11 | Дом | FAIL | ✓ wb win (quality, not pipeline) |
| product-12 | Дом | FAIL | ✓ daos win |
| product-14 | Авто | FAIL | ✓ daos win |
| product-15 | Кухня | FAIL | ✓ daos win |
| product-19 | Климат | FAIL | ✓ wb win (quality, not pipeline) |
| product-20 | Климат | FAIL | ✓ wb win (quality, not pipeline) |

### Quality Regression Check

Among the 10 products that **already succeeded** in BV1, verdicts are preserved or improved:

- product-01: wb → wb (no regression)
- product-02: daos → daos
- product-03: daos → daos
- product-07: daos → daos
- product-08: daos → daos
- product-10: daos → daos
- product-13: wb → wb
- product-16: wb → draw (neutral)
- product-17: daos → daos
- product-18: wb → wb

**No card-quality regression** from stabilization fixes; newly generated cards participate in competitive scoring.

---

## Success Criteria

| Criterion | Result |
|-----------|--------|
| Generation Success ≥95% | **PASS** — 100% |
| Zero unexpected aborts | **PASS** |
| Zero runtime crashes | **PASS** |
| No quality regression | **PASS** |

---

## Council Decision — Production Pipeline Stability

### **READY**

**Rationale:** The sole P0 blocker (Zod `deferredSpecs` / `deferredBullets` >80 chars) is eliminated. Re-benchmark on the same 20 WB products shows **100% generation success**, zero pipeline aborts, and zero runtime exceptions. Remaining WB wins are **quality/composition gaps**, not pipeline reliability — out of scope for this sprint.

**Note:** Closed Beta **competitive readiness** (beating WB leaders) is a separate track. Pipeline stability no longer blocks generation; quality iteration (dominance, packshot inputs) continues on the roadmap.

---

## Re-run Command

```bash
cd marketplace-infographic
BV1_LIMIT=20 BV1_OUT_DIR=beta-stabilization-1 npx tsx benchmark/beta-validation-1.ts
```

Unit test:

```bash
npx tsx src/lib/design-brief/sanitize-deferred.test.ts
```
