# DAOS Attention Hierarchy

**Version:** `1.0.0-quality-cycle-5`  
**Law:** `LAW_101` — Attention Hierarchy  
**Module:** `src/lib/typography/attention-hierarchy.ts`  
**Feature flag:** `DAOS_ATTENTION_HIERARCHY` (default **ON**; set `=0` to disable)

---

## LAW_101

```
Attention(Product) > Attention(Headline) > Attention(Benefits) > Attention(Badges) > Attention(Background)
```

Violations produce a **diagnostics warning** (`law101Warning`) in stored payload.  
Constitution stage: `rendered_critique` (proxy pre-render; pixel validation post-render).

---

## Problem (Cycle 4)

Compositor FI **80.5** → final **33.8**. Heatmap peak moved from product zone to headline **(0.12, 0.07)**.  
Headline Visual Weight: **r = −0.723** with Product Dominance.

---

## Typography Investigation

Why headline had excessive Visual Weight:

| Parameter | Before | Contribution |
|-----------|--------|--------------|
| **Font weight** | 800 | High edge density, bold mass |
| **Size multiplier** | 0.88 × fontSizePct | ~40–74px effective |
| **Contrast** | `#fff` on `rgba(15,23,42,0.93)` bar | Maximum luminance separation |
| **Placement** | Full-width top bar, z-index 9 | Occupies prime eye-entry zone |
| **Background bar** | Dark gradient across full width | Large high-contrast shape |
| **Distance to product** | Top of card | First fixation point on scroll |

Badges contributed **zero delta** on overlay (Cycle 4 confirmed).

---

## Implementation (additive CSS only)

Injected via `buildAttentionHierarchyCss()` appended in `composition/css-vars.ts`.

| Change | Before | After |
|--------|--------|-------|
| Font weight | 800 | **600** |
| Size multiplier | 0.88 | **0.62** |
| Bar opacity | 0.93 | **0.38** gradient |
| Bar border | accent line | **none** |
| Text color | `#fff` | **`rgba(255,255,255,0.9)`** + text-shadow |
| max-width | 78% | **58%** |
| z-index | 9 | **6** |
| Top offset | baseline | **+1.2% canvas** (more whitespace) |

**Not changed:** LayoutSpec, Geometry, Compositor, Genome, Prompt, Product Scale.

---

## Diagnostics

```typescript
type AttentionHierarchyDiagnostics = {
  enabled: boolean;
  law101Passed: boolean;
  law101Warning?: string;
  attentionHierarchyScore: number; // 0–100
  productVisualWeight: number;
  headlineVisualWeight: number;
  primaryFocusRatio: number;
  peakX: number;
  peakY: number;
  peakOnProduct: boolean;
};
```

Captured post-render in `generate-infographic-handler.ts` via `captureAttentionHierarchy()`.

---

## Attention Hierarchy Score

```
score = primaryFocus×0.35 + (100−competition)×0.25 + weightGap×0.25 + peakBonus(15)
```

---

## Related

- [DAOS Attention Competition Research](./DAOS_ATTENTION_COMPETITION_RESEARCH.md)
- [DAOS Quality Cycle 5 Report](./DAOS_QUALITY_CYCLE_5_REPORT.md)
