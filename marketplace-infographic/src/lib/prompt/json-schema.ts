export const DESIGN_BRIEF_JSON_EXAMPLE = `{
  "designConcept": "Премиальная садовая карточка с акцентом на мощность и автономность",
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
  return `Верни ТОЛЬКО JSON (Design Brief):
{
  "designConcept": "string",
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
