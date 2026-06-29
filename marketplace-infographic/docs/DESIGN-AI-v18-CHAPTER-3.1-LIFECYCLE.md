# DESIGN AI v18 — Chapter 3.1: RenderBlueprint Lifecycle

> Реализация: `src/lib/render-blueprint/lifecycle.ts`

## Purpose

`RenderBlueprint` постепенно проходит стадии зрелости. После каждой стадии соответствующая область **LOCKED**. Это исключает конфликты агентов.

## Lifecycle stages

```
NEW → PRODUCT_ANALYZED → CREATIVE_DEFINED → STORY_DEFINED → SCENE_DEFINED
→ PHOTO_DEFINED → COMPOSITION_DEFINED → CONSTRAINTS_DEFINED → VALIDATED
→ FROZEN → RENDERING → COMPOSITING → VISION_QA → FINISHED
```

## Section states

```
EMPTY → DIRTY → READY → VALIDATED → LOCKED
```

Обратные переходы запрещены (`LOCKED → DIRTY` невозможен).

## API

| Функция | Назначение |
|---------|------------|
| `createInitialLifecycleMeta()` | NEW, все секции EMPTY |
| `applyAgentPatch()` | патч + `markSectionDirtyAfterPatch` + propagation |
| `advanceLifecycleStage()` | validation barrier → lock → snapshot → next stage |
| `rollbackToSnapshot()` | Chief выбирает snapshot, не мутирует blueprint |
| `advanceToRendering()` | только из FROZEN |
| `assertSectionWritable()` | LOCKED / frozen / wrong stage → throw |

## Dirty propagation

При изменении `story` автоматически DIRTY:
`scene`, `photography`, `camera`, `lighting`, `materials`, `composition`, `constraints`, `validation`

`product` и `creative` остаются LOCKED.

## Snapshots

После каждого `advanceLifecycleStage()` создаётся immutable snapshot в `lifecycle.snapshots[]`.

Chief Design Director: `rollbackToSnapshot(bp, snapshotId)` → resume с нужной стадии.

## Design rules

- Нельзя менять LOCKED-раздел
- Нельзя рендерить до FROZEN
- Нельзя пропускать validation barrier
- Prompt только после FROZEN (`assertReadyForAdapter`)

## Test

```bash
npx tsx src/lib/render-blueprint/lifecycle.spec.ts
```
