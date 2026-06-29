# DESIGN AI v18 — Chapter 3.12: Serialization Rules

> Реализация: `serialization.ts`, `canonical-json.ts`, `blueprint-migration.ts`, `serialization-types.ts`

## Purpose

Единственный допустимый способ сохранения, передачи и восстановления `RenderBlueprint`. Blueprint — данные, не код: чистый JSON без функций, классов и скрытого состояния.

## Serialization Principle

| Правильно | Неправильно |
|-----------|-------------|
| `{ meta, scene, product, ... }` | классы, `function`, циклические ссылки |
| ссылки на изображения (`ImageReference`) | PNG/JPEG/base64 внутри blueprint |
| checksum + version | prompt-строки в blueprint |

## Serializable Interface

```typescript
type SerializableBlueprint = {
  schemaVersion: number;   // формат envelope (сейчас 1)
  version: number;         // схема данных blueprint (18)
  blueprint: RenderBlueprint;
  checksum: string;          // SHA-256 canonical blueprint body
  metadata: SerializationMetadata;
  unknownFields?: Record<string, unknown>;
};
```

## Canonical JSON

Для hash и deduplication:

- ключи сортируются по алфавиту (рекурсивно);
- без лишних пробелов;
- массивы сохраняют порядок;
- `NaN` / `Infinity` запрещены.

```typescript
import { canonicalStringify } from "./render-blueprint";
canonicalStringify({ z: 1, a: 2 }); // '{"a":2,"z":1}'
```

## Checksum

`SHA-256(canonicalStringify(blueprint))` — обязателен для snapshot, recovery, replay, debug export.

## Version & Migration

`version` / `meta.version` — версия **схемы данных**, не приложения.

При загрузке старой версии `migrateBlueprint()` выполняется **до** validation:

- v17 `environment` → v18 `scene.environment`;
- добавляется `lifecycle`, `constraints.set`;
- неизвестные top-level поля → `unknownFields` (не удаляются).

## Security Rules

Запрещено сериализовать:

- API keys, tokens, secrets, credentials;
- base64 / embedded binary;
- prompt-поля (`prompt`, `compiledPrompt`, …).

## Compression

При размере JSON > **256 KB** — автоматический `gzip` (`metadata.compressed = true`).

## API

```typescript
import {
  serializeBlueprint,
  deserializeBlueprint,
  exportBlueprintToJson,
  importBlueprintFromJson,
  assertSerializationRoundTrip,
} from "./render-blueprint";

const { json, compressed, envelope } = serializeBlueprint(blueprint);
const { blueprint: restored } = deserializeBlueprint(json);
assertSerializationRoundTrip(blueprint); // golden rule
```

## Storage Strategy (Prisma)

Сохраняются:

- Final Blueprint (serialized envelope);
- Debug Blueprint (опционально);
- Validation Report;
- Provider Metadata.

Промежуточные snapshot по умолчанию не персистятся (см. Ch 3.8).

## Supported Formats

| Format      | Status   |
| ----------- | -------- |
| JSON        | Primary  |
| MessagePack | Optional (type only) |
| Protobuf    | Future   |

## Golden Rule

Любой `RenderBlueprint` должен быть полностью восстановим из сериализованного представления без обращения к исходному pipeline.

## Test

```bash
npx tsx src/lib/render-blueprint/serialization.spec.ts
```
