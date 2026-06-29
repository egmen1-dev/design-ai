# DESIGN AI v18 — Chapter 3.2: Agent Contracts

> Реализация: `src/lib/render-blueprint/agent-contracts.ts`, `lifecycle-manager.ts`

## Golden Rule

Агент принимает решение. **Только Lifecycle Manager** меняет `RenderBlueprint`.

```
agent.execute(readonly Blueprint) → AgentResult
        ↓
LifecycleManager.apply() → BlueprintMutationResult
```

## BlueprintAgent

```typescript
interface BlueprintAgent<TInput, TResult> {
  id, version, stage
  canExecute(blueprint): boolean
  execute(readonly blueprint, input): Promise<TResult>
  toUpdates(result): AgentSectionUpdates  // pure, no mutation
}
```

## AgentResult (обязательно)

- `confidence: 0..100` — уверенность агента, не quality score
- `decisionTrace: string[]` — объяснение для Debug Report
- `warnings: string[]`
- `retryAdvice?: RetryAdvice` — агент не делает retry сам
- `errors?: AgentError[]` — recoverable | fatal

## Read / Write Matrix

См. `agent-matrix.ts` — `AGENT_READ_MATRIX`, `AGENT_WRITE_MATRIX`

| Agent | Write |
|-------|-------|
| Critics | ничего |
| Chief Director | ничего (rollback via snapshot) |
| Flux Adapter | ничего |

## LifecycleManager

```typescript
const mgr = new LifecycleManager();
const { blueprint, mutation, result } = await mgr.runAgent(agent, bp, input);
mgr.completeStage(blueprint);
```

`mutation.invalidatedSections` — автоматически из dirty propagation (агент не знает).

## Example

`agents/story-director-agent.ts` — эталонный контрактный агент.

## Test

```bash
npx tsx src/lib/render-blueprint/agent-contracts.spec.ts
```
