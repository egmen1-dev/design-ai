# DESIGN AI v18 — Часть 1. Design Philosophy

> Статус: **спецификация** (фундамент в `src/lib/render-blueprint/`).  
> Текущий прод: v17.1-design-governance. v18 включается флагом `RENDER_BLUEPRINT_V18=1` (постепенная миграция).

---

## 1. Новая философия системы

### v17 думает так

```
Товар → Агенты → Большой Prompt → FLUX → Фон → Композит → HTML
```

Вся интеллектуальная работа в конце сводится к одной длинной строке текста.

**Проблемы:**
- теряется структура;
- появляются конфликты (Scene=kitchen, Resolver=outdoor);
- FLUX получает инструкции, которые не способен интерпретировать (CTR, whitespace %, typography);
- критики исправляют уже готовый результат.

### v18 думает иначе

**Система больше не генерирует картинки. Система принимает дизайнерские решения.**  
Генерация изображения — исполнительный этап.

### Главный принцип v18

**Каждый агент принимает решение. Никто не пишет промпты.**

---

## 2. Новая цепочка

```
Knowledge
  ↓
Creative Intent
  ↓
Story
  ↓
Scene
  ↓
Photography
  ↓
Composition
  ↓
Render Blueprint
  ↓
Flux Adapter
  ↓
FLUX
```

**Prompt появляется только в самом конце.** До этого — только структурированные объекты.

---

## 3. Главный объект: RenderBlueprint

Единственный источник истины. Запрещены: `promptData`, `sceneStrings`, `mergedPrompt` как параллельные состояния.

| Агент | Секция |
|-------|--------|
| Visual Story Director | `renderBlueprint.story` |
| Scene Director | `renderBlueprint.scene` |
| Commercial Photo Director | `renderBlueprint.photography` |
| Composition Director | `renderBlueprint.layout` |
| Lighting Director | `renderBlueprint.lighting` |
| Camera Director | `renderBlueprint.camera` |
| Material Director | `renderBlueprint.materials` |
| Flux Adapter | `renderBlueprint.render` (read-only для агентов) |

**Правило:** агент меняет только свою секцию. Запись в чужую секцию — нарушение Constitution v18.

---

## 4. Один уровень абстракции на агента

| Агент | Вопрос | Не думает о |
|-------|--------|-------------|
| Visual Story Director | Почему человек захочет товар? | камера, свет, фон |
| Scene Director | Где происходит история? | CTR, заголовок, шрифты |
| Commercial Photo Director | Как снял бы профи? | продающий текст, рейтинг |
| Composition Director | Где hero и negative space? | FLUX, промпты |

---

## 5. FLUX перестаёт быть дизайнером

| v17 (плохо) | v18 (правильно) |
|-------------|-----------------|
| «Сделай красивую коммерческую карточку» | «Создай реалистичную сцену по фотографическому брифу» |

---

## 6. Три языка

1. **Design Language** — агенты: надёжность, минимализм, эмоция, narrative.
2. **Photography Language** — фото: golden hour, eye level, 50mm, stone patio.
3. **Flux Language** — модель: конкретные визуальные токены, backdrop only.

Перевод Design/Photo → Flux выполняют **адаптеры**, не агенты.

---

## 7. Агенты не пишут текст

**Visual Story Director:**
```json
{
  "emotion": "security",
  "customerNeed": "backup power",
  "visualNarrative": "family home remains functional during outage"
}
```

**Scene Director:**
```json
{
  "environment": "residential_backyard",
  "time": "golden_hour",
  "weather": "clear",
  "depth": "medium"
}
```

**Commercial Photo Director:**
```json
{
  "lensMm": 50,
  "cameraHeight": "eye_level",
  "lightingPreset": "warm_directional",
  "depthOfField": "medium"
}
```

---

## 8–9. Single Source of Truth

**Каждая информация существует только один раз.**

Запрещённые дубли → единое поле:

| Deprecated (v17) | v18 |
|------------------|-----|
| `sceneType` | `scene.environment` |
| `coverConcept` | `scene.environment` |
| `backgroundType` | `scene.environment` |
| `environment` (разрозненно) | `scene.environment` |
| `sceneCategory` | `scene.environment` |

---

## 10. Главная цель

> Принять профессиональные дизайнерские решения и передать модели только те инструкции, которые она способна реализовать.

---

## Design Constitution v18

1. Ни один агент не думает о возможностях модели генерации.
2. Агенты принимают решения в структурированном виде.
3. Только **Flux Adapter** переводит решения в язык FLUX.
4. Замена FLUX меняет только адаптер; агенты без изменений.

Реализация: `src/lib/render-blueprint/constitution.ts`

---

## Связь с v17

| v17 | v18 |
|-----|-----|
| `VisualSceneBlueprint` | основа секций `story`…`materials` |
| `LayoutSpec` | `layout` |
| `ScenePlan` + `coverConceptId` | deprecated → `scene.environment` |
| `pollinations-compiler.ts` | Flux Adapter (переименование в фазе 4) |
| `FinalDesignBlueprint` (строки) | `RenderBlueprint` (типы) |

См. [MIGRATION-v18.md](./MIGRATION-v18.md)
