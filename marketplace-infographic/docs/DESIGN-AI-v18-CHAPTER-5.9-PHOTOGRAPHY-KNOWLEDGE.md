# DESIGN AI v18 — Chapter 5.9: Photography Knowledge

## Purpose

Photography Knowledge contains professional commercial product photography knowledge for realistic, premium, and commercially effective images. Design AI designs photography first, then asks the Provider to realize it.

## Design Philosophy

AI models create beautiful images but rarely follow professional photography laws. Photography Knowledge ensures lighting, perspective, materials, and reflections obey physics and commercial intent.

## Photography Knowledge Object

| Field | Role |
|-------|------|
| `topic` | lighting, lens, perspective, depth_of_field, exposure, reflection, material, physical_realism |
| `rule` | Actionable photographic guidance |
| `conditions` | Context matching |
| `examples` | Reference shots |
| `references` | Evidence attribution |
| `commercialRationale` | Why this improves sales |

## Product First

```
Product > Photography
```

Photography never becomes the main subject.

## Key Behaviors

| Behavior | Implementation |
|----------|----------------|
| Lighting schemes | `LIGHTING_SCHEME_KNOWLEDGE` — soft window, softbox, rim, three-point, product table |
| Lens profiles | `LENS_KNOWLEDGE` — 35mm dynamic, 50mm natural, 85mm premium, 100mm macro |
| Perspective | Low angle (power), frontal (technical) |
| Depth of field | Moderate blur (luxury), deep focus (technical) |
| Exposure | High key (marketplace), low key (premium drama) |
| Reflections | Controlled metal/glass, minimized plastic glare |
| Material lighting | `MATERIAL_LIGHTING_MAP` — per-material schemes |
| Physical realism | Shadow direction matches light; scale consistency |
| Blueprint validation | `validatePhotographyBlueprint()` — triggers retry |
| Evolution | `applyPhotographyLearningFeedback()` — vision/commercial scores |

## Golden Rule

Professional photography begins with understanding what the buyer must feel. Photography Knowledge creates trust, demonstrates value, and supports purchase decisions.

## Implementation

| Module | Role |
|--------|------|
| `photography-knowledge-types.ts` | Knowledge model, validation types |
| `photography-knowledge-engine.ts` | Seed knowledge, matching, validation |

## Integration

Builds on Ch 5.7 style, Ch 5.5 marketplace, and Technical Directors (Ch 4.14–4.16). Distinct from `LightingScheme` catalog in Ch 4.14 — this chapter owns the knowledge layer.

## Failure Conditions

Violated when:

- lighting is random;
- physics laws broken;
- perspective contradicts story;
- material and lighting disconnected;
- decisions lack commercial explanation.
