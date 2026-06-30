# DESIGN AI v18 — Chapter 5.10: Color Knowledge

## Purpose

Color Knowledge contains professional knowledge about color relationships, harmonies, contrast, emotional perception, and commercial use. Color is an information carrier — every color must answer why it helps sell the product.

## Design Philosophy

Color is not decoration. If there is no commercial rationale, the color is wrong.

## Color Knowledge Object

| Field | Role |
|-------|------|
| `palette` | Recommended color combination |
| `purpose` | Commercial rationale |
| `psychologicalEffects` | Trust, luxury, energy, etc. |
| `recommendedCategories` / `forbiddenCategories` | Category fit |

## Key Behaviors

| Behavior | Implementation |
|----------|----------------|
| Color psychology | `COLOR_PSYCHOLOGY` — blue (trust), green (eco), black (luxury), white (clean), red (energy) |
| Color harmony | `selectColorHarmony()` — monochromatic, analogous, complementary, triadic |
| Category profiles | Medical, luxury cosmetics, eco, electronics palettes |
| Color temperature | `selectPaletteColorTemperature()` — warm (kitchen), cold (electronics) |
| Accent policy | Max 3 accents: primary + secondary + accent |
| Contrast | `CONTRAST_GUIDANCE` — color, luminance, saturation, local, global |
| Hero contrast | Product must never be lost on background |
| Brand conflict | `resolveBrandColorConflict()` — readability overrides brand |
| Agent consistency | `validateAgentPaletteConsistency()` — unified temperature |
| Accessibility | `MIN_TEXT_CONTRAST_RATIO` 4.5 |
| Blueprint validation | `validateColorBlueprint()` — triggers local retry |
| Evolution | `applyColorLearningFeedback()` — commercial score feedback |

## Golden Rule

Color directs attention, evokes emotions, strengthens product value, and helps purchase decisions. If color does not help sell, it is chosen incorrectly.

## Implementation

| Module | Role |
|--------|------|
| `color-knowledge-types.ts` | Knowledge model, validation types |
| `color-knowledge-engine.ts` | Psychology, profiles, validation |

## Integration

Builds on Ch 5.7 Style Knowledge and Ch 5.5 Marketplace. Used by Story Director and lighting/material agents.

## Failure Conditions

Violated when:

- colors selected randomly;
- no business goal link;
- palette contradicts story;
- insufficient contrast;
- agents use different color systems.
