# v16.7 Composition Director

## Pipeline

```
Story Engine
    ↓
Scene Director → SceneBlueprint
    ↓
Composition Director → LayoutSpec (geometry)
    ↓
Scene Planner + Layout Engine
    ↓
Prompt Builder (compiles FROM LayoutSpec — never invents layout)
    ↓
SD Background → Render
```

## Module

`src/lib/design/composition-director/`

| File | Role |
|------|------|
| `types.ts` | LayoutGeometry, LayoutSpec extensions |
| `templates.ts` | 12 composition templates with constraints |
| `geometry.ts` | Build geometry from constraints + rules |
| `eye-flow.ts` | Hero → Headline → Benefits → CTA |
| `balance.ts` | Left/right, CoG, negative space |
| `whitespace.ts` | Density, edge pressure, crowded rejection |
| `hierarchy.ts` | H1 → Hero → Supporting → CTA → Decorative |
| `CompositionDirector.ts` | Orchestrator + quality gate (78) |

## LayoutSpec geometry example

```json
{
  "canvas": { "width": 900, "height": 1200 },
  "grid": { "columns": 12, "margin": 48, "gutter": 16 },
  "hero": { "x": 0.55, "y": 0.32, "width": 0.44, "height": 0.46, "rotation": -4 },
  "headline": { "x": 0.08, "y": 0.09, "width": 0.34, "height": 0.18 },
  "benefits": { "x": 0.08, "y": 0.34, "width": 0.36, "height": 0.12 },
  "cta": { "x": 0.08, "y": 0.83, "width": 0.22, "height": 0.06 }
}
```

## API fields

```json
{
  "compositionQualityScore": 84,
  "compositionTemplate": "hero_right",
  "pipelineVersion": "v16.7-composition-director"
}
```

## Backward compatibility

- Existing LayoutSpec fields preserved
- `buildInitialLayoutSpec` fallback when Composition Director skipped
- All prior agents unchanged

## Tests

```bash
npx tsx src/lib/design/composition-director/composition.spec.ts
```

## Checklist

- [x] LayoutSpec schema with geometry
- [x] 12 layout templates
- [x] Composition rules (hero 35–50%, no dead center)
- [x] Eye Flow Engine
- [x] Visual Balance
- [x] Whitespace Engine
- [x] Visual Hierarchy
- [x] Prompt Builder integration
- [x] Handler wiring
- [ ] Persist geometry in stored payload (optional)
