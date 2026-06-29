# DESIGN AI v18 — Chapter 3.7: Constraint Engine

> Реализация: `constraint-engine.ts`, `constraint-providers.ts`, `constraint-types.ts`

## Purpose

Constraint Engine — центральная система архитектурных ограничений. **Не** улучшает дизайн, **не** выбирает сцену, **не** меняет композицию. Гарантирует соответствие обязательным правилам перед передачей в Render Adapter.

## Philosophy

Ограничения — типизированные объекты (`payload`), не строки.

```typescript
// Правильно
{ minimum: 0.28 }

// Запрещено
"leave empty space"
```

## Constraint Sources

```text
Safety → Architecture → Marketplace → Provider → Creative → Story → Composition → User → Governance
```

При конфликте побеждает источник выше в иерархии, затем `priority`, затем `hard`.

## API

```typescript
const engine = new ConstraintEngine();
const report = engine.evaluate(blueprint, {
  userConstraints: userConstraintsFromFlags({ noPeople: true }),
});
// report.mergedSet, report.conflicts, report.ignoredConstraints

engine.assertReady(blueprint); // throws ConstraintEngineError

const forFlux = constraintsForProviderCapability(report);
```

## ConstraintReport

- `totalConstraints`, `activeConstraints`, `ignoredConstraints`
- `mergedSet` (deduplicated)
- `conflicts` + `resolutionStrategy`
- `durationMs`, cache by `revision:stage`

## Integration

- `LifecycleManager.assertPreAdapterConstraints()` — при переходе в `FROZEN`
- `assertReadyForAdapter()` — constitution golden rule + constraint check
- Provider translation: `constraintsForProviderCapability()` исключает `providerInternal` marketplace-поля

## Extension

Новый источник — зарегистрировать `ConstraintProvider` без изменения Lifecycle Manager.

## Test

```bash
npx tsx src/lib/render-blueprint/constraint-engine.spec.ts
```
