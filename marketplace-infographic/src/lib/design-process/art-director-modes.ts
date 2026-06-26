import type { DesignDNA } from "@/lib/design/types";

export const ART_DIRECTOR_MODES = [
  {
    id: "marketplace_ctr",
    label: "Marketplace CTR",
    description: "Максимально цепляет взгляд в выдаче Wildberries/Ozon",
    scoringBias: { visualImpact: 1.15, commercialAppeal: 1.2, readability: 1.05 },
    dnaBias: { visualEnergy: 75, contrast: 78, productDominance: 72 } satisfies Partial<DesignDNA>,
    textStrategy: "короткий ударный заголовок + одна цифра",
  },
  {
    id: "premium_brand",
    label: "Premium Brand",
    description: "Как реклама Apple, Dyson, Bosch",
    scoringBias: { professionalLook: 1.2, commercialAppeal: 1.1, realism: 1.1 },
    dnaBias: { luxury: 82, minimalism: 75, negativeSpace: 32 } satisfies Partial<DesignDNA>,
    textStrategy: "минимум текста, премиальная типографика",
  },
  {
    id: "technical_catalog",
    label: "Technical Catalog",
    description: "Акцент на ключевой характеристике",
    scoringBias: { readability: 1.2, categoryMatch: 1.1 },
    dnaBias: { textDensity: 35, symmetry: 62, productDominance: 68 } satisfies Partial<DesignDNA>,
    textStrategy: "одна сильная цифра + технический бейдж",
  },
  {
    id: "emotional_lifestyle",
    label: "Emotional Lifestyle",
    description: "Товар в реальной среде использования",
    scoringBias: { commercialAppeal: 1.15, realism: 1.2, categoryMatch: 1.1 },
    dnaBias: { depth: 75, colorMood: 68, visualEnergy: 62 } satisfies Partial<DesignDNA>,
    textStrategy: "эмоциональный заголовок + сцена жизни",
  },
  {
    id: "luxury_poster",
    label: "Luxury Poster",
    description: "Минимум текста, максимум визуального эффекта",
    scoringBias: { visualImpact: 1.2, professionalLook: 1.15, originality: 1.1 },
    dnaBias: { minimalism: 88, luxury: 85, decorDensity: 8 } satisfies Partial<DesignDNA>,
    textStrategy: "почти без текста — визуал говорит сам",
  },
] as const;

export type ArtDirectorModeId = (typeof ART_DIRECTOR_MODES)[number]["id"];

export function resolveArtDirectorMode(id?: string) {
  return ART_DIRECTOR_MODES.find((m) => m.id === id) ?? ART_DIRECTOR_MODES[0];
}
