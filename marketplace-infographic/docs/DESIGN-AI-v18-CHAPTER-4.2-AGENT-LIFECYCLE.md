# DESIGN AI v18 — Chapter 4.2: Agent Lifecycle

> Реализация: `agent-lifecycle.ts`, `agent-lifecycle-orchestrator.ts`

## Purpose

Полный жизненный цикл любого агента Design AI — от регистрации до уничтожения. Все агенты проходят **одинаковые 10 этапов**, независимо от специализации.

## Golden Rule

Жизненный цикл полностью управляется **Lifecycle Manager**. Агент никогда не управляет собственным запуском, retry или завершением.

## 10 Stages

```text
Registered → Discovered → Validated → Initialized → Execute
    → Decision → Mutation → Validation → Completed → Disposed
```

| Stage | Responsibility |
|-------|----------------|
| Registered | Agent Registry — id, version, category, produces, consumes |
| Discovered | LM checks pipeline stage, dependencies, readiness |
| Validated | Contract, consumed sections, version compatibility |
| Initialized | `AgentContext` created |
| Execute | `agent.execute(context)` — no side effects |
| Decision | `UniversalAgentResult` with mutations — blueprint unchanged |
| Mutation | Mutation Engine applies changes |
| Validation | Validation Engine — rollback on failure |
| Completed | Revision, decision trace, events, diagnostics |
| Disposed | Temp objects destroyed — stateless guarantee |

## API

```typescript
import { AgentLifecycleOrchestrator, runAgentLifecycle } from "./render-blueprint";

const outcome = await runAgentLifecycle({
  agent: universalStoryDirectorAgent,
  blueprint,
  pipelineStage: BlueprintLifecycle.STORY_DEFINED,
  pipelineId,
}, { registry });

if (outcome.skipped) {
  // Agent not required at this stage
} else if (outcome.success) {
  blueprint = outcome.blueprint;
} else {
  // outcome.failure.stage, recovery recommendations
}
```

## Guarantees

- At most **once per stage** per session
- **No internal state** between runs
- **No direct** influence on other agents
- **Consistent** completion or rollback

## Test

```bash
npx tsx src/lib/render-blueprint/agent-lifecycle.spec.ts
```
