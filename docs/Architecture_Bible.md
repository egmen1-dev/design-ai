# Design AI — Architecture Bible

> Единый справочник по архитектуре проекта **design-ai**  
> Продакшен: **https://design-ai.shop**  
> Обновлено: 2026-07-05

---

## 1. Миссия продукта

**Design AI** — SaaS для генерации инфографики товаров (900×1200 / 1200×1200) под маркетплейсы **Wildberries** и **Ozon**.

Пользователь загружает фото товара и описание → система строит коммерчески сильную карточку с УТП, фоном, композицией и водяным знаком.

| Параметр | Значение |
|----------|----------|
| Домен | `design-ai.shop` |
| VPS | `194.226.115.138` |
| Бесплатный лимит | 5 генераций / день |
| Платный пакет | 20 генераций за 500 ₽ (Stripe) |
| Целевой рынок | WB, Ozon, Amazon (в перспективе) |

---

## 2. Высокоуровневая топология

```mermaid
flowchart TB
    subgraph Users["Пользователи"]
        Browser["Браузер"]
    end

    subgraph VPS["VPS 194.226.115.138"]
        Nginx["Nginx / Caddy :443"]
        PM2["PM2"]
        Next["Next.js 15 standalone :3000"]
        PG["PostgreSQL 16"]
        Ollama["Ollama qwen2.5:7b :11434"]
    end

    subgraph External["Внешние сервисы"]
        GH["GitHub OAuth"]
        Stripe["Stripe"]
        Poll["Pollinations API"]
        GHActions["GitHub Actions CI/CD"]
    end

    Browser --> Nginx --> PM2 --> Next
    Next --> PG
    Next --> Ollama
    Next --> Poll
    Next --> GH
    Next --> Stripe
    GHActions -->|SSH deploy| VPS
```

### Поток деплоя

```
git push main
    → GitHub Actions (.github/workflows/deploy.yml)
    → SSH root@194.226.115.138
    → scripts/deploy.sh
    → npm ci → prisma migrate → npm run build
    → PM2 restart (ecosystem.config.cjs)
    → curl http://127.0.0.1:3000/api/health
```

---

## 3. Технологический стек

| Слой | Технология |
|------|------------|
| Frontend | Next.js 15 (App Router), React 19, Tailwind CSS |
| Backend | Next.js API Routes, Server Components |
| Auth | NextAuth v5 (GitHub OAuth + email/password) |
| ORM | Prisma 6 + PostgreSQL |
| AI (структура) | Ollama `qwen2.5:7b` |
| AI (рендер фона) | Pollinations API (v17) |
| Рендер PNG | Puppeteer + Sharp |
| Cutout | @imgly/background-removal-node |
| Платежи | Stripe Checkout + Webhook |
| Валидация | Zod |
| Process manager | PM2 (fork, 2.5 GB limit) |
| CI | GitHub Actions (lint + specs) |

---

## 4. Структура репозитория

```
design-ai/
├── marketplace-infographic/     # Основное приложение
│   ├── src/
│   │   ├── app/                 # Страницы + API routes
│   │   ├── components/          # UI-компоненты
│   │   └── lib/                 # Бизнес-логика (~500 файлов)
│   ├── prisma/                  # Схема + 15 миграций
│   ├── templates/               # HTML-шаблоны слайдов
│   ├── scripts/                 # Тесты и build-скрипты
│   └── docs/                    # Аудит, книга, архивы
├── scripts/                     # VPS setup / deploy
├── deploy/ssh/                  # SSH-ключи для CI/CD
├── ecosystem.config.cjs         # PM2 конфиг
├── .github/workflows/           # CI + Deploy
├── DEPLOY.md
└── docs/
    └── Architecture_Bible.md    # ← этот файл
```

---

## 5. Версии пайплайна

Версия определяется в `src/lib/pipeline-version.ts` и отдаётся в `/api/health`.

| Версия | Флаг | Статус | Описание |
|--------|------|--------|----------|
| **v16.9** | — | legacy | Design Constitution, HuggingFace SD |
| **v17.0** | `RENDER_ENGINE_V17=1` | prod-ready | Pollinations render engine |
| **v17.1** | `+ DESIGN_GOVERNANCE_V171=1` | **текущий prod** | Quality gates, professional score |
| **v18.0** | `RENDER_BLUEPRINT_V18=1` | код есть, **не подключён к API** | Render Blueprint lifecycle |

### Переключение версий (.env)

```env
# Продакшен (рекомендуется)
RENDER_ENGINE_V17=1
PIPELINE_V17=1
DESIGN_GOVERNANCE_V171=1
RENDER_PROVIDER=pollinations
POLLINATIONS_API_KEY="..."

# Демо без Ollama
AI_MOCK_MODE=true

# Будущее: полный v18 blueprint
# RENDER_BLUEPRINT_V18=1
```

