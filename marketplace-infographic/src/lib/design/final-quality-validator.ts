import type { CompositionLayout } from "@/lib/composition/types";
import type { CreativeDirectorResult } from "@/lib/design-process/creative-concept";
import type { ProductAnalysis } from "@/lib/product-analysis";
import type { QualityValidationResult } from "@/lib/design/quality-validator";
import { resolveArtDirector } from "@/lib/design-process/category-art-directors";

export type FinalQualityScore = {
  professionalAd: number;
  instantComprehension: number;
  productDominance: number;
  notOverloaded: number;
  categoryEnvironment: number;
  notPngOverlay: number;
  total: number;
  passed: boolean;
  issues: string[];
};

export type FinalQualityInput = {
  creative: CreativeDirectorResult;
  analysis: ProductAnalysis;
  productPrompt: string;
  compositionLayout?: CompositionLayout;
  qualityValidation?: QualityValidationResult;
  hasComposite: boolean;
  elementCount?: number;
};

const PASS = 90;

export function evaluateFinalQuality(input: FinalQualityInput): FinalQualityScore {
  const layout = input.compositionLayout;
  const productArea = layout?.metrics?.productAreaPct ?? 62;
  const textArea = layout?.metrics?.textAreaPct ?? 12;
  const overlap = layout?.metrics?.overlapPct ?? 0;
  const qv = input.qualityValidation;

  const professionalAd =
    input.creative.conceptScore && input.creative.conceptScore >= 85 ? 94 : 82;

  const instantComprehension =
    input.creative.oneThought.headline.length <= 45 &&
    input.creative.creativeConcept.whatToSayInOneSecond.length <= 60
      ? 95
      : 78;

  const productDominance =
    productArea >= 60 && productArea <= 76 ? 95 : productArea >= 55 ? 82 : 65;

  const notOverloaded =
    (input.elementCount ?? 3) <= 4 && textArea < 18 && overlap < 6 ? 96 : 72;

  const director = resolveArtDirector(input.analysis.category, input.productPrompt);
  const envText = `${input.creative.sceneNarrative} ${input.creative.multiConcept?.environment ?? ""}`.toLowerCase();
  const categoryEnvironment = director.forbiddenScenes.some((f) =>
    envText.includes((f.split(" ")[0] ?? "").toLowerCase()),
  )
    ? 65
    : 92;

  const notPngOverlay =
    input.hasComposite && (qv?.dimensions.find((d) => d.id === "lighting_consistency")?.score ?? 80) >= 78
      ? 93
      : input.hasComposite
        ? 85
        : 70;

  const scores = [
    professionalAd,
    instantComprehension,
    productDominance,
    notOverloaded,
    categoryEnvironment,
    notPngOverlay,
  ];
  const total = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  const issues: string[] = [];
  if (professionalAd < PASS) issues.push("not_professional");
  if (instantComprehension < PASS) issues.push("slow_comprehension");
  if (productDominance < PASS) issues.push("product_not_dominant");
  if (notOverloaded < PASS) issues.push("overloaded");
  if (categoryEnvironment < PASS) issues.push("wrong_environment");
  if (notPngOverlay < PASS) issues.push("png_overlay_feel");

  return {
    professionalAd,
    instantComprehension,
    productDominance,
    notOverloaded,
    categoryEnvironment,
    notPngOverlay,
    total,
    passed: scores.every((s) => s >= PASS) && total >= PASS,
    issues,
  };
}

export { PASS as FINAL_QUALITY_PASS };
