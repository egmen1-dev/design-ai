# DAOS Production Compositor Audit

**Sprint:** 6A (read-only)  
**Version:** 1.0.0-sprint6a  
**Benchmark:** `benchmark/compositor-audit.ts`  
**Evidence:** `benchmark/output/sprint6a/compositor-audit.json`

---

## 1. Production Compositor Pipeline

Confirmed production chain in `generate-infographic-handler.ts` (v17 marketplace path):

```
Product photo / upload
  ↓ loadProductCutout()
Cutout PNG (alpha)
  ↓
Flux / Pollinations background (RENDER_ENGINE_V17)
  ↓ regenerateMarketplaceBackground()
Background 900×1200
  ↓ compositeProductIntoScene()  — src/lib/compositing/scene-compositor.ts
    ├─ resizeBackground()
    ├─ detectFloorY()            — ground-detector.ts
    ├─ matchLightingToScene()    — lighting-matcher.ts
    ├─ matchColorToScene()       — color-matcher.ts
    ├─ softenProductEdges()      — scene-harmony.ts
    ├─ prepareProductLayer()     — resize + rotate (±3°)
    ├─ fitProductWithSafePlacement() — alpha-fit.ts
    ├─ applyFloorColorSpill()
    ├─ resolveVerticalTop()      — floor anchor
    ├─ renderFloorContactShadow() + renderFloorReflection()
    ├─ generateShadows()       — shadow-generator.ts
    ├─ generateReflection()      — optional, ScenePlan.reflectionEnabled
    ├─ sharp.composite()         — product + shadows
    ├─ applyFilmGrain()
    └─ applySceneHarmony()
Merged PNG (/public/merged/*.png)
  ↓ mergedToDataUrl()
  ↓ renderInfographicHtml()      — infographic-template.ts
    ├─ compositionToCssBlock()   — composition/css-vars.ts
    ├─ marketplace-badges        — badges / plaques
    └─ headline typography       — infographic-html-templates.ts
HTML
  ↓ renderHtmlToImage()          — puppeteer.ts
  ↓ polishCoverImage()
Final PNG (Wildberries card)
```

### Module map

| Stage | Production module | Key function |
|-------|-------------------|--------------|
| Cutout | `product-cutout` loader (handler) | `loadProductCutout` |
| Resize | `compositing/scene-compositor.ts` | `prepareProductLayer` |
| Scale | `generate-infographic-handler.ts` | `layoutObjectScale` → `objectScale` |
| Scale (max bbox) | `compositing/scene-compositor.ts` | `computeMaxProductSize` |
| Alpha shrink | `compositing/alpha-fit.ts` | `fitProductByAlphaBounds` |
| Placement | `compositing/alpha-fit.ts` | `fitProductWithSafePlacement`, `resolveAlphaCenteredLeft` |
| Vertical anchor | `compositing/scene-compositor.ts` | `resolveVerticalTop` + `detectFloorY` |
| Shadow | `compositing/shadow-generator.ts` | `generateShadows` |
| Floor contact | `compositing/floor-contact.ts` | `renderFloorContactShadow` |
| Overlay merge | `compositing/scene-compositor.ts` | `sharp().composite()` |
| Typography | `infographic-html-templates.ts` | `renderLayoutHtml` |
| Badges | `marketplace-badges.ts` | `buildSpecPlaquesHtml`, `buildSideBadges*` |
| Final raster | `puppeteer.ts` | `renderHtmlToImage` |

Wrapper entry: `image-compositor.ts` → `mergeProductWithBackground()` delegates to `compositeProductIntoScene()`.

---

## 2. Product Area Ownership

### Where is product size computed?

| Layer | Owner | Formula / source |
|-------|-------|------------------|
| **Commercial target** | `LayoutSpec` | `heroScale` (0.5–0.8), `productAreaPct` (Genome mirror) |
| **Layout geometry** | `layout-engine/builder.ts` | `zoneAreaPct(product.width, product.height)` from **template.productScale** (0.61–0.70) |
| **Compositor input** | `generate-infographic-handler.ts:285` | `layoutObjectScale(compositionLayout.metrics.productAreaPct)` — **NOT layoutSpec** |
| **Max pixel size** | `scene-compositor.ts:119` | `computeMaxProductSize(compositionLayout, objectScale)` |
| **Alpha bbox** | `ground-detector.ts` | `getAlphaBounds()` on cutout |
| **Final placement** | `scene-compositor.ts:430` | `productPlacement { left, top, width, height }` |

