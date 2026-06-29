# DESIGN AI v18 — Chapter 3.3: Decision Dependency Graph

> Реализация: `src/lib/render-blueprint/decision-graph.ts`

## Два уровня

| Слой | Вопрос |
|------|--------|
| **RenderBlueprint** | Что известно системе сейчас? |
| **Decision Graph** | Почему система приняла такое решение? |

Эти системы **никогда не смешиваются**.

## Golden Rule

```
Agent → DecisionGraph.proposeUpdate()
      → validate()
      → LifecycleManager.commit + sync
      → RenderBlueprint
```

Агент меняет граф решений. Только после проверки Lifecycle Manager синхронизирует `RenderBlueprint`.

## DecisionNode

- `parents[]` — хранятся (source of truth)
- `children[]` — вычисляются в runtime из рёбер
- `producer` — ровно один владелец узла
- `state` — `SectionState` (EMPTY → DIRTY → … → LOCKED)
- `confidence` — уверенность агента (0..100)

## DependencyKind

| Kind | Поведение |
|------|-----------|
| **HARD** | изменение родителя обязательно инвалидирует потомка |
| **SOFT** | инвалидация есть; пересчёт решает Lifecycle Manager |
| **INFO** | только для оценки; не участвует в invalidation |

Пример: `lighting → composition` — SOFT, weight `0.35`.

## Invalidation

```
Story changed → Scene DIRTY → Photography → Camera → Lighting → Composition → Validation
```

Транзитивный обход потомков (HARD + SOFT рёбра).

## Partial Rebuild

`firstDirtyNode()` / `dirtyNodesInOrder()` — pipeline возобновляется с первого DIRTY узла, не с начала.

## Runtime Only

Граф **не** сохраняется в Prisma, Design Memory или JSON результата.

Для Debug Report: `graph.toMermaid()`.

## Graph Validation

Запрещено: циклы, отсутствующий родитель, два producer, недостижимые узлы, узел без владельца.

## Conflict

Два агента предлагают изменить один узел → `DecisionConflict` → Governance Resolver.

## Test

```bash
npx tsx src/lib/render-blueprint/decision-graph.spec.ts
```
