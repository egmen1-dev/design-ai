# DESIGN AI v18 — Chapter 3.13: Blueprint Versioning

> Реализация: `blueprint-version.ts`, `blueprint-migration-engine.ts`, `version-engine.ts`, `blueprint-version-types.ts`

## Purpose

Правила эволюции `RenderBlueprint`. Версионируется **структура Blueprint**, не приложение.

## Three Independent Versions

```text
Blueprint Schema Version  (SemVer 2.0.0)
        ↓
Agent Version             (per agent, e.g. story-director 2.3.0)
        ↓
Pipeline Version          (protocol 2.0.0)
```

Они никогда не смешиваются.

## Semantic Versioning

| Level | Meaning | Example |
|-------|---------|---------|
| MAJOR | breaking structure change | 1.x → 2.0.0 |
| MINOR | new section/field | 1.0 → 1.1 |
| PATCH | bugfix, same structure | 1.1.0 → 1.1.1 |

## Compatibility Matrix

| Blueprint | Pipeline | Status |
|-----------|----------|--------|
| 1.2.0 | 1.2.0 | Native |
| 1.1.0 | 1.2.0 | Migration |
| 1.0.0 | 1.2.0 | Migration |
| 2.0.0 | 1.2.0 | Unsupported |

## Migration Chain (Upgrade Only)

```text
1.0.0 → 1.1.0 → 1.2.0 → 2.0.0
```

- Запрещено перескакивать версии
- Downgrade запрещён
- Pipeline никогда не работает со старой схемой напрямую

## API

```typescript
import {
  prepareBlueprintForPipeline,
  assertPipelineCompatible,
  buildVersionManifest,
  runMigrationChain,
  evaluateCompatibility,
} from "./render-blueprint";

const { blueprint, report } = prepareBlueprintForPipeline(legacyBlueprint);
assertPipelineCompatible(blueprint);

const manifest = buildVersionManifest({ blueprint, agents, adapterVersion: "3.11.0" });
```

## Version Manifest

```typescript
type VersionManifest = {
  blueprint: string;           // "2.0.0"
  pipeline: string;            // "2.0.0"
  agents: Record<string, string>;
  adapter: string;
};
```

Используется для Replay, Debug Report и Snapshot metadata.

## Snapshot Version Record

Каждый snapshot (Ch 3.8) сохраняет:

- `blueprintVersion`
- `pipelineVersion`
- `agentVersions`
- `adapterVersion`

## Golden Rule

Ни один Blueprint не должен стать непригодным после обновления Design AI. Новая версия либо работает с предыдущей схемой, либо автоматически мигрирует её без потери данных.

## Test

```bash
npx tsx src/lib/render-blueprint/blueprint-versioning.spec.ts
```
