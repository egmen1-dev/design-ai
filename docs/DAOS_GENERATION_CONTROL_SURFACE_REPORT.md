# DAOS Generation Control Surface Report

**Sprint:** Product Integration Sprint 3 — Commercial Intent → Visible Hero Validation  
**Date:** 2026-07-09  
**Harness:** `marketplace-infographic/benchmark/generation-control-surface-validation.ts`  
**Raw data:** `marketplace-infographic/benchmark/output/sprint3-control-surface/generation-control-surface.json`  
**Production path:** `RENDER_ENGINE_V17=1` → Pollinations Flux (v17)

---

## Executive Summary

Sprint 3 получил **объективные экспериментальные данные** на 5 товарах Wildberries.

**Главный вывод:** Commercial intent проходит цепочку **Genome → LayoutSpec → Prompt Compiler (v16 path)**, но **не проходит в Pollinations/Flux (v17 production render path)**. Изменения фонового изображения при идентичном Flux-prompt не атрибутируются commercial decisions — это шум генератора.

**Product Impact:** остаётся **~6.5/10** — prompt богаче, изображение не управляется commercial genome в текущем v17 pipeline.

---

## 1. Generation Control Surface Matrix

| Commercial Intent | LayoutSpec | Prompt Compiler | Flux (Pollinations) | Visible Image | Control Strength | Bottleneck |
|-------------------|:----------:|:---------------:|:-------------------:|:-------------:|:----------------:|------------|
| productAreaTarget | YES | YES | NO | NOISE | **WEAK** | Prompt Compiler → Pollinations |
| heroDominance | YES | YES | NO | NOISE | **WEAK** | Prompt Compiler → Pollinations |
| hierarchy | YES | YES | NO | NOISE | **WEAK** | Prompt Compiler → Pollinations |
| maxCharacteristics | YES | YES | NO | NOISE | **WEAK** | Prompt Compiler → Pollinations |
| badgeLimit | YES | YES | NO | NOISE | **WEAK** | Prompt Compiler → Pollinations |
| typographyStrategy | YES | YES | NO | NOISE | **WEAK** | Prompt Compiler → Pollinations |
| backgroundPalettePreference | YES | YES | NO | NOISE | **WEAK** | Prompt Compiler → Pollinations |
| scenePreference | YES | YES | NO | NOISE | **WEAK** | Prompt Compiler → Pollinations |
| environmentDirection | YES | YES | NO | NOISE | **WEAK** | Prompt Compiler → Pollinations |
| backgroundContrastDirection | YES | YES | NO | NOISE | **WEAK** | Prompt Compiler → Pollinations |
| mainMessage | NO | NO | NO | NOISE | **NONE** | Commercial Decision → LayoutSpec |

### Методология

- **5 товаров:** аккумуляторный опрыскиватель, строительный пылесос, ударная дрель, мойка ВД, увлажнитель воздуха
- **A/B:** Legacy vs Commercial Genome + Layout Integration flags
- **Render:** Pollinations Flux, **одинаковый seed** на пару A/B (`:ab`) для честного сравнения изображений
- **Метрики изображения:** SHA256 + mean absolute pixel diff (sharp, 900×1200)

### Агрегированные результаты

| Метрика | Результат |
|---------|-----------|
| Prompt Compiler changed | **5/5** |
| Pollinations (Flux) prompt changed | **0/5** |
| Render success | **5/5** |
| Image pixel diff (same Flux prompt) | **2/5** (остальные идентичны) |
| Image diff при разных seed (контроль) | 5/5 — подтверждает шум Flux |

---

## 2. Product Gap Matrix

| Stage | Status | Evidence |
|-------|--------|----------|
| Commercial Rule → Genome | ✅ | 52 WB rules, `createCommercialGenomeBetaDecision` |
| Genome → LayoutSpec | ✅ | Sprint 1, `stabilizeLayoutSpecWithCommercialIntent` |
| LayoutSpec → Prompt Compiler | ✅ | Sprint 2, 5/5 products prompt changed |
| Prompt Compiler → Pollinations | ❌ | **0/5** — v17 bypasses prompt compiler |
| LayoutSpec → VisualSceneBlueprint | ❌ | `scenePreference`, `backgroundPalettePreference`, `heroScale` not read by visual directors |
| Pollinations → Flux image | ⚠️ | Renders succeed; prompt identical → no commercial attribution |
| Flux → Composited Hero card | ❌ | Product scale from layout-engine templates, not `heroScale` |

---

## 3. Какие commercial decisions реально влияют на изображение?

### Влияют на Prompt Compiler (v16 path) — ДА

Пример добавленных строк (construction-vacuum, commercial arm):

- `product hero target area 55% of frame`
- `product-first dominance, single hero product is the visual anchor`
- `maximum 2 icon elements, maximum 2 badge elements`
- `typography strategy: one main message, strong result-oriented headline`
- `scene preference from layout: clean industrial technical environment`
- `cool neutral background separation from product`
- `VISUAL HIERARCHY (preserve order): 1. H1 — headline, 2. hero — product hero...`

