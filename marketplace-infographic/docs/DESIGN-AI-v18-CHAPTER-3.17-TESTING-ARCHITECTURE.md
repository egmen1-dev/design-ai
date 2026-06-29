# DESIGN AI v18 — Chapter 3.17: Testing Architecture

> Реализация: `testing-architecture.ts`, `testing-registry.ts`, `testing-runner.ts`, `golden-dataset.ts`

## Purpose

Единая стратегия проверки качества всей архитектуры Design AI — не отдельных функций, а поведения системы.

## Testing Pyramid

```text
Vision → E2E → Integration → Agent → Blueprint → Unit
```

## Test Categories

`TestCategory`: unit, blueprint, agent, integration, pipeline, vision, performance, regression.

Каждый `*.spec.ts` зарегистрирован в `V18_TEST_REGISTRY` с категорией и флагом `usesLlm: false`.

## Запуск

```bash
# Все v18 RenderBlueprint specs
npm run test:v18-blueprint

# Категория через API
npx tsx -e "
  import { runCategory, formatTestReport, TestCategory } from './src/lib/render-blueprint/index.ts';
  console.log(formatTestReport({ ...runCategory(TestCategory.UNIT), qualityGatePassed: true, startedAt: 0, finishedAt: 0, suites: [runCategory(TestCategory.UNIT)], passed: 0, failed: 0, total: 0, durationMs: 0 }));
"
```

## Golden Dataset

7 эталонных продуктов: Coffee Machine, Hair Dryer, Vacuum Cleaner, Blender, Lawn Mower, Speaker, Monitor.

## Regression

`RegressionStore` сравнивает blueprint hash, design/vision score, retry count.

## Mock LLM

`MockLLMProvider` — детерминированные ответы для agent tests без live LLM.

## Contract Tests

`testBlueprintAgentContract()`, `testRenderAdapterContract()` — автоматическая проверка интерфейсов.

## Chaos Tests

5 сценариев: provider failure, network loss, snapshot corrupt, composite fail, vision fail.

## Quality Gates

**PR:** unit, blueprint, agent, integration, pipeline.

**Release Candidate:** все категории + performance + regression + vision.

## Coverage Targets

| Component | Min |
|-----------|-----|
| Core / Lifecycle / Mutation / Validation / Registry | 95% |
| Adapters | 90% |
| Agents | 85% |
| UI | 70% |

## Golden Rule

Изменение не завершено, пока не подтверждено автоматическими тестами. Если архитектуру невозможно протестировать — она спроектирована неправильно.

## Test

```bash
npx tsx src/lib/render-blueprint/testing-architecture.spec.ts
```
