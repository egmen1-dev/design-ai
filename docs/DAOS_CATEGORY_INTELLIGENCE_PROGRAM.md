# DAOS Category Intelligence Program — Wave 1

**Status:** Implementation Complete — Validation Pending  
**Date:** 2026-07-11  
**Flag:** `DAOS_CATEGORY_INTELLIGENCE=1`  
**Depends on:** `DAOS_COMMERCIAL_GENOME_BETA=1`

---

## Objective

Create specialized commercial models for underperforming BV2 categories without modifying Foundation (EKB), Layout Runtime, or Compositor geometry.

**Wave 1 categories:** Дом, Кухня, Климат, Мойка

---

## Architecture

```
Commercial Genome Beta (Foundation — unchanged)
        ↓
Category Intelligence Layer (additive, flag-gated)
        ↓
CommercialDecisionBeta overrides
        ↓
Layout Integration (existing gate)
        ↓
Attention Hierarchy + Post-Overlay Gate (category caps)
```

### Boundaries (unchanged)

| Layer | Status |
|-------|--------|
| `wildberries-hero-rules.ts` (EKB Foundation) | **NOT modified** |
| Layout Runtime / Compositor / Geometry | **NOT modified** |
| Prompt Compiler core | **NOT modified** |
| Commercial Genome rule resolution | **NOT modified** |

### New module

`src/lib/daos/commercial-genome-beta/category-intelligence/`

| File | Role |
|------|------|
| `profiles.ts` | Wave-1 commercial models (4 categories) |
| `resolve-category-key.ts` | Harvest-key resolution from prompt |
| `apply-category-intelligence.ts` | Decision overrides |
| `index.ts` | Flag + public API |

---

## Category Models

Each profile defines:

| Dimension | Applied via |
|-----------|-------------|
| Commercial Laws | Trace + diagnostics |
| Visual Patterns | Trace + prompt snippet |
| Attention Rules | CSS caps + dominance gate floors |
| Composition Rules | `productAreaTarget`, `maxCharacteristics`, `badgeLimit`, `visualHierarchy` |
| Lighting Rules | `environmentDirection` |
| Hero Rules | `mainMessage`, `heroDominance` |
| Typography Rules | `typographyDirection`, default overlay mode |
| Background Rules | `backgroundContrastDirection` |

### BV2 Baseline → Wave 1 Targets

| Category | Harvest Key | BV2 Win Rate | Primary Failure | Wave 1 Focus |
|----------|-------------|--------------|-----------------|--------------|
| **Дом** | `home` | 57.1% | Dominance (5) | +product area 44%, light BG, relaxed typography |
| **Кухня** | `kitchen` | 50.0% | Dominance (4) | Warm studio, compact specs, dominance floor 51 |
| **Климат** | `humidifier` | 50.0% | Category Specific (3) | Vertical appliance, max 2 specs, cool neutral BG |
| **Мойка** | `pressure-wash` | 50.0% | Background+Dominance | Industrial env, cool neutral, dominance floor 52 |

---

## Feature Flag

```bash
DAOS_CATEGORY_INTELLIGENCE=1   # enable wave-1 profiles
DAOS_CATEGORY_INTELLIGENCE=0   # default — genome-only path
```

Registered in `feature-flag-registry.ts` with lifecycle `Shadow`, wave 45.

---

## Validation

### Benchmark

```bash
cd marketplace-infographic
npx tsx benchmark/category-intelligence-wave1.ts
```

Output: `benchmark/output/category-intelligence-wave1/summary.json`

### Success Criteria

Each wave-1 category must show **positive win rate delta** vs BV2 baseline:

| Category | BV2 Baseline | Target |
|----------|--------------|--------|
| Дом | 57.1% | >57.1% |
| Кухня | 50.0% | >50.0% |
| Климат | 50.0% | >50.0% |
| Мойка | 50.0% | >50.0% |

### Unit Tests

```bash
npx tsx src/lib/daos/commercial-genome-beta/category-intelligence/category-intelligence.test.ts
```

---

## Integration Points

1. **`createCommercialGenomeBetaDecision()`** — applies intelligence after base decision
2. **`generate-infographic-handler.ts`** — category attention rules → CSS + gate floors
3. **`attention-hierarchy.ts`** — category-tuned headline/sidebar opacity
4. **`post-overlay-dominance-gate.ts`** — category-specific dominance/focus floors

---

## Product Backlog (Wave 2+)

- Expand to Tier B categories (Сад, Бытовая техника)
- Add missing harvest categories (Освещение, Хранение, Электроника)
- Seller packshot metadata bridge for explicit category key
- Per-category compositor scale hints (requires Sprint 8C recalibration)

---

**END OF CATEGORY INTELLIGENCE PROGRAM — WAVE 1**
