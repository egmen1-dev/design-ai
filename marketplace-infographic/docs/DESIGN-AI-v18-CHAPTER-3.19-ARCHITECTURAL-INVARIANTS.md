# DESIGN AI v18 — Chapter 3.19: Architectural Invariants

> Реализация: `architectural-invariants.ts`, `architecture-validator.ts`

## Purpose

Architectural Invariants — фундаментальные неизменяемые правила Design AI. Нарушение хотя бы одного инварианта считается архитектурным дефектом и останавливает Pipeline.

## Golden Rule

Архитектурные инварианты имеют абсолютный приоритет. Никакая бизнес-логика, агент, Provider, оптимизация или Recovery не имеют права их нарушать.

## 23 Invariants

| ID | Name |
|----|------|
| INV_01 | Single Source of Truth |
| INV_02 | Immutable History |
| INV_03 | Agent Isolation |
| INV_04 | Blueprint Ownership |
| INV_05 | Lifecycle Authority |
| INV_06 | Mutation Safety |
| INV_07 | Validation Before Commit |
| INV_08 | Snapshot Consistency |
| INV_09 | Provider Independence |
| INV_10 | Prompt Isolation |
| INV_11 | Stateless Agents |
| INV_12 | Deterministic Pipeline |
| INV_13 | Event Driven Communication |
| INV_14 | Version Compatibility |
| INV_15 | Explainability |
| INV_16 | Recovery Safety |
| INV_17 | Vision Independence |
| INV_18 | Composite Isolation |
| INV_19 | Adapter Responsibility |
| INV_20 | Single Responsibility |
| INV_21 | No Hidden State |
| INV_22 | Open Architecture |
| INV_23 | Architecture Over Implementation |

## Pipeline Gate

При запуске Pipeline `ArchitectureValidator` проверяет все инварианты **до начала генерации**.

```typescript
import {
  ArchitectureValidator,
  assertPipelineArchitecture,
  validateArchitectureAtPipelineStart,
} from "./render-blueprint";

const report = validateArchitectureAtPipelineStart(blueprint);
if (!report.valid) {
  // Pipeline blocked — Lifecycle Manager receives violations
}

assertPipelineArchitecture(blueprint); // throws ArchitectureValidatorError
```

## Runtime Context

Для runtime-проверок передаётся `ArchitectureValidationContext`:

- `shadowStateStores` — INV_01
- `historyMutated` — INV_02
- `agentCrossCalls` — INV_03
- `directBlueprintMutation` — INV_06
- `mutationWithoutValidation` — INV_07
- `snapshotWithoutValidation` — INV_08
- `visionUsesBlueprint` — INV_17
- `compositeMutatesBackground` — INV_18
- `recoveryViolations` — INV_16

## Recovery Integration

```typescript
import { validateRecoveryArchitecture } from "./render-blueprint";

const violations = validateRecoveryArchitecture({
  before, after, seedLocked: before.meta.seed,
});
// If violations.length > 0 → Pipeline must abort, not bypass invariants
```

## Failure Policy

- **Fatal/Error** — блокирует Pipeline
- **Warning** — диагностика (например, дублирующие owners в agent-matrix)

## Test

```bash
npx tsx src/lib/render-blueprint/architecture-validator.spec.ts
```