---

## 6. Design AI Book — главы 1–11

Книга Design AI — каноническая модель архитектуры. Реестр: `src/lib/design-ai-book/book-registry.ts`.

| Гл | Название | Модуль | Секций | Тесты | Зрелость |
|----|----------|--------|--------|-------|----------|
| 1 | Design Philosophy | `docs/DESIGN-AI-v18-PHILOSOPHY.md` | 1 | via constitution | docs |
| 2 | Blueprint | `render-blueprint/types.ts` | 1 | spec | types |
| 3 | Render Blueprint | `render-blueprint/` | 19 | 21 | **full** |
| 4 | Agent Ecosystem | `render-blueprint/` | 28 | 29 | **full** |
| 5 | Design Knowledge Engine | `render-blueprint/` | 20 | 20 | **full** |
| 6 | Design Pipeline | `render-blueprint/` | 20 | 21 | **full** |
| 7 | Platform Architecture | `render-blueprint/` | 28 | 29 | **full** |
| 8 | Design Knowledge Platform | `design-knowledge-platform/` | 27 | spec | registry |
| 9 | Intelligent Orchestration | `intelligent-orchestration-platform/` | 19 | spec | registry |
| 10 | Human AI Collaboration | `human-ai-collaboration/` | 15 | spec | registry |
| 11 | Commercial Intelligence | `commercial-intelligence-platform/` | 20 | 75 | **full** |

### Поток платформы (главы 8 → 11)

```
Ch8  Design Knowledge Platform
  ↓
Ch9  Intelligent Orchestration Platform
  ↓
Ch10 Human AI Collaboration
  ↓
Ch11 Commercial Intelligence Platform
```

Единый оркестратор: `src/lib/design-ai-book/pipeline.ts` → `runDesignAiBookPipeline()`.

> **Важно:** book pipeline существует и тестируется, но **не вызывается** из production handler.

---

## 7. Production pipeline (v17.1) — как работает сейчас

Главный оркестратор: `src/lib/generate-infographic-handler.ts` (~2200 строк).

```mermaid
flowchart TD
    A["POST /api/generate-infographic"] --> B["auth + Zod validation"]
    B --> C["consumeGenerationSlot (credits)"]
    C --> D["product-image: cutout + compositing"]

    D --> E["Intelligence layer (parallel)"]
    E --> E1["Knowledge Engine"]
    E --> E2["Market Intelligence"]
    E --> E3["Assets Intelligence"]
    E --> E4["Trend Intelligence"]

    E1 --> F["Design Genome: select / mutate / layout boost"]
    F --> G["Ollama qwen2.5:7b → design brief JSON"]
    G --> H["Visual Story Director"]
    H --> I["Scene Planner"]
    I --> J["Commercial Photo Director"]
    J --> K["Layout Engine (templates + DNA)"]

    K --> L["Critics (parallel)"]
    L --> L1["Senior Art Director"]
    L --> L2["CTR Expert"]
    L --> L3["Art Director"]

    L1 --> M["Commercial Photographer"]
    M --> N["Chief Design Director"]
    N --> O["Render Engine v17 (Pollinations)"]
    O --> P["Compositing: shadow, color, scene harmony"]
    P --> Q["Design Governance v17.1 (quality gate)"]
    Q --> R["Puppeteer PNG + watermark"]
    R --> S["Prisma: GeneratedImage + diagnostics"]
```

### Legacy endpoint

`POST /api/generate` — упрощённый пайплайн (Ollama → HTML template → Puppeteer). Используется для старых слайдов.

---

## 8. Render Blueprint (v18) — будущий пайплайн

Модуль: `src/lib/render-blueprint/` (416 TypeScript-файлов).

Ключевые подсистемы:

| Подсистема | Файлы | Назначение |
|------------|-------|------------|
| `types.ts` | схема | RenderBlueprint, 14 секций blueprint |
| `agent-registry.ts` | DI | Реестр агентов |
| `lifecycle-manager.ts` | runtime | Жизненный цикл blueprint |
| `mutation-engine.ts` | engine | Мутации секций |
| `validation-engine.ts` | QA | Валидация конституции v18 |
| `render-orchestrator-agent-engine.ts` | Ch 7.26 | Оркестратор рендера |
| `render-adapter-agent-engine.ts` | Ch 7.27 | Адаптер провайдеров |
| `render-validator-agent-engine.ts` | Ch 7.28 | Валидатор результата |
| `knowledge-architecture-engine.ts` | Ch 5 | Knowledge graph |
| `consensus-validation-stage-engine.ts` | Ch 6 | Консенсус агентов |

