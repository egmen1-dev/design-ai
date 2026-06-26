export const DESIGN_BRIEF_JSON_EXAMPLE = `{
  "designConcept": "Премиальная садовая карточка с акцентом на мощность",
  "designProcess": {
    "stage1": { "category": "garden_tools", "priceSegment": "mid", "targetAudience": "владельцы домов" },
    "visualHook": { "type": "power_number", "reason": "Мощность 1300 Вт — главный триггер", "confidence": 96 },
    "stage2": { "concept": "Премиальная садовая съёмка", "creativeDirection": "golden hour lawn" },
    "stage7": { "overallScore": 94, "readability": 95, "conversionPotential": 93 }
  },
  "visualHook": { "type": "power_number", "reason": "Мощность — главный триггер", "confidence": 96 },
  "audienceAnalysis": { "category": "garden_tools", "priceSegment": "mid" },
  "marketingStrategy": "УТП через цифры мощности и комплектацию",
  "composition": { "rule": "rule-of-thirds", "visualFlow": "headline-product-benefits" },
  "layout": "marketplace",
  "cameraAngle": "three-quarter",
  "objectScale": 0.58,
  "lightDirection": "top-left",
  "lightTemperature": "5500K",
  "shadowType": "contact-soft",
  "reflection": false,
  "backgroundPrompt": "sunny suburban lawn garden path, wooden fence blurred, golden hour daylight, clear empty grass foreground, cinematic depth, ultra realistic, no objects, no text",
  "colorPalette": ["#00a8b5", "#ffffff", "#0f172a"],
  "fontId": null,
  "fontReason": "Montserrat для техники сада",
  "badgeId": null,
  "headline": "Садовый триммер",
  "subHeadline": "аккумуляторный",
  "bullets": ["1300 Вт мощность", "65 дБ тихая работа", "3 мощных АКБ", "8 насадок", "лёгкий и компактный"],
  "badge": "GardenPro",
  "negativePrompt": "no product in background, no text",
  "qualityChecklist": ["композиция сбалансирована", "без дублей bullets"]
}`;

export function buildJsonSchemaPrompt(): string {
  return `Верни ТОЛЬКО JSON (Design Brief) после прохождения этапов 1–7.
Обязательно включи designProcess (все этапы) и visualHook.

{
  "designConcept": "string",
  "designProcess": {
    "stage1": { "category", "dimensions", "shape", "materials", "priceSegment", "targetAudience" },
    "visualHook": { "type": "string", "reason": "string", "confidence": 90 },
    "stage2": { "concept", "creativeDirection", "mood", "whyThisConcept" },
    "stage3": { "mainSubject", "eyeFlow", "textPlacement", "balance", "depth" },
    "stage4": { "fontStyle", "weight", "rationale" },
    "stage5": { "primary", "accent", "systemRationale" },
    "stage6": { "useDecorations": false, "elements": [], "rationale": "" },
    "stage7": { "visualBalance": 95, "readability": 94, "overallScore": 94 }
  },
  "visualHook": { "type", "reason", "confidence" },
  "audienceAnalysis": { "category", "priceSegment", "painPoints", "emotionalTriggers" },
  "marketingStrategy": "string",
  "composition": { "rule", "focusPoint", "visualFlow" },
  "layout": "marketplace",
  "cameraAngle": "three-quarter",
  "objectScale": 0.58,
  "lightDirection": "top-left",
  "lightTemperature": "5500K",
  "shadowType": "contact-soft",
  "reflection": false,
  "backgroundPrompt": "english only, premium commercial scene",
  "colorPalette": ["#hex", "#hex", "#hex"],
  "fontId": "uuid or null",
  "fontReason": "why",
  "badgeId": "uuid or null",
  "badgeReason": "why",
  "headline": "Title Case",
  "subHeadline": "короткий тип",
  "bullets": ["5 уникальных УТП"],
  "badge": "бренд",
  "negativePrompt": "no product in background",
  "qualityChecklist": ["..."]
}

Пример:
${DESIGN_BRIEF_JSON_EXAMPLE}`;
}
