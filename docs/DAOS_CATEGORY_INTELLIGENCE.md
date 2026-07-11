# DAOS Category Intelligence

**Program:** Category Intelligence Layer  
**Version:** 1.1.0-home-wave1  
**Date:** 2026-07-11  
**Owner:** Commercial Genome Beta

---

## Purpose

Raise underperforming marketplace categories from Tier C to Tier A **without** modifying Foundation (EKB), Layout Runtime, Compositor, or Registry.

Category Intelligence is an **additive intent layer** atop Commercial Genome Beta that applies category-specific commercial models when `DAOS_CATEGORY_INTELLIGENCE=1`.

---

## Architecture

```
┌─────────────────────────────────────────┐
│  Foundation — EKB v1.0 (unchanged)      │
│  wildberries-hero-rules.ts              │
└──────────────────┬──────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│  Commercial Genome Beta                 │
│  resolveCommercialRulesBeta()           │
│  buildCommercialDecisionBeta()          │
└──────────────────┬──────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│  Category Intelligence Layer  [NEW]       │
│  resolveCategoryIntelligenceKey()       │
│  applyCategoryIntelligence()            │
│  Profiles: home · kitchen · humidifier  │
│            · pressure-wash               │
└──────────────────┬──────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│  Layout Integration (unchanged)         │
│  Attention Hierarchy CSS (category caps)│
│  Post-Overlay Dominance Gate (floors)   │
└─────────────────────────────────────────┘
```

---

## Wave Roadmap

| Wave | Category | Status | Win Rate |
|------|----------|--------|----------|
| 1.0 | All Tier C (4 cats) | Complete | 56% aggregate (+4.2pp) |
| **1.1** | **Дом (Home)** | **FAIL** | **57.1%** (0pp vs BV2) |
| 1.2 | Кухня | Pending | 50% baseline |
| 1.3 | Климат | Pending | 50% baseline |
| 1.4 | Мойка | Validated v1.0 | 57.1% (+7.1pp) |

---

## Category Profile Schema

Each profile defines 8 measurable dimensions:

| Dimension | Type | Example (Home) |
|-----------|------|----------------|
| Commercial Laws | `CommercialLawRef[]` | LAW_002, LAW_003, LAW_101 |
| Visual Patterns | `string` | flat_wide_organizer_fills_lower_two_thirds |
| Attention Rules | `CategoryAttentionRules` | headlineFactor 0.36, floor 52 |
| Composition Rules | `CategoryCompositionRules` | productArea 0.45, specs 1 |
| Lighting Rules | `CategoryLightingRules` | light_modern_clean |
| Hero Rules | `CategoryHeroRules` | product_first |
| Typography Rules | `CategoryTypographyRules` | relaxed overlay |
| Background Rules | `CategoryBackgroundRules` | light_background |

---

## Feature Flag

```bash
DAOS_CATEGORY_INTELLIGENCE=1   # enable category profiles
DAOS_CATEGORY_INTELLIGENCE=0   # default — genome-only
```

Dependencies: `DAOS_COMMERCIAL_GENOME_BETA=1`

---

## Category Resolution

Harvest-aligned keys resolved from product title:

| Russian Label | Key | Match Keywords |
|---------------|-----|----------------|
| Дом | `home` | органайзер, для дома, хранен, корзин |
| Кухня | `kitchen` | кухон, блендер, миксер, посуда |
| Климат | `humidifier` | увлажнител, климат, осушител |
| Мойка | `pressure-wash` | мойк, давлен, karcher |

---

## Validation Protocol

1. Select category products from WB harvest
2. Enable `DAOS_CATEGORY_INTELLIGENCE=1`
3. Generate DAOS cards vs WB leaders
4. Human-equivalent verdict (composite score + dominance override)
5. Compare Category Win Rate vs BV2 baseline
6. Confirm Tier A regression (frozen BV2 results)

**Success:** Category Win Rate ≥70%, Gen Success 100%, no Tier A degradation.

---

## Design Principles

1. **Measurable** — every rule maps to a KPI or KB law
2. **Data-driven** — calibrated from BV2 failure analysis
3. **KB-compatible** — uses LAW_002, LAW_003, LAW_101, not ad-hoc laws
4. **Auto-selected** — category key from prompt, no manual config
5. **Not manual tuning** — profiles are structured commercial models, not per-product overrides

---

## Key Finding (Home Wave 1.1)

Category Intelligence intent (typography, composition, background) **cannot alone** close the dominance gap for flat home organizers. The primary blocker is **compositor product visual mass** — a runtime-level constraint outside the allowed scope.

Typography suppression (LAW_003) improved winning cards marginally but did not flip any of the 5 BV2 losses.

---

## Module Reference

```
src/lib/daos/commercial-genome-beta/category-intelligence/
├── types.ts
├── profiles.ts
├── home-category-knowledge.ts    # Home v1.1 SSOT
├── resolve-category-key.ts
├── apply-category-intelligence.ts
└── index.ts
```

---

**END OF DAOS CATEGORY INTELLIGENCE**
