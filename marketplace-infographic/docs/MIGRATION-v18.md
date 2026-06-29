# Migration v18 — RenderBlueprint

## Цель

Один объект `RenderBlueprint` вместо `ScenePlan` + `SceneBlueprint` + `LayoutSpec` + `VisualSceneBlueprint` + строкового `FinalDesignBlueprint`.

## Фазы

## Фаза 1 — Типы и Constitution ✅

- `src/lib/render-blueprint/types.ts` — **Chapter 3** полная схема
- `docs/DESIGN-AI-v18-CHAPTER-3-RENDER-BLUEPRINT.md`
- `ownership.ts` — таблица агент → секции
- `FluxAdapterOutput` — prompt **вне** blueprint (Rule 004)
- `scene.environment`: kitchen | garden | studio | …

Флаг: `RENDER_BLUEPRINT_V18=1` (handler ещё на v17).

### Фаза 2 — Agent boundaries ✅ (Chapter 3.2)

- `agent-contracts.ts` — `BlueprintAgent`, `BlueprintMutationResult`, `RetryAdvice`
- `lifecycle-manager.ts` — единственный мутатор после `agent.execute()`
- `agent-matrix.ts` — read/write matrix; Critics / Chief / Flux Adapter — read-only
- `agents/story-director-agent.ts` — эталонный контрактный агент
- `docs/DESIGN-AI-v18-CHAPTER-3.2-AGENT-CONTRACTS.md`

```bash
npx tsx src/lib/render-blueprint/agent-contracts.spec.ts
```

### Фаза 2c — Decision Graph ✅ (Chapter 3.3)

- `decision-graph.ts` — runtime dependency graph, invalidation, partial rebuild
- `DecisionGraph` — parents stored, children computed; HARD/SOFT/INFO edges
- `LifecycleManager` — graph first, blueprint sync second (Golden Rule)
- `docs/DESIGN-AI-v18-CHAPTER-3.3-DECISION-GRAPH.md`

```bash
npx tsx src/lib/render-blueprint/decision-graph.spec.ts
```

### Фаза 2d — Lifecycle Manager ✅ (Chapter 3.4)

- `lifecycle-manager.ts` — `executeStage`, events, recovery, pipeline state machine
- `mutation-engine.ts` — revision + optimistic lock
- `snapshot-manager.ts` — VALIDATED-only rollback
- `retry-engine.ts`, `agent-registry.ts`, `stage-preconditions.ts`
- `meta.revision` на RenderBlueprint
- `docs/DESIGN-AI-v18-CHAPTER-3.4-LIFECYCLE-MANAGER.md`

```bash
npx tsx src/lib/render-blueprint/lifecycle-manager.spec.ts
```

### Фаза 2e — Mutation Engine ✅ (Chapter 3.5)

- `BlueprintMutation`, `MutationBatch` — atomic one-section rule
- Validation pipeline: schema, lifecycle, revision, ownership, lock, dependency
- SHA256 idempotency, audit trail, `MutationApplied` events
- Section state → READY after apply; downstream DIRTY via graph
- `docs/DESIGN-AI-v18-CHAPTER-3.5-MUTATION-ENGINE.md`

```bash
npx tsx src/lib/render-blueprint/mutation-engine.spec.ts
```

### Фаза 2f — Validation Engine ✅ (Chapter 3.6)

- `validation-engine.ts` — 4 levels, rule priority, revision cache
- `validation-rules.ts` — VAL_001…VAL_010 + business scene logic
- Integrated in `LifecycleManager` after every mutation
- `docs/DESIGN-AI-v18-CHAPTER-3.6-VALIDATION-ENGINE.md`

```bash
npx tsx src/lib/render-blueprint/validation-engine.spec.ts
```

### Фаза 2b — Legacy agent integration (planned)

### Фаза 3 — Critics before render

- Senior AD, CTR, Art Director — оценка `layout` до Flux Adapter
- Убрать `backgroundPrompt` из Ollama DesignBrief

### Фаза 4 — Flux Adapter

- `pollinations-compiler.ts` → `flux-adapter.ts`
- Единственный модуль с Flux Language
- `render.compiledPrompt` заполняется только адаптером

### Фаза 5 — Удаление legacy

- Deprecate `ScenePlan.coverConceptId`, `prompt-compiler/`
- `PIPELINE_VERSION = v18.0-render-blueprint`

## Environment migration

```ts
commercial_studio   → studio
outdoor_lifestyle   → garden
home_interior       → living_room
garden_scene        → garden
tech_showcase       → studio
premium_minimal     → studio
```

## Тест

```bash
cd marketplace-infographic
npx tsx src/lib/render-blueprint/render-blueprint.spec.ts
```

## Ошибки (план)

| Код | Когда |
|-----|-------|
| `CONSTITUTION_V18_SECTION_VIOLATION` | агент пишет в чужую секцию |
| `CONSTITUTION_V18_BANNED_TOKEN` | агент вернул Flux/marketing токен |
| `CONSTITUTION_V18_DUPLICATE_ENVIRONMENT` | конфликт environment в нескольких полях |