Агенты (Ch 7.18–7.25): `src/lib/agents/` — Senior Art Director, CTR Expert, Commercial Photographer, Pattern Director, Vision Critic, Marketplace Director и др.

Флаг: `USE_RENDER_BLUEPRINT_V18` в `render-blueprint/index.ts`.

---

## 9. Render Engine (v17)

Модуль: `src/lib/render-engine/`

```
render-planner.ts
    → model-selection.ts (Pollinations / HuggingFace)
    → pollinations/provider.ts
    → canvas-composer.ts
    → render-quality.ts
    → retry-engine.ts
```

Провайдеры регистрируются в `providers/registry.ts`.  
Компилятор промптов: `adapters/pollinations-compiler.ts`.  
Модерация: `providers/pollinations/moderation.ts`.

---

## 10. Design Governance (v17.1)

Модуль: `src/lib/design-governance/`

| Компонент | Путь | Роль |
|-----------|------|------|
| Constitution | `constitution/` | Законы дизайна |
| Validators | `validators/` | Проверка макета |
| Scores | `scores/` | Professional score |
| Conflicts | `conflicts/` | Разрешение конфликтов |
| Trace | `trace/` | Диагностика прохождения gate |

Пороги (.env):

```env
GOVERNANCE_CONSTITUTION_THRESHOLD=80
GOVERNANCE_PROFESSIONAL_THRESHOLD=75
GOVERNANCE_PROFESSIONAL_NEAR_MISS=3
```

---

## 11. Слой данных (Prisma)

Основные модели:

| Модель | Назначение |
|--------|------------|
| `User` | Аккаунт, credits, stripeCustomerId |
| `Subscription` | Stripe-подписка |
| `CreditPurchase` | Пакеты генераций |
| `GeneratedImage` | Результат + diagnostics JSON |
| `TrainingSample` | Few-shot self-learning |
| `DesignExample` | Админские примеры |
| `ReferenceImage` | Референсы стиля |
| `LibraryAsset` | Шрифты, бейджи, иконки |
| `UserFeedback` | 👍/👎 на генерации |
| `SdBackgroundCache` | Кэш SD/Pollinations фонов |

Миграции: `prisma/migrations/` (15 штук, с 2025-06-24 по 2025-06-27).

---

## 12. API Surface

### Публичные

| Method | Path | Auth | Описание |
|--------|------|------|----------|
| GET | `/api/health` | — | Статус + pipelineVersion + DB |
| GET | `/api/ai/status` | — | Ollama / mock режим |
| POST | `/api/auth/[...nextauth]` | — | NextAuth |
| POST | `/api/auth/register` | — | Регистрация email/password |
| POST | `/api/stripe/webhook` | Stripe sig | Webhook |

### Авторизованные

| Method | Path | Описание |
|--------|------|----------|
| POST | `/api/generate-infographic` | **Главная генерация** (v17.1) |
| POST | `/api/generate` | Legacy HTML pipeline |
| POST | `/api/upload` | Загрузка фото |
| POST | `/api/regenerate-background` | Перегенерация фона |
| GET | `/api/images/[id]/download` | Скачать PNG |
| GET | `/api/images/[id]/diagnostics` | Диагностика генерации |
| POST | `/api/images/[id]/feedback` | 👍/👎 |
| POST | `/api/stripe/checkout` | Оплата пакета |

### Admin

| Path | Описание |
|------|----------|
| `/api/admin/fonts` | Управление шрифтами |
| `/api/admin/badges` | Бейджи маркетплейса |
| `/api/admin/examples` | Few-shot примеры |
| `/api/admin/references` | Референсные изображения |
| `/api/admin/intelligence-sync` | Синхронизация intelligence |

Доступ admin: `ADMIN_EMAILS` в `.env`.

---

## 13. Frontend

| Страница | Путь | Описание |
|----------|------|----------|
| Главная | `/` | Форма генерации + AiStatusBanner |
| Dashboard | `/dashboard` | История генераций |
| Login | `/login` | GitHub OAuth + email |
| Register | `/register` | Регистрация |
| Pricing | `/pricing` | Тарифы + Stripe |
| How it works | `/how-it-works` | Описание пайплайна |
| Admin | `/admin` | Панель администратора |

Ключевые компоненты: `GenerateForm`, `AiStatusBanner`, `SiteHeader`, `SiteFooter`.

---

## 14. Переменные окружения

Шаблон: `marketplace-infographic/.env.example`

### Обязательные для продакшена

