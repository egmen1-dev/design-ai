# DESIGN AI v18 — Chapter 3.9: Event System

> Реализация: `event-bus.ts`, `event-types.ts`

## Purpose

Event-driven нервная система Design AI. Агенты не вызывают друг друга напрямую — только publish/subscribe через Event Bus.

## DesignEvent

```typescript
{
  id, category, type, timestamp, revision,
  metadata: { pipelineId, blueprintId, stage, producer, version },
  payload: { /* minimal refs only */ }
}
```

**Запрещено в payload:** RenderBlueprint, images, nested objects.

## Event Bus Rules

- `publish(event)` — любой компонент
- `subscribe(type | category, handler)` — до `lock()`
- `lock()` во время `executeStage` — новые подписчики запрещены
- События immutable после publish
- `replay()` — полный event log
- Handler error → `EventHandlerFailed` (pipeline не останавливается автоматически)

## Categories

`LIFECYCLE`, `AGENT`, `MUTATION`, `VALIDATION`, `RENDER`, `RECOVERY`, `DEBUG`, `SYSTEM`

## Integration

`LifecycleManager` использует `EventBus`:
- Pipeline/Stage/Agent/Mutation/Validation/Snapshot events
- `getEventBus()`, `getDesignEvents()`
- Legacy `onEvent()` / `getEvents()` сохранены

## Golden Rule

Event Bus не содержит бизнес-логику — только доставка.

## Test

```bash
npx tsx src/lib/render-blueprint/event-system.spec.ts
```
