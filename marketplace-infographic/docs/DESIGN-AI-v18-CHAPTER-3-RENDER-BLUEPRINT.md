# DESIGN AI v18 — Chapter 3: RenderBlueprint

> Источник истины для всей системы. Реализация: `src/lib/render-blueprint/types.ts`

## Назначение

`RenderBlueprint` — единственный Single Source of Truth. Агенты меняют только свою секцию. Между агентами не передаются prompt-строки. Состояние проекта в момент времени.

## Архитектурные правила

| Rule | Суть |
|------|------|
| **001** | Каждая сущность один раз (`camera.distance`, не `scene.cameraDistance`) |
| **002** | Агент пишет только свою область |
| **003** | Все поля типизированы (`quality: QualityProfile`, не `string`) |
| **004** | Prompt запрещён в blueprint — генерирует адаптер |

## Структура

```typescript
interface RenderBlueprint {
  meta: MetaBlueprint;
  creative: CreativeBlueprint;
  story: StoryBlueprint;
  product: ProductBlueprint;
  scene: SceneBlueprint;
  photography: PhotographyBlueprint;
  camera: CameraBlueprint;
  lighting: LightingBlueprint;
  materials: MaterialBlueprint;
  composition: CompositionBlueprint;
  background: BackgroundBlueprint;
  render: RenderBlueprintSettings;
  constraints: ConstraintBlueprint;
  validation: ValidationBlueprint;
}
```

`FluxAdapterOutput { prompt, negativePrompt }` — **вне** blueprint (Rule 004).

## Ответственность агентов

| Агент | Секции |
|-------|--------|
| Product Analyzer | `product` |
| Story Director | `creative`, `story` |
| Scene Director | `scene` |
| Commercial Photo Director | `photography` |
| Camera Director | `camera` |
| Lighting Director | `lighting` |
| Material Director | `materials` |
| Composition Director | `composition` |
| Governance | `constraints` |
| Chief Director | `validation` |
| Flux Adapter | read-only |

## scene.environment (единственная локация)

`kitchen` | `bathroom` | `garage` | `garden` | `living_room` | `studio` | `workshop`

Deprecated: `coverConcept`, `sceneType`, `backgroundType`, `sceneCategory`.

## composition — без пикселей

Никаких `x=0.52`, `width=0.63` во внутренней модели. Только `template`, `heroWeight`, `negativeSpace`, `eyeFlow[]`. Пиксели — задача HTML.

## Золотое правило

Prompt нельзя сериализовать, пока `validation.*Approved` не пройдены.  
`assertReadyForAdapter(blueprint)` — перед Flux Adapter.

## Тест

```bash
npx tsx src/lib/render-blueprint/render-blueprint.spec.ts
```

Полная философия: [DESIGN-AI-v18-PHILOSOPHY.md](./DESIGN-AI-v18-PHILOSOPHY.md)  
Миграция: [MIGRATION-v18.md](./MIGRATION-v18.md)
