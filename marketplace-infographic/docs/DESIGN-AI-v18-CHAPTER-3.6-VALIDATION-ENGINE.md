# DESIGN AI v18 — Chapter 3.6: Validation Engine

> Реализация: `validation-engine.ts`, `validation-rules.ts`

## Purpose

Validation Engine проверяет целостность `RenderBlueprint`. **Не** принимает решений, **не** исправляет ошибки, **не** мутирует blueprint.

Обязателен после каждой Mutation (интегрирован в `LifecycleManager`).

## Validation Levels

```text
LEVEL 1 Schema → LEVEL 2 Business → LEVEL 3 Architecture → LEVEL 4 Professional
```

FATAL на любом уровне останавливает дальнейшие проверки.

## Severity

| Severity | Pipeline |
|----------|----------|
| FATAL | останов |
| ERROR | retry (решение Lifecycle Manager) |
| WARNING | продолжение, рекомендация Chief |

## Rules (VAL_001 … VAL_010)

| Code | Name |
|------|------|
| VAL_001 | Blueprint Structure |
| VAL_002 | Lifecycle |
| VAL_003 | Dependencies |
| VAL_004 | Camera |
| VAL_005 | Lighting |
| VAL_006 | Composition |
| VAL_007 | Background |
| VAL_BUSINESS | Scene business logic |
| VAL_008 | Professional Layout |
| VAL_009 | Marketplace Constraints |
| VAL_010 | Architecture Invariants |

## ValidationReport

- revision, stage, score, errors, warnings, recommendations, durationMs
- Кэш по `revision:stage`

## API

```typescript
const engine = new ValidationEngine();
const report = engine.validate(blueprint, { graph });
// report.passed, report.hasFatal, report.hasError
```

Lifecycle Manager вызывает `assertPostMutationValidation` после каждого `apply` / `runAgent`.

## Test

```bash
npx tsx src/lib/render-blueprint/validation-engine.spec.ts
```
