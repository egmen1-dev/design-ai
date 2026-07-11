# DAOS Product Integration Sprint 2 Report

**Sprint:** LayoutSpec → Prompt Compiler (Commercial Intent Propagation)  
**Branch:** `cursor/product-sprint2-prompt-aecb`  
**Prompt commercial version:** `1.0.0-sprint2`  
**Validation:** `marketplace-infographic/benchmark/output/product-sprint2-prompt-validation.json`

---

## 1. Какие поля LayoutSpec теперь реально используются Prompt Compiler?

| LayoutSpec field | Prompt section(s) | Read-only |
|------------------|-------------------|-----------|
| `heroScale` | composition | ✅ |
| `productAreaPct` | composition (diagnostics) | ✅ |
| `primaryObject` | product_identity, visual_hierarchy | ✅ |
| `hierarchy` | visual_hierarchy | ✅ |
| `maxIcons` / `maxBadges` | composition, marketplace_constraints | ✅ |
| `maxCharacteristics` | typography_safe_zone, marketplace_constraints | ✅ |
| `typographyStrategy` | typography_safe_zone | ✅ |
| `scenePreference` | environment | ✅ |
| `backgroundPalettePreference` | background, marketplace_constraints | ✅ |

**Модуль:** `commercial-layout-materializer.ts` — только читает и форматирует значения из `LayoutSpec`.  
**Интеграция:** существующие секции в `sections.ts` дополнены clauses через `appendClauses()`.

### До Sprint 2 (runtime-анализ)

| Поле | Использовалось? |
|------|-----------------|
| `geometry`, `whitespaceTarget`, `heroPosition`, `maxSecondaryObjects`, `palette` | ✅ |
| `hierarchy` | ✅ (visual_hierarchy) |
| `heroScale`, `maxIcons`, commercial extensions | ❌ |
| `genomeSnippet` | ❌ (мёртвый input) |

---

## 2. Какие commercial-поля ещё остаются неиспользованными?

На уровне LayoutSpec все commercial extension-поля Sprint 1 теперь **читаются** prompt compiler.

**Не используются (намеренно — не Layout domain):**

| Источник | Причина |
|----------|---------|
| `commercialLayout` diagnostics block | metadata only |
| `mainMessage`, `antiRules` | prompt copy / negative — не на LayoutSpec |
| `genomeSnippet` | deprecated path; заменён structured read |

**Не доходят до Render (следующий Product Gap):**

- Prompt → Flux/Pollinations (нет live render в shadow validation)
- `heroScale` → layout-engine pixel `productAreaPct`
- `scenePreference` → SceneBlueprint (compiler читает как hint, Scene не мутируется)

---

## 3. Есть ли дублирование коммерческой логики?

**Нет.**

| Проверка | Результат |
|----------|-----------|
| `materializeCommercialLayoutIntent` импортирует Genome? | ❌ |
| Prompt Compiler вычисляет `productAreaTarget`, `badgeLimit`, hierarchy? | ❌ |
| Коммерческие решения принимаются в compiler? | ❌ |
| Единственный источник commercial values | `LayoutSpec` (стабилизированный Sprint 1) |

Prompt Compiler стал **более «глупым»**: только материализует уже принятые поля.

---

## 4. Насколько вырос Product Impact?

| Метрика | Sprint 1 | Sprint 2 |
|---------|----------|----------|
| Product Impact | ~6/10 | **~6.5–7/10** |
| Genome → LayoutSpec | ✅ | ✅ |
| LayoutSpec → Prompt | hierarchy only | **9 полей** |
| Prompt → Image | unproven | unproven (Sprint 3) |

**Product validation (3 товара):** 3/3 — prompt изменился, ≥11 layout-driven строк на товар.

Примеры добавленных строк (yellow-tool):

- `product hero target area 55% of frame`
- `product-first dominance, single hero product is the visual anchor`
- `maximum 2 icon elements, maximum 2 badge elements`
- `typography strategy: one main message, strong result-oriented headline`
- `scene preference from layout: clean industrial technical environment`
- `cool neutral background separation from product`

---

## 5. Что является следующим Product Gap?

**Product Gap #3: LayoutSpec.heroScale → layout-engine pixel product area**

Цепочка обрывается после Prompt:

```
LayoutSpec.heroScale (55%)
        ↓  ❌
layout.metrics.productAreaPct (template default)
        ↓
Rendered composite / Flux background
```

**Sprint 3 proposal:**

- Одна точка: `layout-engine/builder.ts` — read `layoutSpec.heroScale` / `productAreaPct`
- Одна продуктовая проблема: hero на изображении не соответствует commercial 55%
- Визуальная проверка: A/B product area на 3 товарах

---

## Architecture Check

**Есть ли место, где Prompt Compiler принимает коммерческие решения?**

**Нет.** Sprint 2 завершён по архитектурному критерию.

---

## Diagnostics

В `PromptCompilerMetadata.promptCommercial`:

- `commercialIntentRead`
- `commercialIntentIgnored`
- `promptCommercialMappings`
- `promptCommercialVersion`

---

## Tests

- `commercial-layout-materializer.test.ts` — 7 tests
- `product-sprint2-prompt-validation.ts` — 3 products, all PASS
- `run-specs.sh` — all OK

---

## Activation

Commercial prompt materialization активируется автоматически когда `LayoutSpec` содержит commercial поля (после Sprint 1 flags):

```bash
DAOS_COMMERCIAL_GENOME_BETA=1
DAOS_COMMERCIAL_LAYOUT_INTEGRATION=1
```

Отдельный prompt flag не требуется — compiler читает то, что уже на production LayoutSpec.
