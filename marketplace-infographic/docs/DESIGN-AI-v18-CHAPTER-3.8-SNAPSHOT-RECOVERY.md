# DESIGN AI v18 — Chapter 3.8: Snapshot & Recovery System

> Реализация: `snapshot-manager.ts`, `snapshot-types.ts`

## Purpose

Обеспечивает детерминированное восстановление Pipeline без повторного выполнения завершённых стадий. Snapshot — точка согласованного **валидного** состояния, не резервная копия проекта.

## Lifecycle

```text
Mutation → Validation → Snapshot → Freeze → Next Stage
```

Snapshot создаётся **только** после успешной Validation (`validated: true` + `validation.passed`).

## BlueprintSnapshot (Ch 3.8)

- `blueprint`, `decisionGraph`, `validation`, `metadata`, `checksum`
- `deltas` — изменённые секции (audit/debug)
- `sectionRefs` — Copy-on-Write hashes

## Rollback Strategies

| Strategy | Scope |
|----------|--------|
| `SECTION` | Один раздел + инвалидация зависимостей |
| `STAGE` | Вся стадия |
| `BLUEPRINT` | Последний VALIDATED snapshot |

Recovery только к `validated: true` snapshots.

## Recovery

```typescript
const mgr = new SnapshotManager({ maxRecoveryAttempts: 3 });
const result = mgr.recover(snapshotId, blueprint, graph);
// result.events: RecoveryStarted → SnapshotLoaded → … → RecoveryFinished
```

## API

```typescript
mgr.store({ blueprint, graph, stage, validated: true, validation: report });
mgr.compare(idA, idB);
mgr.replay();
mgr.applyRetention(pipelineSucceeded);
mgr.verifyIntegrity(snapshot);
```

## Golden Rule

Восстановление **только** через Snapshot System — запрещено вручную копировать разделы blueprint.

## Test

```bash
npx tsx src/lib/render-blueprint/snapshot-recovery.spec.ts
```
