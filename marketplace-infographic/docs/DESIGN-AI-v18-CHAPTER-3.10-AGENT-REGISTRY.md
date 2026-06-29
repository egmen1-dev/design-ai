# DESIGN AI v18 — Chapter 3.10: Agent Registry

> Реализация: `agent-registry.ts`, `agent-registry-types.ts`

## Purpose

Единственная точка регистрации и создания агентов. Pipeline знает только Stage + Interface, не классы и пути к файлам.

## Architecture

```text
Lifecycle Manager → Agent Registry → Agent Factory → Agent Instance
```

## Registration

```typescript
registry.register({
  descriptor: { id, name, version, stage, type, producer, enabled },
  factory: { create: () => agent, dispose?: (i) => void },
  capabilities: { supportsRetry, supportsParallel, requiresLLM, requiresVision },
  metadata: { author, description, supportedStages, dependencies },
});

registry.registerBlueprintAgent(storyDirectorAgent); // convenience
```

- Уникальный `id` — повторная регистрация → ошибка
- Регистрация запрещена при `registry.lock()` (во время pipeline)

## Lookup

```typescript
registry.get(BlueprintLifecycle.STORY_DEFINED);
registry.getById("visual-story-director");
registry.createForStage(stage);
registry.disposeInstances(); // после stage/pipeline
```

## Health Check

```typescript
registry.healthCheck({ visionEngineAvailable: true });
registry.assertHealthy(); // throws at app boot
```

Проверяет: factory, stage mismatch, cyclic metadata.dependencies, vision requirements.

## Registry Report

```typescript
registry.recordRunResult(id, { durationMs, result, confidence });
registry.getReport(); // Debug Report
```

## Golden Rule

Никто не создаёт и не импортирует конкретные агенты напрямую — только через Agent Registry.

## Test

```bash
npx tsx src/lib/render-blueprint/agent-registry.spec.ts
```
