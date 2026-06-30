# DESIGN AI v18 — Chapter 4.12: Composition Director

## Purpose

Composition Director is the **third Creative Agent**. It transforms Story and Scene into a **professional commercial layout** ready for render and HTML Overlay. It owns visual space organization only.

## Pipeline Position

```
Story → Scene → Composition Director → Layout Section → Commercial Photo Director
```

Runs only after Story and Scene are defined.

## Responsibilities (only)

- Composition geometry
- Hero placement and visual hierarchy
- Eye flow and white space
- Layout template and safe zones for HTML overlay

**Never:** story, environment, lighting, materials, prompts.

## Layout Section

```typescript
interface LayoutSection {
  templateId: LayoutTemplate;
  heroArea: LayoutRect;
  headlineArea: LayoutRect;
  benefitsArea: LayoutRect;
  badgeArea: LayoutRect;
  ctaArea: LayoutRect;
  safeZones: LayoutRect[];
  visualHierarchy: HierarchyLevel[];
  whiteSpace: number;
  eyeFlow: EyeFlowProfile;
  compositionBlueprint: CompositionBlueprint;
  confidence: number; // 0.0..1.0
}
```

## Golden Rule

Composition Director does not place beautiful elements — it designs the **buyer's attention path**. If the user cannot tell where to look in the first two seconds, the composition failed.

## Implementation

| Module | Role |
|--------|------|
| `composition-director-types.ts` | Layout templates, rects, hierarchy, eye flow |
| `composition-director-engine.ts` | Template selection, validation, decision pipeline |
| `agents/composition-director-agent.ts` | Agent contract integration |

## Integration

Uses Chapter 4.6 Context, 4.7 Memory, 4.8 Decision pipeline, and 4.9 Confidence. Template selection is driven by **Story + Scene** with marketplace and overlay constraints.
