# DESIGN AI v18 — Chapter 3.4: Lifecycle Manager

> Реализация: `src/lib/render-blueprint/lifecycle-manager.ts` и сателлиты

## Purpose

Lifecycle Manager — центральный оркестратор. **Не** принимает дизайнерских решений, **не** вызывает LLM, **не** мутирует blueprint напрямую.

## Responsibilities Matrix

| Компонент | Решения | Меняет Blueprint |
|-----------|---------|------------------|
| Agent | ✔ | ✘ |
| Lifecycle Manager | ✘ | ✔ (через Mutation Engine) |
| Render Adapter | ✘ | ✘ |

## Pipeline

```text
Blueprint → LifecycleManager → Agent → Result → Validation
         → DecisionGraph → MutationEngine → Snapshot → Next Stage
```

## Modules

| Модуль | Роль |
|--------|------|
| `agent-registry.ts` | `register(stage, agent)` — LM не импортирует агентов |
| `mutation-engine.ts` | Единственный путь AgentResult → Blueprint |
| `snapshot-manager.ts` | Immutable snapshots; rollback только к VALIDATED |
| `retry-engine.ts` | Agent/Stage/Pipeline retry (2/2/1) |
| `stage-preconditions.ts` | Preconditions per stage |
| `parallel-execution.ts` | Параллельный запуск без HARD-зависимостей |

## Revision & Optimistic Lock

`meta.revision` увеличивается после каждой мутации. Если агент стартовал с revision N, а blueprint уже N+1 — результат отклоняется.

## State Machine

`NEW → RUNNING → VALIDATING → LOCKED → FINISHED | FAILED`

## Events

`StageStarted`, `StageFinished`, `MutationApplied`, `SnapshotCreated`, `RetryStarted`, `RollbackStarted`, `ValidationFailed`, `PipelineFinished`

## API

```typescript
const lm = new LifecycleManager();
lm.registerAgent(storyDirectorAgent);
const { blueprint, revision, snapshotId } = await lm.executeStage(bp, BlueprintLifecycle.STORY_DEFINED, input);
lm.onEvent((e) => console.log(e.type));
lm.recover(bp); // last VALIDATED snapshot
```

Legacy API сохранён: `apply()`, `runAgent()`, `completeStage()`.

## Test

```bash
npx tsx src/lib/render-blueprint/lifecycle-manager.spec.ts
```
