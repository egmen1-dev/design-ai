# Migration v18 — RenderBlueprint

## Цель

Один объект `RenderBlueprint` вместо `ScenePlan` + `SceneBlueprint` + `LayoutSpec` + `VisualSceneBlueprint` + строкового `FinalDesignBlueprint`.

## Фазы

### Фаза 1 — Типы и Constitution (текущий PR)

- `src/lib/render-blueprint/types.ts` — схема v18
- `src/lib/render-blueprint/constitution.ts` — правила секций, banned tokens
- `src/lib/render-blueprint/patch.ts` — типизированные патчи агентов
- `src/lib/render-blueprint/from-visual-blueprint.ts` — мост из v17 `VisualSceneBlueprint`
- `src/lib/render-blueprint/environment.ts` — `SceneEnvironmentId`, маппинг с `coverConceptId`
- Спека + документация

Флаг: `RENDER_BLUEPRINT_V18=1` (пока только для тестов и diagnostics; handler ещё на v17).

### Фаза 2 — Agent boundaries

- Каждый `run*Director` принимает `RenderBlueprint`, возвращает `AgentPatch`
- `applyAgentPatch(blueprint, patch)` с runtime guard по секциям
- Governance resolver пишет в `RenderBlueprint`, не в строки

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
// v17 coverConceptId → v18 scene.environment
commercial_studio   → studio_commercial
outdoor_lifestyle   → outdoor_lifestyle
home_interior       → home_interior
garden_scene        → garden_lawn
tech_showcase       → tech_showcase
premium_minimal     → studio_premium
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
