# DAOS Product Sprint 9 Report

## Shadow Beta Visual Review

**Sprint:** Product Sprint 9  
**Status:** Complete (evaluation only)  
**Type:** End-to-end product validation — no production code changes  
**Priority:** CRITICAL  
**Branch:** `cursor/product-sprint9-shadow-beta-aecb`  
**Benchmark:** `benchmark/shadow-beta-validation.ts`  
**Review package:** `benchmark/output/sprint9/report.html`

---

## Objective

First full **Legacy vs Commercial** A/B review across the continuous DAOS pipeline (Genome → Decision → LayoutSpec → Propagation → Calibration → Geometry → Compositor → Fidelity → PNG).

**Not in scope:** architecture changes, optimizations, new registries or RFCs.

---

## Method

| Parameter | Value |
|-----------|-------|
| Products | 5 (construction-vacuum, battery-sprayer, impact-drill, pressure-washer, home-humidifier) |
| Seed | `sprint9-shadow-beta-20260709` |
| Provider | Pollinations / Flux (RENDER_ENGINE_V17) |
| Cutout | Shared synthetic PNG per product (same asset both arms) |
| Legacy | `COMMERCIAL_LAYOUT_INTEGRATION=0`, template `objectScale`, `commercialCalibration=false` |
| Commercial | Full Genome + LayoutSpec + propagation harvest (`objectScale=0.75`) + calibration |

**Limitation (documented honestly):** Production `compositeProductIntoScene` failed on all 10 runs (`floor-contact` extract on synthetic cutout). Benchmark used a **fallback overlay** (benchmark-only, not production). Cards are **background + product placement** — no Wildberries text/badge overlay.

---

## Results Summary

| Metric | Legacy (avg) | Commercial (avg) | Δ |
|--------|--------------|------------------|---|
| Measured Product Area | ~4.3% | ~9.8% | **+5.5 pp (5/5 wins)** |
| Commercial Fidelity | ~48 | ~39 | −9 (target model effect) |
| Overall Product Score | ~5.6/10 | ~4.7/10 | −0.9 |

### Why Commercial Fidelity / Overall Score dropped

Commercial Fidelity now scores against **reachable target 42%** (Sprint 8C). Legacy still uses **heroScale 66%** as expectation. Measured area (~30% proxy on composite) is closer to legacy expectation → legacy scores higher **without** meaning legacy cards are commercially stronger.

**Product Area is the fair A/B metric in this sprint** — Commercial wins **5/5**.

---

## Per-product review

### product-1 — Construction Vacuum

| | Legacy | Commercial |
|---|--------|------------|
| Product Area | 4.4% | **10%** |
| Background | Home interior (generic) | **Industrial studio** (matches genome) |
| Product Score | 5.8 | 5.4 |

**Human:** Commercial фон релевантнее инструменту; товар крупнее. Legacy фон «домашний» — слабее для строительного пылесоса.

### product-2 — Battery Sprayer

Product Area +5.4 pp. Commercial — outdoor/garden-leaning scene vs legacy neutral interior. Товар крупнее у Commercial.

### product-3 — Drill

Product Area +5.4 pp. Commercial industrial scene; legacy brighter domestic. Drill лучше читается на нейтральном industrial фоне.

### product-4 — Pressure Washer

Product Area +5.4 pp. Единственный товар с небольшим ростом fidelity (+3). Оба score низкие (~3.5) — слабый фон/contrast.

### product-5 — Home Humidifier

Product Area +5.4 pp. Legacy home scene случайно удачнее для «home» категории → legacy visual quality выше. Commercial всё равно крупнее по товару.

---

## Human review (7 criteria)

| Criterion | Assessment |
|-----------|------------|
| Product dominance | **Commercial лучше** — +5–6 pp area, крупнее placeholder |
| Thumbnail readability | **Нельзя оценить полностью** — нет текста/бейджей WB |
| Visual hierarchy | Commercial: один фокус (товар + сцена); Legacy: размытый home context |
| Background separation | **Commercial лучше** для tools/appliances (genome-driven scenes) |
| Commercial clarity | **Недостаточно** без headline/offer text |
| Information density | Слишком пусто (нет текста) — обе arms |
| Professional appearance | **Commercial ближе** к studio WB listing для инструментов |

**Would a WB buyer click Commercial more often?**  
Для **инструментов/техники — скорее да** (релевантный фон + крупнее товар). Для **home/lifestyle — неочевидно** (legacy home scene иногда удачнее). **Без текста вывод ограничен.**

---

## Automatic diagnostics (included per product)

Each `metrics.json` contains:

- Commercial Fidelity + `productAreaModel` (aspirational / reachable / measured / gap)
- Propagation diagnostics (Sprint 8C `geometry_ceiling_harvest`)
- Geometry optimization (Sprint 8B)
- Commercial decision (reachable 42%, aspirational 55%)

---

## Architecture review

| Check | Result |
|-------|--------|
| New architecture | **No** |
| New registries | **No** |
| New engines | **No** |
| RFC changes | **No** |
| Pipeline redesign | **No** |

Only new files: `benchmark/shadow-beta-validation.ts`, `benchmark/output/sprint9/*`, this report.

---

## Main wins

1. **Product Area +5–6 pp** on all 5 products (Commercial propagation + calibration).
2. **Genome-driven backgrounds** — industrial/light_modern vs generic legacy scenes.
3. **End-to-end pipeline executes** with full diagnostics chain.
4. **Honest dual-target fidelity** visible in metrics (`unreachableGap` ~24–25 pp to aspirational 55%).

## Main problems

1. **Production compositor failed** on synthetic cutout — Shadow Beta needs **real product PNGs**.
2. **No WB text overlay** — cards not representative of final listing.
3. **Overall score misleading** when legacy/commercial use different fidelity targets.
4. **Measured area ~10%** in fallback composite vs ~37% theoretical ceiling (Sprint 8C) — compositor path not fully exercised.

---

## Council Decision

### **APPROVE WITH FIXES**

**Evidence from generated cards:**

- `product-1/comparison.png`: Commercial industrial studio + 2× larger product vs legacy home scene.
- **5/5** products show Commercial Product Area gain (+5.4–5.6 pp).
- Genome intent applied (`commercialDecisionApplied: true`) with correct propagation mode `geometry_ceiling_harvest`.
- Pipeline is **continuous and measurable** — ready for shadow beta **after fixes**.

**Required fixes before Shadow Beta:**

1. Validate with **real product cutouts** (not synthetic) through production compositor.
2. Generate **full final PNG** including typography/badge overlay.
3. Human thumbnail review at WB search grid size.
4. Re-run fidelity with **same target model** on both arms for fair score comparison.

---

## How to open results

```bash
# From repo root
open marketplace-infographic/benchmark/output/sprint9/report.html
# or
xdg-open marketplace-infographic/benchmark/output/sprint9/report.html
```

Per product: `benchmark/output/sprint9/product-N/{legacy,commercial,comparison}.png` + `metrics.json`.

---

## Re-run

```bash
cd marketplace-infographic
npx tsx benchmark/shadow-beta-validation.ts
# Dry-run (no API):
SPRINT9_SKIP_RENDER=1 npx tsx benchmark/shadow-beta-validation.ts
```

Regenerate comparison boards after manual edits:

```bash
npx tsx benchmark/rebuild-sprint9-comparisons.ts
```
