# DESIGN AI v18 — Chapter 3.15: Observability & Diagnostics

> Реализация: `observability-engine.ts`, `observability-types.ts`, `diagnostic-privacy.ts`

## Purpose

Полная прозрачность работы Design AI: каждая генерация должна быть объяснима — кто принял решение, почему, когда и на каких данных.

## Core Principle

> Каждое изменение Blueprint должно быть объяснимо. Нельзя менять данные без сохранения причины.

## Observability Layers

```text
Pipeline → Lifecycle → Agents → Mutations → Validation → Render → Vision → Storage
```

## Diagnostic Context

Единый контекст на весь Pipeline:

```typescript
type DiagnosticContext = {
  pipelineId: string;
  blueprintRevision: number;
  currentStage: BlueprintLifecycle;
  sessionId: string;
};
```

Все записи обязаны содержать Diagnostic Context.

## Traces

| Trace | Содержит |
|-------|----------|
| DecisionTrace | agentId, input/output hash, confidence, reason |
| MutationTrace | section, producer, old/new revision, reason |
| ValidationTrace | ruleId, passed, severity, message, fix |
| AgentDiagnostic | duration, hashes, confidence, retries |
| RenderDiagnostic | provider, lengths, seed, time (prompt только в debug) |
| VisionDiagnostic | scores + explained issues |
| RetryDiagnostic | reason, strategy, affected sections, result |

## Reports

```typescript
const engine = new ObservabilityEngine({ mode: "debug", pipelineId: "..." });
const explainability = engine.buildExplainabilityReport(renderIntent, performanceMetrics);
const failure = engine.buildFailureReport(); // после recordFailure()
```

**Explainability Report** — решения, мутации, constraints, timeline, metrics.

**Failure Report** — место ошибки, последний snapshot, stage, timeline, stack (debug).

## EventBus Integration

```typescript
const detach = attachObservabilityToEventBus(engine, eventBus);
// автоматически: timeline, mutations, validation failures, retries
```

## Debug vs Production

| Mode | Сохраняется |
|------|-------------|
| Debug | полный event log, prompts, все validation traces |
| Production | ошибки, предупреждения, агрегированные метрики |

## Privacy Rules

`maskSecrets()` / `sanitizeDiagnosticData()` — API keys, tokens, credentials, email автоматически маскируются.

## Golden Rule

Если невозможно определить кто, почему, когда и на каких данных было принято решение — архитектура Observability нарушена.

## Test

```bash
npx tsx src/lib/render-blueprint/observability.spec.ts
```
