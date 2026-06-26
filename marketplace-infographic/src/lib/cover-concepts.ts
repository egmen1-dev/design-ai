/** Концепции обложки в духе Aidentika — одна сильная сцена + инфографика */
export type CoverConceptId =
  | "commercial_studio"
  | "outdoor_lifestyle"
  | "home_interior"
  | "garden_scene"
  | "tech_showcase"
  | "premium_minimal";

export type CoverConcept = {
  id: CoverConceptId;
  label: string;
  description: string;
  backgroundPromptSuffix: string;
  lightDirection: string;
  lightTemperature: string;
  shadowType: string;
  reflection: boolean;
};

export const COVER_CONCEPTS: CoverConcept[] = [
  {
    id: "commercial_studio",
    label: "Студийная съёмка",
    description: "Чистый коммерческий свет, нейтральный фон",
    backgroundPromptSuffix:
      "professional product photography studio, soft gradient backdrop, cinematic key light, empty foreground surface, ultra realistic, 8k",
    lightDirection: "top-left",
    lightTemperature: "5600K",
    shadowType: "contact-soft",
    reflection: true,
  },
  {
    id: "outdoor_lifestyle",
    label: "Lifestyle / улица",
    description: "Товар в реальной среде использования",
    backgroundPromptSuffix:
      "lifestyle outdoor scene, natural daylight, shallow depth of field, blurred background, clear empty foreground, ultra realistic",
    lightDirection: "top-right",
    lightTemperature: "5800K",
    shadowType: "contact-soft",
    reflection: false,
  },
  {
    id: "home_interior",
    label: "Дом / интерьер",
    description: "Уютная домашняя обстановка",
    backgroundPromptSuffix:
      "modern home interior, warm ambient light, wooden floor, soft bokeh background, empty space for product, ultra realistic",
    lightDirection: "left",
    lightTemperature: "5200K",
    shadowType: "ambient-soft",
    reflection: false,
  },
  {
    id: "garden_scene",
    label: "Сад / газон",
    description: "Для садовой техники и outdoor",
    backgroundPromptSuffix:
      "sunny suburban lawn, garden path, wooden fence blurred, golden hour, clear grass foreground, cinematic depth, ultra realistic, no objects",
    lightDirection: "top-left",
    lightTemperature: "5500K",
    shadowType: "contact-soft",
    reflection: false,
  },
  {
    id: "tech_showcase",
    label: "Техно-витрина",
    description: "Электроника, гаджеты, контрастный свет",
    backgroundPromptSuffix:
      "futuristic tech showcase, dark gradient studio, subtle blue rim light, reflective surface, premium electronics advertising, ultra realistic",
    lightDirection: "top-right",
    lightTemperature: "6500K",
    shadowType: "contact-hard",
    reflection: true,
  },
  {
    id: "premium_minimal",
    label: "Премиум минимал",
    description: "Много воздуха, дорогой каталог",
    backgroundPromptSuffix:
      "luxury minimal studio, soft beige gradient, high-end catalog photography, vast negative space, ultra realistic",
    lightDirection: "top",
    lightTemperature: "5400K",
    shadowType: "ambient-soft",
    reflection: false,
  },
];

export function resolveCoverConcept(
  conceptId?: CoverConceptId,
  category?: string,
): CoverConcept {
  if (conceptId) {
    return COVER_CONCEPTS.find((c) => c.id === conceptId) ?? COVER_CONCEPTS[0];
  }
  if (category === "garden_tools") return COVER_CONCEPTS.find((c) => c.id === "garden_scene")!;
  if (category === "electronics") return COVER_CONCEPTS.find((c) => c.id === "tech_showcase")!;
  if (category === "home_appliances") return COVER_CONCEPTS.find((c) => c.id === "home_interior")!;
  return COVER_CONCEPTS[0];
}

export function enrichBackgroundWithConcept(basePrompt: string, concept: CoverConcept): string {
  const clean = basePrompt.trim().replace(/\s+/g, " ");
  if (clean.length > 80) return clean;
  return `${clean}, ${concept.backgroundPromptSuffix}`;
}
