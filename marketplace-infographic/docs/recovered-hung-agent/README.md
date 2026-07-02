# Восстановлено из зависшего агента — СМЕРЖЕНО

Коммиты stash: `e435fdcc`, `0ad82ab1`

## Статус

| Файлы | Куда смержено |
|-------|---------------|
| `commercial-intelligence-platform/` (Ch11) | `src/lib/commercial-intelligence-platform/` |
| Ecosystem engines 11.1–11.17 (логика из design-ai-os) | `src/lib/commercial-intelligence-platform/ecosystem-engine-runners.ts` |
| Unified pipeline Ch8→11 | `src/lib/design-ai-book/pipeline.ts` |
| `design-ai-os/` (неправильная модель) | `docs/archive/deprecated-design-ai-os/` — **не использовать** |

## Осталось здесь (только справка)

- `docs/AUDIT-DESIGN-AI-OS-CHAPTERS-1-11.md` — исторический аудит
- `docs/DESIGN-AI-OS-CHAPTER-11-COMMERCIAL-INTELLIGENCE-PLATFORM.md` — справка по Ch11

## Проверка

```bash
cd marketplace-infographic
./scripts/run-design-ai-book-audit.sh
```
