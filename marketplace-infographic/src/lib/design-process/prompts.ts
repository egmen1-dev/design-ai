import type { FoundationPromptInput } from "./types";
import type { CreativeDirectorResult } from "./creative-concept";
import { buildSystemPrompt } from "@/lib/prompt/system";
import {
  compileDesignInstructionsFromLayoutSpec,
  compileLayoutSpecJson,
  type LayoutSpec,
} from "@/lib/design/layout-spec";

export type DesignPromptInput = FoundationPromptInput & {
  foundation: import("./types").DesignProcessFoundation;
  creativeDirector: CreativeDirectorResult;
  referenceHint?: string;
  retryHint?: string;
  knowledgeBlock?: string;
  marketIntelligenceBlock?: string;
  assetsIntelligenceBlock?: string;
  genomeBlock?: string;
  trendIntelligenceBlock?: string;
  layoutSpec?: LayoutSpec;
  artDirectorMode?: string;
};

export function buildFoundationStagePrompt(input: FoundationPromptInput): string {
  return `${buildSystemPrompt()}

# МНОГОЭТАПНЫЙ ПРОЦЕСС — ФАЗА 1 (Анализ + Хук + Концепция)

Ты работаешь как опытный арт-директор. СНАЧАЛА принимаешь решения, ПОТОМ строишь макет.
На этой фазе НЕ создавай финальный макет. Только анализ, визуальный хук и художественную концепцию.

## Этап 1. Анализ товара
Определи: категорию, размеры, форму, материалы, цвет, назначение, ценовой сегмент,
эмоциональное восприятие, целевую аудиторию.

## Визуальный хук (visualHook) — ГЛАВНЫЙ ВОПРОС
Перед любым дизайном ответь: «Почему покупатель должен остановить взгляд именно на этой карточке?»
Выбери ОДИН сильный хук. Тип — свободная строка или один из:
oversized_product | premium_badge | emotional_background | dynamic_diagonal |
spec_highlight | luxury_minimal | lifestyle_scene | tech_showcase | gift_bundle |
contrast_pop | editorial_typography | power_number

## Этап 2. Художественная концепция
Сформируй индивидуальную идею карточки под товар (НЕ из фиксированного списка шаблонов).
Примеры направлений: предметная съёмка, реклама Apple, премиальная косметика, технологичный продукт,
уютный интерьер, спортивная динамика, студийный минимализм — но формулируй своими словами.

Верни ТОЛЬКО JSON:
{
  "stage1": {
    "category": "string",
    "dimensions": "string",
    "shape": "string",
    "materials": ["string"],
    "color": "string",
    "purpose": "string",
    "priceSegment": "budget|mid|premium|luxury",
    "emotionalPerception": "string",
    "targetAudience": "string"
  },
  "visualHook": {
    "type": "oversized_product",
    "reason": "почему этот хук сработает для конверсии",
    "confidence": 92
  },
  "stage2": {
    "concept": "краткое название концепции",
    "creativeDirection": "описание визуального направления",
    "mood": "настроение карточки",
    "references": ["референсы стиля, не бренды"],
    "whyThisConcept": "почему именно эта концепция для этого товара"
  }
}

Стиль оформления: ${input.style}
Категория (подсказка): ${input.category}
Ценовой сегмент: ${input.priceSegment}

ОПИСАНИЕ ТОВАРА:
"${input.productPrompt}"`;
}

export function buildDesignStagePrompt(input: DesignPromptInput): string {
  const f = input.foundation;
  const cd = input.creativeDirector;
  const layoutBlock = input.layoutSpec
    ? compileDesignInstructionsFromLayoutSpec(input.layoutSpec, cd)
    : null;
  const artDirectorBlock = input.artDirectorMode
    ? `## Art Director Mode\n${input.artDirectorMode} — align scene mood and background narrative with this mode.\n`
    : "";

  return `${buildSystemPrompt()}

# DESIGN EXECUTOR — structured layout compiler (v16.5)

You compile a Design Brief from LayoutSpec constraints. Do NOT write prose. Do NOT invent layout geometry.

${artDirectorBlock}## Creative Concept (ANCHOR — do not change idea)
${JSON.stringify(cd.creativeConcept, null, 2)}

## One thought
Headline anchor: "${cd.oneThought.headline}"
Hero number: ${cd.oneThought.answer} ${cd.oneThought.answerLabel}

${layoutBlock ?? `## DEFAULT CONSTRAINTS
- 1 primary product object
- max 3 secondary objects
- max 4 colors
- clean background
- large hero
- 20–35% whitespace
- hierarchy: Hero → Headline → Benefits → CTA`}

## LayoutSpec JSON
${input.layoutSpec ? compileLayoutSpecJson(input.layoutSpec) : "{}"}

## HARD RULES
- bullets: ONLY 1 item for cover
- useDecorations: false
- glassEffects: true
- NO coordinates, NO percentages, NO layout template ids

Return ONLY JSON Design Brief:
{
  "designConcept": "${cd.creativeConcept.title}",
  "layout": "marketplace",
  "headline": "${cd.oneThought.headline}",
  "subHeadline": "${cd.oneThought.badge ?? "новинка"}",
  "bullets": ["${cd.oneThought.answer} ${cd.oneThought.answerLabel}"],
  "cameraAngle": "three-quarter hero",
  "lightDirection": "top-left",
  "lightTemperature": "5500K",
  "shadowType": "contact-soft",
  "reflection": false,
  "backgroundPrompt": "english clean scene, NO product, NO text",
  "colorPalette": ${JSON.stringify(input.layoutSpec?.palette?.slice(0, 4) ?? ["#1a1a2e", "#f8fafc", "#f97316"])},
  "fontId": null,
  "badgeId": null,
  "badge": "бренд",
  "glassEffects": true,
  "decorations": []
}

Canvas 900×1200. Wildberries.
${input.knowledgeBlock ? `\n## KNOWLEDGE\n${input.knowledgeBlock}\n` : ""}
${input.marketIntelligenceBlock ? `\n## MARKET\n${input.marketIntelligenceBlock}\n` : ""}
${input.assetsIntelligenceBlock ? `\n## ASSETS\n${input.assetsIntelligenceBlock}\n` : ""}
${input.genomeBlock ? `\n## GENOME\n${input.genomeBlock}\n` : ""}
${input.trendIntelligenceBlock ? `\n## TREND\n${input.trendIntelligenceBlock}\n` : ""}
${input.referenceHint ? `REFERENCE: ${input.referenceHint}` : ""}
${input.retryHint ? input.retryHint : ""}

PRODUCT:
"${input.productPrompt}"`;
}