### Key functions

| Question | Answer (production file) |
|----------|--------------------------|
| Product size target? | `layout-engine/builder.ts` → `computeMetrics().productAreaPct` from template |
| Scale multiplier? | `layoutObjectScale()` in handler → `objectScale` param |
| Max bbox? | `computeMaxProductSize()` in scene-compositor |
| Position? | `fitProductWithSafePlacement()` + `resolveVerticalTop()` |
| Safe zones? | `CompositionLayout` zones (headline, leftPanel, product) — from layout-engine template |
| Hero placement? | `compositionLayout.product.{left,top,width,height,centerX,centerY}` |

### Critical disconnect (confirmed)

```
Commercial Genome sets layoutSpec.productAreaPct = 55
CompositionLayout.metrics.productAreaPct ≈ 65–68 (from template.productScale)
layoutObjectScale reads composition metrics ONLY
→ objectScale stays ~0.62 regardless of commercial 55%
```

Benchmark (5 products): **avg gap −14.9%** between composition area and layoutSpec target.

---

## 3. LayoutSpec Usage Matrix

| LayoutSpec Field | Used in Compositor Path | Module | Notes |
|------------------|------------------------|--------|-------|
| `heroScale` | PARTIAL | `layout-spec/patches.ts` | `layoutSpecToTemplatePreference` only (`>=0.68` → `hero_right`). **Not** passed to `objectScale`. |
| `productAreaPct` | **NO** | commercial integration (write) | Never read by handler or compositor. |
| `primaryObject` | **NO** | — | Genome field; no compositor reference. |
| `hierarchy` | **NO** | — | Not used by layout-engine or compositor. |
| `maxIcons` | **NO** | prompt-compiler | Badge limit not enforced in compositor. |
| `maxCharacteristics` | **NO** | prompt-compiler | Typography limit not in compositor. |
| `scenePreference` | **NO** | visual-pipeline (Flux) | Sprint 4 background only. |
| `backgroundPalettePreference` | **NO** | visual-pipeline (Flux) | HTML uses separate accent system. |
| `visualPriority` | **NO** | — | **Field does not exist** on LayoutSpec; Genome maps to `hierarchy`. |
| `productDominance` | **NO** | — | **Field does not exist** on LayoutSpec; Genome maps to `primaryObject`. |

### LayoutSpec fields that DO affect compositor path (indirect)

| Field | Effect |
|-------|--------|
| `heroPosition` | Template selection (`hero_left` / `minimal` / default) |
| `backgroundStyle` | Template `luxury` when `dark_premium` |
| `whitespaceTarget` | Template `premium` when `>=30` |
| `compositionTemplateId` | Via `COMPOSITION_TEMPLATES` → layout engine template |
| `maxSecondaryObjects` | `simplifyCardMeaningForSpec` trims badge/subtitle before layout |

---

## 4. Existing Compositor Capabilities (without rewrite)

| Capability | Supported? | Mechanism |
|------------|------------|-----------|
| Change product scale | **YES** | `SceneCompositeOptions.objectScale` → `computeMaxProductSize` scaleBoost |
| Change bbox | **YES** | `compositionLayout.product.maxWidthPct/maxHeightPct` zones |
| Change safe area | **YES** | `compositionLayout` text zones + `safeInsetPct` |
| Change anchor | **PARTIAL** | `detectFloorY` + `resolveVerticalTop`; horizontal via `resolveAlphaCenteredLeft` |
| Vertical alignment | **YES** | `resolveVerticalTop`, `HEADER_RESERVE_PX`, `BOTTOM_PAD` |
| Change padding | **YES** | `PRODUCT_SIDE_MARGIN_PX`, `PRODUCT_BOTTOM_PAD_PX` constants |

### Existing parameters (production)

