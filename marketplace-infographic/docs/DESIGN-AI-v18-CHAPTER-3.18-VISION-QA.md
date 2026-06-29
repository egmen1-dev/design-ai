# DESIGN AI v18 — Chapter 3.18: Vision Quality Assurance

> Реализация: `vision-qa-engine.ts`, `vision-qa-analysis.ts`, `vision-qa-signals.ts`

## Purpose

Финальный объективный контроль качества композита. Vision QA **только оценивает** результат — не принимает дизайнерских решений.

## Core Principle

Анализируется **только изображение**. Не используются: Prompt, Decision Graph, Story, LayoutSpec, Agent Scores.

## Pipeline Position

```text
Background → Composite → Vision QA → Quality Report → Recovery → Final Export
```

## API

```typescript
import { VisionQA, analyzeVision } from "./render-blueprint";

const report = analyzeVision({
  image: compositeBase64,
  productMask: optionalMask,
  provider: "flux",
  metadata: providerMetadata,
});

if (!report.approved) {
  // Lifecycle Manager uses report.recommendations
}
```

## VisionReport

- `approved`, `score`, `confidence`
- `metrics` — composition, realism, lighting, integration, marketplace, technical, overall
- `issues` — category, severity, reason (explainability)
- `recommendations` — recovery hints for LM (не исправляет сам)

## Thresholds

| Metric | Min |
|--------|-----|
| Composition | 80 |
| Realism | 80 |
| Lighting | 75 |
| Integration | 80 |
| Marketplace | 85 |
| Technical | 90 |

## Recovery Hints

| Problem | Recovery |
|---------|----------|
| Product Too Small | Composition Retry |
| Weak Shadows / PNG overlay | Composite Retry |
| Wrong Background | Background Retry |
| Wrong Lighting | Lighting Retry |

## Vision History

`VisionHistoryStore` — для regression, design memory, benchmarks.

## Extensibility

`VisionImageSignals` + optional plugin `signals` — OpenCV, ML, external services без изменения Pipeline.

## Golden Rule

Vision QA никогда не принимает дизайнерских решений. Исправления выполняют другие компоненты по рекомендациям Vision QA.

## Test

```bash
npx tsx src/lib/render-blueprint/vision-qa.spec.ts
```
