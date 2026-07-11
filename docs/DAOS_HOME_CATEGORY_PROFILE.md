# DAOS Home Category Profile

**Category:** Дом (`home`)  
**Profile Version:** 1.1.0-home-wave1  
**Date:** 2026-07-11  
**Sources:** BV2 Category Analysis · Commercial KB (LAW_001–LAW_101) · WB Harvest n=14

---

## Category Overview

| Parameter | Value |
|-----------|-------|
| Harvest key | `home` |
| Market group | `home` |
| BV2 Win Rate | **57.1%** (8/14) |
| Tier | C (requires calibration) |
| Primary failure | **Dominance** (5/5 WB wins) |
| Target Win Rate | **≥70%** (Tier A) |

**Product mix:** органайзеры, коробки для хранения, держатели, контейнеры — flat/wide silhouettes with high WB product mass.

---

## Category Knowledge Extraction

### Main UTPs (УТП)

1. Порядок и экономия пространства
2. Быстрый доступ к вещам
3. Эстетика интерьера
4. Компактное хранение

### Visual Patterns (WB Leaders)

| Pattern | Frequency | DAOS Gap |
|---------|-----------|----------|
| `flat_wide_organizer_fills_lower_two_thirds` | High | DAOS lifestyle scene reduces apparent mass |
| `single_product_center_mass_no_props` | High | Scene props compete for attention |
| `soft_neutral_gradient_background` | High | Partially matched |
| `minimal_or_no_sidebar_on_storage_items` | Medium | Sidebar still present on losses |

### Competitor Errors (DAOS must avoid)

1. Слишком мелкий товар на lifestyle-фоне (`productVW < 15`)
2. Заголовок конкурирует с товаром (`headlineVW > 20`, LAW_003 r=−0.723)
3. Боковые характеристики отвлекают от массы товара
4. Тёмный фон снижает контраст светлых органайзеров

### Composition Signature

| Attribute | WB Leader Pattern | DAOS Current |
|-----------|-------------------|--------------|
| Hero Shape | Flat rectangular wide | Portrait lifestyle crop |
| Visual Mass | Product fills ≥45% canvas | Compositor ~17–18 productVW |
| Placement | Center-lower bias | Scene-dependent |
| Whitespace | 28–32% | 55–61% (LAW_003 violation) |

### Color & Lighting

| Attribute | Preference |
|-----------|------------|
| Palette | Warm neutral cream/white |
| Lighting | Soft diffused studio |
| Background | Light gradient neutral (`light_background`) |

### Typography

| Attribute | Rule | LAW |
|-----------|------|-----|
| Style | Single-line benefit, compact | LAW_003 |
| Headline weight | Subordinate to product | LAW_003 |
| Max headline width | 42% canvas | Measurable cap |
| Headline factor | 0.36 (relaxed overlay) | LAW_003 |

### Attention Hierarchy

```
product > headline > logo > characteristics
```

- Primary focus target: ≥0.36
- Dominance floor: 52
- Sidebar opacity: 0.55

---

## Category Genome Extension

Profile location: `src/lib/daos/commercial-genome-beta/category-intelligence/home-category-knowledge.ts`

| Dimension | Home v1.1 Value |
|-----------|-----------------|
| Commercial Laws | LAW_002, LAW_003, LAW_005, LAW_101 |
| Scene Preference | `light_modern_clean` |
| Lighting | Soft studio, contrastBoost 0.12 |
| Composition | productArea 45%, maxSpecs 1, badges 0 |
| Typography | Relaxed overlay, headlineFactor 0.36 |
| Background | `light_background` |
| Commercial Priority | Product visual mass > headline > specs |

---

## BV2 Loss Analysis (5 defeats)

| Slot | Product | DAOS Dom | WB Dom | Δ Dom | Headline Δ | Root Cause |
|------|---------|----------|--------|-------|------------|------------|
| 057 | Органайзер белья | 40 | 79 | −39 | +21.9 | Low productVW + headline competition |
| 058 | Держатель соусов | 47 | 64 | −17 | +8.5 | Product mass deficit |
| 059 | Органайзер косметики | 43 | 56 | −13 | +5.2 | Product mass deficit |
| 060 | Органайзер 3л | 42 | 51 | −9 | +2.8 | Near parity, attention |
| 068 | Коробка с крышкой | 28 | 43 | −15 | −3.2 | **productVW 8** — compositor scale |

**Key finding:** Typography tuning (v1.1) reduced headline weight on wins but **did not flip any losses**. Product-057 headline remains 27.1 — identical to BV2. Dominance metric is driven primarily by **compositor product visual mass**, not overlay typography alone.

---

## Measurable Rules (auto-selected)

```typescript
// Resolved when prompt matches: органайзер, для дома, корзин, хранен, ...
resolveCategoryIntelligenceKey({ productTitle }) → "home"
```

All rules map to existing Commercial KB laws — no new Foundation laws introduced.

---

## Wave 1.1 Calibration Result

| Metric | BV2 | v1.1 | Δ |
|--------|-----|------|---|
| Win Rate | 57.1% | 57.1% | 0pp |
| Avg Dominance | 49.4 | 49.3 | −0.1 |
| Gen Success | 100% | 100% | — |

**Council:** FAIL — Category Intelligence intent layer alone cannot close the compositor mass gap for flat home organizers.

---

## Required Next Step (Product Backlog)

**Primary Product Gap:** Product Visual Mass on flat wide organizers — requires compositor-level hero fill calibration (outside Category Intelligence intent scope per architecture freeze).

Candidate approaches (post-validation):
1. Category-tuned `objectScale` via existing `heroScale` propagation (Sprint 8C recalibration)
2. Packshot fill mode for flat silhouettes (`BV1_PACKSHOT_INPUT` extension)
3. Scene template `flat_product_hero` for home market group

---

**END OF HOME CATEGORY PROFILE**