```typescript
// scene-compositor.ts
SceneCompositeOptions {
  layout?: "center" | "marketplace";
  scene: ScenePlan;
  compositionLayout?: CompositionLayout;
  objectScale?: number;  // ← primary commercial hook
}

// product-render-policy.ts
PRODUCT_MAX_WIDTH_PX, PRODUCT_TARGET_MAX_HEIGHT_PX,
PRODUCT_ALPHA_MAX_WIDTH_PX, PRODUCT_ALPHA_MAX_HEIGHT_PX,
PRODUCT_SIDE_MARGIN_PX, PRODUCT_BOTTOM_PAD_PX
```

`objectScale` default: `0.78` in compositor, but handler passes `layoutObjectScale()` ≈ `0.50–0.62`.

---

## 5. Commercial Loss Attribution

| Parameter | Loss stage | Evidence |
|-----------|------------|----------|
| **Product Area** | **Compositor bridge** | `layoutObjectScale` ignores `layoutSpec.productAreaPct`; uses template-derived `compositionLayout.metrics.productAreaPct` |
| **Product Dominance** | **Compositor + HTML** | `primaryObject` unused; `fitProductWithSafePlacement` shrink loop reduces size; headline HTML adds competing visual mass |
| **Visual Hierarchy** | **Layout-engine + HTML** | `hierarchy` unused; template `textSide` + headline zones fixed per template |
| **Background Separation** | **HTML overlay (minor)** | Flux OK (Sprint 4); badges/headline overlay on merged image |
| **Scene Consistency** | **None at compositor** | Background pass-through; resize only |

### Per-parameter chain

**Product Area**
```
Commercial Decision → LayoutSpec (55%) → ✗ BREAK → compositionLayout (~66%) → layoutObjectScale → objectScale → computeMaxProductSize → Final PNG
Loss: layoutObjectScale() in generate-infographic-handler.ts
```

**Product Dominance**
```
Commercial Decision → primaryObject → ✗ BREAK → template productScale → alpha-fit shrink → HTML badges
Loss: Compositor + Typography overlay
```

**Visual Hierarchy**
```
Commercial Decision → hierarchy → ✗ BREAK → layout template → compositionLayout zones → HTML
Loss: Layout-engine template + infographic-html-templates
```

---

## 6. Minimal Integration Point (single proposal)

```
LayoutSpec.productAreaPct (fallback: round(heroScale × 100))
  ↓
layoutObjectScale()  — generate-infographic-handler.ts:285
  ↓
objectScale
  ↓
compositeProductIntoScene({ objectScale })
  ↓
computeMaxProductSize(compositionLayout, objectScale)
```

### Why this point

1. **`objectScale` already exists** — consumed by `computeMaxProductSize` without compositor rewrite.
2. **`productAreaPct` already on LayoutSpec** — written by Sprint 1 commercial integration.
3. **One function change** — `layoutObjectScale` + pass `layoutSpec` at 3 existing call sites.
4. **Benchmark proves impact** — all 5 products would change `objectScale` from ~0.62 → ~0.55.

### Complexity: **Low**

### Estimated Product Impact: **High** (Product Area pixel fidelity)

---

## 7. Constants reference

| Constant | Value | File |
|----------|-------|------|
| Canvas | 900×1200 | `composition/canvas.ts` |
| PRODUCT_AREA_MIN/MAX | 55–75% | `layout-engine/constants.ts` |
| Template productScale | 0.61–0.70 | `layout-engine/templates.ts` |
| objectScale clamp | 0.50–0.62 | `generate-infographic-handler.ts` |
| HEADER_RESERVE_PX | 20% canvas height | `scene-compositor.ts` |

---

## Appendix: Handler call order (commercial relevance)

```
1. buildProfessionalComposition(layoutSpec)     → compositionLayout from TEMPLATE
2. finalizeProductionLayoutSpec(genome)         → layoutSpec.heroScale/productAreaPct updated
3. rebuildVisualPipelineForRender(layoutSpec)  → Flux path (Sprint 4)
4. objectScale = layoutObjectScale(compositionLayout.metrics.productAreaPct)  ← uses PRE-COMMERCIAL metrics
5. compositeProductIntoScene(..., objectScale)  ← commercial area NOT applied
6. renderInfographicHtml(compositionLayout)     → typography/badges
7. renderHtmlToImage()                          → final PNG
```

Commercial LayoutSpec is stabilized **after** composition layout is built, and **never fed back** into step 4.