```env
DATABASE_URL="postgresql://designai:PASSWORD@localhost:5432/marketplace_infographic"
NEXTAUTH_URL="https://design-ai.shop"
NEXTAUTH_SECRET="openssl rand -base64 32"
GITHUB_ID="..."
GITHUB_SECRET="..."
POLLINATIONS_API_KEY="..."
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_ID="price_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
ADMIN_EMAILS="you@example.com"
AI_MOCK_MODE="false"
```

### Performance

```env
FAST_GENERATION=1        # Ускоренный режим
DISABLE_IMGLY=0          # 1 = без cutout (быстрее на слабом VPS)
```

---

## 15. Тестирование

| Команда | Тестов | Что покрывает |
|---------|--------|---------------|
| `npm run lint` | ESLint | Стиль кода |
| `npm run test:specs` | ~13 | Governance + render-engine + blueprint core |
| `bash scripts/run-v18-blueprint-tests.sh` | 120 | Главы 3–7 (v18) |
| `bash scripts/run-platform-chapters-8-11-specs.sh` | 99 | Главы 8–11 |
| `bash scripts/run-design-ai-book-audit.sh` | **219** | Полный аудит книги |

> CI (`.github/workflows/ci.yml`) запускает только `lint` + `test:specs`.  
> Полный аудит 219 тестов — **вручную** или при доработке CI.

---

## 16. Известные разрывы (integration gaps)

| # | Проблема | Влияние | Приоритет |
|---|----------|---------|-----------|
| 1 | VPS недоступен (SSH/TLS reset) | design-ai.shop лежит | 🔴 критично |
| 2 | `RENDER_BLUEPRINT_V18` не подключён к handler | v18 только в тестах | 🟠 высокий |
| 3 | `runDesignAiBookPipeline()` не вызывается из API | Ch 8–11 вне prod | 🟠 высокий |
| 4 | Ch 8–10 — registry scaffold, не full engines | 61 секция без логики | 🟡 средний |
| 5 | CI не гоняет 219 тестов | Регрессии не ловятся | 🟡 средний |
| 6 | CI не делает `npm run build` | Ошибки сборки не видны | 🟡 средний |
| 7 | Rate-limit in-memory | Сброс при рестарте PM2 | 🟢 низкий |
| 8 | `generate-infographic-handler.ts` монолит ~2200 строк | Сложно поддерживать | 🟢 низкий |

---

## 17. Roadmap улучшений

### Фаза 1 — Продакшен (сейчас)

- [ ] Починить VPS `194.226.115.138` (sshd, nginx, pm2)
- [ ] Заполнить production `.env` (Pollinations, Stripe, GitHub OAuth)
- [ ] Успешный деплой: `curl https://design-ai.shop/api/health` → `v17.1`

### Фаза 2 — CI/CD

- [ ] Добавить `run-design-ai-book-audit.sh` в CI
- [ ] Добавить `npm run build` в CI
- [ ] Retry + health-check в deploy workflow
- [ ] Uptime мониторинг `/api/health`

### Фаза 3 — Интеграция v18

- [ ] Wire `RENDER_BLUEPRINT_V18=1` → `generate-infographic-handler`
- [ ] Подключить `runDesignAiBookPipeline()` за feature flag
- [ ] Разбить handler на stage-модули

### Фаза 4 — Платформы 8–10

- [ ] Реализовать engines для 61 секции (по образцу Ch11)
- [ ] E2E тесты (Playwright): login → generate → download

---

## 18. Быстрые команды

```bash
# Локальный старт
cd marketplace-infographic
cp .env.example .env
npm ci
npx prisma migrate deploy
npm run dev
# → http://localhost:3000

# Полный аудит
bash scripts/run-design-ai-book-audit.sh

# Health check
curl -s http://localhost:3000/api/health | jq

# Деплой на VPS
cd /opt/design-ai && ./scripts/deploy.sh

# PM2 на VPS
pm2 status
pm2 logs marketplace-infographic --lines 50
```

---

## 19. Связанные документы

| Документ | Путь |
|----------|------|
| Деплой | `DEPLOY.md` |
| Книга Design AI (индекс) | `marketplace-infographic/docs/DESIGN-AI-BOOK-INDEX-CH1-11.md` |
| Статус восстановления | `marketplace-infographic/docs/RESTORATION-STATUS.md` |
| Аудит Chief Architect | `marketplace-infographic/docs/AUDIT-CHIEF-ARCHITECT-DESIGN-AI-CH1-11.md` |
| Скачивание архива | `DOWNLOAD.md` |
| Философия v18 | `marketplace-infographic/docs/DESIGN-AI-v18-PHILOSOPHY.md` |
| Внешний аудит | `AUDIT.md` |

---

*Architecture Bible — living document. Обновляйте при смене pipeline version или добавлении глав книги.*
