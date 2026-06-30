# DESIGN AI v18 — Chapter 5.4: Knowledge Layers

## Purpose

Knowledge Layers organizes different types of knowledge into independent levels, each solving its own task in commercial infographic design. Knowledge is separated by role in decision-making, not by source.

## Layer Stack

```
Business → Marketplace → Design → Photography → Psychology → Rendering
```

Learning Layer runs post-pipeline (not in forward chain).

## Layers

| Layer | Responsibility | Dynamic |
|-------|----------------|---------|
| Business | Commercial goal, positioning, audience | No |
| Marketplace | Platform rules (Amazon, Ozon, WB) | No |
| Design | Composition, hierarchy, negative space | No |
| Photography | Lighting, lens, materials, exposure | No |
| Psychology | Attention, trust, color perception | No |
| Rendering | Provider capabilities — implementation only | No |
| Learning | Design Memory patterns — post-pipeline | Yes |

## Key Behaviors

| Behavior | Implementation |
|----------|----------------|
| Layer priority | Business > Marketplace > Design > Photography > Psychology > Learning > Rendering |
| Cross-layer reasoning | `buildCrossLayerReasoning()` combines multiple layers |
| Layer independence | Marketplace change must not mutate Photography |
| Knowledge isolation | Learning unavailable — core layers still operational |
| Layer versioning | `publishLayerVersion()` per layer independently |
| Agent access | `getAgentKnowledgeLayers()` — scoped layer query |
| Extensibility | accessibility, localization, brand_identity slots |

## Golden Rule

Design Knowledge is a multi-level system where each layer owns its domain, yet all layers form unified professional design thinking.

## Implementation

| Module | Role |
|--------|------|
| `knowledge-layers-types.ts` | Layer definitions, cross-layer types |
| `knowledge-layers-engine.ts` | Stack, priority, reasoning, validation |

## Integration

Builds on Ch 5.1–5.3 and Design Memory (Ch 4.20). Distinct from Ecosystem Layers (Ch 4.28).

## Failure Conditions

Violated when:

- monolithic store without layer structure;
- no layer boundaries;
- one layer mutation breaks others;
- rendering overrides business;
- learning unavailability blocks pipeline.
