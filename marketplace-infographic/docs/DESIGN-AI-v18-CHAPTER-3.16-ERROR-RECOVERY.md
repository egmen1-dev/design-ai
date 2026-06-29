# DESIGN AI v18 — Chapter 3.16: Error Handling & Recovery Strategy

> Реализация: `recovery-engine.ts`, `recovery-types.ts`

## Purpose

Единые правила обработки ошибок: локальное восстановление вместо аварийного завершения, если это безопасно.

## Error Lifecycle

```text
Error → Classification → Severity → Recovery Strategy → Execution → Validation → Resume
```

## Categories & Severity

`RecoveryErrorCategory`: validation, mutation, agent, render, provider, network, composite, vision, pipeline, system, unknown.

`ErrorSeverity`: low → medium → high → critical → fatal.

## Recovery Matrix

| Severity | Strategy |
|----------|----------|
| LOW | Continue |
| MEDIUM | Local Retry |
| HIGH | Stage Rollback |
| CRITICAL | Blueprint Rollback |
| FATAL | Abort Pipeline |

## Escalation (only forward)

```text
Retry → Stage Rollback → Blueprint Rollback → Provider Switch → Abort
```

## Provider Recovery

| Condition | Action |
|-----------|--------|
| HTTP 429 | Wait + Retry |
| HTTP 500 | Provider Switch (flux → gpt-image → …) |
| Timeout | Repeat Request |

Provider никогда не меняет Blueprint.

## Vision Recovery

| Problem | Recovery |
|---------|----------|
| Wrong Background | Background Retry |
| Wrong Lighting | Lighting Retry (stage rollback) |
| Bad Integration | Composite Retry |
| PNG Overlay Feel | Composite + Shadow Retry |
| Product Too Small | Composition Retry |

## Recovery Decision

Только **Lifecycle Manager** выполняет recovery. Агенты возвращают `RecoveryRecommendation` — не более.

## API

```typescript
import {
  RecoveryEngine,
  classifyError,
  planVisionRecovery,
  planProviderRecovery,
} from "./render-blueprint";

const engine = new RecoveryEngine();
const error = classifyError({ message: "Provider timeout", provider: "flux" });
const plan = engine.decideRecovery(error, agentRecommendation, stage);
engine.recordExecution(plan, success, durationMs, stage);
const metrics = engine.buildMetrics();
```

## Invariants

Запрещено во время recovery: нарушать lifecycle, менять decision history, удалять snapshots, менять version/seed без LM.

## Golden Rule

Если восстановление невозможно без повреждения RenderBlueprint, Decision Graph или Lifecycle — контролируемый abort, не работа с повреждённым состоянием.

## Test

```bash
npx tsx src/lib/render-blueprint/recovery-engine.spec.ts
```
