# DESIGN AI v18 — Chapter 4.1: Universal Agent Contract

> Реализация: `universal-agent-contract.ts`, `universal-agent-bridge.ts`, `universal-agent-contract-validator.ts`

## Purpose

Единый интерфейс взаимодействия всех агентов с Lifecycle Manager. Агент описывает **что** делать, но не **как** принимать решение (GPT, Ollama, эвристики — внутри).

## Core Flow

```text
RenderBlueprint → AgentContext → Agent → UniversalAgentResult → BlueprintMutation[] → Mutation Engine
```

## Universal Interface

```typescript
interface UniversalBlueprintAgent {
  readonly id: string;
  readonly version: string;
  readonly category: AgentCategory;
  readonly produces: BlueprintSection[];
  readonly consumes: BlueprintSection[];
  canExecute(context: AgentContext): boolean;
  execute(context: AgentContext): Promise<UniversalAgentResult>;
}
```

## AgentContext

```typescript
const context = createAgentContext({
  blueprint,
  snapshot,
  pipelineId,
  diagnostics,
});
```

## UniversalAgentResult

- `approved`, `confidence` (0.0..1.0)
- `mutations` — **не blueprint**, только список Mutation
- `diagnostics` — execution time, input/output hash, sections, version
- `recommendations` — retry hints (агент не выполняет сам)

## Legacy Bridge

Chapter 3.2 `BlueprintAgent` оборачивается без изменения Lifecycle:

```typescript
import { wrapLegacyBlueprintAgent, universalStoryDirectorAgent } from "./render-blueprint";

const universal = wrapLegacyBlueprintAgent(legacyAgent, {
  category: AgentCategory.CREATIVE_DIRECTOR,
  consumes: ["creative", "product"],
  produces: ["story"],
  buildInput: (ctx) => ({ ... }),
});
```

## Validation

`UniversalAgentContractValidator` проверяет:

- Interface completeness (id, version, category, produces, consumes)
- Confidence 0.0..1.0
- No blueprint in result
- Mutation ownership
- Required diagnostics fields
- Forbidden side effects (provider, render, composite, lifecycle)

## Golden Rule

Все агенты взаимозаменяемы через один контракт. Если для нового агента нужно менять Lifecycle, Mutation Engine или RenderBlueprint — архитектура нарушена.

## Test

```bash
npx tsx src/lib/render-blueprint/universal-agent-contract.spec.ts
```
