# DESIGN AI v18 — Chapter 5.7: Style Knowledge

## Purpose

Style Knowledge contains structured knowledge about visual styles, their characteristics, application domains, constraints, and commercial effectiveness. It enables Agent Ecosystem to consciously choose image style as a business decision, not random aesthetic preference.

## Design Philosophy

Most AI systems use style as decoration. Design AI treats style as a communication tool — style exists to convey a message, not decorate an image.

## Style Profile

| Field | Role |
|-------|------|
| `visualCharacteristics` | Composition, color, lighting, materials, density |
| `recommendedCategories` | Categories where style is effective |
| `forbiddenCategories` | Categories where style fails commercially |
| `psychologicalEffects` | Trust, exclusivity, precision, etc. |
| `constraints` | Rules enforced by Consensus Engine |

## Style Taxonomy

```
Commercial → Luxury → Modern Luxury → Minimal Luxury
Commercial → Technical → Modern Technical
```

## Core Families

Luxury, Minimal, Modern, Premium, Technical, Lifestyle, Natural, Industrial, Medical, Eco

## Key Behaviors

| Behavior | Implementation |
|----------|----------------|
| Category fit | `isStyleAllowedForCategory()` |
| Audience preferences | `AUDIENCE_STYLE_PREFERENCES` + `recommendStyleForContext()` |
| Marketplace hints | Amazon main → minimal/technical; secondary → lifestyle/luxury |
| Style composition | `composeStyles()` — Minimal + Luxury → Minimal Luxury |
| Agent consistency | `getAgentStyleGuidance()` — unified constraints per style |
| Blueprint validation | `validateStyleBlueprint()` — scene/lighting/composition match |
| Style evolution | `validateNewStyle()` — new styles require validation |
| Consensus retry | Style violations set `retryRecommended: true` |

## Golden Rule

Style is not decoration. Style conveys business meaning through visual language. Good style strengthens product, brand, and commercial offer perception.

## Implementation

| Module | Role |
|--------|------|
| `style-knowledge-types.ts` | StyleProfile, validation types |
| `style-knowledge-engine.ts` | Profiles, taxonomy, recommendation, validation |

## Integration

Builds on Ch 5.5 marketplace contexts, Ch 5.6 design rules, and `CreativeGoal` from blueprint types.

## Failure Conditions

Violated when:

- style is decorative words without structure;
- constraints or category links are missing;
- audience does not influence recommendations;
- agents interpret style inconsistently.
