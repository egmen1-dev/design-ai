# DESIGN AI v18 — Chapter 3.14: Performance Model

> Реализация: `performance-model.ts`, `performance-cache.ts`, `performance-stages.ts`, `pipeline-queue.ts`

## Purpose

Правила проектирования Design AI с точки зрения производительности: минимальное время ожидания при сохранении качества и архитектурных инвариантов.

## Philosophy

> **Не выполнять повторно то, что уже было вычислено.**

## Performance Layers

```text
User → Pipeline → Decision → Render → Storage
```

## Parallel vs Sequential

Параллельно (без HARD-зависимостей):

- `lighting-director` || `camera-director` || `material-director`
- `commercial-photo-director` || `critics` || `governance`

Последовательно:

```text
visual-story-director → scene-director → composition-director
story → scene → photography
```

Интеграция с `groupParallelAgents()` (Ch 3.4).

## Cache Strategy

Ключ: `revision + agentVersion + inputHash`

| Level | Scope |
|-------|-------|
| Memory | один Pipeline run |
| Pipeline | до завершения генерации (Retry Engine) |
| Disk | между генерациями |
| Distributed | горизонтальное масштабирование (опционально) |

```typescript
const { value, cached } = await runWithAgentCache(cache, keyInput, () => agent.execute(...));
```

## Incremental Rebuild

```typescript
const plan = planIncrementalRebuild("lighting");
// stagesToRun: lighting → composition → constraints → validation
// sectionsToSkip: story, scene, creative, ...
```

## Zero-Copy Rule

`reuseUnchangedSections()` переиспользует ссылки неизменённых секций (совместимо с COW Snapshot, Ch 3.8).

## Lazy Evaluation

`shouldRunLazyStage()` — пропуск тяжёлых стадий при ошибке render/validation.

## Resource Limits

```typescript
type PerformanceLimits = {
  maxMemoryMB: number;
  maxCpuTime: number;
  maxParallelAgents: number;
  maxRetries: number;
};
```

## Time Budgets (ms)

| Stage | Target |
|-------|--------|
| Product Analysis | 100 |
| Story | 2000 |
| Scene | 200 |
| Composition | 150 |
| Validation | 100 |
| Prompt Compilation | 30 |
| Render Adapter | 50 |
| Composite | 200 |
| Vision QA | 500 |

## Metrics

`PerformanceTracker.finalize()` → Total Time, Agent/Render/Composite/Vision Time, Retry Count, Cache Hit Rate, Memory Peak, Bottlenecks.

## Queue Model

`PipelineContextPool` + `PipelineQueue` — изолированные контексты, параллельные генерации.

## Golden Rule

Производительность — следствие правильной архитектуры. Оптимизация, нарушающая Lifecycle, Decision Graph, RenderBlueprint или воспроизводимость, отклоняется.

## Test

```bash
npx tsx src/lib/render-blueprint/performance-model.spec.ts
```
