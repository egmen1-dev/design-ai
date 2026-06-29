# Design AI — пакет для внешнего аудита

Это **санитизированная копия исходников** без секретов, ключей, билдов и пользовательских данных.

## Что внутри

| Путь | Содержание |
|------|------------|
| `marketplace-infographic/` | Next.js 15 приложение: генерация инфографики для маркетплейсов |
| `marketplace-infographic/src/lib/generate-infographic-handler.ts` | Главный оркестратор пайплайна |
| `marketplace-infographic/src/lib/agents/` | AI-агенты (Art Director, Senior AD, CTR, Chief Director, …) |
| `marketplace-infographic/src/lib/design/` | Design Genome, Trend Intelligence, Knowledge Engine, Market/Assets Intelligence |
| `marketplace-infographic/prisma/` | Схема БД и миграции |
| `scripts/`, `DEPLOY.md` | Деплой (домен и IP заменены на плейсхолдеры) |

## Версия пайплайна

Смотрите `marketplace-infographic/src/lib/pipeline-version.ts`.

## Архитектура генерации (marketplace layout)

```
Параллельно: Knowledge Engine + Market Intelligence + Assets Intelligence + Trend Intelligence
    ↓
Design Genome (select / mutate / layout boost)
    ↓
Ollama (промпт с knowledge / market / assets / genome / trend блоками)
    ↓
Visual Story Director → Scene Planner → Commercial Photo Director
    ↓
Layout Engine (шаблоны + DNA + trend boost)
    ↓
Параллельно: Senior Art Director + CTR Expert + Art Director
    ↓
Commercial Photographer → Chief Design Director → Render (Puppeteer + SD background)
    ↓
Learning: Design Memory, Knowledge patterns, Assets success, User feedback 👍/👎
```

## Чего нет в архиве (намеренно)

- `.env` — DATABASE_URL, Stripe, GitHub OAuth, NEXTAUTH_SECRET
- SSH private keys (`deploy/ssh/github-actions-deploy`)
- `node_modules`, `.next`
- Сгенерированные картинки и загрузки пользователей
- Runtime store `data/design-memory.json`

## Переменные окружения

Шаблон: `marketplace-infographic/.env.example` (значения — плейсхолдеры).

## Промпт для ChatGPT (скопируйте целиком)

```
Ты — senior architect и code reviewer. Проанализируй прикреплённый репозиторий design-ai (Next.js, Prisma, Ollama).

Фокус аудита:
1. Архитектура пайплайна генерации (generate-infographic-handler.ts и агенты)
2. Design Genome AI + Trend Intelligence + Knowledge/Market/Assets intelligence
3. Качество типов, границы модулей, тестируемость
4. Безопасность API (auth, admin routes, Stripe webhook)
5. Производительность (параллельные вызовы, тяжёлые операции Puppeteer/Ollama)
6. Риски для продакшена и технический долг

Формат ответа:
- Краткое резюме (5–10 предложений)
- Сильные стороны (bullet list)
- Критические проблемы (severity: high/medium/low)
- Рекомендации по приоритету (quick wins vs refactor)
- Вопросы, если чего-то не хватает в архиве

Секретов в архиве нет; домен и email заменены на плейсхолдеры.
```

## Локальная проверка архива

```bash
tar -tzf dist/design-ai-audit-*.tar.gz | head
tar -xzf dist/design-ai-audit-*.tar.gz
grep -r "sk_live\|BEGIN OPENSSH\|DATABASE_URL=postgresql" . || echo "OK: no obvious secrets"
```
