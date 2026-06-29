# DESIGN AI v18 — Chapter 3.5: Mutation Engine

> Реализация: `mutation-engine.ts`, `mutation-validators.ts`, `mutation-types.ts`

## Golden Rule

**Единственный** компонент, который может изменить `RenderBlueprint`.

```typescript
// ЗАПРЕЩЕНО вне Mutation Engine:
blueprint.scene = ...
```

## BlueprintMutation

```typescript
interface BlueprintMutation<T> {
  section: BlueprintSection;
  producer: string;
  expectedRevision: number;
  payload: T;          // только изменяемый раздел
  reason: string;
  timestamp: number;
}
```

**Atomic Rule:** одна Mutation = один Section. Несколько разделов → `MutationBatch`.

## Validation Pipeline

```text
Schema → Lifecycle → Revision → Ownership → Lock → Dependency → Apply
```

Первая ошибка останавливает применение.

## Apply Phase

```text
payload merge → section READY → revision++ → graph invalidate → audit + event
```

- **Idempotency:** если SHA256 hash не изменился — mutation skipped, revision не растёт
- **Recovery:** batch при ошибке откатывает graph + audit, blueprint остаётся на прежней revision

## MutationApplied Event

```typescript
{ section, revision, producer, duration }
```

## API

```typescript
const engine = new MutationEngine();
engine.onMutationApplied((e) => ...);

engine.applyMutation(bp, graph, mutation);
engine.applyBatch(bp, graph, { mutations: [...] });
engine.getAuditTrail(); // revision, hashes, duration
```

Legacy: `engine.apply(ctx)` — AgentResult → batch.

## Test

```bash
npx tsx src/lib/render-blueprint/mutation-engine.spec.ts
```
