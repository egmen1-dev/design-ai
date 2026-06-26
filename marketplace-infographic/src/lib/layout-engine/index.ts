import { createSeededRng } from "@/lib/design/variability";
import type { ProductCategory } from "@/lib/product-analysis";
import type {
  LayoutEngineInput,
  LayoutTemplateId,
  ProfessionalLayoutResult,
  ProductShapeHint,
} from "./types";
import { MAX_LAYOUT_ATTEMPTS, DESIGN_SCORE_PASS } from "./constants";
import { rankTemplatesForProduct, getTemplate } from "./templates";
import { buildLayoutFromTemplate } from "./builder";
import { validateLayoutQuality } from "./quality-engine";
import { computeDesignScore } from "./design-score";
import type { CompositionResult } from "@/lib/design/types";
import { generateDesignDNA } from "@/lib/design/dna";

export type ProfessionalLayoutInput = LayoutEngineInput & {
  category: ProductCategory;
  backgroundHint?: string;
};

/** Layout Engine — полностью детерминированный, без Ollama */
export function computeProfessionalLayout(
  input: ProfessionalLayoutInput,
): ProfessionalLayoutResult {
  const seed = input.seed ?? `layout-${Date.now()}`;
  const shape: ProductShapeHint = input.productShape ?? "standard";
  const ranked = input.templateId
    ? [getTemplate(input.templateId), ...rankTemplatesForProduct(shape, input.meaning.priority, seed).filter((t) => t.id !== input.templateId)]
    : rankTemplatesForProduct(shape, input.meaning.priority, seed);

  let best: ProfessionalLayoutResult | null = null;

  for (let attempt = 0; attempt < Math.min(MAX_LAYOUT_ATTEMPTS, ranked.length); attempt++) {
    const template = ranked[attempt];
    const { layout, headlineFontPx } = buildLayoutFromTemplate(template, input.meaning, shape);
    const quality = validateLayoutQuality(layout, input.meaning, input.category, input.backgroundHint);
    const designScore = computeDesignScore(layout, input.meaning);

    const result: ProfessionalLayoutResult = {
      layout: { ...layout, score: designScore.total, scenarioId: template.id },
      templateId: template.id,
      designScore,
      quality,
      headlineFontPx,
      attempts: attempt + 1,
      seed: `${seed}:${template.id}`,
    };

    if (!best || designScore.total > best.designScore.total) {
      best = result;
    }

    if (quality.passed && designScore.passed) {
      return result;
    }
  }

  return best!;
}

/** Адаптер для существующего CompositionResult */
export function toCompositionResult(
  pro: ProfessionalLayoutResult,
  category: ProductCategory,
): CompositionResult {
  const dna = generateDesignDNA(category, pro.seed);
  return {
    layout: pro.layout,
    dna,
    scenarioId: "hero_product",
    score: {
      total: pro.designScore.total,
      balance: pro.designScore.dimensions.find((d) => d.id === "visual_balance")?.score ?? 85,
      productSize: pro.layout.metrics.productAreaPct >= 60 ? 95 : 80,
      whitespace: pro.layout.metrics.whitespacePct >= 20 ? 92 : 75,
      textDensity: 90,
      readability: pro.designScore.dimensions.find((d) => d.id === "readability")?.score ?? 88,
      contrast: 88,
      overlap: 100 - pro.layout.metrics.overlapPct * 10,
      safeArea: 90,
    },
    seed: pro.seed,
    attempts: pro.attempts,
  };
}

export { LAYOUT_TEMPLATES } from "./templates";
export type { CardMeaning, LayoutTemplateId, ProfessionalLayoutResult } from "./types";