### Влияют на Flux background — НЕТ (доказано)

Pollinations prompt **байт-в-байт идентичен** legacy и commercial для всех 5 товаров.

Пример (battery-sprayer, оба arms):

```
sunny suburban lawn, garden path, wooden fence blurred, golden hour, ...
empty foreground for product compositing, backdrop only, no text ...
70mm lens, three-quarter view, large clean empty space on left
```

### Влияют на итоговую Hero-карточку — НЕТ (в рамках Sprint 3)

- Background: commercial intent не в Flux prompt
- Product scale: layout-engine не читает `layoutSpec.heroScale`
- Typography/badges: HTML overlay layer, не background render

---

## 4. Какие решения пока не проходят

| Parameter | Где теряется |
|-----------|--------------|
| productAreaTarget | Pollinations (`%` banned); layout-engine ignores `heroScale` |
| heroDominance | Visual pipeline composition director ignores `primaryObject` |
| hierarchy | Pollinations strips designer language; v17 doesn't use hierarchy block |
| maxCharacteristics / badgeLimit | Overlay/compositor layer, not Flux |
| typographyStrategy | Background prompt forbids text (`no text, no letters`) |
| scenePreference / environmentDirection | `runSceneEnvironmentDirector` ignores LayoutSpec commercial fields |
| backgroundPalettePreference | Not wired to `compilePollinationsPrompt` |
| mainMessage | Never on LayoutSpec (by design) |

---

## 5. Главное узкое место production pipeline

### **v17 Render Path bypasses commercial Prompt Compiler**

```
Handler (RENDER_ENGINE_V17=1)
  → rebuildVisualPipelineForRender()
  → compilePollinationsPrompt(VisualSceneBlueprint)   ← production Flux prompt
  → Pollinations Flux

Commercial Sprint 2:
  → compileRenderingPrompt(LayoutSpec)             ← NOT used for v17 background
```

**VisualSceneBlueprint** строится из category/coverConcept/story — **не из** `scenePreference`, `backgroundPalettePreference`, `heroScale`.

Это **единственный bottleneck**, объясняющий 0/5 изменений Flux prompt при 5/5 изменений Prompt Compiler.

---

## 6. Реальные рычаги управления Flux (эксперимент)

| Lever | Reaches Pollinations? | Reaches Image? | Control Strength | Notes |
|-------|:---------------------:|:--------------:|:----------------:|-------|
| Background Palette | Category hints only | Stochastic | WEAK | Not commercial-controlled |
| Scene / Environment | Category/coverConcept | Same | NONE | 0/5 commercial delta |
| Camera | Yes (70mm, angle) | Yes | MEDIUM | Category profile, not genome |
| Product Scale | **No** | **No** | **NONE** | heroScale orphaned |
| Typography | **No** | **No** | **NONE** | Text = overlay, not Flux |
| Environment | Category-driven | Stochastic | WEAK | scenePreference unused |

---

## 7. Следующий Sprint — максимальный прирост Product Impact

### Рекомендация: Sprint 4 — LayoutSpec → VisualSceneBlueprint → Pollinations

**Одна продуктовая проблема:** Commercial environment/contrast/hero intent не попадает в Flux prompt.

**Одна production-точка:** `compilePollinationsPrompt()` или `runSceneEnvironmentDirector()` — **read-only** чтение `layoutSpec.scenePreference` и `layoutSpec.backgroundPalettePreference` (без commercial logic).

**Ожидаемый прирост:** Product Impact **6.5 → 7.5/10** — впервые commercial decisions изменят Flux prompt и background image.

**Не делать в Sprint 4:**
- Новый Blueprint
- Переписывание layout-engine (Sprint 5)
- Изменение Flux provider

### Альтернатива (если Council хочет hero scale first)

Sprint 4b: `layout-engine` reads `layoutSpec.heroScale` → pixel `productAreaPct` — влияет на composited card, не на Flux background.

---

## 8. Артефакты

| File | Purpose |
|------|---------|
| `benchmark/generation-control-surface-validation.ts` | A/B harness |
| `benchmark/lib/image-metrics.ts` | SHA256 + pixel diff |
| `benchmark/output/sprint3-control-surface/*.png` | Background renders per product/arm |
| `benchmark/output/sprint3-control-surface/generation-control-surface.json` | Full experimental data |

### Запуск

```bash
cd marketplace-infographic
RENDER_ENGINE_V17=1 npx tsx benchmark/generation-control-surface-validation.ts

# Prompt-only (no network):
SPRINT3_SKIP_RENDER=1 npx tsx benchmark/generation-control-surface-validation.ts
```

---

## 9. Product Impact

| Metric | Before Sprint 3 | After Sprint 3 |
|--------|-----------------|----------------|
| Product Impact | ~6.5/10 (assumed) | **~6.5/10 (confirmed)** |
| Knowledge confidence | Low | **High** — experimental |
| Next action clarity | Unclear | **VisualSceneBlueprint bridge** |

Sprint 3 **успешен по критерию знания**: доказано, что commercial decisions **не управляют изображением** через текущий v17 path, и указано **точное место потери**.
