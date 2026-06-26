import type { CompositionScenarioId } from "@/lib/design/types";
import type { DesignDNA } from "@/lib/design/types";

export const CONCEPT_ARCHETYPE_IDS = [
  "hero_product",
  "lifestyle",
  "premium_studio",
  "minimal_poster",
  "commercial_photography",
  "outdoor_advertising",
  "technical_focus",
  "emotional_story",
] as const;

export type ConceptArchetypeId = (typeof CONCEPT_ARCHETYPE_IDS)[number];

export type ConceptArchetype = {
  id: ConceptArchetypeId;
  label: string;
  compositionScenarioId: CompositionScenarioId;
  designDNABias: Partial<DesignDNA>;
  composition: string;
  lighting: string;
  textStrategy: string;
};

export const CONCEPT_ARCHETYPES: ConceptArchetype[] = [
  {
    id: "hero_product",
    label: "Hero Product",
    compositionScenarioId: "hero_product",
    designDNABias: { productDominance: 82, minimalism: 55, visualEnergy: 60 },
    composition: "товар 70% кадра, диагональ, минимум отвлекающих элементов",
    lighting: "ключевой свет сверху-слева, мягкая контактная тень",
    textStrategy: "один заголовок + одна цифра слева",
  },
  {
    id: "lifestyle",
    label: "Lifestyle",
    compositionScenarioId: "lifestyle",
    designDNABias: { depth: 72, colorMood: 65, visualEnergy: 58 },
    composition: "товар в реальной среде, контекст использования на фоне",
    lighting: "натуральный дневной или золотой час",
    textStrategy: "эмоциональный заголовок о пользе в жизни",
  },
  {
    id: "premium_studio",
    label: "Premium Studio",
    compositionScenarioId: "luxury_advertising",
    designDNABias: { luxury: 85, minimalism: 72, negativeSpace: 35 },
    composition: "студийная съёмка, много воздуха, товар как ювелирный объект",
    lighting: "мягкий студийный свет, лёгкий rim light",
    textStrategy: "лаконичный премиальный заголовок",
  },
  {
    id: "minimal_poster",
    label: "Minimal Poster",
    compositionScenarioId: "minimal_premium",
    designDNABias: { minimalism: 90, decorDensity: 5, textDensity: 15 },
    composition: "постер: товар + один акцент, без плашек",
    lighting: "ровный мягкий свет, нейтральный фон",
    textStrategy: "2–4 слова максимум",
  },
  {
    id: "commercial_photography",
    label: "Commercial Photography",
    compositionScenarioId: "commercial_studio",
    designDNABias: { contrast: 72, lightingDrama: 68, productDominance: 70 },
    composition: "каталожная коммерческая съёмка, чёткий фокус на товаре",
    lighting: "профессиональный студийный свет, контрастные тени",
    textStrategy: "рекламный слоган + ключевая цифра",
  },
  {
    id: "outdoor_advertising",
    label: "Outdoor Advertising",
    compositionScenarioId: "lifestyle",
    designDNABias: { visualEnergy: 70, depth: 68, contrast: 65 },
    composition: "уличная/загородная реклама, масштаб и надёжность",
    lighting: "закат или яркий дневной свет с глубиной",
    textStrategy: "сильный outdoor-слоган",
  },
  {
    id: "technical_focus",
    label: "Technical Focus",
    compositionScenarioId: "tech_showcase",
    designDNABias: { textDensity: 32, symmetry: 58, contrast: 70 },
    composition: "технический акцент, чёткая цифра как герой",
    lighting: "холодный tech-свет, чистые линии",
    textStrategy: "одна техническая цифра крупно + бейдж",
  },
  {
    id: "emotional_story",
    label: "Emotional Story",
    compositionScenarioId: "focus_frame",
    designDNABias: { colorMood: 72, depth: 70, visualEnergy: 55 },
    composition: "история через атмосферу, товар как спаситель/решение",
    lighting: "тёплый эмоциональный свет, bokeh",
    textStrategy: "история в заголовке, не характеристики",
  },
];

export function getArchetype(id: ConceptArchetypeId): ConceptArchetype {
  return CONCEPT_ARCHETYPES.find((a) => a.id === id) ?? CONCEPT_ARCHETYPES[0];
}
