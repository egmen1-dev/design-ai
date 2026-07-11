# DAOS Product Sprint 6A Report

## Commercial Compositor Audit

**Sprint:** Product Sprint 6A  
**Status:** Complete (audit only — no compositor changes)  
**Priority:** CRITICAL  
**Product Gap identified:** #5 — Compositor bridge loses commercial Product Area  
**Branch:** `cursor/product-sprint6a-compositor-audit-aecb`  
**Full audit:** `docs/DAOS_COMPOSITOR_AUDIT.md`  
**Benchmark:** `benchmark/compositor-audit.ts`  
**Artifacts:** `benchmark/output/sprint6a/compositor-audit.json`

---

## Architecture Delta

**None.** Sprint 6A is read-only audit. No production code modified.

---

## Product Delta

Sprint 5 Fidelity proved Product Area / Dominance / Hierarchy losses correlate with **final card composition**, not Flux. Sprint 6A locates the exact production break:

> Commercial `layoutSpec.productAreaPct` is written but never read by the compositor bridge.

---

## 1. Production Compositor Pipeline

| Step | Module | Function |
|------|--------|----------|
| Cutout | handler | `loadProductCutout` |
| Resize | `scene-compositor.ts` | `prepareProductLayer` |
| Scale | `generate-infographic-handler.ts` | `layoutObjectScale` → `objectScale` |
| Max bbox | `scene-compositor.ts` | `computeMaxProductSize` |
| Placement | `alpha-fit.ts` | `fitProductWithSafePlacement` |
| Floor anchor | `ground-detector.ts` | `detectFloorY`, `getAlphaBounds` |
| Shadow | `shadow-generator.ts` | `generateShadows` |
| Overlay | `scene-compositor.ts` | `sharp().composite()` |
| Typography | `infographic-html-templates.ts` | `renderLayoutHtml` |
| Badges | `marketplace-badges.ts` | plaque/badge HTML |
| Final PNG | `puppeteer.ts` | `renderHtmlToImage` → `polishCoverImage` |

---

## 2. Product Area Ownership

| Question | Answer |
|----------|--------|
| **Where is product area computed?** | `layout-engine/builder.ts` → `computeMetrics().productAreaPct` from **template.productScale** (fixed 0.61–0.70 per template) |
| **Who owns scale?** | `layoutObjectScale()` in handler — reads **composition metrics**, not `layoutSpec` |
| **Who owns bbox?** | `computeMaxProductSize()` + `fitProductByAlphaBounds()` |
| **Who places product?** | `fitProductWithSafePlacement()` + `resolveVerticalTop()` |
| **Who owns safe zones?** | `CompositionLayout` from layout-engine template |
| **Who owns hero placement?** | `compositionLayout.product.{left,top,width,height}` |

**Confirmed gap:** `layoutSpec.productAreaPct` (commercial = 55%) is **never read** in compositor path. Composition stays ~65–68%.

---

## 3. LayoutSpec Usage Matrix

| Field | Used | Module | Compositor |
|-------|------|--------|------------|
| `heroScale` | PARTIAL | `layoutSpecToTemplatePreference` | NO |
| `productAreaPct` | **NO** | integration (write only) | NO |
| `primaryObject` | **NO** | — | NO |
| `hierarchy` | **NO** | — | NO |
| `maxIcons` | **NO** | prompt-compiler | NO |
| `maxCharacteristics` | **NO** | prompt-compiler | NO |
| `scenePreference` | **NO** | visual-pipeline (Flux) | NO |
| `backgroundPalettePreference` | **NO** | visual-pipeline (Flux) | NO |
| `visualPriority` | **NO** | *field absent* | NO |
| `productDominance` | **NO** | *field absent* | NO |

---

## 4. Commercial Loss Attribution

| Parameter | Loss Stage | Root cause |
|-----------|------------|------------|
| Product Area | **Compositor bridge** | `layoutObjectScale(compositionLayout.metrics)` ignores `layoutSpec.productAreaPct` |
| Product Dominance | Compositor + HTML | `primaryObject` unused; alpha-fit shrink; headline/badges overlay |
| Visual Hierarchy | Layout-engine + HTML | `hierarchy` unused; template-driven text zones |
| Background Separation | HTML overlay (minor) | Flux OK; badges/headline add zones |
| Scene Consistency | None at compositor | Background pass-through |

---

## 5. Minimal Integration Point (one proposal)

```
LayoutSpec.productAreaPct → layoutObjectScale() → objectScale → compositeProductIntoScene()
```

| Property | Value |
|----------|-------|
| File | `src/lib/generate-infographic-handler.ts` |
| Function | `layoutObjectScale` (line ~285) |
| Existing hook | `SceneCompositeOptions.objectScale` already used by `computeMaxProductSize` |
| Compositor rewrite | **Not required** |

---

## 6. Complexity Assessment

| Integration | Complexity | Product Impact |
|-------------|------------|----------------|
| `productAreaPct` → `layoutObjectScale` | **Low** | **High** (pixel product bbox) |
| Rescale `compositionLayout.product` zones | Medium | High |
| New placement engine | High | High |
| Rewrite scene-compositor | **Very High** | Unknown risk |

**Recommendation for Sprint 6B:** Low complexity path only.

---

## Benchmark Results

**Harness:** `benchmark/compositor-audit.ts` (5 products)

| Metric | Result |
|--------|--------|
| Commercial layoutSpec changed | 5/5 |
| Composition `productAreaPct` unchanged | 4/5 |
| Production `objectScale` unchanged | **5/5** |
| Would change with proposed integration | **5/5** |
| Avg area gap (composition − layoutSpec) | **−14.9%** |

Example (construction-vacuum):

| Source | Product area % |
|--------|----------------|
| Commercial layoutSpec | 55% |
| compositionLayout.metrics | ~66% |
| production objectScale | 0.62 |
| integrated objectScale (proposed) | 0.55 |

---

## Success Criteria

| Question | Answer |
|----------|--------|
| Where is Product Area computed? | `layout-engine/builder.ts` from template; compositor via `layoutObjectScale` |
| Who owns product scale? | `layoutObjectScale()` — **not** commercial LayoutSpec today |
| Who places product? | `fitProductWithSafePlacement` + floor detector |
| Can existing code be used? | **Yes** — `objectScale` parameter already wired |
| Minimal integration point? | `layoutObjectScale` ← `layoutSpec.productAreaPct` |
| Product Impact? | **High** for Product Area fidelity |

---

## Exit Criteria

Team now knows the confirmed production point for pixel-level Product Area:

**`generate-infographic-handler.ts` → `layoutObjectScale()` → `objectScale` → `compositeProductIntoScene()`**

No architectural assumptions — all claims verified against production source and benchmark JSON.

---

## Next Product Gap (Sprint 6B candidate)

**Commercial Compositor Bridge** — wire `layoutSpec.productAreaPct` into `layoutObjectScale()` at 3 call sites; validate with Commercial Fidelity on **merged** PNG (not background-only).

---

## Known Limitations

- Audit did not run live `compositeProductIntoScene` (no cutout fixtures in benchmark env).
- Typography/badge impact assessed by code trace, not pixel diff.
- `visualPriority` / `productDominance` are Genome concepts, not LayoutSpec fields.

---

## Deliverables

| File | Status |
|------|--------|
| `docs/DAOS_COMPOSITOR_AUDIT.md` | ✅ |
| `docs/DAOS_PRODUCT_SPRINT_6A_REPORT.md` | ✅ |
| `benchmark/compositor-audit.ts` | ✅ |
| `benchmark/output/sprint6a/compositor-audit.json` | ✅ |
